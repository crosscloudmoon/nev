/* global Cesium */

const defined = Cesium.defined;
const DeveloperError = Cesium.DeveloperError;
const Cartesian3 = Cesium.Cartesian3;
const RectangleGeometry = Cesium.RectangleGeometry;
const GroundPolylineGeometry = Cesium.GroundPolylineGeometry;
const ArcType = Cesium.ArcType;
const VertexFormat = Cesium.VertexFormat;
const Ellipsoid = Cesium.Ellipsoid;
const Rectangle = Cesium.Rectangle;

const ellipsoid = Ellipsoid.WGS84;

import ChangeableGroundPrimitive from './ChangeableGroundPrimitive';
import BillboardGroup from './BillboardGroup';

class GroundRectanglePrimitive extends ChangeableGroundPrimitive {
    constructor(options) {
        if (!defined(options.extent)) {
            throw new DeveloperError('Extent is required');
        }
        let extent = options.extent;
        delete options.extent;
        super(options);
        this._extent = extent;
    }

    setExtent(extent) {
        this.setAttribute('_extent', extent);
    }

    getExtent() {
        return this.getAttribute('_extent');
    }

    getType() {
        return 'GroundRectangle';
    }

    getGeometryInstances() {
        if (!defined(this._extent)) {
            return;
        }
        let geometry = new RectangleGeometry({
            rectangle: this._extent,
            height: this.height,
            vertexFormat: VertexFormat.POSITION_AND_NORMAL,
            ellipsoid: this.ellipsoid,
        });
        let geometryInstances = this.createGeometryInstance(geometry, this.color);
        return geometryInstances;
    }

    getOutlineGeometry() {
        if (!defined(this._extent)) {
            return;
        }

        let geometry = new GroundPolylineGeometry({
            positions: this.getBoundary(),
            width: this.outlineWidth < 1 ? 1 : this.outlineWidth,
            loop: true,
            arcType: ArcType.RHUMB,
        });
        return this.createGeometryInstance(geometry, this.outlineColor);
    }

    getBoundary() {
        return [
            Cartesian3.fromRadians(this._extent.east, this._extent.north),
            Cartesian3.fromRadians(this._extent.west, this._extent.north),
            Cartesian3.fromRadians(this._extent.west, this._extent.south),
            Cartesian3.fromRadians(this._extent.east, this._extent.south),
        ];
    }

    getDegreesBoundary() {
        let n = 180 / Math.PI;
        let east = this._extent.east * n;
        let north = this._extent.north * n;
        let south = this._extent.south * n;
        let west = this._extent.west * n;
        return [
            {
                longitude: east,
                latitude: north,
                height: 0,
            },
            {
                longitude: west,
                latitude: north,
                height: 0,
            },
            {
                longitude: west,
                latitude: south,
                height: 0,
            },
            {
                longitude: east,
                latitude: south,
                height: 0,
            },
        ];
    }

    get extent() {
        let n = 180 / Math.PI;
        let extent = {
            east: this._extent.east * n,
            north: this._extent.north * n,
            south: this._extent.south * n,
            west: this._extent.west * n,
        };
        let _self = this;
        return new Proxy(extent, {
            set: function(obj, prop, value) {
                obj[prop] = value;
                _self.extent = obj;
                _self._createPrimitive = true;
                _self._markers &&
                    _self._markers.updateBillboardsPositions(getExtentCorners(_self.getExtent()));
                return true;
            },
        });
    }

    set extent(value) {
        let n = Math.PI / 180;
        this._extent = new Rectangle(
            value.west * n,
            value.south * n,
            value.east * n,
            value.north * n
        );
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
                        extent: this.extent,
                        fill: this.fill,
                        outline: this.outline,
                        outlineColor: this.outlineColor,
                        outlineWidth: this.outlineWidth,
                    };
                    let primitiveAttr = new Proxy(options, {
                        set: function(obj, prop, value) {
                            obj[prop] = value;
                            _self.setAttribute(prop, value);
                            _self._markers &&
                                prop === _self.extent &&
                                _self._markers.updateBillboardsPositions(
                                    getExtentCorners(_self.getExtent())
                                );
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
                                let corner = markers.getBillboard((index + 2) % 4).position;
                                _self.setExtent(
                                    getExtent(
                                        ellipsoid.cartesianToCartographic(corner),
                                        ellipsoid.cartesianToCartographic(position)
                                    )
                                );

                                markers.updateBillboardsPositions(
                                    getExtentCorners(_self.getExtent())
                                );
                                options && (options.extent = _self.extent);
                            },
                        },
                    };
                    markers.addBillboards(getExtentCorners(_self.getExtent()), handleMarkerChanges);
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

function getExtentCorners(value) {
    return ellipsoid.cartographicArrayToCartesianArray([
        Rectangle.northwest(value),
        Rectangle.northeast(value),
        Rectangle.southeast(value),
        Rectangle.southwest(value),
    ]);
}

function getExtent(mn, mx) {
    let e = new Rectangle();
    // Re-order so west < east and south < north
    e.west = Math.min(mn.longitude, mx.longitude);
    e.east = Math.max(mn.longitude, mx.longitude);
    e.south = Math.min(mn.latitude, mx.latitude);
    e.north = Math.max(mn.latitude, mx.latitude);
    // Check for approx equal (shouldn't require abs due to re-order)
    let epsilon = 0.0000001;
    if (e.east - e.west < epsilon) {
        e.east += epsilon * 2.0;
    }
    if (e.north - e.south < epsilon) {
        e.north += epsilon * 2.0;
    }
    return e;
}
export default GroundRectanglePrimitive;
