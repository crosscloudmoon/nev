/* global Cesium */
const defined = Cesium.defined;
const defaultValue = Cesium.defaultValue;
const destroyObject = Cesium.destroyObject;
const GeometryInstance = Cesium.GeometryInstance;
const Ellipsoid = Cesium.Ellipsoid;
const Primitive = Cesium.Primitive;
const ColorGeometryInstanceAttribute = Cesium.ColorGeometryInstanceAttribute;
const PerInstanceColorAppearance = Cesium.PerInstanceColorAppearance;
const Color = Cesium.Color;

import optionsFunction from './optionsFunction';

class ChangeablePrimitive {
    constructor(options) {
        options = options || {};
        this.ellipsoid = defaultValue(options.ellipsoid, Ellipsoid.WGS84);
        this.textureRotationAngle = defaultValue(options.textureRotationAngle, 0.0);
        this.asynchronous = defaultValue(options.asynchronous, false);
        this.show = defaultValue(options.show, true);
        this.debugShowBoundingVolume = defaultValue(options.debugShowBoundingVolume, false);
        this.color = defaultValue(options.color, 'rgba(253, 128, 69, 0.6)');
        this.appearance = defaultValue(options.appearance, new PerInstanceColorAppearance());
        this.rotation = defaultValue(options.rotation, 0);
        this.properties = defaultValue(options.properties, {});
        optionsFunction.fillOptions(this, options);

        this._changeState = false;
        this._ellipsoid = undefined;
        this._granularity = undefined;
        this._textureRotationAngle = undefined;
        this._id = undefined;
        this._createPrimitive = false;
        this._primitive = undefined;
        this._outlinePolygon = undefined;
        this._appendPrimitive = undefined;
    }

    setAttribute(name, value) {
        this[name] = value;
        this._createPrimitive = true;
    }

    getAttribute(name) {
        return this[name];
    }

    update(context, frameState, commandList) {
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
            this._ellipsoid = this.ellipsoid;
            this._granularity = this.granularity;
            this._textureRotationAngle = this.textureRotationAngle;
            this._id = this.id;

            this._primitive = this._primitive && this._primitive.destroy();
            this._primitive = new Primitive({
                geometryInstances: geometryInstances,
                appearance: this.appearance,
                asynchronous: this.asynchronous,
            });

            this._framePrimitive = this._framePrimitive && this._framePrimitive.destroy();
            if (this.getFramePrimitive) {
                this._framePrimitive = new Primitive({
                    geometryInstances: this.getFramePrimitive(),
                    appearance: this.frameAppearance,
                    asynchronous: this.asynchronous,
                });
            }
        }

        this._primitive.update(context, frameState, commandList);
        this._framePrimitive && this._framePrimitive.update(context, frameState, commandList);
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
            attributes: {
                color: ColorGeometryInstanceAttribute.fromColor(Color.fromCssColorString(color)),
            },
        });
    }
}

export default ChangeablePrimitive;
