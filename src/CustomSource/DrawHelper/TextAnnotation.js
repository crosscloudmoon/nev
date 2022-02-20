/* global Cesium */
const createGuid = Cesium.createGuid;
const defaultValue = Cesium.defaultValue;
const LabelCollection = Cesium.LabelCollection;
const ScreenSpaceEventHandler = Cesium.ScreenSpaceEventHandler;
const ScreenSpaceEventType = Cesium.ScreenSpaceEventType;
const Color = Cesium.Color;
const Cartesian3 = Cesium.Cartesian3;
const LabelStyle = Cesium.LabelStyle;

import carToDegrees from './carToDegrees';

export default class TextAnnotation extends LabelCollection {
    constructor(options) {
        super({
            scene: options.scene,
        });
        options.style = LabelStyle.FILL_AND_OUTLINE;
        options.horizontalOrigin = 0;
        options.verticalOrigin = 0;
        super.add(options);
        this.id = defaultValue(options.id, createGuid());
        this.properties = defaultValue(options.properties, {});
        this.enEdit = defaultValue(options.enEdit, true);
        this.listeners = defaultValue(options.listeners, {});
        this._primitives = defaultValue(options.primitives, undefined);
        this._scene = defaultValue(options.scene, null);

        let C = this._labels[0].fillColor;
        let OC = this._labels[0].outlineColor;
        this._color =
            'rgba(' + C.red * 255 + ',' + C.green * 255 + ',' + C.blue * 255 + ',' + C.alpha + ')';
        this._outlineColor =
            'rgba(' +
            OC.red * 255 +
            ',' +
            OC.green * 255 +
            ',' +
            OC.blue * 255 +
            ',' +
            OC.alpha +
            ')';
        this._fontSize = parseInt(this._labels[0].font.split(' ')[0], 10);
        this._fontFamily = this._labels[0].font.split(' ')[1];
    }
    destroy() {
        this.removeAll();
        this._primitives.remove(this);
    }
    set show(flag) {
        this._labels[0].show = flag;
    }
    getType() {
        return 'Text';
    }

    get position() {
        let position = carToDegrees(this._labels[0].position);
        let _self = this;
        return new Proxy(position, {
            set: function(obj, prop, value) {
                obj[prop] = value;
                _self._labels[0].position = Cartesian3.fromDegrees(obj.lon, obj.lat);
                return true;
            },
        });
    }

    set position(value) {
        this._labels[0].position = Cartesian3.fromDegrees(value.lon, value.lat);
    }

    get text() {
        return this._labels[0].text;
    }
    set text(value) {
        this._labels[0].text = value;
    }
    get fontSize() {
        return this._fontSize;
    }
    set fontSize(value) {
        this._fontSize = value;
        this._labels[0].font = value + 'px ' + this._fontFamily;
    }
    get fontFamily() {
        return this._fontFamily;
    }
    set fontFamily(value) {
        this._fontFamily = value;
        this._labels[0].font = this._fontSize + 'px ' + value;
    }
    get color() {
        return this._color;
    }
    set color(value) {
        this._color = value;
        this._labels[0].fillColor = Color.fromCssColorString(value);
    }
    get outlineColor() {
        return this._outlineColor;
    }
    set outlineColor(value) {
        this._outlineColor = value;
        this._labels[0].outlineColor = Color.fromCssColorString(value);
    }

    get outlineWidth() {
        return this._labels[0].outlineWidth;
    }
    set outlineWidth(value) {
        this._labels[0].outlineWidth = value;
    }
    update(context) {
        super.update(context);
        if (this._createPrimitive) {
            this._createPrimitive = false;
            this._mountEventListener(this._labels[0]);
        }
    }

    set listeners(value) {
        let _self = this;
        value.leftClick = value.leftClick || undefined;
        this._listeners = new Proxy(value, {
            get: function(target, key, proxy) {
                if (key === 'leftClick' && _self.enEdit) {
                    return function() {
                        target[key] && target[key](...arguments);
                        _self.setEditMode(...arguments);
                    };
                }
                return target[key];
            },
        });
    }

    get listeners() {
        return this._listeners;
    }

    _mountEventListener(primitive) {
        Object.assign(primitive, this.listeners);
    }

    addEventListener(type, func) {
        this.listeners[type] = func;
        this._primitive && (this._primitive[type] = this.listeners[type]);
        this._outlinePrimitive && (this._outlinePrimitive[type] = this.listeners[type]);
    }

    removeEventListener(type) {
        this.listeners[type] = null;
        this._primitive && (this._primitive[type] = this.listeners[type]);
        this._outlinePrimitive && (this._outlinePrimitive[type] = this.listeners[type]);
    }

    _stopEdit(movement) {
        let pickedObject = this._scene.pick(movement.position);
        if (
            !(pickedObject && pickedObject.primitive) ||
            pickedObject.primitive !== this._labels[0]
        ) {
            this.setEditMode(false);
        }
    }

    _addStopEditListener() {
        this._stopEditListener = new ScreenSpaceEventHandler(this._scene.canvas);
        this._stopEditListener.setInputAction(
            this._stopEdit.bind(this),
            ScreenSpaceEventType.LEFT_CLICK
        );
    }

    _removeStopEditListener() {
        this._stopEditListener && this._stopEditListener.destroy();
        this._stopEditListener = null;
    }

    setEditMode(position, pickedObject) {
        if (this._editing && pickedObject && pickedObject.primitive === this._primitive) {
            return;
        }
        if (!this._editing && position) {
            window.requestAnimationFrame(() => {
                let _self = this;
                let scene = this._scene;
                let options = null;
                if (typeof this.startEditCallback === 'function') {
                    options = {
                        text: this.text,
                        fontSize: this.fontSize,
                        fontFamily: this.fontFamily,
                        color: this.color,
                        outlineColor: this.outlineColor,
                        outlineWidth: this.outlineWidth,
                        position: this.position,
                    };
                    let primitiveAttr = new Proxy(options, {
                        set: function(obj, prop, value) {
                            obj[prop] = value;
                            _self[prop] = value;
                            return true;
                        },
                    });
                    this.startEditCallback(primitiveAttr, this);
                }

                // eslint-disable-next-line no-inner-declarations
                function enableRotation(enable) {
                    scene.screenSpaceCameraController.enableRotate = enable;
                    scene.screenSpaceCameraController.enableTranslate = enable;
                }
                this._labels[0]['leftDown'] = function() {
                    function onDrag(position) {
                        _self._labels[0].position = position;
                        options.position = _self.position;
                    }

                    function onDragEnd() {
                        handler.destroy();
                        enableRotation(true);
                    }
                    let handler = new ScreenSpaceEventHandler(scene.canvas);
                    handler.setInputAction(function(movement) {
                        let ray = scene.camera.getPickRay(movement.endPosition);
                        let cartesian = scene.globe.pick(ray, _self._scene);
                        if (cartesian) {
                            onDrag(cartesian);
                        } else {
                            onDragEnd(cartesian);
                        }
                    }, ScreenSpaceEventType.MOUSE_MOVE);
                    handler.setInputAction(function(movement) {
                        onDragEnd();
                    }, ScreenSpaceEventType.LEFT_UP);
                    handler._buttonDown[0] = true;

                    enableRotation(false);
                };
                this._addStopEditListener();
                this._editing = true;
            });
        } else {
            if (typeof this.endEditCallback === 'function') this.endEditCallback(this);
            this._labels[0] && (this._labels[0]['leftDown'] = null);
            this._removeStopEditListener();
            this._editing = false;
        }
    }
}
