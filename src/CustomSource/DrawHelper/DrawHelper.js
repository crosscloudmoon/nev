/* global Cesium */
const defined = Cesium.defined;
const DeveloperError = Cesium.DeveloperError;
const ScreenSpaceEventType = Cesium.ScreenSpaceEventType;
const ScreenSpaceEventHandler = Cesium.ScreenSpaceEventHandler;
const Ellipsoid = Cesium.Ellipsoid;
const Cartesian3 = Cesium.Cartesian3;
const Cartesian2 = Cesium.Cartesian2;
const Cartographic = Cesium.Cartographic;
const EllipsoidGeodesic = Cesium.EllipsoidGeodesic;
const PrimitiveCollection = Cesium.PrimitiveCollection;
const BillboardCollection = Cesium.BillboardCollection;
const Color = Cesium.Color;
const Rectangle = Cesium.Rectangle;
const HeightReference = Cesium.HeightReference;
const SceneMode = Cesium.SceneMode;

import GroundRectanglePrimitive from './GroundRectanglePrimitive';
import GroundPolygonPrimitive from './GroundPolygonPrimitive';
import GroundPolylinePrimitive from './GroundPolylinePrimitive';
import GroundEllipsePrimitive from './GroundEllipsePrimitive';
import GroundCirclePrimitive from './GroundCirclePrimitive';
import BillboardGroup from './BillboardGroup';
import Marker from './Marker';
import TextAnnotation from './TextAnnotation';
import MeasureArea from './MeasureArea';
import MeasureDistance from './MeasureDistance';
import carToDegrees from './carToDegrees';

const ellipsoid = Ellipsoid.WGS84;
// const defaultPolylineOptions = {
//     width: 2,
//     geodesic: true,
//     appearance: new PolylineColorAppearance()
// };
const DrawHelperCollection = {};
class DrawHelper {
    /**
     * DrawHelper类
     * 绘制工具类
     * @constructor
     * @param {options} scene 绘制场景
     */
    constructor(scene) {
        if (!defined(scene)) {
            throw new DeveloperError('请传入绘制场景');
        }
        if (defined(DrawHelperCollection[scene.id])) {
            return DrawHelperCollection[scene.id];
        }
        this._scene = scene;
        this._surfaces = [];

        this.enable = true;
        this.primitives = scene.primitives.add(new PrimitiveCollection());
        this.measurePrimitives = scene.primitives.add(new PrimitiveCollection());

        this.measureCollection = [];
        this.initialHandlers();
        DrawHelperCollection[scene.id] = this;
    }
    initialHandlers() {
        let scene = this._scene;
        let _self = this;
        let handler = new ScreenSpaceEventHandler(scene.canvas);

        function callPrimitiveCallback(name, position) {
            if (!_self.enable) return;
            if (_self._handlersMuted) return;
            let pickedObject = scene.drillPick(position);
            for (let i = 0; i < pickedObject.length; i++) {
                if (
                    pickedObject[i] &&
                    pickedObject[i].primitive &&
                    pickedObject[i].primitive[name]
                ) {
                    pickedObject[i].primitive[name](position, pickedObject[i]);
                    break;
                }
            }
        }
        handler.setInputAction(function(movement) {
            callPrimitiveCallback('leftClick', movement.position);
        }, ScreenSpaceEventType.LEFT_CLICK);
        handler.setInputAction(function(movement) {
            callPrimitiveCallback('leftDoubleClick', movement.position);
        }, ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
        handler.setInputAction(function(movement) {
            callPrimitiveCallback('leftDown', movement.position);
        }, ScreenSpaceEventType.LEFT_DOWN);
    }

    setListener(primitive, type, callback) {
        primitive[type] = callback;
    }

    muteHandlers(muted) {
        this._handlersMuted = muted;
    }

    registerEditableShape(surface) {
        let _self = this;
        setListener(surface, 'leftClick', function() {
            if (_self._handlersMuted) return;
            surface.setEditMode(true);
        });
    }

    cleanAllMeasure() {
        for (let i = 0; i < this.measureCollection.length; ++i) {
            !this.measureCollection[i].isDestroyed() && this.measureCollection[i].destroy();
        }
        this.measureCollection = [];
    }

    startDrawing(cleanUp) {
        DrawHelper.disableAllEditMode();
        if (this.editCleanUp) {
            this.editCleanUp();
        }
        this.editCleanUp = cleanUp;
        this.muteHandlers(true);
    }

    stopDrawing() {
        if (this.editCleanUp) {
            this.editCleanUp();
            this.editCleanUp = null;
        }
        this.muteHandlers(false);
    }

    static disableAllEditMode() {
        DrawHelper.setEdited(undefined);
    }

    static setEdited(surface) {
        if (this._editedSurface && !this._editedSurface.isDestroyed()) {
            this._editedSurface.setEditMode(false);
        }
        this._editedSurface = surface;
    }

    startDrawingMarker(options = {}, callbacks = {}) {
        this.startDrawing(function() {
            mouseHandler.destroy();
        });
        let _self = this;
        let scene = this._scene;
        let primitives = options.primitives || this.primitives;

        let mouseHandler = new ScreenSpaceEventHandler(scene.canvas);
        mouseHandler.setInputAction(function(movement) {
            if (movement.position != null) {
                let cartesian = null;
                if (scene.mode === SceneMode.SCENE3D) {
                    let ray = scene.camera.getPickRay(movement.position);
                    cartesian = scene.globe.pick(ray, scene);
                } else {
                    cartesian = scene.camera.pickEllipsoid(movement.position);
                }
                if (cartesian) {
                    if (typeof callbacks.startCallback === 'function') {
                        callbacks.startCallback();
                    }
                    _self.stopDrawing();
                    options.position = cartesian;
                    options.scene = scene;
                    options.heightReference = HeightReference.CLAMP_TO_GROUND;
                    let primitive = primitives.add(new Marker(options));
                    primitive._createPrimitive = true;
                    primitive._primitives = primitives;
                    if (typeof callbacks.startEditCallback === 'function') {
                        primitive.startEditCallback = callbacks.startEditCallback;
                    }
                    if (typeof callbacks.endEditCallback === 'function') {
                        primitive.endEditCallback = callbacks.endEditCallback;
                    }
                    if (typeof callbacks.endCallback === 'function') {
                        callbacks.endCallback(primitive, primitives, cartesian);
                    }
                }
            }
        }, ScreenSpaceEventType.LEFT_CLICK);
    }

    startDrawingTextAnnotation(options = {}, callbacks = {}) {
        this.startDrawing(function() {
            mouseHandler.destroy();
        });
        let _self = this;
        let scene = this._scene;
        let primitives = options.primitives || this.primitives;

        let mouseHandler = new ScreenSpaceEventHandler(scene.canvas);
        mouseHandler.setInputAction(function(movement) {
            if (movement.position != null) {
                let cartesian = null;
                if (scene.mode === SceneMode.SCENE3D) {
                    let ray = scene.camera.getPickRay(movement.position);
                    cartesian = scene.globe.pick(ray, scene);
                } else {
                    cartesian = scene.camera.pickEllipsoid(movement.position);
                }
                if (cartesian) {
                    if (typeof callbacks.startCallback === 'function') {
                        callbacks.startCallback();
                    }
                    _self.stopDrawing();
                    options.text = '文字';
                    options.font = '24px 黑体';
                    options.position = cartesian;
                    options.horizontalOrigin = 0;
                    options.verticalOrigin = 0;
                    options.scene = scene;
                    options.fillColor = new Color(1, 1, 0, 1);
                    options.outlineColor = new Color(1, 0, 0, 1);
                    options.outlineWidth = 4;
                    options.heightReference = HeightReference.CLAMP_TO_GROUND;
                    let primitive = primitives.add(new TextAnnotation(options));
                    primitive._createPrimitive = true;
                    primitive._primitives = primitives;
                    if (typeof callbacks.startEditCallback === 'function') {
                        primitive.startEditCallback = callbacks.startEditCallback;
                    }
                    if (typeof callbacks.endEditCallback === 'function') {
                        primitive.endEditCallback = callbacks.endEditCallback;
                    }
                    if (typeof callbacks.endCallback === 'function') {
                        callbacks.endCallback(primitive, primitives, cartesian);
                    }
                }
            }
        }, ScreenSpaceEventType.LEFT_CLICK);
    }

    startDrawingPolygon(options, callbacks) {
        this.drawingPolyshape(options, callbacks, true);
    }

    startDrawingPolyline(options, callbacks) {
        this.drawingPolyshape(options, callbacks, false);
    }

    startMeasureArea(options, callbacks) {
        this.drawingMeasurePolyshape(options, callbacks, true);
    }

    startMeasureDistance(options, callbacks) {
        this.drawingMeasurePolyshape(options, callbacks, false);
    }

    drawingPolyshape(options = {}, callbacks = {}, isPolygon) {
        this.startDrawing(function() {
            poly.destroy();
            if (markers !== null) {
                markers.destroy();
            }
            mouseHandler.destroy();
        });
        let _self = this;
        let scene = this._scene;
        options.scene = scene;
        let primitives = options.primitives || this.primitives;
        let poly;
        let minPoints = isPolygon ? 3 : 2;
        if (isPolygon) {
            poly = new GroundPolygonPrimitive(options);
        } else {
            poly = new GroundPolylinePrimitive(options);
        }
        poly.asynchronous = false;
        poly._primitives = primitives;
        primitives.add(poly);
        let positions = [];
        let markers = new BillboardGroup(this._scene, undefined, primitives);
        let mouseHandler = new ScreenSpaceEventHandler(scene.canvas);
        mouseHandler.setInputAction(function(movement) {
            if (typeof callbacks.startCallback === 'function') {
                callbacks.startCallback();
                callbacks.startCallback = null;
            }
            if (movement.position != null) {
                let cartesian = null;
                if (scene.mode === SceneMode.SCENE3D) {
                    let ray = scene.camera.getPickRay(movement.position);
                    cartesian = scene.globe.pick(ray, scene);
                } else {
                    cartesian = scene.camera.pickEllipsoid(movement.position);
                }
                if (cartesian) {
                    if (positions.length === 0) {
                        positions.push(cartesian.clone());
                        markers.addBillboard(positions[0]);
                    }
                    if (positions.length >= minPoints) {
                        poly.positions = positions;
                        poly._createPrimitive = true;
                    }
                    cartesian.y += 1 + Math.random();
                    positions.push(cartesian);
                    markers.addBillboard(cartesian);
                }
            }
        }, ScreenSpaceEventType.LEFT_CLICK);
        mouseHandler.setInputAction(function(movement) {
            let position = movement.endPosition;
            if (position != null) {
                if (positions.length !== 0) {
                    let cartesian = null;
                    if (scene.mode === SceneMode.SCENE3D) {
                        let ray = scene.camera.getPickRay(position);
                        cartesian = scene.globe.pick(ray, scene);
                    } else {
                        cartesian = scene.camera.pickEllipsoid(position);
                    }
                    if (cartesian) {
                        positions.pop();
                        cartesian.y += 1 + Math.random();
                        positions.push(cartesian);
                        if (positions.length >= minPoints) {
                            poly.positions = positions;
                            poly._createPrimitive = true;
                        }
                        markers.getBillboard(positions.length - 1).position = cartesian;
                    }
                }
            }
        }, ScreenSpaceEventType.MOUSE_MOVE);
        mouseHandler.setInputAction(function(movement) {
            if (typeof callbacks.startCallback === 'function') {
                callbacks.startCallback();
                callbacks.startCallback = null;
            }
            _self.stopDrawing();
            let primitive = null;
            if (positions.length >= minPoints) {
                positions.pop();
                if (movement.position != null) {
                    let cartesian = null;
                    if (scene.mode === SceneMode.SCENE3D) {
                        let ray = scene.camera.getPickRay(movement.position);
                        cartesian = scene.globe.pick(ray, scene);
                    } else {
                        cartesian = scene.camera.pickEllipsoid(movement.position);
                    }
                    if (cartesian) {
                        positions.pop();
                        positions.pop();
                        positions.push(cartesian);
                    }
                }
                options.scene = scene;
                if (isPolygon) {
                    primitive = new GroundPolygonPrimitive(options);
                } else {
                    primitive = new GroundPolylinePrimitive(options);
                }
                primitive.setPositions(positions);
                primitive._primitives = primitives;
                primitives.add(primitive);
                if (typeof callbacks.startEditCallback === 'function') {
                    primitive.startEditCallback = callbacks.startEditCallback;
                }
                if (typeof callbacks.endEditCallback === 'function') {
                    primitive.endEditCallback = callbacks.endEditCallback;
                }
            }
            if (typeof callbacks.endCallback === 'function') {
                callbacks.endCallback(primitive, primitives, positions);
            }
        }, ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
    }

    drawingMeasurePolyshape(options = {}, callbacks = {}, isPolygon) {
        this.startDrawing(function() {
            options.primitives.remove(poly);
            if (markers !== null) {
                markers.destroy();
            }
            mouseHandler.destroy();
        });
        let _self = this;
        let scene = this._scene;
        options.primitives = options.primitives || this.measurePrimitives;
        let poly;
        let minPoints = isPolygon ? 3 : 2;
        if (isPolygon) {
            poly = new MeasureArea(options);
        } else {
            poly = new MeasureDistance(options);
        }
        poly.asynchronous = false;
        options.scene = scene;
        options.primitives.add(poly);
        let positions = [];
        let markers = new BillboardGroup(this._scene, undefined, options.primitives);
        let mouseHandler = new ScreenSpaceEventHandler(scene.canvas);
        mouseHandler.setInputAction(function(movement) {
            if (movement.position != null) {
                let cartesian = null;
                if (scene.mode === SceneMode.SCENE3D) {
                    let ray = scene.camera.getPickRay(movement.position);
                    cartesian = scene.globe.pick(ray, scene);
                } else {
                    cartesian = scene.camera.pickEllipsoid(movement.position);
                }
                if (cartesian) {
                    if (positions.length === 0) {
                        positions.push(cartesian.clone());
                        markers.addBillboard(positions[0]);
                    }
                    if (positions.length >= minPoints) {
                        poly.positions = positions;
                        poly._createPrimitive = true;
                    }
                    cartesian.y += 1 + Math.random();
                    positions.push(cartesian);
                    markers.addBillboard(cartesian);
                }
            }
        }, ScreenSpaceEventType.LEFT_CLICK);
        mouseHandler.setInputAction(function(movement) {
            let position = movement.endPosition;
            if (position != null) {
                if (positions.length !== 0) {
                    let cartesian = null;
                    if (scene.mode === SceneMode.SCENE3D) {
                        let ray = scene.camera.getPickRay(position);
                        cartesian = scene.globe.pick(ray, scene);
                    } else {
                        cartesian = scene.camera.pickEllipsoid(position);
                    }
                    if (cartesian) {
                        positions.pop();
                        cartesian.y += 1 + Math.random();
                        positions.push(cartesian);
                        if (positions.length >= minPoints) {
                            poly.positions = positions;
                            poly._createPrimitive = true;
                        }
                        markers.getBillboard(positions.length - 1).position = cartesian;
                    }
                }
            }
        }, ScreenSpaceEventType.MOUSE_MOVE);
        mouseHandler.setInputAction(function(movement) {
            _self.stopDrawing();
            positions.pop();
            let primitive = null;
            if (movement.position != null) {
                let cartesian = null;
                if (scene.mode === SceneMode.SCENE3D) {
                    let ray = scene.camera.getPickRay(movement.position);
                    cartesian = scene.globe.pick(ray, scene);
                } else {
                    cartesian = scene.camera.pickEllipsoid(movement.position);
                }
                if (cartesian) {
                    positions.push(cartesian);
                }
            }
            options.scene = scene;
            if (isPolygon) {
                primitive = new MeasureArea(options);
            } else {
                primitive = new MeasureDistance(options);
            }
            primitive.setPositions(positions);
            addDeleteListener(primitive);
            _self.measureCollection.push(primitive);
            options.primitives.add(primitive);
            if (typeof callbacks.startEditCallback === 'function') {
                primitive.startEditCallback = callbacks.startEditCallback;
            }
            if (typeof callbacks.endEditCallback === 'function') {
                primitive.endEditCallback = callbacks.endEditCallback;
            }
            if (typeof callbacks.endCallback === 'function') {
                callbacks.endCallback(primitive, options.primitives, positions);
            }
        }, ScreenSpaceEventType.RIGHT_CLICK);
    }

    sectionAnalyse(options, callbacks) {
        this.startDrawingAnalyseShape(options, callbacks, 'section');
    }

    startDrawingAnalyseShape(options = {}, callbacks = {}, type) {
        this.startDrawing(function() {
            !poly.isDestroyed() && poly.destroy();
            if (markers !== null) {
                markers.destroy();
            }
            mouseHandler.destroy();
        });
        options = options || {};
        options.type = 'AnalyseShape';
        let poly;
        let minPoints;
        switch (type) {
            case 'section':
                minPoints = 2;
                poly = new GroundPolylinePrimitive(options);
                break;
            default:
                throw new Error('分析类型未识别，请确认分析类型是否正确');
        }
        let _self = this;
        let scene = this._scene;
        let primitives = options.collection || scene.groundPrimitives;
        poly.asynchronous = false;
        poly._primitives = primitives;
        primitives.add(poly);
        let positions = [];
        let markers = new BillboardGroup(this._scene, undefined, primitives);
        let mouseHandler = new ScreenSpaceEventHandler(scene.canvas);
        mouseHandler.setInputAction(function(movement) {
            if (movement.position != null) {
                let cartesian = null;
                if (scene.mode === SceneMode.SCENE3D) {
                    let ray = scene.camera.getPickRay(movement.position);
                    cartesian = scene.globe.pick(ray, scene);
                } else {
                    cartesian = scene.camera.pickEllipsoid(movement.position);
                }
                if (cartesian) {
                    if (positions.length === 0) {
                        positions.push(cartesian.clone());
                        markers.addBillboard(positions[0]);
                    }
                    if (positions.length >= minPoints) {
                        poly.positions = positions;
                        poly._createPrimitive = true;
                    }
                    positions.push(cartesian);
                    markers.addBillboard(cartesian);
                }
            }
        }, ScreenSpaceEventType.LEFT_CLICK);
        mouseHandler.setInputAction(function(movement) {
            let position = movement.endPosition;
            if (position != null) {
                if (positions.length !== 0) {
                    let cartesian = null;
                    if (scene.mode === SceneMode.SCENE3D) {
                        let ray = scene.camera.getPickRay(movement.position);
                        cartesian = scene.globe.pick(ray, scene);
                    } else {
                        cartesian = scene.camera.pickEllipsoid(movement.position);
                    }
                    if (cartesian) {
                        positions.pop();
                        cartesian.y += 1 + Math.random();
                        positions.push(cartesian);
                        if (positions.length >= minPoints) {
                            poly.positions = positions;
                            poly._createPrimitive = true;
                        }
                        markers.getBillboard(positions.length - 1).position = cartesian;
                    }
                }
            }
        }, ScreenSpaceEventType.MOUSE_MOVE);
        mouseHandler.setInputAction(function(movement) {
            _self.stopDrawing();
            positions.pop();
            positions.pop();
            let primitive = null;
            // eslint-disable-next-line no-unused-expressions
            type === 'section' ? (primitive = new GroundPolylinePrimitive(options)) : undefined;
            primitive._primitives = primitives;
            primitive.setPositions(positions);
            primitive._createPrimitive = true;
            primitives.add(primitive);
            if (typeof callbacks.drawEndCallback === 'function') {
                switch (type) {
                    case 'section':
                        sectionAnalyseHandler(primitive, _self._scene, callbacks.drawEndCallback);
                        break;
                }
            }
            if (typeof callbacks.mousemoveCallback === 'function') {
                primitive['mousemove'] = function(position) {
                    let cartesian = null;
                    if (scene.mode === SceneMode.SCENE3D) {
                        let ray = scene.camera.getPickRay(position);
                        cartesian = scene.globe.pick(ray, scene);
                    } else {
                        cartesian = scene.camera.pickEllipsoid(position);
                    }
                    let positions = this.positions;
                    let s = new Cartesian3();
                    let m = new Cartesian3();
                    let minDistance = Infinity;
                    let result = 0;
                    let index;
                    let distance;
                    let sections;
                    for (let i = 1, length = positions.length; i < length; ++i) {
                        Cartesian3.subtract(positions[i - 1], positions[i], s);
                        Cartesian3.subtract(cartesian, positions[i - 1], m);
                        if (Cartesian3.magnitude(m) === 0) {
                            index = i - 1;
                            break;
                        }
                        distance = Cartesian3.magnitude(Cartesian3.cross(m, s, new Cartesian3()));
                        // eslint-disable-next-line no-unused-expressions
                        minDistance > distance && ((minDistance = distance), (index = i));
                    }
                    let geodesic = new EllipsoidGeodesic();
                    for (let i = 1; i < index; ++i) {
                        geodesic.setEndPoints(
                            Cartographic.fromCartesian(positions[i - 1]),
                            Cartographic.fromCartesian(positions[i])
                        );
                        distance = geodesic.surfaceDistance;
                        sections = Math.floor(distance / 1000);
                        result += sections > 1000 ? 1000 : sections < 100 ? 100 : sections;
                    }
                    let g = new EllipsoidGeodesic(
                        Cartographic.fromCartesian(positions[index - 1]),
                        Cartographic.fromCartesian(cartesian)
                    );
                    geodesic.setEndPoints(
                        Cartographic.fromCartesian(positions[index - 1]),
                        Cartographic.fromCartesian(positions[index])
                    );
                    distance = geodesic.surfaceDistance;
                    sections = Math.floor(distance / 1000);
                    result +=
                        sections > 1000
                            ? Math.floor(1000 * (g.surfaceDistance / distance))
                            : sections < 100
                            ? Math.floor(100 * (g.surfaceDistance / distance))
                            : Math.floor(sections * (g.surfaceDistance / distance));
                    callbacks.mousemoveCallback(result);
                    if (!this._globeMousemoveHandler || this._globeMousemoveHandler.isDestroyed()) {
                        let _self = this;
                        this._globeMousemoveHandler = new ScreenSpaceEventHandler(scene.canvas);
                        this._globeMousemoveHandler.setInputAction(function(movement) {
                            let pickedObject = scene.pick(movement.endPosition);
                            if (
                                !(pickedObject && pickedObject.primitive) ||
                                !pickedObject.id ||
                                pickedObject.id.id !== 'chartPoint'
                            ) {
                                callbacks.mousemoveCallback();
                                _self._globeMousemoveHandler.destroy();
                            }
                        }, ScreenSpaceEventType.MOUSE_MOVE);
                    }
                };
                setTimeout(function() {
                    setListener(primitive._primitive, 'mousemove', function(position) {
                        primitive['mousemove'](position);
                    });
                }, 1);
            }
        }, ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
    }

    startDrawingExtent(options = {}, callbacks = {}) {
        this.startDrawing(function() {
            extent && extent.destroy();
            markers && markers.destroy();
            mouseHandler.destroy();
        });
        let _self = this;
        let scene = this._scene;
        options.scene = scene;
        let primitives = options.primitives || this.primitives;
        let firstPoint = null;
        let extent = null;
        let markers = null;
        let mouseHandler = new ScreenSpaceEventHandler(scene.canvas);

        function updateExtent(value) {
            if (extent == null) {
                options.extent = value;
                options.asynchronous = false;
                extent = new GroundRectanglePrimitive(options);
                primitives.add(extent);
                extent._primitives = primitives;
            }
            extent.setExtent(value);
            extent.rectangle = value;
            let corners = getExtentCorners(value);
            if (markers == null) {
                markers = new BillboardGroup(scene, undefined);
                markers.addBillboards(corners);
            } else {
                markers.updateBillboardsPositions(corners);
            }
        }
        mouseHandler.setInputAction(function(movement) {
            if (movement.position != null) {
                let cartesian = null;
                if (scene.mode === SceneMode.SCENE3D) {
                    let ray = scene.camera.getPickRay(movement.position);
                    cartesian = scene.globe.pick(ray, scene);
                } else {
                    cartesian = scene.camera.pickEllipsoid(movement.position);
                }
                if (cartesian) {
                    if (extent == null) {
                        if (typeof callbacks.startCallback === 'function') {
                            callbacks.startCallback();
                        }
                        firstPoint = ellipsoid.cartesianToCartographic(cartesian);
                        let value = getExtent(firstPoint, firstPoint);
                        updateExtent(value);
                    } else {
                        _self.stopDrawing();
                        let extent = getExtent(
                            firstPoint,
                            ellipsoid.cartesianToCartographic(cartesian)
                        );
                        options.extent = extent;
                        options.asynchronous = false;
                        options.scene = scene;
                        let primitive = new GroundRectanglePrimitive(options);
                        primitive._createPrimitive = true;
                        primitives.add(primitive);
                        primitive._primitives = primitives;
                        if (typeof callbacks.startEditCallback === 'function') {
                            primitive.startEditCallback = callbacks.startEditCallback;
                        }
                        if (typeof callbacks.endEditCallback === 'function') {
                            primitive.endEditCallback = callbacks.endEditCallback;
                        }
                        if (typeof callbacks.endCallback === 'function') {
                            callbacks.endCallback(primitive, primitives, { extent: extent });
                        }
                    }
                }
            }
        }, ScreenSpaceEventType.LEFT_CLICK);
        mouseHandler.setInputAction(function(movement) {
            let position = movement.endPosition;
            if (position != null) {
                if (extent !== null) {
                    let cartesian = null;
                    if (scene.mode === SceneMode.SCENE3D) {
                        let ray = scene.camera.getPickRay(position);
                        cartesian = scene.globe.pick(ray, scene);
                    } else {
                        cartesian = scene.camera.pickEllipsoid(position);
                    }
                    if (cartesian) {
                        let value = getExtent(
                            firstPoint,
                            ellipsoid.cartesianToCartographic(cartesian)
                        );
                        updateExtent(value);
                    }
                }
            }
        }, ScreenSpaceEventType.MOUSE_MOVE);
    }

    startDrawingCircle(options = {}, callbacks = {}) {
        let _self = this;
        let scene = this._scene;
        options.scene = scene;
        let primitives = options.primitives || this.primitives;
        let circle = null;
        let markers = null;
        let mouseHandler = new ScreenSpaceEventHandler(scene.canvas);
        this.startDrawing(function() {
            if (circle !== null) circle.destroy();
            if (markers !== null) markers.destroy();
            mouseHandler.destroy();
        });
        mouseHandler.setInputAction(function(movement) {
            if (movement.position != null) {
                let cartesian = null;
                if (scene.mode === SceneMode.SCENE3D) {
                    let ray = scene.camera.getPickRay(movement.position);
                    cartesian = scene.globe.pick(ray, scene);
                } else {
                    cartesian = scene.camera.pickEllipsoid(movement.position);
                }
                if (cartesian) {
                    if (circle == null) {
                        if (typeof callbacks.startCallback === 'function') {
                            callbacks.startCallback();
                        }
                        options.center = cartesian;
                        options.radius = 1;
                        circle = new GroundCirclePrimitive(options);
                        primitives.add(circle);
                        circle._primitives = primitives;
                        markers = new BillboardGroup(scene, undefined);
                        markers.addBillboards([cartesian]);
                    } else {
                        let center = circle.getCenter();
                        let radius = circle.getRadius();
                        options.center = center;
                        options.radius = radius;
                        options.scene = scene;
                        _self.stopDrawing();
                        let primitive = new GroundCirclePrimitive(options);
                        primitives.add(primitive);
                        primitive._primitives = primitives;
                        if (typeof callbacks.startEditCallback === 'function') {
                            primitive.startEditCallback = callbacks.startEditCallback;
                        }
                        if (typeof callbacks.endEditCallback === 'function') {
                            primitive.endEditCallback = callbacks.endEditCallback;
                        }
                        if (typeof callbacks.endCallback === 'function') {
                            callbacks.endCallback(primitive, primitives, {
                                center: center,
                                radius: radius,
                            });
                        }
                    }
                }
            }
        }, ScreenSpaceEventType.LEFT_CLICK);
        mouseHandler.setInputAction(function(movement) {
            let position = movement.endPosition;
            if (position != null) {
                if (circle !== null) {
                    let cartesian = null;
                    if (scene.mode === SceneMode.SCENE3D) {
                        let ray = scene.camera.getPickRay(position);
                        cartesian = scene.globe.pick(ray, scene);
                    } else {
                        cartesian = scene.camera.pickEllipsoid(position);
                    }
                    if (cartesian) {
                        circle.setRadius(Cartesian3.distance(circle.getCenter(), cartesian));
                        markers.updateBillboardsPositions(cartesian);
                    }
                }
            }
        }, ScreenSpaceEventType.MOUSE_MOVE);
        return circle;
    }

    startDrawingEllipse(options = {}, callbacks = {}) {
        this.startDrawing(function cleanUp() {
            ellipse && ellipse.destroy();
            markers && markers.destroy();
            mouseHandler.destroy();
        });
        let _self = this;
        let scene = this._scene;
        options.scene = scene;
        let primitives = options.primitives || this.primitives;
        let ellipse = null;
        let markers = null;
        let mouseHandler = new ScreenSpaceEventHandler(scene.canvas);
        mouseHandler.setInputAction(function(movement) {
            if (movement.position != null) {
                let cartesian = null;
                if (scene.mode === SceneMode.SCENE3D) {
                    let ray = scene.camera.getPickRay(movement.position);
                    cartesian = scene.globe.pick(ray, scene);
                } else {
                    cartesian = scene.camera.pickEllipsoid(movement.position);
                }
                if (cartesian) {
                    if (ellipse == null) {
                        options.center = cartesian;
                        ellipse = new GroundEllipsePrimitive(options);
                        ellipse.positions.push(cartesian);
                        primitives.add(ellipse);
                        ellipse._primitives = primitives;
                        markers = new BillboardGroup(scene, undefined);
                        markers.addBillboards([cartesian]);
                    } else if (ellipse.positions.length < 3) {
                        ellipse.positions.pop();
                        ellipse.positions.push(cartesian);
                        ellipse.setSemiMajorAxis(ellipse.calculateMajorAxis());
                        ellipse.setSemiMinorAxis(ellipse.calculateMinorAxis());
                        ellipse.setRotation(ellipse.calculateRotation());
                        markers.addBillboard(cartesian);
                    } else if (ellipse.positions.length === 3) {
                        ellipse.positions.pop();
                        ellipse.positions.push(cartesian);
                        options.positions = [...ellipse.positions];
                        options.center = ellipse.getCenter();
                        options.semiMajorAxis = ellipse.getSemiMajorAxis();
                        options.semiMinorAxis = ellipse.getSemiMinorAxis();
                        options.rotation = ellipse.getRotation();
                        options.scene = scene;
                        _self.stopDrawing();
                        let primitive = new GroundEllipsePrimitive(options);
                        primitive._createPrimitive = true;
                        primitives.add(primitive);
                        primitive._primitives = primitives;
                        if (typeof callbacks.startEditCallback === 'function') {
                            primitive.startEditCallback = callbacks.startEditCallback;
                        }
                        if (typeof callbacks.endEditCallback === 'function') {
                            primitive.endEditCallback = callbacks.endEditCallback;
                        }
                        if (typeof callbacks.endCallback === 'function') {
                            callbacks.endCallback(primitive, primitives, {
                                center: options.center,
                                semiMajorAxis: options.semiMajorAxis,
                                semiMinorAxis: options.semiMinorAxis,
                                rotation: options.rotation,
                            });
                        }
                    }
                    ellipse.positions.push(cartesian);
                }
            }
        }, ScreenSpaceEventType.LEFT_CLICK);
        mouseHandler.setInputAction(function(movement) {
            let position = movement.endPosition;
            if (position != null) {
                if (ellipse !== null) {
                    let cartesian = null;
                    if (scene.mode === SceneMode.SCENE3D) {
                        let ray = scene.camera.getPickRay(position);
                        cartesian = scene.globe.pick(ray, scene);
                    } else {
                        cartesian = scene.camera.pickEllipsoid(position);
                    }
                    if (cartesian) {
                        ellipse.positions.pop();
                        ellipse.positions.push(cartesian);
                        ellipse.setSemiMajorAxis(ellipse.calculateMajorAxis());
                        ellipse.setSemiMinorAxis(ellipse.calculateMinorAxis());
                        ellipse.setRotation(ellipse.calculateRotation());
                        markers.updateBillboardsPositions(cartesian);
                    }
                }
            }
        }, ScreenSpaceEventType.MOUSE_MOVE);
    }

    selectByExtent(options, callback) {
        options = options || {};
        this.startDrawing(function() {
            if (extent != null) {
                primitives.remove(extent);
            }
            mouseHandler.destroy();
        });
        options.color = options.color || 'rgba(255, 255, 255, 0.3)';
        let _self = this;
        let scene = this._scene;
        let primitives = this._scene.primitives;
        let firstPoint = null;
        let extent = null;
        // let markers = null;
        let mouseHandler = new ScreenSpaceEventHandler(scene.canvas);

        function updateExtent(value) {
            if (extent == null) {
                options.extent = value;
                options.asynchronous = false;
                extent = new GroundRectanglePrimitive(options);
                primitives.add(extent);
            }
            extent.setExtent(value);
            extent.rectangle = value;
        }

        function controlEarth(flag) {
            scene.screenSpaceCameraController.enableRotate = flag;
            scene.screenSpaceCameraController.enableTranslate = flag;
            scene.screenSpaceCameraController.enableTilt = flag;
            scene.screenSpaceCameraController.enableLook = flag;
            scene.screenSpaceCameraController.enableZoom = flag;
        }
        // Now wait for start
        mouseHandler.setInputAction(function(movement) {
            if (movement.position != null) {
                let cartesian = scene.camera.pickEllipsoid(movement.position, ellipsoid);
                if (cartesian) {
                    controlEarth(false);
                    firstPoint = ellipsoid.cartesianToCartographic(cartesian);
                    let value = getExtent(firstPoint, firstPoint);
                    updateExtent(value);
                }
            }
        }, ScreenSpaceEventType.LEFT_DOWN);
        mouseHandler.setInputAction(function(movement) {
            if (extent !== null) {
                _self.stopDrawing();
                if (typeof options.callback === 'function') {
                    options.callback();
                }
                controlEarth(true);
                callback(extent.rectangle, extent);
            }
        }, ScreenSpaceEventType.LEFT_UP);
        mouseHandler.setInputAction(function(movement) {
            let position = movement.endPosition;
            if (position != null) {
                if (extent !== null) {
                    let cartesian = scene.camera.pickEllipsoid(position, ellipsoid);
                    if (cartesian) {
                        let value = getExtent(
                            firstPoint,
                            ellipsoid.cartesianToCartographic(cartesian)
                        );
                        updateExtent(value);
                    }
                }
            }
        }, ScreenSpaceEventType.MOUSE_MOVE);
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
    e.west = Math.min(mn.longitude, mx.longitude);
    e.east = Math.max(mn.longitude, mx.longitude);
    e.south = Math.min(mn.latitude, mx.latitude);
    e.north = Math.max(mn.latitude, mx.latitude);
    let epsilon = 0.0000001;
    if (e.east - e.west < epsilon) {
        e.east += epsilon * 2.0;
    }
    if (e.north - e.south < epsilon) {
        e.north += epsilon * 2.0;
    }
    return e;
}

function sectionAnalyseHandler(primitive, scene, callback) {
    let positions = primitive.positions;
    let lastDistance = 0;
    let distance;
    let sections;
    let height;
    let distanceStep;
    let cartographic = new Cartographic();
    let maxHeight = -Infinity;
    let minHeight = Infinity;
    let position = carToDegrees(positions[0]);
    let data = [
        {
            coordinate: [position.lon, position.lat],
            value: scene.globe.getHeight(Cartographic.fromCartesian(positions[0])),
            distance: 0,
            label: {
                show: true,
            },
        },
    ];
    let geodesic = new EllipsoidGeodesic();
    for (let i = 1, length = positions.length; i < length; ++i) {
        geodesic.setEndPoints(
            Cartographic.fromCartesian(positions[i - 1]),
            Cartographic.fromCartesian(positions[i])
        );
        distance = geodesic.surfaceDistance;
        sections = Math.floor(distance / 1000);
        sections = sections > 1000 ? 1000 : sections < 100 ? 100 : sections;
        distanceStep = distance / sections;
        for (let j = 1; j <= sections; ++j) {
            geodesic.interpolateUsingSurfaceDistance(distanceStep * j, cartographic);
            lastDistance = lastDistance + distanceStep;
            height = scene.globe.getHeight(cartographic);
            maxHeight = Math.max(height, maxHeight);
            minHeight = Math.min(height, minHeight);
            data[data.length] = {
                coordinate: [
                    Number(((cartographic.longitude / Math.PI) * 180).toFixed(6)),
                    Number(((cartographic.latitude / Math.PI) * 180).toFixed(6)),
                ],
                value: Number(height.toFixed(2)),
                distance: lastDistance,
            };
        }
    }
    callback(data, maxHeight, minHeight, function(lon, lat, height, entities) {
        let entity = entities.getById('chartPoint');
        if (entity) {
            entity.position = Cartesian3.fromDegrees(lon, lat, height);
        } else {
            entities.add({
                id: 'chartPoint',
                position: Cartesian3.fromDegrees(lon, lat, height),
                point: {
                    pixelSize: 5,
                    color: Color.WHITE,
                },
            });
        }
    });
}

function setListener(primitive, type, callback) {
    primitive[type] = callback;
}

function addDeleteListener(primitive) {
    primitive.billboards = primitive._primitives.add(new BillboardCollection());
    let button = primitive.billboards.add({
        position: primitive.positions[primitive.positions.length - 1],
        image:
            'data:image/png;base64,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',
        width: 15,
        height: 15,
        pixelOffset: new Cartesian2(3, 0),
        horizontalOrigin: 1,
        verticalOrigin: 0,
    });
    setListener(button, 'leftClick', function() {
        primitive.destroy();
    });
}

export default DrawHelper;
