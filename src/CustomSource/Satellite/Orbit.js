import * as satellite from '../ThirdParty/satellite/satellite.min';
import dayjs from '../ThirdParty/dayjs.min';

export default class Orbit {
    constructor(name, tle) {
        this.name = name;
        this.tle = tle.split('\n');
        this.satrec = satellite.twoline2satrec(this.tle[1], this.tle[2]);
    }

    get satnum() {
        return this.satrec.satnum;
    }

    // 获取轨道周期
    get orbitalPeriod() {
        const meanMotionRad = this.satrec.no;
        const period = (2 * Math.PI) / meanMotionRad;
        return period;
    }

    positionECI(time) {
        return satellite.propagate(this.satrec, time).position;
    }

    positionECF(time) {
        const positionEci = this.positionECI(time);
        const gmst = satellite.gstime(time);
        const positionEcf = satellite.eciToEcf(positionEci, gmst);
        return positionEcf;
    }

    // 卫星惯性坐标转经纬坐标
    positionGeodetic(time) {
        const positionEci = this.positionECI(time);
        const gmst = satellite.gstime(time);
        const positionGd = satellite.eciToGeodetic(positionEci, gmst);

        return {
            longitude: positionGd.longitude,
            latitude: positionGd.latitude,
            height: positionGd.height * 1000,
        };
    }

    computeGeodeticPositionVelocity(timestamp) {
        const positionAndVelocity = satellite.propagate(this.satrec, timestamp);
        const positionEci = positionAndVelocity.position;
        const velocityEci = positionAndVelocity.velocity;

        const gmst = satellite.gstime(timestamp);
        const positionGd = satellite.eciToGeodetic(positionEci, gmst);
        const velocityGd = satellite.eciToGeodetic(velocityEci, gmst);
        const velocity = Math.sqrt(
            velocityGd.longitude * velocityGd.longitude +
                velocityGd.latitude * velocityGd.latitude +
                velocityGd.height * velocityGd.height
        );

        return {
            longitude: positionGd.longitude,
            latitude: positionGd.latitude,
            height: positionGd.height * 1000,
            velocity,
        };
    }

    // 计算过境周期
    computePasses(
        groundStation,
        startDate = dayjs().toDate(),
        endDate = dayjs(startDate)
            .add(7, 'day')
            .toDate(),
        minElevation = 0,
        maxPasses = 20
    ) {
        const deg2rad = Math.PI / 180;
        const cartographic = {
            latitude: groundStation.latitude * deg2rad,
            longitude: groundStation.longitude * deg2rad,
            height: groundStation.height / 1000,
        };

        let date = startDate;
        let passes = [];
        let pass = false;
        let ongoingPass = false;
        let lastElevation = 0;
        // eslint-disable-next-line no-unmodified-loop-condition
        while (date < endDate) {
            const positionEcf = this.positionECF(date);
            const lookAngles = satellite.ecfToLookAngles(cartographic, positionEcf);
            const elevation = lookAngles.elevation / deg2rad;

            if (elevation > 0) {
                if (!ongoingPass) {
                    // 卫星周期
                    pass = {
                        name: this.name,
                        start: date.getTime(),
                        azimuthStart: lookAngles.azimuth,
                        maxElevation: elevation,
                        azimuthApex: lookAngles.azimuth,
                    };
                    ongoingPass = true;
                } else {
                    // 进入
                    if (elevation > pass.maxElevation) {
                        pass.maxElevation = elevation;
                        pass.azimuthApex = lookAngles.azimuth;
                    }
                }
                date.setSeconds(date.getSeconds() + 5);
            } else {
                if (ongoingPass) {
                    // 退出
                    if (pass.maxElevation > minElevation) {
                        pass.end = date.getTime();
                        pass.duration = pass.end - pass.start;
                        pass.azimuthEnd = lookAngles.azimuth;
                        pass.azimuthStart /= deg2rad;
                        pass.azimuthApex /= deg2rad;
                        pass.azimuthEnd /= deg2rad;
                        passes.push(pass);
                        if (passes.length > maxPasses) {
                            break;
                        }
                    }
                    ongoingPass = false;
                    lastElevation = -180;
                    date.setMinutes(date.getMinutes() + this.orbitalPeriod * 0.75);
                } else {
                    let deltaElevation = elevation - lastElevation;
                    lastElevation = elevation;
                    if (deltaElevation < 0) {
                        date.setMinutes(date.getMinutes() + this.orbitalPeriod * 0.75);
                        lastElevation = -180;
                    } else if (elevation < -20) {
                        date.setMinutes(date.getMinutes() + 5);
                    } else if (elevation < -5) {
                        date.setMinutes(date.getMinutes() + 1);
                    } else if (elevation < -1) {
                        date.setSeconds(date.getSeconds() + 5);
                    } else {
                        date.setSeconds(date.getSeconds() + 2);
                    }
                }
            }
        }
        return passes;
    }
}
