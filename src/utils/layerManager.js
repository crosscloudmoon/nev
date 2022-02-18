/* global Cesium viewer */
let provider = {
    wmts: 'C_WebMapTileServiceImageryProvider',
    wms: 'WebMapServiceImageryProvider',
    single: 'SingleTileImageryProvider',
};

function setBaseLayer(param, flag, index) {
    if (flag) {
        let p = { ...param };
        p.provider.tilingScheme =
            p.provider.projection !== 'WebMercator'
                ? new Cesium.GeographicTilingScheme()
                : new Cesium.WebMercatorTilingScheme();
        let imageryLayer = new Cesium.ImageryLayer(
            new Cesium[provider[p.type.toLowerCase()]](param.provider),
            param.layer
        );
        imageryLayer.id = param.id;
        viewer.imageryLayers.add(imageryLayer, index);
    } else {
        for (let i = 0; i < viewer.imageryLayers.length; i++) {
            if (viewer.imageryLayers._layers[i].id === param.id) {
                viewer.imageryLayers.remove(viewer.imageryLayers.get(i));
            }
        }
    }
}

function setTerrainLayer(param, flag) {
    if (flag) {
        viewer.terrainProvider = new Cesium.CesiumTerrainProvider({
            url: param.url,
        });
    } else {
        viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();
    }
}

export default {
    setBaseLayer,
    setTerrainLayer,
};
