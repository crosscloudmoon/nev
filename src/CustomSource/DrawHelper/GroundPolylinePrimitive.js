/* global Cesium */

const defined = Cesium.defined;
const GroundPolylineGeometry = Cesium.GroundPolylineGeometry;
const Material = Cesium.Material;
const Cartographic = Cesium.Cartographic;
const Color = Cesium.Color;
const ArcType = Cesium.ArcType;

import ChangeableGroundPolylinePrimitive from './ChangeableGroundPolylinePrimitive';
import BillboardGroup from './BillboardGroup';

class PolylineClassificationPrimitive extends ChangeableGroundPolylinePrimitive {
    constructor(options) {
        super(options);
        this.isPolygon = false;
    }

    setPositions(positions) {
        this.setAttribute('positions', positions);
    }

    setWidth(width) {
        this.setAttribute('width', width);
    }

    getPositions() {
        return this.getAttribute('positions');
    }

    getWidth() {
        return this.getAttribute('width');
    }

    getType() {
        return 'GroundPolyline';
    }

    getGeometryInstances() {
        if (!defined(this.positions) || this.positions.length < 2) {
            return;
        }
        let geometry = new GroundPolylineGeometry({
            positions: this.positions,
            width: this.width < 1 ? 1 : this.width,
            arcType: ArcType.RHUMB,
        });
        let geometryInstances = this.createGeometryInstance(geometry, this.color);
        return geometryInstances;
    }

    getDegreesPositions() {
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

    get lineType() {
        return this._lineType;
    }
    set lineType(value) {
        this._lineType = value;
        if (value === 'PolylineGlow') {
            this.material = Material.fromType('PolylineGlow', {
                color: Color.fromCssColorString(this.color),
                glowPower: this._glowPower,
                taperPower: this._taperPower,
            });
        }
        if (value === 'Color') {
            this.material = Material.fromType('Color', {
                color: Color.fromCssColorString(this.color),
            });
        }
        if (value === 'PolylineOutline') {
            this.material = Material.fromType('PolylineOutline', {
                color: Color.fromCssColorString(this.color),
                outlineColor: Color.fromCssColorString(this.outlineColor),
                outlineWidth: this._outlineWidth,
            });
        }
        if (value === 'PolylineDash') {
            let dashPattern = '';
            for (let i = 0; i < 16; i++) {
                dashPattern += i / 16 <= this._dashedScale ? '1' : '0';
            }
            this.material = Material.fromType('PolylineDash', {
                color: Color.fromCssColorString(this.color),
                gapColor: Color.fromCssColorString(this._gapColor),
                dashLength: this._dashedLength,
                dashPattern: parseInt(dashPattern, 2),
            });
        }
    }

    get color() {
        return this._color;
    }
    set color(value) {
        this._color = value;
        this.material && (this.material.uniforms.color = Color.fromCssColorString(value));
    }
    get gapColor() {
        return this._gapColor;
    }
    set gapColor(value) {
        this._gapColor = value;
        this.material && (this.material.uniforms.gapColor = Color.fromCssColorString(value));
    }

    get outlineWidth() {
        return this._outlineWidth;
    }
    set outlineWidth(value) {
        this._outlineWidth = value;
        this.material && (this.material.uniforms.outlineWidth = value);
    }
    get outlineColor() {
        return this._outlineColor;
    }
    set outlineColor(value) {
        this._outlineColor = value;
        this.material && (this.material.uniforms.outlineColor = Color.fromCssColorString(value));
    }
    get glowPower() {
        return this._glowPower;
    }
    set glowPower(value) {
        this._glowPower = value;
        this.material && (this.material.uniforms.glowPower = value);
    }
    get taperPower() {
        return this._taperPower;
    }
    set taperPower(value) {
        this._taperPower = value;
        this.material && (this.material.uniforms.taperPower = value);
    }
    get dashedScale() {
        return this._dashedScale;
    }
    set dashedScale(value) {
        this._dashedScale = value;
        let dashPattern = '';
        for (let i = 0; i < 16; i++) {
            dashPattern += i / 16 < value ? '1' : '0';
        }
        this.material && (this.material.uniforms.dashPattern = parseInt(dashPattern, 2));
    }
    get dashedLength() {
        return this._dashedLength;
    }
    set dashedLength(value) {
        this._dashedLength = value;
        this.material && (this.material.uniforms.dashLength = value);
    }
    // get selectPosition() {
    //     return this._selectPosition;
    // }
    setEditMode(position, pickedObject) {
        if (this._editing && pickedObject && pickedObject.primitive === this._primitive) {
            return;
        }
        if (!this._editing && position) {
            window.requestAnimationFrame(() => {
                let _self = this;
                let scene = this._scene;

                if (typeof this.startEditCallback === 'function') {
                    let primitiveAttr = new Proxy(
                        {
                            color: this.color,
                            width: this.width,
                            lineType: this.lineType,
                            outlineWidth: this.outlineWidth,
                            outlineColor: this.outlineColor,
                            glowPower: this.glowPower,
                            taperPower: this.taperPower,
                            dashedScale: this.dashedScale,
                            dashedLength: this.dashedLength,
                            // selectPosition: this.selectPosition,
                        },
                        {
                            set: function(obj, prop, value) {
                                obj[prop] = value;
                                _self.setAttribute(prop, value);
                                return true;
                            },
                        }
                    );
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
                            onDragEnd: function(index, position) {},
                        },
                        onDoubleClick: function(index) {
                            if (_self.positions.length < 3) {
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
                        if (index === positions.length) {
                            editMarkers.removeBillboard(index - 1);
                            return;
                        }
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
                                // create new sets of makers for editing
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
            // this.selectPosition = null;
            this._editing = false;
        }
    }
}

export default PolylineClassificationPrimitive;
