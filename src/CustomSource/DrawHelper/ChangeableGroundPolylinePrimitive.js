/* global Cesium */
const defined = Cesium.defined;
const defaultValue = Cesium.defaultValue;
const destroyObject = Cesium.destroyObject;
const GeometryInstance = Cesium.GeometryInstance;
const Ellipsoid = Cesium.Ellipsoid;
const GroundPolylinePrimitive = Cesium.GroundPolylinePrimitive;
const PolylineMaterialAppearance = Cesium.PolylineMaterialAppearance;
const ScreenSpaceEventType = Cesium.ScreenSpaceEventType;
const ScreenSpaceEventHandler = Cesium.ScreenSpaceEventHandler;

class ChangeableClassificationPrimitive {
    constructor(options = {}) {
        this.id = defaultValue(options.id, undefined);
        this.ellipsoid = defaultValue(options.ellipsoid, Ellipsoid.WGS84);
        this.textureRotationAngle = defaultValue(options.textureRotationAngle, 0.0);
        this.asynchronous = defaultValue(options.asynchronous, false);
        this.show = defaultValue(options.show, true);
        this.width = defaultValue(options.width, 3);
        this.properties = defaultValue(options.properties, {});
        this.listeners = defaultValue(options.listeners, {});
        this.positions = defaultValue(options.positions, null);

        this.debugShowBoundingVolume = defaultValue(options.debugShowBoundingVolume, false);

        this.color = defaultValue(options.color, 'rgba(253, 128, 69, 0.6)');
        this.appearance = defaultValue(options.appearance, new PolylineMaterialAppearance());
        // 外衬线
        this.outlineWidth = defaultValue(options.outlineWidth, 1);
        this.outlineColor = defaultValue(options.outlineColor, 'rgba(0,0,0,1)');
        // 发光线
        this.glowPower = defaultValue(options.glowPower, 0.05);
        this.taperPower = defaultValue(options.taperPower, 0.5);
        // 虚线
        this.gapColor = defaultValue(options.gapColor, 'rgba(0,0,0,0)');
        this.dashedScale = defaultValue(options.dashedScale, 0.5);
        this.dashedLength = defaultValue(options.dashedLength, 16);
        // 线型
        this.lineType = defaultValue(options.lineType, 'Color');
        this.enEdit = defaultValue(options.enEdit, true);

        this._scene = defaultValue(options.scene, null);
        this._primitives = defaultValue(options.primitives, undefined);

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

        if (!this._createPrimitive && !defined(this._primitive)) {
            return;
        }

        if (this._createPrimitive) {
            let geometryInstances = this.getGeometryInstances();
            if (!geometryInstances) {
                return;
            }
            this._createPrimitive = false;
            this._granularity = this.granularity;
            this._textureRotationAngle = this.textureRotationAngle;
            this._id = this.id;

            this._primitive = this._primitive && this._primitive.destroy();
            this.appearance.material = this.material;

            this._primitive = new GroundPolylinePrimitive({
                geometryInstances: geometryInstances,
                appearance: this.appearance,
                asynchronous: this.asynchronous,
            });
            this._mountEventListener(this._primitive);
        }

        this._primitive.update(frameState);
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
        this._primitive = this._primitive && this._primitives.remove(this._primitive);
        this._framePrimitive =
            this._framePrimitive && this._primitives.remove(this._framePrimitive);
        this._primitives = this._primitives && this._primitives.remove(this);
        return destroyObject(this);
    }

    createGeometryInstance(geometry, color, id) {
        return new GeometryInstance({
            geometry: geometry,
            id: id,
            pickPrimitive: this,
        });
    }
}

export default ChangeableClassificationPrimitive;
