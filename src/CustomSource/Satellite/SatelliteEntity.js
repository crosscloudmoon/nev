/* global Cesium */
import { SatelliteProperties } from './SatelliteProperties';
import { EntityWrapper } from './EntityWrapper';
import CesiumSensorVolumes from './lib/cesium-sensor-volumes';
import SatelliteComponents from './SatelliteComponents';

const Matrix4 = Cesium.Matrix4;
const Cartesian3 = Cesium.Cartesian3;
const IntersectionTests = Cesium.IntersectionTests;
const Ray = Cesium.Ray;
const Ellipsoid = Cesium.Ellipsoid;
const Transforms = Cesium.Transforms;
const Matrix3 = Cesium.Matrix3;
const defaultValue = Cesium.defaultValue;
const Color = Cesium.Color;
const JulianDate = Cesium.JulianDate;
const VelocityOrientationProperty = Cesium.VelocityOrientationProperty;
const CallbackProperty = Cesium.CallbackProperty;
const Cartographic = Cesium.Cartographic;
const HeadingPitchRoll = Cesium.HeadingPitchRoll;
const PointGraphics = Cesium.PointGraphics;
const BoxGraphics = Cesium.BoxGraphics;
const buildModuleUrl = Cesium.buildModuleUrl;
const ModelGraphics = Cesium.ModelGraphics;
const BillboardGraphics = Cesium.BillboardGraphics;
const LabelGraphics = Cesium.LabelGraphics;
const HorizontalOrigin = Cesium.HorizontalOrigin;
const VerticalOrigin = Cesium.VerticalOrigin;
const Cartesian2 = Cesium.Cartesian2;
const DistanceDisplayCondition = Cesium.DistanceDisplayCondition;
const NearFarScalar = Cesium.NearFarScalar;
const PathGraphics = Cesium.PathGraphics;
const PolylineGlowMaterialProperty = Cesium.PolylineGlowMaterialProperty;
const PolygonGraphics = Cesium.PolygonGraphics;
const Entity = Cesium.Entity;
const ColorMaterialProperty = Cesium.ColorMaterialProperty;
const CesiumMath = Cesium.Math;
const StripeMaterialProperty = Cesium.StripeMaterialProperty;
const StripeOrientation = Cesium.StripeOrientation;
const PolylineGraphics = Cesium.PolylineGraphics;
// const Material = Cesium.Material;

function transformsPosition(transforms, position, x, y) {
    let d = Matrix4.multiplyByPoint(transforms, new Cartesian3(x, y, -1000), new Cartesian3());
    Cartesian3.subtract(d, position, d);
    let intersection = IntersectionTests.rayEllipsoid(new Ray(position, d), Ellipsoid.WGS84);
    return Ray.getPoint(new Ray(position, d), intersection.start);
}

function calculatePosition(position, lastPosition, pitch, xHalfAngle, yHalfAngle) {
    let transforms = Transforms.eastNorthUpToFixedFrame(position);
    let inverseTransforms = Matrix4.inverse(transforms, new Matrix4());
    let lastP = Matrix4.multiplyByPoint(inverseTransforms, lastPosition, new Cartesian3());
    let heading = Math.atan(lastP.y / lastP.x);
    let rz3 = Matrix3.fromRotationZ(heading, new Matrix3());
    pitch = lastP.y > 0 ? -pitch : pitch;
    let rx3 = Matrix3.fromRotationX((pitch / 180) * Math.PI, new Matrix3());

    Matrix4.multiplyByMatrix3(transforms, rz3, transforms);
    Matrix4.multiplyByMatrix3(transforms, rx3, transforms);
    let x = Math.tan((xHalfAngle / 180) * Math.PI) * 1000;
    let y = Math.tan((yHalfAngle / 180) * Math.PI) * 1000;

    let p1 = transformsPosition(transforms, position, x, y);
    let p2 = transformsPosition(transforms, position, -x, y);
    let p3 = transformsPosition(transforms, position, -x, -y);
    let p4 = transformsPosition(transforms, position, x, -y);
    return [p1, p2, p3, p4];
}
class SatelliteEntity extends EntityWrapper {
    constructor(viewer, tle, options) {
        super(viewer, options);
        this.scanStrips = options.scanStrips;
        this.props = new SatelliteProperties(viewer, tle, options);
        this.code = options.code;
        this._image = defaultValue(options.image, '../../../Assets/images/satelliteO.png');
        this._orbitColor = Color.GOLD.withAlpha(0.6);
        this._orbitalType = options.orbitalType;
        this._satelliteType = options.satelliteType;
        this._satelliteType2 = options.satelliteType2;
        this._orbitTrackColor = defaultValue(options.orbitTrackColor, Color.ORANGE);
        this._groundTrackColor = defaultValue(
            options.groundTrackColor,
            Color.fromRandom().withAlpha(0.3)
        );
        this._fov = defaultValue(options.fov, 1);
        this._radius = null;
        this._Roll = 0;
        this._pitch = 0;
        this._xHalfAngle = defaultValue(options.xHalfAngle, 5);
        this._yHalfAngle = defaultValue(options.yHalfAngle, 5);
        this._sideSwingAngle = defaultValue(options.sideSwingAngle, 0);
        this.enableAllComponentTimes = [];
    }

    /**
     * 获取卫星测摆角
     * @return {number}  卫星测摆角
     *
     */
    get fov() {
        return this._fov;
    }

    /**
     * 设置卫星测摆角
     * @return {number}  卫星测摆角
     *
     */
    set fov(val) {
        this._fov = val;
    }

    /**
     * 获取卫星测摆角
     * @return {number}  卫星测摆角
     *
     */
    get radius() {
        return this._radius;
    }

    /**
     * 设置卫星测摆角
     * @return {number}  卫星测摆角
     *
     */
    set radius(val) {
        this._radius = val;
    }

    /**
     * 获取卫星图标
     * @return {String}  卫星图标
     *
     */
    get image() {
        return this._image;
    }

    /**
     * 设置卫星图标
     * @param {String}  val 卫星图标
     *
     */
    set image(val) {
        this._image = val;
    }

    /**
     * 获取卫星轨道颜色
     * @return {Color}   卫星轨道颜色
     *
     */
    get orbitColor() {
        return this._orbitColor;
    }
    /**
     * 设置卫星轨道颜色
     * @param {Color}  val 卫星轨道颜色
     *
     */
    set orbitColor(val) {
        this._orbitColor = val;
    }

    /**
     * 设置卫星地面覆盖颜色
     * @param {Color}  val 卫星地面覆盖颜色
     *
     */
    set groundTrackColor(val) {
        this._groundTrackColor = val;
    }
    /**
     * 获取卫星地面覆盖颜色
     * @return {Color}  卫星地面覆盖颜色
     *
     */
    get groundTrackColor() {
        return this._groundTrackColor;
    }

    /**
     * 设置卫星地面覆盖宽度
     * @param {Number}  val 卫星地面覆盖宽度
     *
     */
    set groundTrackWidth(val) {
        this._groundTrackWidth = val;
    }

    /**
     * 获取卫星地面覆盖宽度
     * @return {Number}  获取卫星地面覆盖宽度
     *
     */
    get groundTrackWidth() {
        return this._groundTrackWidth;
    }

    /**
     * 设置卫星波束颜色1
     * @param {Color}  val 卫星波束颜色1
     *
     */
    set coneColor1(val) {
        this._coneColor1 = val;
    }

    /**
     * 获取卫星波束颜色1
     * @return {Color}  获取卫星波束颜色1
     *
     */
    get coneColor1() {
        return this._coneColor1;
    }

    /**
     * 设置卫星波束颜色2
     * @param {Color}  val 卫星波束颜色2
     *
     */
    set coneColor2(val) {
        this._coneColor2 = val;
    }
    /**
     * 获取卫星波束颜色2
     * @return {Color}  获取卫星波束颜色2
     *
     */
    get coneColor2() {
        return this._coneColor2;
    }

    /**
     * 获取卫星名称
     * @return {String}  卫星名称
     *
     */
    get name() {
        return this.props.name;
    }

    /**
     * 获取卫星过境信息
     * @return {Object}  卫星过境信息
     *
     */
    get passInfo() {
        return this.props.passes;
    }

    /**
     * 获取卫星旋转角度
     * @return {Number}  卫星旋转角度
     *
     */
    get Roll() {
        return this._Roll;
    }

    /**
     * 设置卫星旋转角度
     *
     */
    set Roll(value) {
        this._Roll = value;
    }

    /**
     * 获取卫星侧摆角度
     * @return {Number}  卫星侧摆角度
     *
     */
    get pitch() {
        return this._pitch;
    }

    /**
     * 设置卫星侧摆角度
     *
     */
    set pitch(value) {
        this._pitch = value;
    }

    /**
     * 设置卫星x向扫描角度
     *
     */
    set xHalfAngle(value) {
        this._xHalfAngle = value;
        this.entities['Sensor square cone'] &&
            (this.entities['Sensor square cone'].rectangularSensor.xHalfAngle =
                (value / 180) * Math.PI);
    }

    get xHalfAngle() {
        return this._xHalfAngle;
    }

    /**
     * 设置卫星x向扫描角度
     *
     */
    set yHalfAngle(value) {
        this._yHalfAngle = value;
        this.entities['Sensor square cone'] &&
            (this.entities['Sensor square cone'].rectangularSensor.yHalfAngle =
                (value / 180) * Math.PI);
    }

    get yHalfAngle() {
        return this._yHalfAngle;
    }
    /**
     * 获取卫星当前位置信息
     * @param {DateTime} time 当前时间
     * @return {cartographicDegrees}  卫星当前位置信息,十进制度
     *
     */
    getPosition(time) {
        return this.props.positionCartographicDegrees(time);
    }

    /**
     * 渲染卫星要素
     * @param {string} name 卫星要素名称
     *
     */
    enableComponent(name) {
        if (!this.created) {
            this.createEntities();
        }
        if (name === 'Model' && !this.isTracked) {
            return;
        }
        if (name === 'Ground track') {
            if (this.props.orbit.orbitalPeriod < 60 * 12) {
                this.createGroundTrack();
            }
        }

        if (name === 'Orbit track') {
            super.enableComponent('Orbit');
        }
        super.enableComponent(name);
    }

    disableComponent(name) {
        // if (
        //     name === 'Ground track' &&
        //     this.entities[name] &&
        //     this.entityCollection.contains(this.entities[name])
        // ) {
        //     if (this.props.orbit.orbitalPeriod < 60 * 12) {
        //         let positions = this.entities[name].polygon.hierarchy.getValue(
        //             JulianDate.fromDate(new Date())
        //         );
        //         this.scanStrips.add({
        //             polygon: {
        //                 hierarchy: positions,
        //                 material: this._groundTrackColor,
        //             },
        //         });
        //     }
        // }
        if (name === 'Orbit track') {
            super.disableComponent('Orbit');
        }
        super.disableComponent(name);
    }

    // 创建卫星要素
    createEntities() {
        let _self = this;
        this.props.createSampledPosition(this.viewer.clock, sampledPosition => {
            for (let entity in this.entities) {
                // if (entity === 'Orbit') {
                //     this.entities[entity].position = this.props.sampledPositionInertial;
                //     this.entities[entity].orientation = new VelocityOrientationProperty(
                //         this.props.sampledPositionInertial
                //     );
                // } else
                if (entity === 'Sensor cone' || entity === 'Sensor square cone') {
                    this.entities[entity].position = sampledPosition;
                    this.entities[entity].orientation = new CallbackProperty(time => {
                        const position = this.props.position(time);
                        const lastPosition = this.props.position(
                            JulianDate.addSeconds(time, -1, new JulianDate())
                        );
                        const cartographic = Cartographic.fromCartesian(position);
                        let surfacePoint = Cartesian3.fromRadians(
                            cartographic.longitude,
                            cartographic.latitude
                        );
                        let transforms = Transforms.eastNorthUpToFixedFrame(surfacePoint);
                        let inverseTransforms = Matrix4.inverse(transforms, new Matrix4());
                        let p1 = Matrix4.multiplyByPoint(
                            inverseTransforms,
                            position,
                            new Cartesian3()
                        );
                        let p2 = Matrix4.multiplyByPoint(
                            inverseTransforms,
                            lastPosition,
                            new Cartesian3()
                        );
                        let radius = Math.atan((p1.x - p2.x) / (p1.y - p2.y));
                        const hpr = new HeadingPitchRoll(
                            radius,
                            CesiumMath.toRadians(180 + _self._pitch),
                            CesiumMath.toRadians(_self.Roll)
                        );
                        return Transforms.headingPitchRollQuaternion(position, hpr);
                    }, false);
                } else {
                    this.entities[entity].position = sampledPosition;
                    this.entities[entity].orientation = new VelocityOrientationProperty(
                        sampledPosition
                    );
                }
            }
        });

        this.entities = {};
        this.createPoint();
        this.createLabel();
        this.createImage();
        this.createOrbit();
        this.createOrbitTrack();
        this.createCone();
        this.createSquareCone();
        // this.createModel();
        if (this.props.groundStationAvailable) {
            this.createGroundStationLink();
        }
        this.defaultEntity = this.entities['Point'];
    }
    // 创建卫星对象
    createCesiumSatelliteEntity(entityName, entityKey, entityValue) {
        this.createCesiumEntity(
            entityName,
            entityKey,
            entityValue,
            this.props.name,
            this.description,
            this.props.sampledPosition,
            true
        );
    }

    // 创建点
    createPoint() {
        const point = new PointGraphics({
            pixelSize: 10,
            color: Color.WHITE,
        });
        this.createCesiumSatelliteEntity('Point', 'point', point);
    }

    createBox() {
        const size = 1000;
        const box = new BoxGraphics({
            dimensions: new Cartesian3(size, size, size),
            material: Color.WHITE,
        });
        this.createCesiumSatelliteEntity('Box', 'box', box);
    }

    // 创建模型
    createModel(url) {
        let modelUrl = url ? url : buildModuleUrl('Assets/Images/Satellite/satellite.glb');
        const model = new ModelGraphics({
            uri: modelUrl,
        });
        this.createCesiumSatelliteEntity('3D model', 'model', model);
    }

    // 创建卫星图标
    createImage() {
        const satBillboard = new BillboardGraphics({
            image: this._image,
            horizontalOrigin: HorizontalOrigin.CENTER,
            verticalOrigin: VerticalOrigin.CENTER,
            height: 24,
            width: 24,
        });
        this.createCesiumSatelliteEntity('satBillboard', 'billboard', satBillboard);
    }

    // 创建文字
    createLabel() {
        const label = new LabelGraphics({
            text: this.props.name,
            font: '30px 黑体',
            fillColor: Color.AQUA,
            scale: 0.5,
            horizontalOrigin: HorizontalOrigin.LEFT,
            verticalOrigin: VerticalOrigin.CENTER,
            pixelOffset: new Cartesian2(15, 0),
            distanceDisplayCondition: new DistanceDisplayCondition(10000, 2.0e7),
            pixelOffsetScaleByDistance: new NearFarScalar(1.0e1, 10, 2.0e5, 1),
        });
        this.createCesiumSatelliteEntity('Label', 'label', label);
    }
    createOrbit(leadTime = 0, trailTime = this.props.orbit.orbitalPeriod * 60) {
        const path = new Cesium.PathGraphics({
            leadTime: this.props.orbit.orbitalPeriod < 720 ? leadTime : 100,
            trailTime:
                this.props.orbit.orbitalPeriod < 720
                    ? trailTime / 2
                    : this.props.orbit.orbitalPeriod * 10000,
            material: this._orbitTrackColor.withAlpha(0.5),
            resolution: 600,
            width: 2,
        });
        this.createCesiumSatelliteEntity('Orbit', 'path', path);
    }
    // 创建轨道跟踪
    createOrbitTrack(leadTime = this.props.orbit.orbitalPeriod * 60, trailTime = 0) {
        // 720 = 60 * 12
        const path = new PathGraphics({
            leadTime:
                this.props.orbit.orbitalPeriod < 720
                    ? leadTime / 2
                    : this.props.orbit.orbitalPeriod * 10000,
            trailTime: this.props.orbit.orbitalPeriod < 720 ? trailTime : 100,
            material: new PolylineGlowMaterialProperty({
                glowPower: 0.05,
                taperPower: 4.0,
                color: this._orbitTrackColor,
            }),
            resolution: 600,
            width: 15,
        });
        this.createCesiumSatelliteEntity('Orbit track', 'path', path);
    }

    // 创建地面扫描线
    createGroundTrack() {
        let startTime = this.viewer.clock.currentTime.clone();
        const startPosition = this.props.position(startTime);
        JulianDate.addSeconds(startTime, -1, startTime);
        const startLastPosition = this.props.position(startTime);

        let positions = calculatePosition(
            startPosition,
            startLastPosition,
            this.pitch,
            this.xHalfAngle,
            this.yHalfAngle
        );
        const polygon = new PolygonGraphics({
            material: this._groundTrackColor,
            hierarchy: new CallbackProperty(time => {
                time = time.clone();
                const position = this.props.position(time);
                JulianDate.addSeconds(time, -1, time);
                const lastPosition = this.props.position(time);

                let nowPositions = calculatePosition(
                    position,
                    lastPosition,
                    this.pitch,
                    this.xHalfAngle,
                    this.yHalfAngle
                );
                return {
                    positions: [positions[0], positions[3], nowPositions[2], nowPositions[1]],
                };
            }, false),
            height: 10,
        });
        this.createCesiumSatelliteEntity('Ground track', 'polygon', polygon);
    }

    // 创建卫星波束
    createCone() {
        let _self = this;
        const cone = new Entity({
            position: this.props.sampledPosition,
            orientation: new CallbackProperty(time => {
                const position = this.props.position(time);
                const lastPosition = this.props.position(
                    JulianDate.addSeconds(time, -1, new JulianDate())
                );
                const cartographic = Cartographic.fromCartesian(position);
                let surfacePoint = Cartesian3.fromRadians(
                    cartographic.longitude,
                    cartographic.latitude
                );
                let transforms = Transforms.eastNorthUpToFixedFrame(surfacePoint);
                let inverseTransforms = Matrix4.inverse(transforms, new Matrix4());
                let p1 = Matrix4.multiplyByPoint(inverseTransforms, position, new Cartesian3());
                let p2 = Matrix4.multiplyByPoint(inverseTransforms, lastPosition, new Cartesian3());
                let radius = Math.atan((p1.x - p2.x) / (p1.y - p2.y));
                const hpr = new HeadingPitchRoll(
                    radius,
                    CesiumMath.toRadians(180 + _self.pitch),
                    CesiumMath.toRadians(_self.Roll)
                );
                return Transforms.headingPitchRollQuaternion(position, hpr);
            }, false),
        });

        cone.addProperty('conicSensor');
        // let material = new ColorMaterialProperty(Color.ORANGE.withAlpha(0.3));
        let offset = 0.001;
        let material = new Cesium.StripeMaterialProperty({
            evenColor: Color.ORANGE.withAlpha(0.6),
            oddColor: new Color(0, 0, 0, 0),
            repeat: Number(1000.0),
            orientation: Cesium.StripeOrientation.HORIZONTAL,
            offset: new Cesium.CallbackProperty(function() {
                offset += 0.0001;
                return offset;
            }, false),
        });

        cone.conicSensor = new CesiumSensorVolumes.ConicSensorGraphics({
            radius: 15000000,
            innerHalfAngle: CesiumMath.toRadians(0),
            outerHalfAngle: CesiumMath.toRadians(this._fov),
            lateralSurfaceMaterial: material,
            intersectionColor: Color.WHITE.withAlpha(0.8),
            intersectionWidth: 1,
        });

        this.entities['Sensor cone'] = cone;
    }

    createSquareCone() {
        let _self = this;
        const cone = new Entity({
            position: this.props.sampledPosition,
            orientation: new CallbackProperty(time => {
                const position = this.props.position(time);
                const lastPosition = this.props.position(
                    JulianDate.addSeconds(time, -1, new JulianDate())
                );
                const cartographic = Cartographic.fromCartesian(position);
                let surfacePoint = Cartesian3.fromRadians(
                    cartographic.longitude,
                    cartographic.latitude
                );
                let transforms = Transforms.eastNorthUpToFixedFrame(surfacePoint);
                let inverseTransforms = Matrix4.inverse(transforms, new Matrix4());
                let p1 = Matrix4.multiplyByPoint(inverseTransforms, position, new Cartesian3());
                let p2 = Matrix4.multiplyByPoint(inverseTransforms, lastPosition, new Cartesian3());
                let radius = Math.atan((p1.x - p2.x) / (p1.y - p2.y));
                const hpr = new HeadingPitchRoll(
                    radius,
                    CesiumMath.toRadians(180 + _self.pitch),
                    CesiumMath.toRadians(_self.Roll)
                );
                return Transforms.headingPitchRollQuaternion(position, hpr);
            }, false),
        });

        cone.addProperty('rectangularSensor');
        let material = new ColorMaterialProperty(Color.ORANGE.withAlpha(0.3));
        // let material = new Material({
        //  fabric : {
        //      type : 'Image',
        //      uniforms : {
        //          image : '../images/Cesium_Logo_Color.jpg'
        //      }
        //  }
        // });

        cone.rectangularSensor = new CesiumSensorVolumes.RectangularSensorGraphics({
            radius: 1500000,
            xHalfAngle: (this._xHalfAngle * Math.PI) / 180,
            yHalfAngle: (this._yHalfAngle * Math.PI) / 180,
            innerHalfAngle: CesiumMath.toRadians(0),
            lateralSurfaceMaterial: material,
            intersectionColor: Color.WHITE.withAlpha(0.8),
            intersectionWidth: 1,
        });
        this.entities['Sensor square cone'] = cone;
    }

    // 创建监测点连接线
    createGroundStationLink() {
        let offset = 0.001;
        let dyMaterial = new StripeMaterialProperty({
            evenColor: Color.BLUE.withAlpha(Number(0.6)),
            oddColor: Color.YELLOW.withAlpha(Number(0.6)),
            repeat: Number(20.0),
            orientation: StripeOrientation.VERTICAL,
            offset: new CallbackProperty(function() {
                offset += 0.001;
                return offset;
            }, false),
        });

        const polyline = new PolylineGraphics({
            followSurface: false,
            material: dyMaterial,
            positions: new CallbackProperty(time => {
                const satPosition = this.props.position(time);
                const groundPosition = this.props.groundStationPosition.cartesian;
                const positions = [satPosition, groundPosition];
                return positions;
            }, false),
            show: new CallbackProperty(time => {
                return this.props.passIntervals.contains(time);
            }, false),
            width: 10,
        });
        this.createCesiumSatelliteEntity('Ground station link', 'polyline', polyline);
    }

    addSimulation(startTime, endTime) {
        this.show([SatelliteComponents.SatImage, SatelliteComponents.Label]);
        let _self = this;
        _self.enableAllComponentState = false;
        this.onTickListener = this.viewer.clock.onTick.addEventListener(function(clock) {
            let show = false;
            if (
                Cesium.JulianDate.greaterThanOrEquals(clock.currentTime, startTime) &&
                Cesium.JulianDate.lessThanOrEquals(clock.currentTime, endTime)
            ) {
                show = true;
            }
            if (!_self.enableAllComponentState && show) {
                _self.enableComponent('Sensor square cone');
                _self.enableComponent('Ground track');
                _self.enableComponent('Orbit track');
                _self.enableAllComponentState = true;
            } else if (_self.enableAllComponentState && !show) {
                _self.disableComponent('Sensor square cone');
                _self.disableComponent('Orbit track');
                if (
                    'Ground track' in _self.entities &&
                    _self.entityCollection.contains(_self.entities['Ground track'])
                ) {
                    _self.entityCollection.remove(_self.entities['Ground track']);
                }
                _self.enableAllComponentState = false;
            }
        });
    }
    removeSimulation() {
        this.enableAllComponentTimes = [];
        this.onTickListener();
        this.onTickListener = null;
    }
}

export default SatelliteEntity;
