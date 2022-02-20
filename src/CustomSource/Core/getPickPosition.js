/* global Cesium */
import carToDegrees from '../DrawHelper/carToDegrees';

const ScreenSpaceEventHandler = Cesium.ScreenSpaceEventHandler;
const defined = Cesium.defined;
const ScreenSpaceEventType = Cesium.ScreenSpaceEventType;

let positionMap = {};
export default function getPickPosition(viewer) {
    if (!viewer) {
        throw new Error('请传给当前视图--viewer');
    }
    let position = {
        lon: '0°00′00″',
        lat: '0°00′00″',
        height: '0.00m',
        viewHeight: '0.00m',
    };
    if (positionMap[viewer.scene.id]) {
        return positionMap[viewer.scene.id];
    }
    let handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction(function(movement) {
        // 获取鼠标位置
        let ray = viewer.scene.camera.getPickRay(movement.endPosition);
        let cartesian = viewer.scene.globe.pick(ray, viewer.scene);
        if (defined(cartesian)) {
            let degrees = carToDegrees(cartesian);
            position.lon =
                degrees.lon < 0 ? getNum(Math.abs(degrees.lon), 'W') : getNum(degrees.lon, 'E');
            position.lat =
                degrees.lat < 0 ? getNum(Math.abs(degrees.lat), 'S') : getNum(degrees.lat, 'N');
            position.height =
                degrees.height < 1000
                    ? Math.max(degrees.height, 0).toFixed(2) + 'm'
                    : (degrees.height / 1000).toFixed(2) + 'km';
        }
    }, ScreenSpaceEventType.MOUSE_MOVE);

    viewer.scene.camera.changed.addEventListener(function() {
        // 获取当前相机高度
        let height = viewer.camera.positionCartographic.height;
        position.viewHeight =
            height < 1000
                ? Math.max(height, 0).toFixed(2) + 'm'
                : (height / 1000).toFixed(2) + 'km';
    });
    positionMap[viewer.scene.id] = position;
    return position;
}

function getNum(num, sign) {
    let n;
    let res = parseInt(num, 10) + '°';
    num = adjustment(num) * 60;
    n = parseInt(num, 10);
    res = res + (n < 10 ? '0' + n : n) + '′';
    num = adjustment(num) * 60;
    return res + (num < 10 ? '0' + num.toFixed(2) : num.toFixed(2)) + '″' + sign;
}

function adjustment(num) {
    return num - parseInt(num, 10);
}
