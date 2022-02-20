/* global Cesium */
import SatelliteEntity from './SatelliteEntity';
import satComponents from './SatelliteComponents';

const CustomDataSource = Cesium.CustomDataSource;
const JulianDate = Cesium.JulianDate;
const defined = Cesium.defined;
const Cartesian3 = Cesium.Cartesian3;

/**
 * 卫星管理类
 * 读取tle格式的卫星轨道数据进行可视化展示，实现对卫星的跟踪、过境分析、波束、观测站、轨道等要素的渲染
 */
class SatelliteManager {
    /**
     * 卫星管理类,构造函数
     * @param {Viewer}  viewer 对象.
     *
     */
    constructor(viewer) {
        this.viewer = viewer;

        this.satellites = [];
        this.enabledComponents = [satComponents.SatImage, satComponents.Label];

        this.enabledTags = [];

        this.satelliteDataSource = new CustomDataSource('SatelliteDataSource');
        this.scanStripDataSource = new CustomDataSource('scanStripDataSource');
        this.viewer.dataSources.add(this.satelliteDataSource);
        this.viewer.dataSources.add(this.scanStripDataSource);
        this.entities = this.satelliteDataSource.entities;
        this.scanStrips = this.scanStripDataSource.entities;

        this.viewer.trackedEntityChanged.addEventListener(() => {
            let trackedSatelliteName = this.trackedSatellite;
            if (trackedSatelliteName) {
                this.getSatellite(trackedSatelliteName).show(this.enabledComponents);
            }
        });
    }

    /**
     * 添加卫星轨道两根数
     * @param {Strng}  url tle数据url地址.
     * @param {Strng}  tags 卫星分类.
     *
     */
    addFromTleUrl(url, options) {
        fetch(url, {
            mode: 'no-cors',
        })
            .then(response => {
                if (!response.ok) {
                    throw Error(response.statusText);
                }
                return response;
            })
            .then(response => response.text())
            .then(data => {
                const lines = data.split(/\r?\n/);
                for (let i = 3; i < lines.length; i + 3) {
                    let tle = lines.splice(i - 3, i).join('\n');
                    this.addFromTle(tle, options);
                }
            })
            .catch(function(error) {
                console.log(error);
            });
    }

    /**
     * 设置卫星轨道颜色
     * @param {Color}  color 轨道颜色
     *
     */
    setObitColor(color) {
        this.satellites.forEach(item => {
            item.orbitColor = color;
        });
    }

    /**
     * 设置卫星波速颜色
     * @param {Color}  color1 tle数据
     * @param {Color}  color2 卫星分类.
     *
     */
    setConColor(color1, color2) {
        this.satellites.forEach(item => {
            item.coneColor1 = color1;
            item.coneColor2 = color2;
        });
    }

    /**
     * 设置卫星地面扫面带颜色
     * @param {Color}  color 扫面带颜色
     *
     */
    setGroundTrackColor(color) {
        this.satellites.forEachmap(item => {
            item.groundTrackColor = color;
        });
    }

    /**
     * 设置卫星地面扫面带宽度
     * @param {number}  width 扫面带宽度，默认 10 C
     *
     */
    setGroundTrackWidth(width) {
        this.satellites.forEach(item => {
            item.groundTrackWidth = width;
        });
    }

    /**
     * 设置卫星图标
     * @param {Strng}   img 卫星图标
     *
     */
    setSatImage(img) {
        this.satList.forEach(item => {
            item.image = img;
        });
    }

    /**
     * 添加卫星轨道两根数
     * @param {Strng}  url tle数据
     * @param {Strng}  tags 卫星分类.
     *
     */
    addFromTle(tle, options = {}) {
        options.entities = options.entities || this.entities;
        options.scanStrips = options.scanStrips || this.scanStrips;
        let sat = new SatelliteEntity(this.viewer, tle, options);
        this.add(sat);
    }

    /**
     * 添加卫星
     * @param {SatelliteEntity}  satelliteEntity 卫星
     *
     */
    add(satelliteEntity) {
        if (this.satelliteNames.includes(satelliteEntity.props.name)) {
            console.log(`Satellite ${satelliteEntity.props.name} already exists`);
            return;
        }
        this.satellites.push(satelliteEntity);

        if (satelliteEntity.props.tags.some(tag => this.enabledTags.includes(tag))) {
            satelliteEntity.show(this.enabledComponents);
            if (this.pendingTrackedSatellite === satelliteEntity.props.name) {
                this.trackedSatellite = satelliteEntity.props.name;
            }
        }
    }

    /**
     * 获取卫星分类列表
     * @return {Array}  卫星列表
     *
     */
    get taglist() {
        let taglist = {};
        this.satellites.forEach(sat => {
            sat.props.tags.forEach(tag => {
                (taglist[tag] = taglist[tag] || []).push(sat.props.name);
            });
        });
        Object.values(taglist).forEach(tag => {
            tag.sort();
        });
        return taglist;
    }

    /**
     * 获取卫星列表
     * @return {Array}  卫星列表
     *
     */
    get satList() {
        let satList = Object.keys(this.taglist)
            .sort()
            .map(tag => {
                return {
                    name: tag,
                    list: this.taglist[tag],
                };
            });
        if (satList.length === 0) {
            satList = [
                {
                    name: '',
                    list: [],
                },
            ];
        }
        return satList;
    }

    /**
     * 获取选中的卫星名称
     * @return {String}  卫星名称
     *
     */
    get selectedSatellite() {
        for (let sat of this.satellites) {
            if (sat.isSelected) {
                return sat.props.name;
            }
        }
        return '';
    }

    /**
     * 获取正在跟踪的卫星
     * @return {String}  卫星名称
     *
     */
    get trackedSatellite() {
        for (let sat of this.satellites) {
            if (sat.isTracked) {
                return sat.props.name;
            }
        }
        return '';
    }

    /**
     * 设置跟踪的卫星
     * @param {String}  卫星名称
     *
     */
    set trackedSatellite(name) {
        if (!name) {
            if (this.trackedSatellite) {
                this.viewer.trackedEntity = undefined;
            }
            return;
        } else if (name === this.trackedSatellite) {
            return;
        }

        let sat = this.getSatellite(name);
        if (sat) {
            sat.track();
            this.pendingTrackedSatellite = undefined;
        } else {
            // 卫星还未初始化?
            this.pendingTrackedSatellite = name;
        }
    }

    get enabledSatellites() {
        return this.satellites.filter(sat => sat.enabled);
    }

    get enabledSatellitesByName() {
        return this.enabledSatellites.map(sat => sat.props.name);
    }

    set enabledSatellitesByName(sats) {
        this.satellites.forEach(sat => {
            if (sats.includes(sat.props.name)) {
                sat.show(this.enabledComponents);
            } else {
                sat.hide();
            }
        });
    }

    get monitoredSatellites() {
        return this.satellites.filter(sat => sat.props.pm.active).map(sat => sat.props.name);
    }

    set monitoredSatellites(sats) {
        this.satellites.forEach(sat => {
            if (sats.includes(sat.props.name)) {
                sat.props.notifyPasses();
            } else {
                sat.props.pm.clearTimers();
            }
        });
    }

    /**
     * 获取所有卫星名称
     * @return {Array}  卫星名称
     *
     */
    get satelliteNames() {
        return this.satellites.map(sat => sat.props.name);
    }

    /**
     * 获取卫星
     * @param {String}  卫星名称
     *
     */
    getSatellite(name) {
        for (let sat of this.satellites) {
            if (sat.props.name === name) {
                return sat;
            }
        }
    }

    /**
     * 获取卫星分类
     * @return {Array}  卫星分类信息
     *
     */
    get tags() {
        const tags = this.satellites.map(sat => sat.props.tags);
        return [...new Set([].concat(...tags))];
    }

    getSatellitesWithTag(tag) {
        return this.satellites.filter(sat => {
            return sat.props.hasTag(tag);
        });
    }

    showSatsWithEnabledTags() {
        this.satellites.forEach(sat => {
            if (this.enabledTags.some(tag => sat.props.hasTag(tag))) {
                sat.show(this.enabledComponents);
            } else {
                sat.hide();
            }
        });
    }
    /**
     * 根据卫星类型显示卫星
     * @param {String}  卫星分类信息
     *
     */
    enableSatellite(name) {
        this.getSatellite(name).show(this.enabledComponents);
    }

    /**
     * 根据卫星类型显示卫星
     * @param {String}  卫星分类信息
     *
     */
    disableSatellite(name) {
        let satellite = this.getSatellite(name);
        satellite && satellite.hide();
    }
    /**
     * 根据卫星类型显示卫星
     * @param {String}  卫星分类信息
     *
     */
    enableTag(tag) {
        this.enabledTags = [...new Set(this.enabledTags.concat(tag))];
        this.showSatsWithEnabledTags();
    }

    /**
     * 隐藏卫星
     * @param {String}  卫星分类信息
     *
     */
    disableTag(tag) {
        this.enabledTags = this.enabledTags.filter(enabledTag => enabledTag !== tag);
        this.showSatsWithEnabledTags();
    }

    get components() {
        const components = this.satellites.map(sat => sat.components);
        return [...new Set([].concat(...components))];
    }

    /**
     * 显示卫星要素
     * @param {String}  要素名称
     *
     */
    enableComponent(componentName) {
        let index = this.enabledComponents.indexOf(componentName);
        if (index === -1) this.enabledComponents.push(componentName);

        this.enabledSatellites.forEach(sat => {
            sat.enableComponent(componentName);
        });
    }
    /**
     * 隐藏卫星要素
     * @param {String}  要素名称
     *
     */
    disableComponent(componentName) {
        let index = this.enabledComponents.indexOf(componentName);
        if (index !== -1) this.enabledComponents.splice(index, 1);

        this.enabledSatellites.forEach(sat => {
            sat.disableComponent(componentName);
        });
    }

    // setGroundPosition(positions, startDate, endDate) {
    //     let passes = [];
    //     if (!positions || positions.length === 0) {
    //         throw new Error('请传入所需分析的实体点集');
    //     }
    //     if (positions && positions.length === 1) {
    //         // 将地面站添加到所有卫星中
    //         this.enabledSatellites.forEach(sat => {
    //             if (sat._orbitalType && sat._orbitalType === '地球同步轨道') return false;
    //             passes.push(...sat.props.computePasses(positions[0], startDate, endDate));
    //         });
    //     } else {
    //         this.enabledSatellites.forEach(sat => {
    //             if (sat._orbitalType && sat._orbitalType === '地球同步轨道') return false;
    //             passes.push(...sat.props.computeAreaPasses(positions, startDate, endDate));
    //         });
    //     }

    //     passes = passes.sort((a, b) => {
    //         return a.start - b.start;
    //     });
    //     return passes;
    // }

    setGroundPosition(param) {
        let passes = [];
        if (!param.targetList || param.targetList.length === 0) {
            throw new Error('请传入所需观测的目标列表');
        }
        let positions = [];
        let startDate = JulianDate.fromDate(new Date(param.timeValue1));
        let endDate = JulianDate.fromDate(new Date(param.timeValue2));
        for (let i = 0; i < param.targetList.length; ++i) {
            positions.length = 0;
            param.targetList[i].coordinates.forEach(coordinate => {
                positions.push(
                    Cartesian3.fromDegrees(
                        coordinate.longitude,
                        coordinate.latitude,
                        coordinate.height
                    )
                );
            });
            let name = param.targetList[i].DMMC;
            this.filterSatellite(param, name, positions, startDate, endDate, passes);
        }
        passes = quickSort(passes);
        return passes;
    }
    filterSatellite(param, name, positions, startDate, endDate, passes) {
        this.satellites.forEach(sat => {
            if (sat._orbitalType && sat._orbitalType === '地球同步轨道') {
                return;
            }
            if (
                defined(param.typeCheckList) &&
                !param.typeCheckList.includes(sat._satelliteType2)
            ) {
                return;
            }
            if (
                defined(param.sensorCheckList) &&
                !param.sensorCheckList.includes(sat._satelliteType)
            ) {
                return;
            }
            passes.push(...sat.props.computeAreaPasses(positions, name, startDate, endDate));
        });
    }
}
function quickSort(arr) {
    if (arr.length < 1) {
        return arr;
    }
    let pivotIndex = Math.floor(arr.length / 2); // 找到那个基准数
    let pivot = arr.splice(pivotIndex, 1)[0]; // 取出基准数，并去除，splice返回值为数组。
    let left = [];
    let right = [];
    for (let i = 0; i < arr.length; i++) {
        if (new Date(arr[i].startTime) < new Date(pivot.startTime)) {
            left.push(arr[i]);
        } else {
            right.push(arr[i]);
        }
    }
    return quickSort(left).concat([pivot], quickSort(right)); // 加入基准数
}
export default SatelliteManager;
