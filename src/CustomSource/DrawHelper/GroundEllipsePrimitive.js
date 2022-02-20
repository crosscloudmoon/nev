/* global Cesium */
const defined = Cesium.defined;
const defaultValue = Cesium.defaultValue;
const DeveloperError = Cesium.DeveloperError;
const Cartesian3 = Cesium.Cartesian3;
const Cartographic = Cesium.Cartographic;
const EllipseGeometry = Cesium.EllipseGeometry;
const EllipseOutlineGeometry = Cesium.EllipseOutlineGeometry;
const GroundPolylineGeometry = Cesium.GroundPolylineGeometry;
const VertexFormat = Cesium.VertexFormat;
const ArcType = Cesium.ArcType;

import carToDegrees from './carToDegrees';
import calculateAngle from './calculateAngle';
import ChangeableGroundPrimitive from './ChangeableGroundPrimitive';
import BillboardGroup from './BillboardGroup';

class GroundEllipsePrimitive extends ChangeableGroundPrimitive {
    constructor(options) {
        if (!defined(options.center)) {
            throw new DeveloperError('Center are required');
        }
        super(options);
        this.setCenter(options.center);
        this._rotation = defaultValue(options.rotation, 0);
        this.semiMajorAxis = defaultValue(options.semiMajorAxis, 1);
        this.semiMinorAxis = defaultValue(options.semiMinorAxis, 1);
        this.positions = defaultValue(options.positions, []);
    }

    setCenter(center) {
        this.setAttribute('_center', center);
    }

    setSemiMajorAxis(semiMajorAxis, options) {
        if (semiMajorAxis < this.getSemiMinorAxis()) {
            this.setAttribute('semiMajorAxis', this.getSemiMinorAxis());
            options && (options['semiMajorAxis'] = this.getSemiMinorAxis());
            this.setAttribute('semiMinorAxis', semiMajorAxis);
            options && (options['semiMinorAxis'] = semiMajorAxis);
        } else {
            this.setAttribute('semiMajorAxis', semiMajorAxis);
            options && (options['semiMajorAxis'] = semiMajorAxis);
        }
    }

    setSemiMinorAxis(semiMinorAxis, options) {
        if (semiMinorAxis > this.getSemiMajorAxis()) {
            this.setAttribute('semiMinorAxis', this.getSemiMajorAxis());
            options && (options['semiMinorAxis'] = this.getSemiMajorAxis());

            this.setAttribute('semiMajorAxis', semiMinorAxis);
            options && (options['semiMajorAxis'] = semiMinorAxis);
        } else {
            this.setAttribute('semiMinorAxis', semiMinorAxis);
            options && (options['semiMinorAxis'] = semiMinorAxis);
        }
    }

    setRotation(rotation) {
        return this.setAttribute('_rotation', rotation);
    }

    getCenter() {
        return this.getAttribute('_center');
    }

    getSemiMajorAxis() {
        return this.getAttribute('semiMajorAxis');
    }

    getSemiMinorAxis() {
        return this.getAttribute('semiMinorAxis');
    }

    getRotation() {
        return this.getAttribute('_rotation');
    }

    get center() {
        let position = carToDegrees(this._center);
        let _self = this;
        return new Proxy(position, {
            set: function(obj, prop, value) {
                obj[prop] = value;
                _self.setCenter(Cartesian3.fromDegrees(obj.lon, obj.lat));
                _self._markers &&
                    _self._markers.updateBillboardsPositions(_self.getEllipseMarkers());
                return true;
            },
        });
    }

    set center(value) {
        this._center = Cartesian3.fromDegrees(value.lon, value.lat);
    }

    get rotation() {
        return (this._rotation / Math.PI) * 180;
    }

    set rotation(value) {
        this._rotation = (value / 180) * Math.PI;
    }

    calculateMajorAxis() {
        if (this.positions.length === 2) {
            this.maxPositionIndex = 1;
            return Cartesian3.distance(this.positions[0], this.positions[1]);
        }
        if (this.positions.length === 3) {
            let l1 = Cartesian3.distance(this.positions[0], this.positions[1]);
            let l2 = Cartesian3.distance(this.positions[0], this.positions[2]);
            this.maxPositionIndex = l1 > l2 ? 1 : 2;
            return l1 > l2 ? l1 : l2;
        }
    }

    calculateMinorAxis() {
        if (this.positions.length === 2) {
            return Cartesian3.distance(this.positions[0], this.positions[1]);
        }
        if (this.positions.length === 3) {
            let p0 = carToDegrees(this.positions[0]);
            let p1 = carToDegrees(this.positions[this.maxPositionIndex]);
            let p2 = carToDegrees(this.positions[3 - this.maxPositionIndex]);
            if (p2.lon === p1.lon && p2.lat === p1.lat) {
                return this.semiMajorAxis;
            }
            if (
                (p0.lon === p1.lon && p2.lon === p0.lon) ||
                (p0.lat === p1.lat && p2.lat === p0.lat)
            ) {
                return 0;
            }
            let k = p0.lon - p1.lon !== 0 ? (p0.lat - p1.lat) / (p0.lon - p1.lon) : undefined;
            let y =
                k === undefined || k === 0
                    ? p2.lat - p0.lat
                    : Math.abs((k * p2.lon - p2.lat + p0.lat - k * p0.lon) / Math.sqrt(k * k + 1));
            let x =
                k === undefined || k === 0
                    ? p2.lon - p0.lon
                    : Math.sqrt(
                          (p2.lat - p0.lat) * (p2.lat - p0.lat) +
                              (p2.lon - p0.lon) * (p2.lon - p0.lon) -
                              y * y
                      );

            let b = y / Math.sqrt(1 - (x * x) / (this.semiMajorAxis * this.semiMajorAxis));
            let lon = p0.lon + b * Math.cos(this.getRotation());
            let lat = p0.lat + b * Math.sin(this.getRotation());

            let cartesian = Cartesian3.fromDegrees(lon, lat);

            return Cartesian3.distance(this.positions[0], cartesian);
        }
    }

    calculateRotation() {
        let p1 = carToDegrees(this.positions[0]);
        let p2 = carToDegrees(this.positions[this.maxPositionIndex]);
        return (
            (calculateAngle([
                [p1.lon, p1.lat],
                [p2.lon, p2.lat],
            ]) /
                180) *
                Math.PI +
            Math.PI / 2
        );
    }

    getType() {
        return 'GroundEllipse';
    }

    getGeometryInstances() {
        if (
            !(defined(this._center) && defined(this.semiMajorAxis) && defined(this.semiMinorAxis))
        ) {
            return;
        }
        let geometry = new EllipseGeometry({
            center: this._center,
            semiMajorAxis: this.semiMajorAxis,
            semiMinorAxis: this.semiMinorAxis,
            rotation: this._rotation,
            vertexFormat: VertexFormat.POSITION_AND_NORMAL,
            stRotation: this.textureRotationAngle,
        });
        let geometryInstances = this.createGeometryInstance(geometry, this.color);
        return geometryInstances;
    }
    getOutlineGeometry() {
        if (
            !(defined(this._center) && defined(this.semiMajorAxis) && defined(this.semiMinorAxis))
        ) {
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
        let geometry = EllipseOutlineGeometry.createGeometry(
            new EllipseOutlineGeometry({
                ellipsoid: this.ellipsoid,
                center: this.getCenter(),
                semiMajorAxis: this.getSemiMajorAxis(),
                semiMinorAxis: this.getSemiMinorAxis(),
                rotation: this.getRotation(),
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

    getEllipseMarkers() {
        let values = [this.getCenter()];
        let positions = this.getBoundary();
        for (let count = 11; count < positions.length; count += 12) {
            values.push(positions[count]);
        }
        return values;
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
                        color: this.color,
                        center: this.center,
                        rotation: this.rotation,
                        semiMajorAxis: this.semiMajorAxis,
                        semiMinorAxis: this.semiMinorAxis,
                        fill: this.fill,
                        outline: this.outline,
                        outlineColor: this.outlineColor,
                        outlineWidth: this.outlineWidth,
                    };
                    let primitiveAttr = new Proxy(options, {
                        set: function(obj, prop, value) {
                            obj[prop] = value;
                            if (prop === 'semiMajorAxis') {
                                _self.setSemiMajorAxis(value, options);
                            } else if (prop === 'semiMinorAxis') {
                                _self.setSemiMinorAxis(value, options);
                            } else {
                                _self.setAttribute(prop, value);
                            }
                            _self._markers &&
                                _self._markers.updateBillboardsPositions(_self.getEllipseMarkers());
                            return true;
                        },
                    });
                    this.startEditCallback(primitiveAttr, this);
                }
                if (this._markers == null) {
                    let markers = new BillboardGroup(scene, undefined);
                    let handleMarkerChanges = {
                        dragHandlers: {
                            onDrag: function(index, position) {
                                if (index === 0) {
                                    _self.setCenter(position);
                                    options && (options.center = _self.center);
                                } else {
                                    let distance = Cartesian3.distance(_self.getCenter(), position);
                                    if (index % 2 !== 0) {
                                        _self.setSemiMinorAxis(distance, options);
                                    } else {
                                        _self.setSemiMajorAxis(distance, options);
                                    }
                                }
                                markers.updateBillboardsPositions(_self.getEllipseMarkers());
                            },
                            onDragEnd: function(index, position) {},
                        },
                    };
                    markers.addBillboards(_self.getEllipseMarkers(), handleMarkerChanges);
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

export default GroundEllipsePrimitive;
