let Cesium = require('cesium/Source/Cesium.js');

if (typeof window !== 'undefined') {
    window.Cesium = Cesium;
} else if (typeof self !== 'undefined') {
    self.Cesium = Cesium;
} else if (typeof module !== 'undefined') {
    module.exports = Cesium;
} else {
    console.log('Unable to load Cesium.');
}
