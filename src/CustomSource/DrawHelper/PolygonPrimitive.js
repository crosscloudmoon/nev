
const defined = Cesium.defined;
const ArcType = Cesium.ArcType;
const PolygonGeometry = Cesium.PolygonGeometry;
const VertexFormat = Cesium.VertexFormat;
const ScreenSpaceEventHandler = Cesium.ScreenSpaceEventHandler;
const ScreenSpaceEventType = Cesium.ScreenSpaceEventType;

import ChangeablePrimitive from './ChangeablePrimitive';
import DrawHelper from './DrawHelper';
import BillboardGroup from './BillboardGroup';

class PolygonPrimitive extends ChangeablePrimitive {
	constructor(options) {
		super(options);
		this.isPolygon = true;
	}

	setPositions(positions) {
		this.setAttribute('positions', positions);
	}

	getPositions() {
		return this.getAttribute('positions');
	}

	getType() {
		return 'polygon';
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
			arcType: ArcType.RHUMB
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

				function onEdited() {
					_self.executeListeners({
						name: 'onEdited',
						positions: _self.positions
					});
				}
				let handleMarkerChanges = {
					dragHandlers: {
						onDrag: function (index, position) {
							_self.positions[index] = position;
							_self._createPrimitive = true;
						},
						onDragEnd: function (index, position) {
							_self._createPrimitive = true;
							onEdited();
						}
					},
					onDoubleClick: function (index) {
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
				this._globeClickHandler = new ScreenSpaceEventHandler(scene.canvas);
				this._globeClickHandler.setInputAction(
					function (movement) {
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
				this._globeClickHandler.destroy();
			}
			this._editMode = false;
		}
	}
}

export default PolygonPrimitive;
