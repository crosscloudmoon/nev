/* global Cesium */

const defined = Cesium.defined;
const PolygonGeometry = Cesium.PolygonGeometry;
const Color = Cesium.Color;
const VertexFormat = Cesium.VertexFormat;
const LabelCollection = Cesium.LabelCollection;
const LabelStyle = Cesium.LabelStyle;
const Cartographic = Cesium.Cartographic;
// const ArcType = Cesium.ArcType;

import ChangeableGroundPrimitive from './ChangeableGroundPrimitive';
import BillboardGroup from './BillboardGroup';

/* eslint-disable */
const wgs84 = {
    RADIUS: 6378137,
    FLATTENING: 1 / 298.257223563,
    POLAR_RADIUS: 6356752.3142,
};

class MeasureArea extends ChangeableGroundPrimitive {
    constructor(options) {
        super(options);
        this.isPolygon = true;
        this.labels = this._primitives.add(new LabelCollection());
    }

    setPositions(positions) {
        this.setAttribute('positions', positions);
    }

    getPositions() {
        return this.getAttribute('positions');
    }

    getType() {
        return 'MeasureArea';
    }

    getGeometryInstances() {
        if (!defined(this.positions) || this.positions.length < 3) {
            return;
        }
        let text = polygonArea(this.positions);
        this.labels.removeAll();
        this.labels.add({
            position: this.positions[this.positions.length - 1],
            text: '总面积:' + text,
            font: '20px 黑体',
            horizontalOrigin: -1,
            verticalOrigin: 0,
            fillColor: Color.AQUAMARINE,
            outlineColor: Color.BLACK,
            outlineWidth: 2,
            style: LabelStyle.FILL_AND_OUTLINE,
        });
        let geometry = PolygonGeometry.fromPositions({
            positions: this.positions,
            height: this.height,
            vertexFormat: VertexFormat.POSITION_AND_NORMAL,
            stRotation: this.textureRotationAngle,
            ellipsoid: this.ellipsoid,
            granularity: 0.1,
            // arcType: ArcType.RHUMB
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

function polygonArea(positions) {
    let coords = [],
        area = 0,
        text,
        cartographic = null;
    for (let i = 0; i < positions.length; i++) {
        cartographic = Cartographic.fromCartesian(positions[i]);
        coords[coords.length] = [cartographic.longitude, cartographic.latitude];
    }
    if (coords && coords.length > 0) {
        area += Math.abs(ringArea(coords));
    }
    if (area > 1000000) {
        text = (area / 1000000).toFixed(2) + '平方千米';
    } else if (area > 10000) {
        text = (area / 10000).toFixed(2) + '公顷';
    } else {
        text = area.toFixed(2) + '平方米';
    }
    return text;
}

function ringArea(coords) {
    let p1,
        p2,
        p3,
        lowerIndex,
        middleIndex,
        upperIndex,
        area = 0,
        coordsLength = coords.length;

    if (coordsLength > 2) {
        for (let i = 0; i < coordsLength; i++) {
            if (i === coordsLength - 2) {
                // i = N-2
                lowerIndex = coordsLength - 2;
                middleIndex = coordsLength - 1;
                upperIndex = 0;
            } else if (i === coordsLength - 1) {
                // i = N-1
                lowerIndex = coordsLength - 1;
                middleIndex = 0;
                upperIndex = 1;
            } else {
                // i = 0 to N-3
                lowerIndex = i;
                middleIndex = i + 1;
                upperIndex = i + 2;
            }
            p1 = coords[lowerIndex];
            p2 = coords[middleIndex];
            p3 = coords[upperIndex];
            area += (p3[0] - p1[0]) * Math.sin(p2[1]);
        }
        area = (area * wgs84.RADIUS * wgs84.RADIUS) / 2;
    }
    return area;
}

export default MeasureArea;
