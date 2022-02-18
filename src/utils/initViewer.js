/* global Cesium */
import layerManager from 'U/layerManager';
export default function initViewer(container) {
    Cesium.Camera.DEFAULT_VIEW_RECTANGLE = Cesium.Rectangle.fromDegrees(73, 13, 135, 53);
    const viewer = new Cesium.Viewer(container, {
        baseLayerPicker: false,
        fullscreenButton: false,
        vrButton: false,
        geocoder: false,
        animation: false,
        homeButton: false,
        infoBox: false,
        sceneModePicker: false,
        selectionIndicator: false,
        timeline: false,
        navigationHelpButton: false,
        navigationInstructionsInitiallyVisible: false,
        creditContainer: document.createElement('div'),
        imageryProvider: false,
        contextOptions: {
            webgl: {
                alpha: true,
                depth: false,
                stencil: true,
                antialias: true,
                premultipliedAlpha: true,
                preserveDrawingBuffer: true,
                failIfMajorPerformanceCaveat: true,
            },
            allowTextureFilterAnisotropic: true,
        },
    });

    viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
        Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
    );
    viewer.scene.fog.enabled = false;
    viewer.scene.globe.showGroundAtmosphere = false;
    viewer.clock.shouldAnimate = true;
    window.viewer = viewer;

    let handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction(function (movement) {
        let pickedObject = viewer.scene.pick(movement.position);
        if (
            Cesium.defined(pickedObject) &&
            Cesium.defined(pickedObject.id) &&
            typeof pickedObject.id.leftClick === 'function'
        ) {
            pickedObject.id.leftClick(pickedObject.id);
        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    if (window.$config && window.$config.mapService) {
        const imageryLayers = window.$config.mapService.imageryLayers;
        if (imageryLayers && Array.isArray(imageryLayers)) {
            imageryLayers.forEach(item => {
                if (item.preloading) {
                    layerManager.setBaseLayer(item, true);
                }
            });
        }
        const dem = window.$config.mapService.dem;
        if (dem && Array.isArray(dem)) {
            dem.forEach(item => {
                if (item.preloading) {
                    layerManager.setTerrainLayer(item, true);
                }
            });
        }
    }
}
