
const defined = Cesium.defined;
const DeveloperError = Cesium.DeveloperError;
const RectangleGeometry = Cesium.RectangleGeometry;
const RectangleOutlineGeometry = Cesium.RectangleOutlineGeometry;
const VertexFormat = Cesium.VertexFormat;

import ChangeablePrimitive from './ChangeablePrimitive';

class RectanglePrimitive {
  constructor(options) {
    if (!defined(options.extent)) {
      throw new DeveloperError('Extent is required');
    }
    Object.setPrototypeOf(Object.getPrototypeOf(this), new ChangeablePrimitive(options));
  }

  setExtent(extent) {
    this.setAttribute('extent', extent);
  }

  getExtent() {
    return this.getAttribute('extent');
  }

  getType() {
    return 'rectangle';
  }

  getGeometryInstances() {
    if (!defined(this.extent)) {
      return;
    }
   let geometry = new RectangleGeometry({
      rectangle: this.extent,
      height: this.height,
      vertexFormat: VertexFormat.POSITION_AND_NORMAL,
      stRotation: this.textureRotationAngle,
      ellipsoid: this.ellipsoid,
      granularity: this.granularity
    });
    let geometryInstances = this.createGeometryInstance(geometry, this.color);
    return geometryInstances;
  }

  getOutlineGeometry() {
    return new RectangleOutlineGeometry({
      rectangle: this.extent
    });
  }
}

export default RectanglePrimitive;
