/* global Cesium */
const defined = Cesium.defined;
const ScreenSpaceEventType = Cesium.ScreenSpaceEventType;
const ScreenSpaceEventHandler = Cesium.ScreenSpaceEventHandler;

const listenerSceneCollection = {};
export default function initialHandlers(scene) {
    if (!defined(scene)) {
        throw new Error('请传入需监听的场景');
    }
    if (defined(listenerSceneCollection[scene.id])) {
        return;
    }
    let _self = this;
    let handler = new ScreenSpaceEventHandler(scene.canvas);

    function callPrimitiveCallback(name, position) {
        if (!_self.enable) return;
        if (_self._handlersMuted) return;
        let pickedObject = scene.drillPick(position);
        for (let i = 0; i < pickedObject.length; i++) {
            if (pickedObject[i] && pickedObject[i].primitive && pickedObject[i].primitive[name]) {
                pickedObject[i].primitive[name](position);
            }
        }
    }
    handler.setInputAction(function(movement) {
        callPrimitiveCallback('leftClick', movement.position);
    }, ScreenSpaceEventType.LEFT_CLICK);
    handler.setInputAction(function(movement) {
        callPrimitiveCallback('leftDoubleClick', movement.position);
    }, ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
    handler.setInputAction(function(movement) {
        callPrimitiveCallback('leftDown', movement.position);
    }, ScreenSpaceEventType.LEFT_DOWN);
}
