/* global Cesium */

const defined = Cesium.defined;
const defaultValue = Cesium.defaultValue;
const destroyObject = Cesium.destroyObject;
const GeometryInstance = Cesium.GeometryInstance;
const Ellipsoid = Cesium.Ellipsoid;
const GroundPrimitive = Cesium.GroundPrimitive;
const GroundPolylinePrimitive = Cesium.GroundPolylinePrimitive;
const ColorGeometryInstanceAttribute = Cesium.ColorGeometryInstanceAttribute;
const PerInstanceColorAppearance = Cesium.PerInstanceColorAppearance;
const PolylineColorAppearance = Cesium.PolylineColorAppearance;
const Color = Cesium.Color;
const ScreenSpaceEventType = Cesium.ScreenSpaceEventType;
const ScreenSpaceEventHandler = Cesium.ScreenSpaceEventHandler;

class ChangeablePrimitive {
    constructor(options) {
        options = options || {};
        this.id = defaultValue(options.id, undefined);
        this.ellipsoid = defaultValue(options.ellipsoid, Ellipsoid.WGS84);
        this.textureRotationAngle = defaultValue(options.textureRotationAngle, 0.0);
        this.asynchronous = defaultValue(options.asynchronous, false);
        this.show = defaultValue(options.show, true);
        this.debugShowBoundingVolume = defaultValue(options.debugShowBoundingVolume, false);
        this.color = defaultValue(options.color, 'rgba(253, 128, 69, 0.6)');
        this.fill = defaultValue(options.fill, true);
        this.outline = defaultValue(options.outline, false);
        this.outlineColor = defaultValue(options.outlineColor, 'rgba(0, 0, 0, 1.0)');
        this.outlineWidth = defaultValue(options.outlineWidth, 1);
        this.appearance = defaultValue(options.appearance, new PerInstanceColorAppearance());
        this.rotation = defaultValue(options.rotation, 0);
        this.properties = defaultValue(options.properties, {});
        this.enEdit = defaultValue(options.enEdit, true);
        this.listeners = defaultValue(options.listeners, {});
        this._scene = defaultValue(options.scene, null);
        this._primitives = defaultValue(options.primitives, undefined);

        this._ellipsoid = undefined;
        this._granularity = undefined;
        this._textureRotationAngle = undefined;
        this._id = undefined;
        this._createPrimitive = true;
    }

    setAttribute(name, value) {
        this[name] = value;
        this._createPrimitive = true;
    }

    getAttribute(name) {
        return this[name];
    }

    update(frameState) {
        if (!this.show) {
            return;
        }

        if (
            !this._createPrimitive &&
            !defined(this._primitive) &&
            !defined(this._outlinePrimitive)
        ) {
            return;
        }

        if (this._createPrimitive) {
            let geometryInstances = this.getGeometryInstances();
            if (!geometryInstances) {
                return;
            }

            this._createPrimitive = false;
            this._id = this.id;
            this._primitive = this._primitive && this._primitive.destroy();
            if (this.fill) {
                this._primitive = new GroundPrimitive({
                    geometryInstances: geometryInstances,
                    appearance: this.appearance,
                    asynchronous: this.asynchronous,
                });
                this._mountEventListener(this._primitive);
            }

            this._outlinePrimitive = this._outlinePrimitive && this._outlinePrimitive.destroy();
            if (this.outline) {
                this._outlinePrimitive = new GroundPolylinePrimitive({
                    geometryInstances: this.getOutlineGeometry(),
                    appearance: new PolylineColorAppearance(),
                    asynchronous: this.asynchronous,
                });
                this._mountEventListener(this._outlinePrimitive);
            }
        }

        this._primitive && this._primitive.update(frameState);
        this._outlinePrimitive && this._outlinePrimitive.update(frameState);
    }

    set listeners(value) {
        let _self = this;
        if (this._listeners) return;
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
            pickedObject.primitive !== this._primitive
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

    isDestroyed() {
        return false;
    }

    destroy() {
        if (this.setEditMode) {
            this.setEditMode(false);
        }
        this.labels = this.labels && this._primitives.remove(this.labels);
        this.billboards = this.billboards && this._primitives.remove(this.billboards);
        this._primitive = this._primitive && this._primitive.destroy();
        this._outlinePrimitive = this._outlinePrimitive && this._outlinePrimitive.destroy();
        this._primitives = this._primitives && this._primitives.remove(this);
        return destroyObject(this);
    }

    createGeometryInstance(geometry, color, id) {
        return new GeometryInstance({
            geometry: geometry,
            id: id,
            pickPrimitive: this,
            attributes: {
                color: ColorGeometryInstanceAttribute.fromColor(Color.fromCssColorString(color)),
            },
        });
    }
}

export default ChangeablePrimitive;
