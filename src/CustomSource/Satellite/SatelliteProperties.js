/* global Cesium */
import Orbit from './Orbit';
import dayjs from '../ThirdParty/dayjs.min';
import GeoUtil from './GeoUtil';

const Matrix4 = Cesium.Matrix4;
const Cartesian3 = Cesium.Cartesian3;
const IntersectionTests = Cesium.IntersectionTests;
const Ray = Cesium.Ray;
const Ellipsoid = Cesium.Ellipsoid;
const CesiumMath = Cesium.Math;
const defaultValue = Cesium.defaultValue;
const TimeInterval = Cesium.TimeInterval;
const TimeIntervalCollection = Cesium.TimeIntervalCollection;
const JulianDate = Cesium.JulianDate;
const ConstantPositionProperty = Cesium.ConstantPositionProperty;
// const SampledPositionProperty = Cesium.SampledPositionProperty;
const ReferenceFrame = Cesium.ReferenceFrame;
// const ExtrapolationType = Cesium.ExtrapolationType;
// const LagrangePolynomialApproximation = Cesium.LagrangePolynomialApproximation;
const Transforms = Cesium.Transforms;
const Cartographic = Cesium.Cartographic;
const Matrix3 = Cesium.Matrix3;

function calculate(transforms, position, x, y) {
    let d = Matrix4.multiplyByPoint(transforms, new Cartesian3(x, y, -1000), new Cartesian3());
    Cartesian3.subtract(d, position, d);
    let intersection = IntersectionTests.rayEllipsoid(new Ray(position, d), Ellipsoid.WGS84);
    let p = Ray.getPoint(new Ray(position, d), intersection.start);
    let g = Cartographic.fromCartesian(p);
    return {
        x: CesiumMath.toDegrees(g.longitude),
        y: CesiumMath.toDegrees(g.latitude),
    };
}

export class SatelliteProperties {
    constructor(viewer, tle, options) {
        this.name = tle.split('\n')[0].trim();
        if (tle.startsWith('0 ')) {
            this.name = this.name.substring(2);
        }
        this.viewer = viewer;
        this.orbit = new Orbit(this.name, tle);
        this.code = options.code;
        this.satnum = this.orbit.satnum;
        this.tags = defaultValue(options.tags, []);
        this._sideSwingAngle = defaultValue(options.sideSwingAngle, 0);
        this._roll = defaultValue(options.roll, 0);
        this._xHalfAngle = defaultValue(options.xHalfAngle, 5);
        this._yHalfAngle = defaultValue(options.yHalfAngle, 5);
        this.groundStationPosition = undefined;
        this.passes = [];
        this.passInterval = undefined;
        this.passIntervals = new TimeIntervalCollection();
    }

    // 判断是否存在分组
    hasTag(tag) {
        return this.tags.includes(tag);
    }

    position(time) {
        time = JulianDate.toDate(time);
        return Cartographic.toCartesian(this.orbit.positionGeodetic(time));
    }

    positionCartographic(time) {
        time = JulianDate.toDate(time);
        return this.orbit.positionGeodetic(time);
    }

    positionCartographicDegrees(time) {
        time = JulianDate.toDate(time);
        let cartographic = this.orbit.positionGeodetic(time);
        let cartographicDegrees = {
            longitude: CesiumMath.toDegrees(cartographic.longitude),
            latitude: CesiumMath.toDegrees(cartographic.latitude),
            height: cartographic.height,
        };
        return cartographicDegrees;
    }

    get height() {
        return this.cartographic.height;
    }

    // 计算世界坐标
    computePositionCartesian3(julianDate) {
        // Check if Position for current timestap is already computed
        if (
            typeof this.lastPosition !== 'undefined' &&
            JulianDate.compare(this.lastDate, julianDate) === 0
        ) {
            return this.lastPosition;
        }

        this.lastDate = julianDate;
        const { longitude, latitude, height } = this.orbit.positionGeodetic(
            JulianDate.toDate(julianDate)
        );
        this.lastPosition = Cartesian3.fromRadians(longitude, latitude, height);

        return this.lastPosition;
    }

    positionInertial(time, constprop = false) {
        const eci = this.orbit.positionECI(JulianDate.toDate(time));
        const position = new Cartesian3(eci.x * 1000, eci.y * 1000, eci.z * 1000);
        if (constprop) {
            return new ConstantPositionProperty(position, ReferenceFrame.INERTIAL);
        } else {
            return position;
        }
    }

    // 对点坐标进行差值
    createSampledPosition(clock, callback) {
        let lastUpdated;
        lastUpdated = this.updateSampledPosition(clock.currentTime);
        clock.onTick.addEventListener(clock => {
            const dt = Math.abs(JulianDate.secondsDifference(clock.currentTime, lastUpdated));
            if (dt >= 60 * 15) {
                lastUpdated = this.updateSampledPosition(clock.currentTime);
                callback(this.sampledPosition);
            }
        });
    }

    // 更新差值点坐标
    updateSampledPosition(julianDate, samplesFwd = 240, samplesBwd = 120, interval = 30) {
        const sampledPosition = new Cesium.SampledPositionProperty();
        sampledPosition.backwardExtrapolationType = Cesium.ExtrapolationType.HOLD;
        sampledPosition.forwardExtrapolationType = Cesium.ExtrapolationType.HOLD;
        sampledPosition.setInterpolationOptions({
            interpolationDegree: 5,
            interpolationAlgorithm: Cesium.LagrangePolynomialApproximation,
        });

        // const sampledPositionInertial = new Cesium.SampledPositionProperty(Cesium.ReferenceFrame.INERTIAL);
        // sampledPositionInertial.backwardExtrapolationType = Cesium.ExtrapolationType.HOLD;
        // sampledPositionInertial.forwardExtrapolationType = Cesium.ExtrapolationType.HOLD;
        // sampledPositionInertial.setInterpolationOptions({
        //  interpolationDegree: 5,
        //  interpolationAlgorithm: Cesium.LagrangePolynomialApproximation,
        // });

        const randomOffset = Math.random() * 60 * 15;
        let reference = Cesium.JulianDate.addSeconds(
            julianDate,
            randomOffset,
            new Cesium.JulianDate()
        );

        const startTime = -samplesBwd * interval;
        const stopTime = samplesFwd * interval;
        for (let time = startTime; time <= stopTime; time += interval) {
            const timestamp = Cesium.JulianDate.addSeconds(
                reference,
                time,
                new Cesium.JulianDate()
            );
            const position = this.computePositionCartesian3(timestamp);
            sampledPosition.addSample(timestamp, position);

            // const positionInertial = this.positionInertial(timestamp);
            // sampledPositionInertial.addSample(timestamp, positionInertial);
        }

        this.sampledPosition = sampledPosition;
        // this.sampledPositionInertial = sampledPositionInertial;
        return reference;
    }

    // 添加过境监测点
    groundTrack(julianDate, samplesFwd = 0, samplesBwd = 120, interval = 30) {
        const groundTrack = [];
        const startTime = -samplesBwd * interval;
        const stopTime = samplesFwd * interval;
        for (let time = startTime; time <= stopTime; time += interval) {
            const timestamp = JulianDate.addSeconds(julianDate, time, new JulianDate());
            const cartographic = this.positionCartographic(timestamp);
            const groudPosition = Cartesian3.fromRadians(
                cartographic.longitude,
                cartographic.latitude,
                1000
            );
            groundTrack.push(groudPosition);
        }
        return groundTrack;
    }

    get groundStationAvailable() {
        return typeof this.groundStationPosition !== 'undefined';
    }

    // 更新过境时间
    updatePasses(time) {
        if (!this.groundStationAvailable) {
            return false;
        }
        // Check if still inside of current pass interval
        if (
            typeof this.passInterval !== 'undefined' &&
            TimeInterval.contains(
                new TimeInterval({
                    start: this.passInterval.start,
                    stop: this.passInterval.stop,
                }),
                time
            )
        ) {
            return false;
        }
        this.passInterval = {
            start: JulianDate.addDays(time, -1, JulianDate.clone(time)),
            stop: JulianDate.addDays(time, 1, JulianDate.clone(time)),
            stopPrediction: JulianDate.addDays(time, 4, JulianDate.clone(time)),
        };

        let passes = this.computePasses(
            this.groundStationPosition,
            this.passInterval.start,
            this.passInterval.stopPrediction,
            45,
            20
        );
        if (!passes) {
            return false;
        }

        this.passes = passes;
        this.computePassIntervals();
        return true;
    }

    // computePasses(groundStation, startDate, endDate) {
    //     const deg2rad = Math.PI / 180;
    //     const inverseGroundTransforms = Matrix4.inverse(
    //         Transforms.eastNorthUpToFixedFrame(groundStation),
    //         new Matrix4()
    //     );
    //     let startTime = JulianDate.toDate(startDate);
    //     let endTime = JulianDate.toDate(endDate);
    //     let passes = [];
    //     let pass = null;

    //     // eslint-disable-next-line no-unmodified-loop-condition
    //     while (startTime < endTime) {
    //         const positionGeodetic = this.orbit.positionGeodetic(startTime);
    //         const position = Cartographic.toCartesian(positionGeodetic);

    //         let p = Matrix4.multiplyByPoint(inverseGroundTransforms, position, new Cartesian3());
    //         if (p.z > 0) {
    //             startTime.setSeconds(startTime.getSeconds() - 1);
    //             let lastPosition = Cartographic.toCartesian(this.orbit.positionGeodetic(startTime));

    //             if (
    //                 position.x === lastPosition.x &&
    //                 position.y === lastPosition.y &&
    //                 position.z === lastPosition.z
    //             ) {
    //                 break;
    //             }

    //             let transforms = Transforms.eastNorthUpToFixedFrame(position);
    //             let inverseTransforms = Matrix4.inverse(transforms, new Matrix4());
    //             let lastP = Matrix4.multiplyByPoint(
    //                 inverseTransforms,
    //                 lastPosition,
    //                 new Cartesian3()
    //             );
    //             let heading = Math.atan(lastP.y / lastP.x);
    //             let m3 = Matrix3.fromRotationZ(heading, new Matrix3());
    //             transforms = Matrix4.multiplyByMatrix3(transforms, m3, transforms);
    //             inverseTransforms = Matrix4.inverse(transforms, new Matrix4());
    //             let p1 = Matrix4.multiplyByPoint(
    //                 inverseTransforms,
    //                 groundStation,
    //                 new Cartesian3()
    //             );

    //             let nowSideSwingAngle = Math.atan(p1.y / p1.z) / deg2rad;
    //             let newPitch = Math.atan(p1.x / p1.z) / deg2rad;

    //             if (!pass) {
    //                 if (
    //                     Math.abs(newPitch) <= this._roll + this._xHalfAngle &&
    //                     Math.abs(nowSideSwingAngle) <= this._sideSwingAngle + this._yHalfAngle
    //                 ) {
    //                     pass = {
    //                         name: this.name,
    //                         id: this.code,
    //                         startTime: dayjs(startTime).format('YYYY/MM/DD HH:mm:ss'),
    //                         pitch: newPitch,
    //                         sideSwingAngle: lastP.y > 0 ? nowSideSwingAngle : -nowSideSwingAngle,
    //                         sensorId: this.name,
    //                         sideSway: true,
    //                         surface: ' ',
    //                         urgentReqId: null,
    //                     };
    //                 }
    //             } else {
    //                 if (
    //                     Math.abs(newPitch) > this._roll + this._xHalfAngle ||
    //                     Math.abs(nowSideSwingAngle) > this._sideSwingAngle + this._yHalfAngle
    //                 ) {
    //                     pass.endTime = dayjs(startTime).format('YYYY/MM/DD HH:mm:ss');
    //                     passes.push(pass);
    //                     pass = null;
    //                 }
    //             }
    //         }
    //         startTime.setSeconds(startTime.getSeconds() + 6);
    //     }
    //     return passes;
    // }
    // computeAreaPasses(area, startDate, endDate) {
    //     const deg2rad = Math.PI / 180;
    //     let areaPointInverseTransforms = [];
    //     let positions = [];
    //     let passPosition = [];
    //     let cartographic = null;
    //     for (let i = 0; i < area.length; ++i) {
    //         areaPointInverseTransforms.push(
    //             Matrix4.inverse(Transforms.eastNorthUpToFixedFrame(area[i]), new Matrix4())
    //         );
    //         cartographic = Cartographic.fromCartesian(area[i]);
    //         positions.push({
    //             x: CesiumMath.toDegrees(cartographic.longitude),
    //             y: CesiumMath.toDegrees(cartographic.latitude),
    //         });
    //     }
    //     let startTime = JulianDate.toDate(startDate);
    //     let endTime = JulianDate.toDate(endDate);
    //     let passes = [];
    //     let pass = null;

    //     // eslint-disable-next-line no-unmodified-loop-condition
    //     while (startTime < endTime) {
    //         passPosition = [];
    //         const position = Cartographic.toCartesian(this.orbit.positionGeodetic(startTime));
    //         let bool;
    //         let p = null;
    //         for (let i = 0; i < areaPointInverseTransforms.length; ++i) {
    //             p = Matrix4.multiplyByPoint(
    //                 areaPointInverseTransforms[i],
    //                 position,
    //                 new Cartesian3()
    //             );
    //             if (p.z > 0) {
    //                 bool = true;
    //                 break;
    //             }
    //         }

    //         if (bool) {
    //             startTime.setSeconds(startTime.getSeconds() - 1);
    //             let lastPosition = Cartographic.toCartesian(this.orbit.positionGeodetic(startTime));

    //             if (
    //                 position.x === lastPosition.x &&
    //                 position.y === lastPosition.y &&
    //                 position.z === lastPosition.z
    //             ) {
    //                 break;
    //             }

    //             let transforms = Transforms.eastNorthUpToFixedFrame(position);
    //             let inverseTransforms = Matrix4.inverse(transforms, new Matrix4());
    //             let lastP = Matrix4.multiplyByPoint(
    //                 inverseTransforms,
    //                 lastPosition,
    //                 new Cartesian3()
    //             );
    //             let heading = Math.atan(lastP.y / lastP.x);
    //             let rz3 = Matrix3.fromRotationZ(heading, new Matrix3());
    //             let rx3 = Matrix3.fromRotationX(
    //                 (this._sideSwingAngle / 180) * Math.PI,
    //                 new Matrix3()
    //             );
    //             let rx4 = Matrix3.fromRotationX(
    //                 (-this._sideSwingAngle / 180) * Math.PI,
    //                 new Matrix3()
    //             );

    //             Matrix4.multiplyByMatrix3(transforms, rz3, transforms);
    //             let t1 = Matrix4.multiplyByMatrix3(transforms, rx3, new Matrix4());
    //             let t2 = Matrix4.multiplyByMatrix3(transforms, rx4, new Matrix4());
    //             let x = Math.tan((this._xHalfAngle / 180) * Math.PI) * 1000;
    //             let y = Math.tan((this._yHalfAngle / 180) * Math.PI) * 1000;
    //             passPosition.push(
    //                 calculate(t1, position, x, y),
    //                 calculate(t1, position, -x, y),
    //                 calculate(t2, position, -x, -y),
    //                 calculate(t2, position, x, -y)
    //             );
    //             let isCross = GeoUtil.IsPolygonCrossPolygon(positions, passPosition);

    //             if (!pass) {
    //                 if (isCross) {
    //                     let length = area.length;
    //                     let angle;
    //                     let nowSideSwingAngle = 0;
    //                     let number = 0;
    //                     inverseTransforms = Matrix4.inverse(transforms, new Matrix4());
    //                     for (let i = 0; i < length; ++i) {
    //                         p = Matrix4.multiplyByPoint(
    //                             inverseTransforms,
    //                             area[i],
    //                             new Cartesian3()
    //                         );
    //                         angle = Math.atan(p.y / p.z) / deg2rad;
    //                         number += angle > 0 ? 1 : -1;
    //                         nowSideSwingAngle += angle;
    //                     }
    //                     if (Math.abs(number) === length) {
    //                         nowSideSwingAngle = nowSideSwingAngle / length;
    //                         nowSideSwingAngle =
    //                             Math.abs(nowSideSwingAngle) < this._sideSwingAngle
    //                                 ? nowSideSwingAngle
    //                                 : nowSideSwingAngle > 0
    //                                 ? this._sideSwingAngle
    //                                 : -this._sideSwingAngle;
    //                     } else {
    //                         nowSideSwingAngle = 0;
    //                     }
    //                     pass = {
    //                         name: this.name,
    //                         id: this.code,
    //                         startTime: dayjs(startTime).format('YYYY/MM/DD HH:mm:ss'),
    //                         sideSwingAngle: lastP.y > 0 ? nowSideSwingAngle : -nowSideSwingAngle,
    //                         sensorId: this.name,
    //                         sideSway: true,
    //                         surface: ' ',
    //                         urgentReqId: null,
    //                     };
    //                 }
    //             } else {
    //                 if (!isCross) {
    //                     pass.endTime = dayjs(startTime).format('YYYY/MM/DD HH:mm:ss');
    //                     passes.push(pass);
    //                     pass = null;
    //                 }
    //             }
    //         }
    //         startTime.setSeconds(startTime.getSeconds() + 6);
    //     }
    //     return passes;
    // }

    // 清除过境
    computePasses(groundStation, targetName, startDate, endDate) {
        const deg2rad = Math.PI / 180;
        const inverseGroundTransforms = Matrix4.inverse(
            Transforms.eastNorthUpToFixedFrame(groundStation),
            new Matrix4()
        );
        let startTime = JulianDate.toDate(startDate);
        let endTime = JulianDate.toDate(endDate);
        let passes = [];
        let pass = null;

        // eslint-disable-next-line no-unmodified-loop-condition
        while (startTime < endTime) {
            const positionGeodetic = this.orbit.positionGeodetic(startTime);
            const position = Cartographic.toCartesian(positionGeodetic);

            let p = Matrix4.multiplyByPoint(inverseGroundTransforms, position, new Cartesian3());
            if (p.z > 0) {
                startTime.setSeconds(startTime.getSeconds() - 1);
                let lastPosition = Cartographic.toCartesian(this.orbit.positionGeodetic(startTime));

                if (
                    position.x === lastPosition.x &&
                    position.y === lastPosition.y &&
                    position.z === lastPosition.z
                ) {
                    break;
                }

                let transforms = Transforms.eastNorthUpToFixedFrame(position);
                let inverseTransforms = Matrix4.inverse(transforms, new Matrix4());
                let lastP = Matrix4.multiplyByPoint(
                    inverseTransforms,
                    lastPosition,
                    new Cartesian3()
                );
                let heading = Math.atan(lastP.y / lastP.x);
                let m3 = Matrix3.fromRotationZ(heading, new Matrix3());
                transforms = Matrix4.multiplyByMatrix3(transforms, m3, transforms);
                inverseTransforms = Matrix4.inverse(transforms, new Matrix4());
                let p1 = Matrix4.multiplyByPoint(
                    inverseTransforms,
                    groundStation,
                    new Cartesian3()
                );

                let nowSideSwingAngle = Math.atan(p1.y / p1.z) / deg2rad;
                let newPitch = Math.atan(p1.x / p1.z) / deg2rad;

                if (!pass) {
                    if (
                        Math.abs(newPitch) <= this._roll + this._xHalfAngle &&
                        Math.abs(nowSideSwingAngle) <= this._sideSwingAngle + this._yHalfAngle
                    ) {
                        pass = {
                            name: this.name,
                            id: this.code,
                            startTime: dayjs(startTime).format('YYYY/MM/DD HH:mm:ss'),
                            pitch: newPitch,
                            sideSwingAngle: lastP.y > 0 ? nowSideSwingAngle : -nowSideSwingAngle,
                            sensorId: this.name,
                            sideSway: true,
                            urgentReqId: null,
                            targetName: targetName,
                        };
                    }
                } else {
                    if (
                        Math.abs(newPitch) > this._roll + this._xHalfAngle ||
                        Math.abs(nowSideSwingAngle) > this._sideSwingAngle + this._yHalfAngle
                    ) {
                        pass.endTime = dayjs(startTime).format('YYYY/MM/DD HH:mm:ss');
                        passes.push(pass);
                        pass = null;
                    }
                }
            }
            startTime.setSeconds(startTime.getSeconds() + 6);
        }
        return passes;
    }
    // eslint-disable-next-line complexity
    computeAreaPasses(area, targetName, startDate, endDate) {
        const deg2rad = Math.PI / 180;
        let areaPointInverseTransforms = [];
        let positions = [];
        let passPosition = [];
        let cartographic = null;
        for (let i = 0; i < area.length; ++i) {
            areaPointInverseTransforms.push(
                Matrix4.inverse(Transforms.eastNorthUpToFixedFrame(area[i]), new Matrix4())
            );
            cartographic = Cartographic.fromCartesian(area[i]);
            positions.push({
                x: CesiumMath.toDegrees(cartographic.longitude),
                y: CesiumMath.toDegrees(cartographic.latitude),
            });
        }
        let startTime = JulianDate.toDate(startDate);
        let endTime = JulianDate.toDate(endDate);
        let passes = [];
        let pass = null;
        let hours;
        let bool;
        let heading;
        let position = null;
        let p = null;
        let lastPosition = null;
        let transforms = null;
        let inverseTransforms = null;
        let lastP = null;
        let rz3 = null;
        let rx3 = null;
        let rx4 = null;
        let t1 = null;
        let t2 = null;
        let x = null;
        let y = null;
        let isCross;
        let length;
        let i;
        let angle;
        let nowSideSwingAngle;
        let number;

        while (startTime < endTime) {
            hours = startTime.getHours();
            if (hours > 18 && this._satelliteType !== '雷达遥感卫星') {
                startTime = new Date(
                    new Date(
                        new Date(
                            new Date(new Date().setDate(startTime.getDate() + 1)).setHours(9)
                        ).setMinutes(0)
                    ).setSeconds(1)
                );
                continue;
            }
            if (hours < 9 && this._satelliteType !== '雷达遥感卫星') {
                startTime = new Date(
                    new Date(new Date(startTime.setHours(9)).setMinutes(0)).setSeconds(1)
                );
                continue;
            }

            passPosition = [];
            position = Cartographic.toCartesian(this.orbit.positionGeodetic(startTime));
            bool = false;
            p = null;
            for (let i = 0; i < areaPointInverseTransforms.length; ++i) {
                p = Matrix4.multiplyByPoint(
                    areaPointInverseTransforms[i],
                    position,
                    new Cartesian3()
                );
                if (p.z > 0) {
                    bool = true;
                    break;
                }
            }

            if (bool) {
                startTime.setSeconds(startTime.getSeconds() - 1);
                lastPosition = Cartographic.toCartesian(this.orbit.positionGeodetic(startTime));

                if (
                    position.x === lastPosition.x &&
                    position.y === lastPosition.y &&
                    position.z === lastPosition.z
                ) {
                    break;
                }

                transforms = Transforms.eastNorthUpToFixedFrame(position);
                inverseTransforms = Matrix4.inverse(transforms, new Matrix4());
                lastP = Matrix4.multiplyByPoint(inverseTransforms, lastPosition, new Cartesian3());
                heading = Math.atan(lastP.y / lastP.x);
                rz3 = Matrix3.fromRotationZ(heading, new Matrix3());
                rx3 = Matrix3.fromRotationX((this._sideSwingAngle / 180) * Math.PI, new Matrix3());
                rx4 = Matrix3.fromRotationX((-this._sideSwingAngle / 180) * Math.PI, new Matrix3());

                Matrix4.multiplyByMatrix3(transforms, rz3, transforms);
                t1 = Matrix4.multiplyByMatrix3(transforms, rx3, new Matrix4());
                t2 = Matrix4.multiplyByMatrix3(transforms, rx4, new Matrix4());
                x = Math.tan((this._xHalfAngle / 180) * Math.PI) * 1000;
                y = Math.tan((this._yHalfAngle / 180) * Math.PI) * 1000;
                passPosition.push(
                    calculate(t1, position, x, y),
                    calculate(t1, position, -x, y),
                    calculate(t2, position, -x, -y),
                    calculate(t2, position, x, -y)
                );
                isCross = GeoUtil.IsPolygonCrossPolygon(positions, passPosition);

                if (!pass) {
                    if (isCross) {
                        length = area.length;
                        nowSideSwingAngle = 0;
                        number = 0;
                        inverseTransforms = Matrix4.inverse(transforms, new Matrix4());
                        for (i = 0; i < length; ++i) {
                            p = Matrix4.multiplyByPoint(
                                inverseTransforms,
                                area[i],
                                new Cartesian3()
                            );
                            angle = Math.atan(p.y / p.z) / deg2rad;
                            number += angle > 0 ? 1 : -1;
                            nowSideSwingAngle += angle;
                        }
                        if (Math.abs(number) === length) {
                            nowSideSwingAngle = nowSideSwingAngle / length;
                            nowSideSwingAngle =
                                Math.abs(nowSideSwingAngle) < this._sideSwingAngle
                                    ? nowSideSwingAngle
                                    : nowSideSwingAngle > 0
                                    ? this._sideSwingAngle
                                    : -this._sideSwingAngle;
                        } else {
                            nowSideSwingAngle = 0;
                        }
                        pass = {
                            id: this.code,
                            name: this.name,
                            targetName: targetName,
                            startTime: dayjs(startTime).format('YYYY/MM/DD HH:mm:ss'),
                            sideSwingAngle: lastP.y > 0 ? nowSideSwingAngle : -nowSideSwingAngle,
                            sensorId: this.name,
                            sideSway: nowSideSwingAngle !== 0,
                        };
                    }
                } else {
                    if (!isCross) {
                        pass.endTime = dayjs(startTime).format('YYYY/MM/DD HH:mm:ss');
                        passes.push(pass);
                        pass = null;
                    }
                }
            }
            startTime.setSeconds(startTime.getSeconds() + 2);
        }
        return passes;
    }
    clearPasses() {
        this.passInterval = undefined;
        this.passes = [];
        this.passIntervals = new TimeIntervalCollection();
    }

    // 计算过境时间
    computePassIntervals() {
        const passIntervalArray = [];
        for (const pass of this.passes) {
            const startJulian = JulianDate.fromDate(new Date(pass.start));
            const endJulian = JulianDate.fromDate(new Date(pass.end));
            passIntervalArray.push(
                new TimeInterval({
                    start: startJulian,
                    stop: endJulian,
                })
            );
        }
        this.passIntervals = new TimeIntervalCollection(passIntervalArray);
    }

    // 通知过境
    notifyPasses(aheadMin = 5) {
        if (!this.groundStationAvailable) {
            let message = 'Ground station required to notify for passes';
            console.log(message);
            return;
        }
        let passes = this.orbit.computePasses(this.groundStationPosition);
        if (!passes) {
            console.log(`No passes for ${this.name}`);
            return;
        }
        let message = `Notifying for passes of ${this.name}`;
        console.log(message);
    }
}
