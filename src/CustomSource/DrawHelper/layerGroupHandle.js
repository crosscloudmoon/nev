/* eslint-disable */

const Cartesian3 = Cesium.Cartesian3;
const HeightReference = Cesium.HeightReference;
const HeadingPitchRange = Cesium.HeadingPitchRange;

import DrawHelper from './DrawHelper';
import Marker from './Marker';
import TextAnnotation from './TextAnnotation';
import GroundCirclePrimitive from './GroundCirclePrimitive';
import GroundEllipsePrimitive from './GroundEllipsePrimitive';
import GroundPolygonPrimitive from './GroundPolygonPrimitive';
import GroundPolylinePrimitive from './GroundPolylinePrimitive';
import GroundRectanglePrimitive from './GroundRectanglePrimitive';

export default (function() {
    let activeGroup;
    let activeLayer;
    let layerGroupMap = new Map();
    let GeometryGroup = new Proxy(
        {
            size: 0,
        },
        {
            set: function(obj, prop, value) {
                if (prop != 'size') {
                    let id = value.id;
                    layerGroupMap
                        .get(activeGroup)
                        .get(activeLayer)
                        .primitives.push(id);
                    obj[id] = value;
                    obj.size = obj.size + 1;
                    return true;
                } else {
                    obj.size = value;
                    return true;
                }
            },
        }
    );
    class layerGroupHandle {
        static deleteAllLayerGroup() {
            layerGroupMap.forEach(function(val) {
                val.forEach(function(v) {
                    removeGeometry(v);
                }, val);
            }, layerGroupMap);
            layerGroupMap.clear();
        }
        static addLayerGroup(key, name) {
            let layerGroup = new Map();
            layerGroupMap.set(key, layerGroup);
            layerGroupMap.get(key).name = name;
        }
        static deleteLayerGroup(key) {
            let layerGroup = layerGroupMap.get(key);
            layerGroup.forEach(function(v) {
                removeGeometry(v);
            }, layerGroup);
            layerGroupMap.delete(key);
        }
        static clearLayerGroup(key) {
            let layerGroup = layerGroupMap.get(key);
            layerGroup.forEach(function(v) {
                removeGeometry(v);
            }, layerGroup);
            layerGroup.clear();
        }
        // 控制图层的添加、删除、清空和显隐
        static addLayer(groupKey, layerKey, name) {
            let layer = {
                name: name,
                primitives: [],
            };
            layerGroupMap.get(groupKey).set(layerKey, layer);
        }
        static deleteLayer(groupKey, layerKey) {
            let layer = layerGroupMap.get(groupKey).get(layerKey);
            removeGeometry(layer);
            layerGroupMap.get(groupKey).delete(layerKey);
        }
        static clearLayer(groupKey, layerKey) {
            let layer = layerGroupMap.get(groupKey).get(layerKey);
            removeGeometry(layer);
            layer.primitives = [];
        }
        // 设置和获取活动图层
        static setActiveLayer(groupKey, layerKey) {
            activeGroup = groupKey;
            activeLayer = layerKey;
        }
        // 控制实体添加、移除、显隐及ID
        static addGeometry(geometry, groupKey, layerKey) {
            activeGroup = groupKey;
            activeLayer = layerKey;
            GeometryGroup.geometry = geometry;
        }
        // OK
        static removeGeometry(Key, groupKey, layerKey) {
            GeometryGroup[Key].destroy();
            delete GeometryGroup[Key];
            GeometryGroup['size'] = GeometryGroup['size'] - 1;
            if (layerKey && groupKey) {
                let collection = layerGroupMap.get(groupKey).get(layerKey).primitives;
                let index = collection.indexOf(Key);
                if (index > -1) {
                    collection.splice(index, 1);
                }
            }
        }

        static getGeometry(Key) {
            return GeometryGroup[Key];
        }

        static showGeometry(Key, flag) {
            GeometryGroup[Key].show = flag;
        }
        // OK
        static addNodeList(func) {
            addNodeListFun = func;
        }
        static showAllGeometry(keys) {
            for (let v in GeometryGroup) {
                if (v !== 'size') {
                    GeometryGroup[v].show = keys.indexOf(v) !== -1;
                }
            }
        }
        static getAllGeometry() {
            return GeometryGroup;
        }

        static saveAllProgramme() {
            layerGroupMap.forEach(function(val, key) {
                layerGroupMap.saveProgramme(val, key);
            });
        }

        static saveProgramme(groupKey, group) {
            if (!groupKey) {
                throw new Error('请输入需要保存的图层组ID');
            }
            let primitive = null;
            let result = {};
            let layerGroup = group || layerGroupMap.get(groupKey);
            result[groupKey] = {};
            let index = 0;
            layerGroup.forEach(function(v, key) {
                result[groupKey][key] = [];
                let collection = v.primitives;
                for (let i = 0; i < collection.length; i++) {
                    primitive = GeometryGroup[collection[i]];
                    switch (primitive.getType()) {
                        case 'Marker':
                            result[groupKey][key].push({
                                id: collection[i],
                                type: 'Marker',
                                position: Cartesian3.pack(primitive._billboards[0].position, []),
                                // image: primitive._billboards[0].image,
                                color: primitive._billboards[0].color,
                                scale: primitive._billboards[0].scale,
                                properties: primitive.properties,
                            });
                            break;
                        case 'Text':
                            result[groupKey][key].push({
                                id: collection[i],
                                type: 'Text',
                                position: Cartesian3.pack(primitive._labels[0].position, []),
                                text: primitive._labels[0].text,
                                font: primitive._labels[0].font,
                                fillColor: primitive._labels[0].fillColor,
                                outlineColor: primitive._labels[0].outlineColor,
                                outlineWidth: primitive._labels[0].outlineWidth,
                                properties: primitive.properties,
                            });
                            break;
                        case 'GroundPolyline':
                            result[groupKey][key].push({
                                id: collection[i],
                                type: 'GroundPolyline',
                                positions: Cartesian3.packArray(primitive.positions, []),
                                width: primitive.width,
                                lineType: primitive.lineType,
                                color: primitive.color,
                                outlineWidth: primitive.outlineWidth,
                                outlineColor: primitive.outlineColor,
                                glowPower: primitive.glowPower,
                                taperPower: primitive.taperPower,
                                dashedScale: primitive.dashedScale,
                                dashedLength: primitive.dashedLength,
                                properties: primitive.properties,
                            });
                            break;
                        case 'GroundPolygon':
                            result[groupKey][key].push({
                                id: collection[i],
                                type: 'GroundPolygon',
                                positions: Cartesian3.packArray(primitive.positions, []),
                                fill: primitive.fill,
                                color: primitive.color,
                                outline: primitive.outline,
                                outlineColor: primitive.outlineColor,
                                outlineWidth: primitive.outlineWidth,
                                properties: primitive.properties,
                            });
                            break;
                        case 'GroundEllipse':
                            result[groupKey][key].push({
                                id: collection[i],
                                type: 'GroundEllipse',
                                center: Cartesian3.pack(primitive.getCenter(), []),
                                rotation: primitive.getRotation(),
                                fill: primitive.fill,
                                color: primitive.color,
                                outline: primitive.outline,
                                outlineColor: primitive.outlineColor,
                                outlineWidth: primitive.outlineWidth,
                                semiMajorAxis: primitive.semiMajorAxis,
                                semiMinorAxis: primitive.semiMinorAxis,
                                properties: primitive.properties,
                            });
                            break;
                        case 'GroundCircle':
                            result[groupKey][key].push({
                                id: collection[i],
                                type: 'GroundCircle',
                                fill: primitive.fill,
                                color: primitive.color,
                                outline: primitive.outline,
                                outlineColor: primitive.outlineColor,
                                outlineWidth: primitive.outlineWidth,
                                center: Cartesian3.pack(primitive.getCenter(), []),
                                radius: primitive.getRadius(),
                                properties: primitive.properties,
                            });
                            break;
                        case 'GroundRectangle':
                            result[groupKey][key].push({
                                id: collection[i],
                                type: 'GroundRectangle',
                                fill: primitive.fill,
                                color: primitive.color,
                                outline: primitive.outline,
                                outlineColor: primitive.outlineColor,
                                outlineWidth: primitive.outlineWidth,
                                extent: primitive.getExtent(),
                                properties: primitive.properties,
                            });
                            break;
                    }
                    index++;
                }
            }, layerGroup);

            return index > 0 ? result : void 0;
        }
        static openProgramme(data, scene, callbacks = {}) {
            let drawHelper = new DrawHelper(scene);
            let primitive = null;
            let options = null;
            for (let ppId in data) {
                layerGroupHandle.addLayerGroup(ppId);
                for (let pId in data[ppId]) {
                    let val = data[ppId][pId];
                    layerGroupHandle.addLayer(ppId, pId);
                    layerGroupHandle.setActiveLayer(ppId, pId);
                    for (let i = 0; i < val.length; i++) {
                        options = val[i];
                        options.scene = scene;
                        switch (options.type) {
                            case 'Marker':
                                options.position = Cartesian3.unpack(options.position);
                                options.heightReference = HeightReference.CLAMP_TO_GROUND;
                                primitive = new Marker(options);
                                break;
                            case 'Text':
                                options.position = Cartesian3.unpack(options.position);
                                options.heightReference = HeightReference.CLAMP_TO_GROUND;
                                primitive = new TextAnnotation(options);
                                break;
                            case 'GroundPolyline':
                                options.positions = Cartesian3.unpackArray(options.positions);
                                primitive = new GroundPolylinePrimitive(options);
                                break;
                            case 'GroundPolygon':
                                options.positions = Cartesian3.unpackArray(options.positions);
                                primitive = new GroundPolygonPrimitive(options);
                                break;
                            case 'GroundEllipse':
                                options.center = Cartesian3.unpack(options.center);
                                primitive = new GroundEllipsePrimitive(options);
                                break;
                            case 'GroundCircle':
                                options.center = Cartesian3.unpack(options.center);
                                primitive = new GroundCirclePrimitive(options);
                                break;
                            case 'GroundRectangle':
                                primitive = new GroundRectanglePrimitive(options);
                                break;
                        }
                        if (typeof callbacks.startEditCallback === 'function')
                            primitive.startEditCallback = callbacks.startEditCallback;
                        if (typeof callbacks.endEditCallback === 'function')
                            primitive.endEditCallback = callbacks.endEditCallback;
                        primitive._createPrimitive = true;
                        drawHelper.primitives.add(primitive);
                        primitive._primitives = drawHelper.primitives;
                        layerGroupHandle.addGeometry(primitive, ppId, pId);
                    }
                }
            }
        }
        static lookGeometry(Key) {
            let geometry = GeometryGroup[Key];
            let type = geometry.getType();
            let boundingSphere = null;
            switch (type) {
                case 'Marker':
                    boundingSphere = geometry._boundingVolume;
                    break;
                case 'Text':
                    boundingSphere = geometry._billboardCollection._boundingVolume;
                    break;
                case 'GroundPolyline':
                    boundingSphere = geometry._primitive._primitive._boundingSpheres[0];
                    break;
                case 'GroundPolygon':
                case 'GroundCircle':
                case 'GroundEllipse':
                case 'GroundRectangle':
                    boundingSphere =
                        geometry._primitive._primitive._primitive._instanceBoundingSpheres[0];
                    break;
                default:
                    console.log(type + '类型不能被识别，请补充该类型获取包围球的方法');
            }
            boundingSphere &&
                geometry._scene.camera.flyToBoundingSphere(boundingSphere, {
                    offset: new HeadingPitchRange(0, -Math.PI / 2, 0),
                });
        }
    }

    function removeGeometry(layer) {
        for (let i = 0, length = layer.primitives.length; i < length; i++) {
            GeometryGroup[layer.primitives[i]].destroy();
            delete GeometryGroup[layer.primitives[i]];
            GeometryGroup.size = GeometryGroup.size - 1;
        }
    }
    return layerGroupHandle;
})();

// new Proxy([], {
//     set: function (arr, prop, value) {
//         if(prop === "length" || arr.indexOf(value) === -1){
//             arr[prop] = value;
//         }
//         return true
//     }
// })
