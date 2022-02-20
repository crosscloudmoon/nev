
const defined = Cesium.defined;
const PolylineGeometry = Cesium.PolylineGeometry;
const VertexFormat = Cesium.VertexFormat;
const ScreenSpaceEventHandler = Cesium.ScreenSpaceEventHandler;
const ScreenSpaceEventType = Cesium.ScreenSpaceEventType;

import DrawHelper from './DrawHelper';
import BillboardGroup from './BillboardGroup';
import ChangeablePrimitive from './ChangeablePrimitive';

class PolylinePrimitive extends ChangeablePrimitive {
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
    return 'polyline';
  }

  getGeometryInstances() {
    if (!defined(this.positions) || this.positions.length < 2) {
      return;
    }
    let geometry = new PolylineGeometry({
      positions: this.positions,
      height: this.height,
      width: this.width < 1 ? 1 : this.width,
      vertexFormat: VertexFormat.POSITION_AND_NORMAL,
      ellipsoid: this.ellipsoid
    });
    let geometryInstances = this.createGeometryInstance(geometry, this.color);
    return geometryInstances;
  }
  setEditMode(editMode) {
    if (this._editMode == editMode) {
      return;
    }
    if (editMode) {
      DrawHelper.setEdited(this);
      let scene = global.ev.scene;
      let _self = this;
      if (this._markers == null) {
        let markers = new BillboardGroup(scene, undefined, this._primitives);
        /* eslint-disable */
        function onEdited() {
          _self.executeListeners({name: 'onEdited', positions: _self.positions});
        }
        let handleMarkerChanges = {
          dragHandlers: {
            onDrag: function(index, position) {
              _self.positions[index] = position;
              _self._createPrimitive = true;
            },
            onDragEnd: function(index, position) {
              _self._createPrimitive = true;
              onEdited();
            }
          },
          onDoubleClick: function(index) {
            if (_self.positions.length < 3) {
              return;
            }
            _self.positions.splice(index, 1);
            _self._createPrimitive = true;
            markers.removeBillboard(index);
            onEdited();
          }
        };
        markers.addBillboards(_self.positions, handleMarkerChanges);
        this._markers = markers;
        this._globeClickhandler = new ScreenSpaceEventHandler(scene.canvas);
        this._globeClickhandler.setInputAction(
          function(movement) {
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

export default PolylinePrimitive;
