/* global Cesium */
const defined = Cesium.defined;
const combine = Cesium.combine;
const ImageryProvider = Cesium.ImageryProvider;
const WebMapTileServiceImageryProvider = Cesium.WebMapTileServiceImageryProvider;

class C_WebMapTileServiceImageryProvider extends WebMapTileServiceImageryProvider {
    // constructor(options) {
    //     super(options);
    // }
    requestImage(x, y, level, request) {
        let result;
        let timeDynamicImagery = this._timeDynamicImagery;
        let currentInterval;

        // Try and load from cache
        if (defined(timeDynamicImagery)) {
            currentInterval = timeDynamicImagery.currentInterval;
            result = timeDynamicImagery.getFromCache(x, y, level, request);
        }

        // Couldn't load from cache
        if (!defined(result)) {
            result = requestImage(this, x, y, level, request, currentInterval);
        }

        // If we are approaching an interval, preload this tile in the next interval
        if (defined(result) && defined(timeDynamicImagery)) {
            timeDynamicImagery.checkApproachingInterval(x, y, level, request);
        }

        return result;
    }
}

function requestImage(imageryProvider, col, row, level, request, interval) {
    let labels = imageryProvider._tileMatrixLabels;
    let tileMatrixSetID = imageryProvider._tileMatrixSetID;
    let label = defined(labels) ? labels[level] : level.toString();
    let tileMatrix = tileMatrixSetID ? tileMatrixSetID + ':' + label : label;
    let subdomains = imageryProvider._subdomains;
    let staticDimensions = imageryProvider._dimensions;
    let dynamicIntervalData = defined(interval) ? interval.data : undefined;
    let resource;
    if (!imageryProvider._useKvp) {
        let templateValues = {
            TileMatrix: tileMatrix,
            TileRow: row.toString(),
            TileCol: col.toString(),
            s: subdomains[(col + row + level) % subdomains.length],
        };

        resource = imageryProvider._resource.getDerivedResource({
            request: request,
        });
        resource.setTemplateValues(templateValues);

        if (defined(staticDimensions)) {
            resource.setTemplateValues(staticDimensions);
        }

        if (defined(dynamicIntervalData)) {
            let date = new Date(dynamicIntervalData.Time);
            let dynamicIntervalDataValues = {
                yy: date.getFullYear(),
                mm: date.getMonth() + 1,
                dd: date.getDate(),
                layer: imageryProvider._layer,
            };
            resource.setTemplateValues(dynamicIntervalDataValues);
        }
    } else {
        // build KVP request
        let query = {};
        query.tilematrix = tileMatrix;
        query.layer = imageryProvider._layer;
        query.style = imageryProvider._style;
        query.tilerow = row;
        query.tilecol = col;
        query.tilematrixset = imageryProvider._tileMatrixSetID;
        query.format = imageryProvider._format;

        if (defined(staticDimensions)) {
            query = combine(query, staticDimensions);
        }

        if (defined(dynamicIntervalData)) {
            query = combine(query, dynamicIntervalData);
        }
        resource = imageryProvider._resource.getDerivedResource({
            queryParameters: query,
            request: request,
        });
    }

    return ImageryProvider.loadImage(imageryProvider, resource);
}

export default C_WebMapTileServiceImageryProvider;
