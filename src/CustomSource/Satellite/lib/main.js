import CesiumSensorVolumes from './cesium-sensor-volumes'
var scope;
if (typeof window === 'undefined') {
    if (typeof self === 'undefined') {
        scope = {};
    } else {
        scope = self;
    }
} else {
    scope = window;
}

scope.CesiumSensorVolumes = CesiumSensorVolumes;
