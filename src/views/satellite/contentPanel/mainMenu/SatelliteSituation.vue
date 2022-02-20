<template>
    <slide-panel
        panelName="卫星态势"
        @close="$emit('close', '卫星态势')"
        class="satellite-manager-panel"
    >
        <!-- <el-row>
            <el-button @click="open">
                <img :src="require('@/assets/img/satellite/search.png')" alt />
            </el-button>
            <div class="more"></div>
        </el-row> -->
        <el-tree
            ref="tree"
            :data="sitData"
            :props="defaultProps"
            :render-after-expand="false"
            node-key="name"
            show-checkbox
            @check-change="handleCheckChange"
            @node-click="doubleClick"
        >
            <span class="custom-tree-node" slot-scope="{ node, data }">
                <span class="title">{{ node.label + total(data.totalCount) }}</span>
                <span class="tool">
                    <span
                        v-if="node.data.trackStatus"
                        class="trackShow"
                        @click.stop="showTrack($event, node, 'track')"
                    ></span>
                    <span
                        v-else
                        class="trackHid"
                        @click.stop="showTrack($event, node, 'track')"
                    ></span>
                    <span
                        v-if="node.data.tripStatus"
                        class="tripShow"
                        @click.stop="showTrack($event, node, 'trip')"
                    ></span>
                    <span
                        v-else
                        class="tripHid"
                        @click.stop="showTrack($event, node, 'trip')"
                    ></span>
                    <span
                        v-if="node.data.beamStatus"
                        class="beamShow"
                        @click.stop="showTrack($event, node, 'beam')"
                    ></span>
                    <span
                        v-else
                        class="beamHid"
                        @click.stop="showTrack($event, node, 'beam')"
                    ></span>
                </span>
            </span>
        </el-tree>
        <!-- <advancedSearch class="check" v-show="checkShow" @changeData="changeData"></advancedSearch> -->
    </slide-panel>
</template>

<script>
/* global Cesium viewer SatelliteManager */
// import advancedSearch from './advancedSearch';
import SlidePanel from '../../components/SlidePanel';

export default {
    name: 'satelliteSituation',
    data() {
        return {
            defaultProps: {
                children: 'children',
                label: 'label',
            },
            sitData: [],
            OrbitData: null,
            input: '',
            checkShow: false,
            trackStatus: '',
            lastTime: 0,
        };
    },
    components: {
        // advancedSearch,
        SlidePanel,
    },
    created() {
        this.initSatellite();
    },
    methods: {
        async initSatellite() {
            let sitDataRes = await this.rq.sate.all();
            if (sitDataRes.status === 200) {
                sitDataRes.data.forEach(item => {
                    for (let i = 0; i < item.children.length; ++i) {
                        if (item.children[i].label === '军用卫星') {
                            item.children.splice(i, 1);
                            break;
                        }
                    }
                    if (item.children[0].totalCount) {
                        item.totalCount = item.children[0].totalCount;
                        if (item.children[1].totalCount) {
                            item.totalCount = item.totalCount + item.children[1].totalCount;
                        }
                    }
                });
                let chinaele = sitDataRes.data.splice(
                    sitDataRes.data.findIndex(item => item.label === '中国'),
                    1
                );
                sitDataRes.data.unshift(chinaele[0]);
                this.sitData = sitDataRes.data;
            }
            let orbitDataRes = await this.rq.orbit2.all();
            let SatelliteManager = new Cesium.C_SatelliteManager(viewer);
            window.SatelliteManager = SatelliteManager;
            this.OrbitData = orbitDataRes.data;
            this.createAllSatellite(this.sitData);
        },
        total(num) {
            if (num) {
                return ' （' + num + '）';
            } else {
                return '';
            }
        },
        createAllSatellite(data) {
            let keys = [];
            for (let i = 0; i < data.length; ++i) {
                if (data[i].children) {
                    this.createAllSatellite(data[i].children);
                } else {
                    this.createSatellite(data[i]);
                    keys.push(data[i].name);
                }
            }
            this.$nextTick(() => {
                this.$refs.tree.setCheckedNodes(keys);
            });
        },
        createSatellite(data) {
            if (!this.OrbitData[data.id]) return;
            let Satellite = SatelliteManager.getSatellite(data.name);
            if (!Satellite) {
                let arr = this.OrbitData[data.id].split('\r\n');
                let str = data.name + '\n' + arr[1] + '\n' + arr[2];
                data.satelliteType2 = data.satelliteType2 || '其他卫星';
                let image = {
                    民用卫星: require('@/assets/img/satellite/satelliteO.png'),
                    商业卫星: require('@/assets/img/satellite/satellitePi.png'),
                    军用卫星: require('@/assets/img/satellite/satelliteG.png'),
                    其他卫星: require('@/assets/img/satellite/satellitePu.png'),
                };
                let orbitTrackColor = {
                    民用卫星: Cesium.Color.ORANGE,
                    商业卫星: Cesium.Color.fromCssColorString('#FA3470'),
                    军用卫星: Cesium.Color.GREEN,
                    其他卫星: Cesium.Color.fromCssColorString('#6514E2'),
                };
                let sideSwingAngle = data.sideSwing.split('/')[0].replace(/[^0-9]/gi, '') / 2;
                SatelliteManager.addFromTle(str, {
                    sideSwingAngle: sideSwingAngle,
                    code: data.code,
                    satelliteType: data.satelliteType,
                    satelliteType2: data.satelliteType2,
                    image: image[data.satelliteType2],
                    orbitTrackColor: orbitTrackColor[data.satelliteType2],
                    groundTrackColor: orbitTrackColor[data.satelliteType2].withAlpha(0.3),
                    orbitalType: data.orbitalType,
                });
                SatelliteManager.enableSatellite(data.name);

                image = null;
                orbitTrackColor = null;
                return;
            }
        },
        handleCheckChange(data, checked) {
            if (!data.name) {
                return;
            }
            let Satellite = SatelliteManager.getSatellite(data.name);
            if (checked) {
                if (!this.OrbitData[data.id]) return;
                Satellite.show(SatelliteManager.enabledComponents);
                data.trackStatus &&
                    Satellite.enableComponent(Cesium.C_SatelliteComponents.OrbitTrack);
                data.tripStatus &&
                    Satellite.enableComponent(Cesium.C_SatelliteComponents.GroundTrack);
                data.beamStatus &&
                    Satellite.enableComponent(this.checkSensorType(data.satelliteType2));
            } else {
                SatelliteManager.disableSatellite(data.name);
            }
        },

        open() {
            this.checkShow = !this.checkShow;
        },
        doubleClick(data) {
            let currentTime = new Date().getTime();
            if (currentTime - this.lastTime < 300) {
                if (!data.name) {
                    return;
                }
                let satellite = SatelliteManager.getSatellite(data.name);
                let position = satellite.props.position(
                    Cesium.JulianDate.fromDate(new Date(), new Cesium.JulianDate())
                );
                let cartographic = Cesium.Cartographic.fromCartesian(position);
                cartographic.height = cartographic.height + 100000;
                viewer.scene.camera.flyTo({
                    destination: Cesium.Cartographic.toCartesian(cartographic),
                });
                this.lastTime = 0;
            } else {
                this.lastTime = currentTime;
            }
        },

        showTrack(e, node, type) {
            let _self = this;
            type += 'Status';
            let typeEnum = {
                trackStatus: Cesium.C_SatelliteComponents.OrbitTrack,
                tripStatus: Cesium.C_SatelliteComponents.GroundTrack,
                beamStatus: 'sensor',
            };
            let componet = typeEnum[type];
            let flag = !node.data[type];
            node.data[type] = flag;
            if (node.childNodes && node.childNodes.length > 0) {
                node.childNodes.forEach(childNode => {
                    childNode.data[type] = flag;
                    if (childNode.childNodes && childNode.childNodes.length > 0) {
                        childNode.childNodes.forEach(childNode => {
                            childNode.data[type] = flag;
                            childNode.checked &&
                                _self.setSatelliteComponent(childNode.data, componet, flag);
                        });
                    } else {
                        childNode.checked &&
                            _self.setSatelliteComponent(childNode.data, componet, flag);
                    }
                });
            } else {
                node.checked && this.setSatelliteComponent(node.data, componet, flag);
            }
            this.setNodeParentStatus(node, type);
        },
        setNodeParentStatus(node, type) {
            if (!node.parent || !node.parent.data.children) {
                return;
            }
            let allStatus = true;
            node.parent.data.children.forEach(obj => {
                if (!obj[type]) {
                    allStatus = false;
                }
            });
            node.parent.data[type] = allStatus;
            this.setNodeParentStatus(node.parent, type);
        },
        setSatelliteComponent(data, componet, flag) {
            let satellite = SatelliteManager.getSatellite(data.name);
            componet === 'sensor' && (componet = this.checkSensorType(data.satelliteType));
            Cesium.defined(satellite) &&
                satellite[flag ? 'enableComponent' : 'disableComponent'](componet);
        },
        checkSensorType(satelliteType) {
            return satelliteType !== '雷达遥感卫星'
                ? Cesium.C_SatelliteComponents.SensorSquareCone
                : Cesium.C_SatelliteComponents.SensorCone;
        },
        close() {
            this.$emit('close');
            this.checkShow = false;
        },
        changeData(newData) {
            this.data = newData;
        },
    },
};
</script>

<style lang="scss">
.satellite-manager-panel {
    .el-button {
        width: 1.5vw;
        height: 1.5vw;
        background: #17336b;
        border-radius: 0;
        border: unset;
        padding: 0;
    }
    .more {
        display: inline-block;
        height: 1.5vw;
        width: 88%;
        background-color: #17336b;
        line-height: 1.5vw;
        vertical-align: top;
    }
    .el-tree {
        height: 90%;
        overflow: hidden;
        overflow-y: scroll;

        .custom-tree-node {
            .title {
                display: inline-block;
                width: 250px;
                text-align: left;
            }
            .tool {
                position: absolute;
                right: 5px;
                display: inline-block;
                .trackShow,
                .trackHid,
                .tripShow,
                .tripHid,
                .beamShow,
                .beamHid {
                    background-size: 100%;
                    width: 19px;
                    height: 19px;
                    display: inline-block;
                }
                .trackShow {
                    background-image: url('~@/assets/img/satellite/track2.png');
                }
                .trackHid {
                    background-image: url('~@/assets/img/satellite/track.png');
                }
                .tripShow {
                    background-image: url('~@/assets/img/satellite/trip2.png');
                }
                .tripHid {
                    background-image: url('~@/assets/img/satellite/trip.png');
                }
                .beamShow {
                    background-image: url('~@/assets/img/satellite/beam2.png');
                }
                .beamHid {
                    background-image: url('~@/assets/img/satellite/beam.png');
                }
            }
        }
    }
    .check {
        float: left;
        position: relative;
    }
    .el-tree-node > .el-tree-node__children {
        overflow: unset;
        background-color: transparent;
    }
}
</style>
