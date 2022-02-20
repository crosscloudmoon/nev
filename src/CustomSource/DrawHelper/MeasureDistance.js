/* global Cesium */
const Color = Cesium.Color;
const defined = Cesium.defined;
const Cartographic = Cesium.Cartographic;
const EllipsoidGeodesic = Cesium.EllipsoidGeodesic;
const GroundPolylineGeometry = Cesium.GroundPolylineGeometry;
const LabelStyle = Cesium.LabelStyle;
const VertexFormat = Cesium.VertexFormat;
const Material = Cesium.Material;
const LabelCollection = Cesium.LabelCollection;

import ChangeableGroundPolylinePrimitive from './ChangeableGroundPolylinePrimitive';
import BillboardGroup from './BillboardGroup';

/* eslint-disable */
class MeasureDistance extends ChangeableGroundPolylinePrimitive {
    constructor(options) {
        super(options);
        this.isPolygon = false;
        this.material = Material.fromType('Color', {
            color: Color.fromCssColorString(this.color),
        });
        this.labels = this._primitives.add(new LabelCollection());
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
        return 'MeasureDistance';
    }

    get color() {
        return this._color;
    }
    set color(value) {
        this._color = value;
        this.material && (this.material.uniforms.color = Color.fromCssColorString(value));
    }

    getGeometryInstances() {
        if (!defined(this.positions) || this.positions.length < 2) {
            return;
        }
        this.labels.removeAll();
        addDistanceLabel(this.positions, this.labels);
        let geometry = new GroundPolylineGeometry({
            positions: this.positions,
            height: this.height,
            width: 2,
            // arcType: ArcType.RHUMB,
            vertexFormat: VertexFormat.POSITION_AND_NORMAL,
        });
        let geometryInstances = this.createGeometryInstance(geometry, this.color);
        return geometryInstances;
    }

    setEditMode(position, pickedObject) {
        if (this._editing && pickedObject && pickedObject.primitive === this._primitive) {
            return;
        }
        if (!this._editing && position) {
            window.requestAnimationFrame(() => {
                let _self = this;
                let scene = this._scene;

                if (this._markers == null) {
                    let markers = new BillboardGroup(scene, undefined, this._primitives);
                    let handleMarkerChanges = {
                        dragHandlers: {
                            onDrag: function(index, position) {
                                if (
                                    defined(_self.billboards) &&
                                    index === _self.positions.length - 1
                                ) {
                                    _self.billboards._billboards[0].position = position;
                                }
                                _self.positions[index] = position;
                                _self._createPrimitive = true;
                            },
                            onDragEnd: function(index, position) {
                                _self._createPrimitive = true;
                            },
                        },
                        onDoubleClick: function(index) {
                            if (_self.positions.length < 3) {
                                return;
                            }
                            _self.positions.splice(index, 1);
                            _self._createPrimitive = true;
                            markers.removeBillboard(index);
                        },
                    };
                    markers.addBillboards(_self.positions, handleMarkerChanges);
                    this._markers = markers;
                    this._addStopEditListener();
                    markers.setOnTop();
                }
                this._editing = true;
            });
        } else {
            if (this._markers != null) {
                this._markers.remove();
                this._markers = null;
                this._removeStopEditListener();
            }
            this._editing = false;
        }
    }
}

function addDistanceLabel(positions, labels) {
    let distance = 0,
        text;
    let geodesic = new EllipsoidGeodesic();

    for (let i = 1; i < positions.length; ++i) {
        geodesic.setEndPoints(
            Cartographic.fromCartesian(positions[i - 1]),
            Cartographic.fromCartesian(positions[i])
        );
        distance += geodesic.surfaceDistance;
        if (distance > 1000) {
            text = (distance / 1000).toFixed(2) + 'km ';
        } else {
            text = distance.toFixed(2) + 'm ';
        }
        labels.add({
            position: positions[i],
            text: text,
            font: '20px 微软雅黑',
            horizontalOrigin: -1,
            verticalOrigin: 0,
            fillColor: Color.AQUAMARINE,
            outlineColor: Color.BLACK,
            outlineWidth: 2,
            style: LabelStyle.FILL_AND_OUTLINE,
        });
    }
}
export default MeasureDistance;
