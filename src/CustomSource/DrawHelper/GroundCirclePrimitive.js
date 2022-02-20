/* global Cesium */
const defined = Cesium.defined;
const defaultValue = Cesium.defaultValue;
const Cartesian3 = Cesium.Cartesian3;
const Cartographic = Cesium.Cartographic;
const ArcType = Cesium.ArcType;
const DeveloperError = Cesium.DeveloperError;
const CircleGeometry = Cesium.CircleGeometry;
const CircleOutlineGeometry = Cesium.CircleOutlineGeometry;
const GroundPolylineGeometry = Cesium.GroundPolylineGeometry;
const VertexFormat = Cesium.VertexFormat;

import ChangeableGroundPrimitive from './ChangeableGroundPrimitive';
import carToDegrees from './carToDegrees';
import BillboardGroup from './BillboardGroup';

class CirclePrimitive extends ChangeableGroundPrimitive {
    constructor(options) {
        if (!defined(options.center)) {
            throw new DeveloperError('Center and radius are required');
        }
        super(options);
        this.radius = defaultValue(options.radius, 1);
        this.setCenter(options.center);
    }

    setCenter(center) {
        this.setAttribute('_center', center);
    }

    setRadius(radius) {
        this.setAttribute('radius', Math.max(0.1, radius));
    }

    getCenter() {
        return this.getAttribute('_center');
    }

    getRadius() {
        return this.getAttribute('radius');
    }
    getPosition() {
        return {
            center: carToDegrees(this.getCenter()),
            radius: this.getRadius(),
        };
    }

    getType() {
        return 'GroundCircle';
    }

    getGeometryInstances() {
        if (!(defined(this.getCenter()) && defined(this.radius))) {
            return;
        }
        let geometry = new CircleGeometry({
            center: this.getCenter(),
            radius: this.radius,
            vertexFormat: VertexFormat.POSITION_AND_NORMAL,
            ellipsoid: this.ellipsoid,
        });
        return this.createGeometryInstance(geometry, this.color);
    }

    getOutlineGeometry() {
        if (!(defined(this.getCenter()) && defined(this.radius))) {
            return;
        }
        let positions = this.getBoundary();
        let geometry = new GroundPolylineGeometry({
            positions: positions,
            width: this.outlineWidth < 1 ? 1 : this.outlineWidth,
            loop: true,
            arcType: ArcType.RHUMB,
        });
        return this.createGeometryInstance(geometry, this.outlineColor);
    }

    getBoundary() {
        let geometry = CircleOutlineGeometry.createGeometry(
            new CircleOutlineGeometry({
                center: this.getCenter(),
                radius: this.radius,
            })
        );
        return Cartesian3.unpackArray(geometry.attributes.position.values);
    }

    getDegreesBoundary() {
        let n = 180 / Math.PI;
        let result = [];
        let positions = this.getBoundary();
        for (let i = 0; i < positions.length; i++) {
            let geo = Cartographic.fromCartesian(positions[i]);
            result.push({
                longitude: geo.longitude * n,
                latitude: geo.latitude * n,
                height: geo.height,
            });
        }
        return result;
    }

    getCircleMarks() {
        let values = [this.getCenter()];
        let positions = this.getBoundary();
        for (let count = 11; count < positions.length; count += 12) {
            values.push(positions[count]);
        }
        return values;
    }

    get center() {
        let position = carToDegrees(this._center);
        let _self = this;
        return new Proxy(position, {
            set: function(obj, prop, value) {
                obj[prop] = value;
                _self.setCenter(Cartesian3.fromDegrees(obj.lon, obj.lat));
                _self._markers && _self._markers.updateBillboardsPositions(_self.getCircleMarks());
                return true;
            },
        });
    }

    set center(value) {
        this._center = Cartesian3.fromDegrees(value.lon, value.lat);
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
                        fill: this.fill,
                        color: this.color,
                        outline: this.outline,
                        outlineColor: this.outlineColor,
                        outlineWidth: this.outlineWidth,
                        center: this.center,
                        radius: this.radius,
                    };
                    let primitiveAttr = new Proxy(options, {
                        set: function(obj, prop, value) {
                            obj[prop] = value;
                            _self.setAttribute(prop, value);
                            _self._markers &&
                                _self._markers.updateBillboardsPositions(_self.getCircleMarks());
                            return true;
                        },
                    });
                    this.startEditCallback(primitiveAttr, this);
                }
                if (this._markers == null) {
                    let markers = new BillboardGroup(scene, undefined, this._primitives);
                    let handleMarkerChanges = {
                        dragHandlers: {
                            onDrag: function(index, position) {
                                if (index === 0) {
                                    _self.setCenter(position);
                                    options && (options.center = _self.center);
                                } else {
                                    _self.setRadius(
                                        Cartesian3.distance(_self.getCenter(), position)
                                    );
                                    options && (options.radius = _self.radius);
                                }
                                markers.updateBillboardsPositions(_self.getCircleMarks());
                            },
                            onDragEnd: function(index, position) {},
                        },
                    };
                    markers.addBillboards(_self.getCircleMarks(), handleMarkerChanges);
                    this._markers = markers;
                    this._addStopEditListener();
                    markers.setOnTop();
                }
                this._editing = true;
            });
        } else {
            if (typeof this.endEditCallback === 'function') this.endEditCallback(this);
            if (this._markers != null) {
                this._markers.remove();
                this._markers = null;
                this._removeStopEditListener();
            }
            this._editing = false;
        }
    }
}
export default CirclePrimitive;
