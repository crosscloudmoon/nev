/* global Cesium */
const defined = Cesium.defined;
const defaultValue = Cesium.defaultValue;
// const Color = Cesium.Color;
const Cartographic = Cesium.Cartographic;
const PolygonGeometry = Cesium.PolygonGeometry;
const GroundPolylineGeometry = Cesium.GroundPolylineGeometry;
const VertexFormat = Cesium.VertexFormat;
const ArcType = Cesium.ArcType;

import ChangeableGroundPrimitive from './ChangeableGroundPrimitive';
import BillboardGroup from './BillboardGroup';

class GroundPolygonPrimitive extends ChangeableGroundPrimitive {
    constructor(options) {
        super(options);
        this.positions = defaultValue(options.positions, null);
        this.isPolygon = true;
    }

    setPositions(positions) {
        this.setAttribute('positions', positions);
    }

    getPositions() {
        return this.getAttribute('positions');
    }

    getType() {
        return 'GroundPolygon';
    }

    getGeometryInstances() {
        if (!defined(this.positions) || this.positions.length < 3) {
            return;
        }

        let geometry = PolygonGeometry.fromPositions({
            positions: this.positions,
            height: this.height,
            vertexFormat: VertexFormat.POSITION_AND_NORMAL,
            stRotation: this.textureRotationAngle,
            ellipsoid: this.ellipsoid,
            granularity: 0.1,
            arcType: ArcType.RHUMB,
        });
        let geometryInstances = this.createGeometryInstance(geometry, this.color);
        return geometryInstances;
    }

    getOutlineGeometry() {
        if (!defined(this.positions) || this.positions.length < 3) {
            return;
        }

        let geometry = new GroundPolylineGeometry({
            positions: this.positions,
            width: this.outlineWidth < 1 ? 1 : this.outlineWidth,
            loop: true,
            arcType: ArcType.RHUMB,
        });
        return this.createGeometryInstance(geometry, this.outlineColor);
    }

    getBoundary() {
        return this.positions;
    }

    getDegreesBoundary() {
        let n = 180 / Math.PI;
        let result = [];
        for (let i = 0; i < this.positions.length; i++) {
            let geo = Cartographic.fromCartesian(this.positions[i]);
            result.push({
                longitude: geo.longitude * n,
                latitude: geo.latitude * n,
                height: geo.height,
            });
        }
        return result;
    }

    setEditMode(position, pickedObject) {
        if (this._editing && pickedObject && pickedObject.primitive === this._primitive) {
            return;
        }
        if (!this._editing && position) {
            window.requestAnimationFrame(() => {
                let _self = this;
                let scene = this._scene;

                if (typeof this.startEditCallback === 'function') {
                    let options = {
                        color: this.color,
                        fill: this.fill,
                        outline: this.outline,
                        outlineColor: this.outlineColor,
                        outlineWidth: this.outlineWidth,
                    };
                    let primitiveAttr = new Proxy(options, {
                        set: function(obj, prop, value) {
                            obj[prop] = value;
                            _self.setAttribute(prop, value);
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
                                _self.positions[index] = position;
                                updateHalfMarkers(index, _self.positions);
                                _self._createPrimitive = true;
                            },
                        },
                        onDoubleClick: function(index) {
                            if (_self.positions.length < 4) {
                                return;
                            }
                            _self.positions.splice(index, 1);
                            _self._createPrimitive = true;
                            markers.removeBillboard(index);
                            editMarkers.removeBillboard(index);
                            updateHalfMarkers(index, _self.positions);
                        },
                    };
                    markers.addBillboards(_self.positions, handleMarkerChanges);
                    this._markers = markers;

                    // ========================================中间点编辑============================================== //

                    // eslint-disable-next-line no-inner-declarations
                    function updateHalfMarkers(index, positions) {
                        let editIndex = index - 1 < 0 ? positions.length - 1 : index - 1;
                        if (editIndex < editMarkers.countBillboards()) {
                            editMarkers.getBillboard(
                                editIndex
                            ).position = calculateHalfMarkerPosition(editIndex);
                        }
                        editIndex = index;
                        if (editIndex < editMarkers.countBillboards()) {
                            editMarkers.getBillboard(
                                editIndex
                            ).position = calculateHalfMarkerPosition(editIndex);
                        }
                    }

                    // eslint-disable-next-line no-inner-declarations
                    function calculateHalfMarkerPosition(index) {
                        let positions = _self.positions;
                        return _self.ellipsoid.cartographicToCartesian(
                            new Cesium.EllipsoidGeodesic(
                                _self.ellipsoid.cartesianToCartographic(positions[index]),
                                _self.ellipsoid.cartesianToCartographic(
                                    positions[index < positions.length - 1 ? index + 1 : 0]
                                )
                            ).interpolateUsingFraction(0.5)
                        );
                    }
                    let halfPositions = [];
                    let index = 0;
                    let length = _self.positions.length + (this.isPolygon ? 0 : -1);
                    for (; index < length; index++) {
                        halfPositions.push(calculateHalfMarkerPosition(index));
                    }

                    let handleEditMarkerChanges = {
                        dragHandlers: {
                            onDragStart: function(index, position) {
                                this.index = index + 1;
                                _self.positions.splice(this.index, 0, position);
                                _self._createPrimitive = true;
                            },
                            onDrag: function(index, position) {
                                _self.positions[this.index] = position;
                                _self._createPrimitive = true;
                            },
                            onDragEnd: function(index, position) {
                                markers.insertBillboard(this.index, position, handleMarkerChanges);
                                editMarkers.getBillboard(
                                    this.index - 1
                                ).position = calculateHalfMarkerPosition(this.index - 1);
                                editMarkers.insertBillboard(
                                    this.index,
                                    calculateHalfMarkerPosition(this.index),
                                    handleEditMarkerChanges
                                );
                                _self._createPrimitive = true;
                            },
                        },
                    };

                    let editMarkers = new BillboardGroup(scene, undefined, this._primitives);
                    editMarkers.addBillboards(halfPositions, handleEditMarkerChanges);
                    this._editMarkers = editMarkers;

                    // ========================================中间点编辑============================================== //

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
                this._editMarkers.remove();
                this._editMarkers = null;
                this._removeStopEditListener();
            }
            this._editing = false;
        }
    }
}

export default GroundPolygonPrimitive;
