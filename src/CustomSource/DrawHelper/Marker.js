/* global Cesium */
const createGuid = Cesium.createGuid;
const defaultValue = Cesium.defaultValue;
const Cartesian3 = Cesium.Cartesian3;
const Color = Cesium.Color;
const BillboardCollection = Cesium.BillboardCollection;
const ScreenSpaceEventHandler = Cesium.ScreenSpaceEventHandler;
const ScreenSpaceEventType = Cesium.ScreenSpaceEventType;
const image =
    'data:image/png;base64,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';

import carToDegrees from './carToDegrees';

export default class Marker extends BillboardCollection {
    constructor(options) {
        super({
            scene: options.scene,
        });
        options.image = options.image || image;
        super.add(options);
        this.id = defaultValue(options.id, createGuid());
        this.properties = defaultValue(options.properties, {});
        this.enEdit = defaultValue(options.enEdit, true);
        this.listeners = defaultValue(options.listeners, {});
        this._primitives = defaultValue(options.primitives, undefined);
        this._scene = defaultValue(options.scene, null);
        this._createPrimitive = false;
        let C = this._billboards[0].color;
        this._color =
            'rgba(' + C.red * 255 + ',' + C.green * 255 + ',' + C.blue * 255 + ',' + C.alpha + ')';
    }

    destroy() {
        this.removeAll();
        this._primitives.remove(this);
    }

    set show(flag) {
        this._billboards[0].show = flag;
    }

    getType() {
        return 'Marker';
    }

    update(context) {
        super.update(context);
        if (this._createPrimitive) {
            this._createPrimitive = false;
            this._mountEventListener(this._billboards[0]);
        }
    }

    get position() {
        let position = carToDegrees(this._billboards[0].position);
        let _self = this;
        return new Proxy(position, {
            set: function(obj, prop, value) {
                obj[prop] = value;
                _self._billboards[0].position = Cartesian3.fromDegrees(obj.lon, obj.lat);
                return true;
            },
        });
    }

    set position(value) {
        this._billboards[0].position = Cartesian3.fromDegrees(value.lon, value.lat);
    }

    get image() {
        return this._billboards[0].image;
    }
    set image(value) {
        this._billboards[0].image = value;
    }

    get color() {
        return this._color;
    }
    set color(value) {
        this._color = value;
        this._billboards[0].color = Color.fromCssColorString(value);
    }

    get scale() {
        return this._billboards[0].scale;
    }
    set scale(value) {
        this._billboards[0].scale = value;
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
            pickedObject.primitive !== this._billboards[0]
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
                        // image: this.image,
                        color: this.color,
                        scale: this.scale,
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
                this._billboards[0]['leftDown'] = function() {
                    function onDrag(position) {
                        _self._billboards[0].position = position;
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
            this._removeStopEditListener();
            this._billboards[0] && (this._billboards[0]['leftDown'] = null);
            this._editing = false;
        }
    }
}
