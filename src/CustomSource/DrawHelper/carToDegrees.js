/* global Cesium */
let Cartographic = Cesium.Cartographic;
let defined = Cesium.defined;
let Math = Cesium.Math;
export default function carToDegrees(cartesian) {
    if (!defined(cartesian)) {
        throw new Error('需要一个笛卡尔坐标');
    }
    let cartographic = Cartographic.fromCartesian(cartesian);
    let longitude = Math.toDegrees(cartographic.longitude);
    let latitude = Math.toDegrees(cartographic.latitude);
    let height = cartographic.height;
    return new Proxy(
        {
            lon: longitude,
            lat: latitude,
            hei: height,
        },
        {
            get(target, key, proxy) {
                if (typeof key === 'string') {
                    return target[key.substring(0, 3)];
                }
                return target[key];
            },
        }
    );
}
