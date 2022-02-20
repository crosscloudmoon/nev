/* global Cesium */
const defined = Cesium.defined;
const Resource = Cesium.Resource;
const DeveloperError = Cesium.DeveloperError;
const PinBuilder = Cesium.PinBuilder;
const writeTextToCanvas = Cesium.writeTextToCanvas;
let PinBuilderCache = {};
class CustomPinBuilder extends PinBuilder {
    constructor(id) {
        super();
        if (id) {
            if (PinBuilderCache[id]) {
                return PinBuilderCache[id];
            }
            PinBuilderCache[id] = this;
        }
    }
    fromImageAddText(url, text, color, size) {
        // >>includeStart('debug', pragmas.debug);
        if (!defined(url)) {
            throw new DeveloperError('url is required');
        }
        if (!defined(text)) {
            throw new DeveloperError('text is required');
        }
        if (!defined(size)) {
            throw new DeveloperError('size is required');
        }
        // >>includeEnd('debug');
        return createPin(url, text, color, size, this._cache);
    }
}

function drawIcon(context2D, image, color, size) {
    // Size is the largest image that looks good inside of pin box.
    let imageSize = size / 2.5;
    let sizeX = imageSize;
    let sizeY = imageSize;

    if (image.width > image.height) {
        sizeY = imageSize * (image.height / image.width);
    } else if (image.width < image.height) {
        sizeX = imageSize * (image.width / image.height);
    }

    // x and y are the center of the pin box
    let x = Math.round((size - sizeX) / 2);
    let y = Math.round((8.5 / 24) * size - sizeY / 2);

    // context2D.globalCompositeOperation = 'destination-out';
    // context2D.drawImage(image, x - 1, y, sizeX, sizeY);
    // context2D.drawImage(image, x, y - 1, sizeX, sizeY);
    // context2D.drawImage(image, x + 1, y, sizeX, sizeY);
    // context2D.drawImage(image, x, y + 1, sizeX, sizeY);

    // context2D.globalCompositeOperation = 'destination-over';
    // context2D.fillStyle = 'rgba(0,0,0,0)';
    // context2D.fillRect(x - 1, y - 1, sizeX + 2, sizeY + 2);

    context2D.globalCompositeOperation = 'destination-out';
    context2D.drawImage(image, x, y, sizeX, sizeY);

    context2D.globalCompositeOperation = 'destination-over';
    context2D.fillStyle = color;
    context2D.fillRect(x - 1, y - 2, sizeX + 2, sizeY + 2);
}

let stringifyScratch = new Array(4);

function createPin(url, label, color, size, cache) {
    // Use the parameters as a unique ID for caching.
    stringifyScratch[0] = url;
    stringifyScratch[1] = label;
    stringifyScratch[2] = color;
    stringifyScratch[3] = size;
    let id = JSON.stringify(stringifyScratch);

    let item = cache[id];
    if (defined(item)) {
        return item;
    }

    let canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    let context2D = canvas.getContext('2d');

    let resource = Resource.createIfNeeded(url);

    let promise = resource.fetchImage().then(function(image) {
        context2D.drawImage(image, 0, 0, size, size);
        image = writeTextToCanvas(label, {
            font: size + 'px Arial',
        });
        drawIcon(context2D, image, color, size);
        cache[id] = canvas;
        return canvas;
    });
    // cache[id] = promise;
    return promise;
}

export default CustomPinBuilder;
