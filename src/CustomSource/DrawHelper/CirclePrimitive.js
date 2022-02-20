/* global Cesium */
const defined = Cesium.defined;
const DeveloperError = Cesium.DeveloperError;
const CircleGeometry = Cesium.CircleGeometry;
const CircleOutlineGeometry = Cesium.CircleOutlineGeometry;
const VertexFormat = Cesium.VertexFormat;
const PerInstanceColorAppearance = Cesium.PerInstanceColorAppearance;
const ScreenSpaceEventHandler = Cesium.ScreenSpaceEventHandler;
const ScreenSpaceEventType = Cesium.ScreenSpaceEventType;

import ChangeablePrimitive from './ChangeablePrimitive';
import carToDegrees from './carToDegrees';
import DrawHelper from './DrawHelper';
import BillboardGroup from './BillboardGroup';

class CirclePrimitive extends ChangeablePrimitive {
    constructor(options) {
        if (!(defined(options.center) && defined(options.radius))) {
            throw new DeveloperError('Center and radius are required');
        }
        super(options);
        this.frameAppearance = new PerInstanceColorAppearance({
            flat: true,
        });
    }

    setCenter(center) {
        this.setAttribute('center', center);
    }

    setRadius(radius) {
        this.setAttribute('radius', Math.max(0.1, radius));
    }

    getCenter() {
        return this.getAttribute('center');
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
        return 'circle';
    }

    getGeometryInstances() {
        if (!(defined(this.center) && defined(this.radius))) {
            return;
        }
        let geometry = new CircleGeometry({
            center: this.center,
            radius: this.radius,
            height: this.height,
            // vertexFormat: EllipsoidSurfaceAppearance.VERTEX_FORMAT,
            vertexFormat: VertexFormat.POSITION_AND_NORMAL,
            stRotation: this.textureRotationAngle,
            ellipsoid: this.ellipsoid,
            granularity: this.granularity,
        });
        let geometryInstances = this.createGeometryInstance(geometry, this.color);
        return geometryInstances;
    }
    getFramePrimitive() {
        let geometry = new CircleOutlineGeometry({
            center: this.getCenter(),
            radius: this.getRadius(),
        });
        let geometryInstances = this.createGeometryInstance(geometry, 'rgba(255, 255, 255, 1)');

        return geometryInstances;
    }
    setEditMode(editMode) {
        if (this._editMode === editMode) {
            return;
        }
        if (editMode) {
            DrawHelper.setEdited(this);
            let scene = global.viewer.scene;
            let _self = this;
            if (this._markers == null) {
                let markers = new BillboardGroup(scene, undefined, this._primitives);
                /* eslint-disable */
                function onEdited() {
                    _self.executeListeners({ name: 'onEdited', positions: _self.positions });
                }
                let handleMarkerChanges = {
                    dragHandlers: {
                        onDrag: function(index, position) {
                            if (defined(_self.billboards) && index === _self.ceter.length - 1) {
                                _self.billboards._billboards[0].position = position;
                            }
                            _self.positions[index] = position;
                            _self._createPrimitive = true;
                        },
                        onDragEnd: function(index, position) {
                            _self._createPrimitive = true;
                            onEdited();
                        },
                    },
                    // onDoubleClick: function(index) {
                    //   if (_self.positions.length < 3) {
                    //     return;
                    //   }
                    //   _self.positions.splice(index, 1);
                    //   _self._createPrimitive = true;
                    //   markers.removeBillboard(index);
                    //   onEdited();
                    // }
                };
                markers.addBillboards(_self.positions, handleMarkerChanges);
                this._markers = markers;
                this._globeClickhandler = new ScreenSpaceEventHandler(scene.canvas);
                this._globeClickhandler.setInputAction(function(movement) {
                    let pickedObject = scene.pick(movement.position);
                    if (!(pickedObject && pickedObject.primitive)) {
                        _self.setEditMode(false);
                    }
                }, ScreenSpaceEventType.LEFT_CLICK);
                markers.setOnTop();
            }
            this._editMode = true;
        } else {
            if (this._markers != null) {
                this._markers.remove();
                this._markers = null;
                this._globeClickhandler.destroy();
            }
            this._editMode = false;
        }
    }
}
export default CirclePrimitive;
