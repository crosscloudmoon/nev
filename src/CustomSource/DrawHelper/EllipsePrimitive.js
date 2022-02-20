
const defined = Cesium.defined;
const DeveloperError = Cesium.DeveloperError;
const Cartesian3 = Cesium.Cartesian3;
const EllipseGeometry = Cesium.EllipseGeometry;
const EllipseOutlineGeometry = Cesium.EllipseOutlineGeometry;
const VertexFormat = Cesium.VertexFormat;

import carToDegrees from './carToDegrees';
import calculateAngle from './calculateAngle';
import ChangeablePrimitive from './ChangeablePrimitive';

/* eslint-disable */
class EllipsePrimitive extends ChangeablePrimitive{
  constructor(options) {
    if (!(defined(options.center) && defined(options.semiMajorAxis) && defined(options.semiMinorAxis))) {
      throw new DeveloperError('Center and semi major and semi minor axis are required');
    }
    super(options)
  }

  setCenter(center) {
    this.setAttribute('center', center);
  }

  setSemiMajorAxis(semiMajorAxis) {
    if (semiMajorAxis < this.getSemiMinorAxis()){
      this.setAttribute('semiMajorAxis', this.getSemiMinorAxis());
      this.setAttribute('semiMinorAxis', semiMajorAxis);
    }else{
      this.setAttribute('semiMajorAxis', semiMajorAxis);
    }
  }

  setSemiMinorAxis(semiMinorAxis) {
    if (semiMinorAxis > this.getSemiMajorAxis()){
      this.setAttribute('semiMinorAxis', this.getSemiMajorAxis());
      this.setAttribute('semiMajorAxis', semiMajorAxis);
    }else{
      this.setAttribute('semiMinorAxis', semiMinorAxis);
    }
  }

  setRotation(rotation) {
    return this.setAttribute('rotation', rotation);
  }

  getCenter() {
    return this.getAttribute('center');
  }

  getSemiMajorAxis() {
    return this.getAttribute('semiMajorAxis');
  }

  getSemiMinorAxis() {
    return this.getAttribute('semiMinorAxis');
  }

  getRotation() {
    return this.getAttribute('rotation');
  }

  calculateMajorAxis(){
    if(this.positions.length === 2){
      this.maxPositionIndex = 1;
      return Cartesian3.distance(this.positions[0], this.positions[1])
    }
    if(this.positions.length === 3){
      let l1 = Cartesian3.distance(this.positions[0], this.positions[1]);
      let l2 = Cartesian3.distance(this.positions[0], this.positions[2]);
      this.maxPositionIndex = l1 > l2? 1 : 2;
      return l1 > l2? l1 : l2
    }
  }

  calculateMinorAxis(){
    if(this.positions.length === 2){
      return Cartesian3.distance(this.positions[0], this.positions[1])
    }
    if(this.positions.length === 3){
      let p0 = carToDegrees(this.positions[0]);
      let p1 = carToDegrees(this.positions[this.maxPositionIndex]);
      let p2 = carToDegrees(this.positions[3 - this.maxPositionIndex]);
      if(p2.lon === p1.lon && p2.lat === p1.lat){
        return this.semiMajorAxis;
      }
      if((p0.lon === p1.lon && p2.lon === p0.lon) || (p0.lat === p1.lat && p2.lat === p0.lat)){
        return 0;
      }
      let k = (p0.lon - p1.lon) !== 0? (p0.lat - p1.lat) / (p0.lon - p1.lon) : undefined;
      let y = (k === undefined || k === 0)? (p2.lat - p0.lat) : Math.abs((k * p2.lon - p2.lat + p0.lat - k * p0.lon) / Math.sqrt(k * k + 1));
      let x = (k === undefined || k === 0)? (p2.lon - p0.lon) : Math.sqrt((p2.lat - p0.lat) * (p2.lat - p0.lat) + (p2.lon - p0.lon) * (p2.lon - p0.lon) - y * y); 

      let b = y / Math.sqrt(1 - (x*x) / (this.semiMajorAxis * this.semiMajorAxis));
      let lon = p0.lon + b * Math.cos(this.rotation)
      let lat = p0.lat + b * Math.sin(this.rotation)

      let cartesian = Cartesian3.fromDegrees(lon, lat);

      return Cartesian3.distance(this.positions[0], cartesian)
    }
  }

  calculateRotation(){
    let p1 = carToDegrees(this.positions[0]);
    let p2 = carToDegrees(this.positions[this.maxPositionIndex]);
    return calculateAngle([[p1.lon, p1.lat], [p2.lon, p2.lat]]) / 180 * Math.PI + Math.PI/2;
  }

  getType(geodesic) {
    return 'ellipse';
  }

  getGeometryInstances() {
    if (!(defined(this.center) && defined(this.semiMajorAxis) && defined(this.semiMinorAxis))) {
      return;
    }
    let geometry = new EllipseGeometry({
      ellipsoid: this.ellipsoid,
      center: this.center,
      semiMajorAxis: this.semiMajorAxis,
      semiMinorAxis: this.semiMinorAxis,
      rotation: this.rotation,
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
    return new EllipseOutlineGeometry({
      center: this.getCenter(),
      semiMajorAxis: this.getSemiMajorAxis(),
      semiMinorAxis: this.getSemiMinorAxis(),
      rotation: this.getRotation()
    });
  }

  getEllipseBoundary() {
    var geometry = EllipseOutlineGeometry.createGeometry(
      new EllipseOutlineGeometry({
        ellipsoid: this.ellipsoid,
        center: this.getCenter(),
        semiMajorAxis: this.getSemiMajorAxis(),
        semiMinorAxis: this.getSemiMinorAxis(),
        rotation: this.getRotation()
      })
    );
    var count = 33, values = [];
    var value = geometry.attributes.position.values;
    for (; count < geometry.attributes.position.values.length; count += 36) {
      values.push(new Cartesian3(value[count], value[count + 1], value[count + 2]));
    }
    return values;
  }
}


export default EllipsePrimitive;
