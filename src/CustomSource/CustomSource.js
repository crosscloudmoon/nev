/* global Cesium */
import DrawHelper from './DrawHelper/DrawHelper';
import GroundCirclePrimitive from './DrawHelper/GroundCirclePrimitive';
import GroundEllipsePrimitive from './DrawHelper/GroundEllipsePrimitive';
import GroundPolygonPrimitive from './DrawHelper/GroundPolygonPrimitive';
import GroundPolylinePrimitive from './DrawHelper/GroundPolylinePrimitive';
import GroundRectanglePrimitive from './DrawHelper/GroundRectanglePrimitive';
import Marker from './DrawHelper/Marker';
import MeasureArea from './DrawHelper/MeasureArea';
import MeasureDistance from './DrawHelper/MeasureDistance';
import TextAnnotation from './DrawHelper/TextAnnotation';
import layerGroupHandle from './DrawHelper/layerGroupHandle';
import carToDegrees from './DrawHelper/carToDegrees';
import SatelliteManager from './Satellite/SatelliteManager';
import SatelliteComponents from './Satellite/SatelliteComponents';
import DoubleSceneCompare from './Components/DoubleSceneCompare';
import getPickPosition from './Core/getPickPosition';
import CustomPinBuilder from './Core/CustomPinBuilder';
import WebMapTileServiceImageryProvider from './Scene/WebMapTileServiceImageryProvider';
import dayjs from './ThirdParty/dayjs.min';
export default {
    install() {
        if (typeof Cesium === 'undefined') {
            window.Cesium = {};
        }
        Cesium['C_DrawHelper'] = DrawHelper;
        Cesium['C_GroundCirclePrimitive'] = GroundCirclePrimitive;
        Cesium['C_GroundEllipsePrimitive'] = GroundEllipsePrimitive;
        Cesium['C_GroundPolygonPrimitive'] = GroundPolygonPrimitive;
        Cesium['C_GroundPolylinePrimitive'] = GroundPolylinePrimitive;
        Cesium['C_GroundRectanglePrimitive'] = GroundRectanglePrimitive;
        Cesium['C_Marker'] = Marker;
        Cesium['C_MeasureArea'] = MeasureArea;
        Cesium['C_MeasureDistance'] = MeasureDistance;
        Cesium['C_TextAnnotation'] = TextAnnotation;
        Cesium['C_layerGroupHandle'] = layerGroupHandle;
        Cesium['C_carToDegrees'] = carToDegrees;
        Cesium['C_SatelliteManager'] = SatelliteManager;
        Cesium['C_SatelliteComponents'] = SatelliteComponents;
        Cesium['C_DoubleSceneCompare'] = DoubleSceneCompare;
        Cesium['C_getPickPosition'] = getPickPosition;
        Cesium['C_CustomPinBuilder'] = CustomPinBuilder;
        Cesium['C_WebMapTileServiceImageryProvider'] = WebMapTileServiceImageryProvider;
        Cesium['C_dayjs'] = dayjs;
    },
};
