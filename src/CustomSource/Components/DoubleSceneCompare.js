/* global Cesium */
const CesiumViewer = Cesium.Viewer;
const defined = Cesium.defined;
const Cartesian4 = Cesium.Cartesian4;
const GeometryInstance = Cesium.GeometryInstance;
const BoxOutlineGeometry = Cesium.BoxOutlineGeometry;
const SphereOutlineGeometry = Cesium.SphereOutlineGeometry;
const BoundingSphere = Cesium.BoundingSphere;
const Cartesian3 = Cesium.Cartesian3;
const Cartographic = Cesium.Cartographic;
const Cartesian2 = Cesium.Cartesian2;
const Color = Cesium.Color;
const ColorGeometryInstanceAttribute = Cesium.ColorGeometryInstanceAttribute;
const combine = Cesium.combine;
const DeveloperError = Cesium.DeveloperError;
const CesiumMath = Cesium.Math;
const Matrix4 = Cesium.Matrix4;
const OrientedBoundingBox = Cesium.OrientedBoundingBox;
const PrimitiveType = Cesium.PrimitiveType;
const Rectangle = Cesium.Rectangle;
const TerrainQuantization = Cesium.TerrainQuantization;
const WebMercatorProjection = Cesium.WebMercatorProjection;
const ContextLimits = Cesium.ContextLimits;
const DrawCommand = Cesium.DrawCommand;
const Pass = Cesium.Pass;
const RenderState = Cesium.RenderState;
const BlendingState = Cesium.BlendingState;
const DepthFunction = Cesium.DepthFunction;
const ImageryLayer = Cesium.ImageryLayer;
const PerInstanceColorAppearance = Cesium.PerInstanceColorAppearance;
const Primitive = Cesium.Primitive;
const SceneMode = Cesium.SceneMode;
const ShadowMode = Cesium.ShadowMode;
const TerrainFillMesh = Cesium.TerrainFillMesh;
const GeometryPipeline = Cesium.GeometryPipeline;
const BufferUsage = Cesium.BufferUsage;
const IndexDatatype = Cesium.IndexDatatype;
const VertexArray = Cesium.VertexArray;

let sceneObject = null;

export default {
    open: function(viewer, options) {
        if (sceneObject) return;
        sceneObject = new LeftCompareRight(viewer, options);
        return sceneObject.rightViewer;
    },
    close: function() {
        if (!sceneObject) return;
        sceneObject.addListener();
        sceneObject.removeListener();
        sceneObject.rightViewer.destroy();
        let rightContainer = document.getElementById('rightViewerContainer');
        rightContainer.parentNode.removeChild(rightContainer);
        sceneObject.leftViewer.container.children[0].style.width = '100%';
        sceneObject.leftViewer.container.children[0].style['padding-right'] = '0px';
        sceneObject.leftViewer.scene.imagerySplitPosition = undefined;
        sceneObject = null;
    },
};

class LeftCompareRight {
    constructor(viewer, options) {
        if (!viewer) {
            throw new Error('viewer is required.');
        }
        this.init(viewer, options);
    }
    init(viewer, options) {
        let _self = this;
        this.leftViewer = viewer;
        viewer.container.children[0].style.width = 'calc(50% - 2px)';
        // viewer.container.children[0].style['padding-right'] = "5px";

        this.createViewer(viewer, 'right');
        this.rightViewer.scene.camera = this.leftViewer.scene.camera;

        this.leftViewer.scene.imagerySplitPosition = 1;
        this.rightViewer.scene.imagerySplitPosition = 0;
        let imageryLayers = viewer.imageryLayers;
        for (let i = 0; i < imageryLayers._layers.length; ++i) {
            this.rightViewer.imageryLayers.add(
                new ImageryLayer(imageryLayers._layers[i].imageryProvider, {
                    splitDirection: function() {
                        return imageryLayers._layers[i].splitDirection;
                    },
                })
            );
        }

        this.addListener = imageryLayers.layerAdded.addEventListener(function(imageryLayer, index) {
            _self.rightViewer.imageryLayers.add(
                new ImageryLayer(imageryLayer.imageryProvider, {
                    splitDirection: function() {
                        return imageryLayer.splitDirection;
                    },
                }),
                index
            );
        });
        this.removeListener = imageryLayers.layerRemoved.addEventListener(function(
            imageryLayer,
            index
        ) {
            _self.rightViewer.imageryLayers.remove(_self.rightViewer.imageryLayers.get(index));
        });
    }
    createViewer(viewer, position) {
        let _self = this;
        viewer.extend(function(viewer, option) {
            let container = viewer.container;
            let viewerContainer = document.createElement('div');
            viewerContainer.id = 'rightViewerContainer';
            viewerContainer.style.cssText =
                'width: calc(50% - 2px);height: 100%;top: 0px; right:0px;position: absolute;background-color: rgb(255, 255, 255); padding-left:5px;';
            container.appendChild(viewerContainer);

            _self['rightViewer'] = new CesiumViewer('rightViewerContainer', {
                baseLayerPicker: false,
                selectionIndicator: false,
                fullscreenButton: false,
                vrButton: false,
                geocoder: false,
                animation: false,
                homeButton: false,
                infoBox: false,
                sceneModePicker: false,
                timeline: false,
                navigationHelpButton: false,
                navigationInstructionsInitiallyVisible: false,
                imageryProvider: false,
                contextOptions: {
                    webgl: {
                        alpha: true,
                        depth: false,
                        stencil: true,
                        antialias: true,
                        premultipliedAlpha: true,
                        preserveDrawingBuffer: true,
                        failIfMajorPerformanceCaveat: true,
                    },
                    allowTextureFilterAnisotropic: true,
                },
                terrainProvider: viewer.terrainProvider,
            });
            _self['rightViewer']._cesiumWidget._creditContainer.style.display = 'none';
            _self['rightViewer'].scene.globe._surface._tileProvider.endUpdate = function(
                frameState
            ) {
                if (!defined(this._renderState)) {
                    this._renderState = RenderState.fromCache({
                        // Write color and depth
                        cull: {
                            enabled: true,
                        },
                        depthTest: {
                            enabled: true,
                            func: DepthFunction.LESS,
                        },
                    });

                    this._blendRenderState = RenderState.fromCache({
                        // Write color and depth
                        cull: {
                            enabled: true,
                        },
                        depthTest: {
                            enabled: true,
                            func: DepthFunction.LESS_OR_EQUAL,
                        },
                        blending: BlendingState.ALPHA_BLEND,
                    });
                }

                // If this frame has a mix of loaded and fill tiles, we need to propagate
                // loaded heights to the fill tiles.
                if (this._hasFillTilesThisFrame && this._hasLoadedTilesThisFrame) {
                    TerrainFillMesh.updateFillTiles(
                        this,
                        this._quadtree._tilesToRender,
                        frameState,
                        this._vertexArraysToDestroy
                    );
                }

                // Add the tile render commands to the command list, sorted by texture count.
                let tilesToRenderByTextureCount = this._tilesToRenderByTextureCount;
                for (
                    let textureCountIndex = 0,
                        textureCountLength = tilesToRenderByTextureCount.length;
                    textureCountIndex < textureCountLength;
                    ++textureCountIndex
                ) {
                    let tilesToRender = tilesToRenderByTextureCount[textureCountIndex];
                    if (!defined(tilesToRender)) {
                        continue;
                    }

                    for (
                        let tileIndex = 0, tileLength = tilesToRender.length;
                        tileIndex < tileLength;
                        ++tileIndex
                    ) {
                        addDrawCommandsForTile(this, tilesToRender[tileIndex], frameState);
                    }
                }
            };

            _self['rightViewer'].scene.fog.enabled = viewer.scene.fog.enabled;
            _self['rightViewer'].scene.globe.showGroundAtmosphere =
                viewer.scene.globe.showGroundAtmosphere;
            _self['rightViewer'].clock.shouldAnimate = viewer.clock.shouldAnimate;
        }, {});
    }
}
let modifiedModelViewScratch = new Matrix4();
let modifiedModelViewProjectionScratch = new Matrix4();
let tileRectangleScratch = new Cartesian4();
let localizedCartographicLimitRectangleScratch = new Cartesian4();
let rtcScratch = new Cartesian3();
let centerEyeScratch = new Cartesian3();
let southwestScratch = new Cartesian3();
let northeastScratch = new Cartesian3();
let scratchClippingPlaneMatrix = new Matrix4();
let rectangleIntersectionScratch = new Rectangle();
let splitCartographicLimitRectangleScratch = new Rectangle();
let rectangleCenterScratch = new Cartographic();

function createTileUniformMap(frameState, globeSurfaceTileProvider) {
    let uniformMap = {
        u_initialColor: function() {
            return this.properties.initialColor;
        },
        u_fillHighlightColor: function() {
            return this.properties.fillHighlightColor;
        },
        u_zoomedOutOceanSpecularIntensity: function() {
            return this.properties.zoomedOutOceanSpecularIntensity;
        },
        u_oceanNormalMap: function() {
            return this.properties.oceanNormalMap;
        },
        u_lightingFadeDistance: function() {
            return this.properties.lightingFadeDistance;
        },
        u_nightFadeDistance: function() {
            return this.properties.nightFadeDistance;
        },
        u_center3D: function() {
            return this.properties.center3D;
        },
        u_tileRectangle: function() {
            return this.properties.tileRectangle;
        },
        u_modifiedModelView: function() {
            let viewMatrix = frameState.context.uniformState.view;
            let centerEye = Matrix4.multiplyByPoint(
                viewMatrix,
                this.properties.rtc,
                centerEyeScratch
            );
            Matrix4.setTranslation(viewMatrix, centerEye, modifiedModelViewScratch);
            return modifiedModelViewScratch;
        },
        u_modifiedModelViewProjection: function() {
            let viewMatrix = frameState.context.uniformState.view;
            let projectionMatrix = frameState.context.uniformState.projection;
            let centerEye = Matrix4.multiplyByPoint(
                viewMatrix,
                this.properties.rtc,
                centerEyeScratch
            );
            Matrix4.setTranslation(viewMatrix, centerEye, modifiedModelViewProjectionScratch);
            Matrix4.multiply(
                projectionMatrix,
                modifiedModelViewProjectionScratch,
                modifiedModelViewProjectionScratch
            );
            return modifiedModelViewProjectionScratch;
        },
        u_dayTextures: function() {
            return this.properties.dayTextures;
        },
        u_dayTextureTranslationAndScale: function() {
            return this.properties.dayTextureTranslationAndScale;
        },
        u_dayTextureTexCoordsRectangle: function() {
            return this.properties.dayTextureTexCoordsRectangle;
        },
        u_dayTextureUseWebMercatorT: function() {
            return this.properties.dayTextureUseWebMercatorT;
        },
        u_dayTextureAlpha: function() {
            return this.properties.dayTextureAlpha;
        },
        u_dayTextureBrightness: function() {
            return this.properties.dayTextureBrightness;
        },
        u_dayTextureContrast: function() {
            return this.properties.dayTextureContrast;
        },
        u_dayTextureHue: function() {
            return this.properties.dayTextureHue;
        },
        u_dayTextureSaturation: function() {
            return this.properties.dayTextureSaturation;
        },
        u_dayTextureOneOverGamma: function() {
            return this.properties.dayTextureOneOverGamma;
        },
        u_dayIntensity: function() {
            return this.properties.dayIntensity;
        },
        u_southAndNorthLatitude: function() {
            return this.properties.southAndNorthLatitude;
        },
        u_southMercatorYAndOneOverHeight: function() {
            return this.properties.southMercatorYAndOneOverHeight;
        },
        u_waterMask: function() {
            return this.properties.waterMask;
        },
        u_waterMaskTranslationAndScale: function() {
            return this.properties.waterMaskTranslationAndScale;
        },
        u_minMaxHeight: function() {
            return this.properties.minMaxHeight;
        },
        u_scaleAndBias: function() {
            return this.properties.scaleAndBias;
        },
        u_dayTextureSplit: function() {
            return this.properties.dayTextureSplit;
        },
        u_dayTextureCutoutRectangles: function() {
            return this.properties.dayTextureCutoutRectangles;
        },
        u_clippingPlanes: function() {
            let clippingPlanes = globeSurfaceTileProvider._clippingPlanes;
            if (defined(clippingPlanes) && defined(clippingPlanes.texture)) {
                // Check in case clippingPlanes hasn't been updated yet.
                return clippingPlanes.texture;
            }
            return frameState.context.defaultTexture;
        },
        u_cartographicLimitRectangle: function() {
            return this.properties.localizedCartographicLimitRectangle;
        },
        u_clippingPlanesMatrix: function() {
            let clippingPlanes = globeSurfaceTileProvider._clippingPlanes;
            return defined(clippingPlanes)
                ? Matrix4.multiply(
                      frameState.context.uniformState.view,
                      clippingPlanes.modelMatrix,
                      scratchClippingPlaneMatrix
                  )
                : Matrix4.IDENTITY;
        },
        u_clippingPlanesEdgeStyle: function() {
            let style = this.properties.clippingPlanesEdgeColor;
            style.alpha = this.properties.clippingPlanesEdgeWidth;
            return style;
        },
        u_minimumBrightness: function() {
            return frameState.fog.minimumBrightness;
        },
        u_hsbShift: function() {
            return this.properties.hsbShift;
        },

        // make a separate object so that changes to the properties are seen on
        // derived commands that combine another uniform map with this one.
        properties: {
            initialColor: new Cartesian4(0.0, 0.0, 0.5, 1.0),
            fillHighlightColor: new Color(0.0, 0.0, 0.0, 0.0),
            zoomedOutOceanSpecularIntensity: 0.5,
            oceanNormalMap: undefined,
            lightingFadeDistance: new Cartesian2(6500000.0, 9000000.0),
            nightFadeDistance: new Cartesian2(10000000.0, 40000000.0),
            hsbShift: new Cartesian3(),

            center3D: undefined,
            rtc: new Cartesian3(),
            modifiedModelView: new Matrix4(),
            tileRectangle: new Cartesian4(),

            dayTextures: [],
            dayTextureTranslationAndScale: [],
            dayTextureTexCoordsRectangle: [],
            dayTextureUseWebMercatorT: [],
            dayTextureAlpha: [],
            dayTextureBrightness: [],
            dayTextureContrast: [],
            dayTextureHue: [],
            dayTextureSaturation: [],
            dayTextureOneOverGamma: [],
            dayTextureSplit: [],
            dayTextureCutoutRectangles: [],
            dayIntensity: 0.0,

            southAndNorthLatitude: new Cartesian2(),
            southMercatorYAndOneOverHeight: new Cartesian2(),

            waterMask: undefined,
            waterMaskTranslationAndScale: new Cartesian4(),

            minMaxHeight: new Cartesian2(),
            scaleAndBias: new Matrix4(),
            clippingPlanesEdgeColor: Color.clone(Color.WHITE),
            clippingPlanesEdgeWidth: 0.0,

            localizedCartographicLimitRectangle: new Cartesian4(),
        },
    };

    return uniformMap;
}

let getDebugOrientedBoundingBox;
let getDebugBoundingSphere;
let debugDestroyPrimitive;

(function() {
    let instanceOBB = new GeometryInstance({
        geometry: BoxOutlineGeometry.fromDimensions({ dimensions: new Cartesian3(2.0, 2.0, 2.0) }),
    });
    let instanceSphere = new GeometryInstance({
        geometry: new SphereOutlineGeometry({ radius: 1.0 }),
    });
    let modelMatrix = new Matrix4();
    let previousVolume;
    let primitive;

    function createDebugPrimitive(instance) {
        return new Primitive({
            geometryInstances: instance,
            appearance: new PerInstanceColorAppearance({
                translucent: false,
                flat: true,
            }),
            asynchronous: false,
        });
    }

    getDebugOrientedBoundingBox = function(obb, color) {
        if (obb === previousVolume) {
            return primitive;
        }
        debugDestroyPrimitive();

        previousVolume = obb;
        modelMatrix = Matrix4.fromRotationTranslation(obb.halfAxes, obb.center, modelMatrix);

        instanceOBB.modelMatrix = modelMatrix;
        instanceOBB.attributes.color = ColorGeometryInstanceAttribute.fromColor(color);

        primitive = createDebugPrimitive(instanceOBB);
        return primitive;
    };

    getDebugBoundingSphere = function(sphere, color) {
        if (sphere === previousVolume) {
            return primitive;
        }
        debugDestroyPrimitive();

        previousVolume = sphere;
        modelMatrix = Matrix4.fromTranslation(sphere.center, modelMatrix);
        modelMatrix = Matrix4.multiplyByUniformScale(modelMatrix, sphere.radius, modelMatrix);

        instanceSphere.modelMatrix = modelMatrix;
        instanceSphere.attributes.color = ColorGeometryInstanceAttribute.fromColor(color);

        primitive = createDebugPrimitive(instanceSphere);
        return primitive;
    };

    debugDestroyPrimitive = function() {
        if (defined(primitive)) {
            primitive.destroy();
            primitive = undefined;
            previousVolume = undefined;
        }
    };
})();
function clipRectangleAntimeridian(tileRectangle, cartographicLimitRectangle) {
    if (cartographicLimitRectangle.west < cartographicLimitRectangle.east) {
        return cartographicLimitRectangle;
    }
    let splitRectangle = Rectangle.clone(
        cartographicLimitRectangle,
        splitCartographicLimitRectangleScratch
    );
    let tileCenter = Rectangle.center(tileRectangle, rectangleCenterScratch);
    if (tileCenter.longitude > 0.0) {
        splitRectangle.east = CesiumMath.PI;
    } else {
        splitRectangle.west = -CesiumMath.PI;
    }
    return splitRectangle;
}
let otherPassesInitialColor = new Cartesian4(0.0, 0.0, 0.0, 0.0);
let surfaceShaderSetOptionsScratch = {
    frameState: undefined,
    surfaceTile: undefined,
    numberOfDayTextures: undefined,
    applyBrightness: undefined,
    applyContrast: undefined,
    applyHue: undefined,
    applySaturation: undefined,
    applyGamma: undefined,
    applyAlpha: undefined,
    applySplit: undefined,
    showReflectiveOcean: undefined,
    showOceanWaves: undefined,
    enableLighting: undefined,
    showGroundAtmosphere: undefined,
    perFragmentGroundAtmosphere: undefined,
    hasVertexNormals: undefined,
    useWebMercatorProjection: undefined,
    enableFog: undefined,
    enableClippingPlanes: undefined,
    clippingPlanes: undefined,
    clippedByBoundaries: undefined,
    hasImageryLayerCutout: undefined,
    colorCorrect: undefined,
};

function createWireframeVertexArrayIfNecessary(context, provider, tile) {
    let surfaceTile = tile.data;

    let mesh;
    let vertexArray;

    if (defined(surfaceTile.vertexArray)) {
        mesh = surfaceTile.mesh;
        vertexArray = surfaceTile.vertexArray;
    } else if (defined(surfaceTile.fill) && defined(surfaceTile.fill.vertexArray)) {
        mesh = surfaceTile.fill.mesh;
        vertexArray = surfaceTile.fill.vertexArray;
    }

    if (!defined(mesh) || !defined(vertexArray)) {
        return;
    }

    if (defined(surfaceTile.wireframeVertexArray)) {
        if (surfaceTile.wireframeVertexArray.mesh === mesh) {
            return;
        }

        surfaceTile.wireframeVertexArray.destroy();
        surfaceTile.wireframeVertexArray = undefined;
    }

    surfaceTile.wireframeVertexArray = createWireframeVertexArray(context, vertexArray, mesh);
    surfaceTile.wireframeVertexArray.mesh = mesh;
}

function createWireframeVertexArray(context, vertexArray, terrainMesh) {
    let indices = terrainMesh.indices;

    let geometry = {
        indices: indices,
        primitiveType: PrimitiveType.TRIANGLES,
    };

    GeometryPipeline.toWireframe(geometry);

    let wireframeIndices = geometry.indices;
    let wireframeIndexBuffer = Buffer.createIndexBuffer({
        context: context,
        typedArray: wireframeIndices,
        usage: BufferUsage.STATIC_DRAW,
        indexDatatype: IndexDatatype.fromSizeInBytes(wireframeIndices.BYTES_PER_ELEMENT),
    });
    return new VertexArray({
        context: context,
        attributes: vertexArray._attributes,
        indexBuffer: wireframeIndexBuffer,
    });
}

// eslint-disable-next-line complexity
function addDrawCommandsForTile(tileProvider, tile, frameState) {
    let surfaceTile = tile.data;

    if (!defined(surfaceTile.vertexArray)) {
        if (surfaceTile.fill === undefined) {
            // No fill was created for this tile, probably because this tile is not connected to
            // any renderable tiles. So create a simple tile in the middle of the tile's possible
            // height range.
            surfaceTile.fill = new TerrainFillMesh(tile);
        }
        surfaceTile.fill.update(tileProvider, frameState);
    }

    let creditDisplay = frameState.creditDisplay;

    let terrainData = surfaceTile.terrainData;
    if (defined(terrainData) && defined(terrainData.credits)) {
        let tileCredits = terrainData.credits;
        for (
            let tileCreditIndex = 0, tileCreditLength = tileCredits.length;
            tileCreditIndex < tileCreditLength;
            ++tileCreditIndex
        ) {
            creditDisplay.addCredit(tileCredits[tileCreditIndex]);
        }
    }

    let maxTextures = ContextLimits.maximumTextureImageUnits;

    let waterMaskTexture = surfaceTile.waterMaskTexture;
    let waterMaskTranslationAndScale = surfaceTile.waterMaskTranslationAndScale;
    if (!defined(waterMaskTexture) && defined(surfaceTile.fill)) {
        waterMaskTexture = surfaceTile.fill.waterMaskTexture;
        waterMaskTranslationAndScale = surfaceTile.fill.waterMaskTranslationAndScale;
    }

    let showReflectiveOcean = tileProvider.hasWaterMask && defined(waterMaskTexture);
    let oceanNormalMap = tileProvider.oceanNormalMap;
    let showOceanWaves = showReflectiveOcean && defined(oceanNormalMap);
    let hasVertexNormals =
        tileProvider.terrainProvider.ready && tileProvider.terrainProvider.hasVertexNormals;
    let enableFog = frameState.fog.enabled;
    let showGroundAtmosphere = tileProvider.showGroundAtmosphere;
    let castShadows = ShadowMode.castShadows(tileProvider.shadows);
    let receiveShadows = ShadowMode.receiveShadows(tileProvider.shadows);

    let hueShift = tileProvider.hueShift;
    let saturationShift = tileProvider.saturationShift;
    let brightnessShift = tileProvider.brightnessShift;

    let colorCorrect = !(
        CesiumMath.equalsEpsilon(hueShift, 0.0, CesiumMath.EPSILON7) &&
        CesiumMath.equalsEpsilon(saturationShift, 0.0, CesiumMath.EPSILON7) &&
        CesiumMath.equalsEpsilon(brightnessShift, 0.0, CesiumMath.EPSILON7)
    );

    let perFragmentGroundAtmosphere = false;
    if (showGroundAtmosphere) {
        let mode = frameState.mode;
        let camera = frameState.camera;
        let cameraDistance;
        if (mode === SceneMode.SCENE2D || mode === SceneMode.COLUMBUS_VIEW) {
            cameraDistance = camera.positionCartographic.height;
        } else {
            cameraDistance = Cartesian3.magnitude(camera.positionWC);
        }
        let fadeOutDistance = tileProvider.nightFadeOutDistance;
        if (mode !== SceneMode.SCENE3D) {
            fadeOutDistance -= frameState.mapProjection.ellipsoid.maximumRadius;
        }
        perFragmentGroundAtmosphere = cameraDistance > fadeOutDistance;
    }

    if (showReflectiveOcean) {
        --maxTextures;
    }
    if (showOceanWaves) {
        --maxTextures;
    }

    let mesh = surfaceTile.renderedMesh;
    let rtc = mesh.center;
    let encoding = mesh.encoding;

    // Not used in 3D.
    let tileRectangle = tileRectangleScratch;

    // Only used for Mercator projections.
    let southLatitude = 0.0;
    let northLatitude = 0.0;
    let southMercatorY = 0.0;
    let oneOverMercatorHeight = 0.0;

    let useWebMercatorProjection = false;

    if (frameState.mode !== SceneMode.SCENE3D) {
        let projection = frameState.mapProjection;
        let southwest = projection.project(Rectangle.southwest(tile.rectangle), southwestScratch);
        let northeast = projection.project(Rectangle.northeast(tile.rectangle), northeastScratch);

        tileRectangle.x = southwest.x;
        tileRectangle.y = southwest.y;
        tileRectangle.z = northeast.x;
        tileRectangle.w = northeast.y;

        // In 2D and Columbus View, use the center of the tile for RTC rendering.
        if (frameState.mode !== SceneMode.MORPHING) {
            rtc = rtcScratch;
            rtc.x = 0.0;
            rtc.y = (tileRectangle.z + tileRectangle.x) * 0.5;
            rtc.z = (tileRectangle.w + tileRectangle.y) * 0.5;
            tileRectangle.x -= rtc.y;
            tileRectangle.y -= rtc.z;
            tileRectangle.z -= rtc.y;
            tileRectangle.w -= rtc.z;
        }

        if (
            frameState.mode === SceneMode.SCENE2D &&
            encoding.quantization === TerrainQuantization.BITS12
        ) {
            // In 2D, the texture coordinates of the tile are interpolated over the rectangle to get the position in the vertex shader.
            // When the texture coordinates are quantized, error is introduced. This can be seen through the 1px wide cracking
            // between the quantized tiles in 2D. To compensate for the error, move the expand the rectangle in each direction by
            // half the error amount.
            let epsilon = (1.0 / (Math.pow(2.0, 12.0) - 1.0)) * 0.5;
            let widthEpsilon = (tileRectangle.z - tileRectangle.x) * epsilon;
            let heightEpsilon = (tileRectangle.w - tileRectangle.y) * epsilon;
            tileRectangle.x -= widthEpsilon;
            tileRectangle.y -= heightEpsilon;
            tileRectangle.z += widthEpsilon;
            tileRectangle.w += heightEpsilon;
        }

        if (projection instanceof WebMercatorProjection) {
            southLatitude = tile.rectangle.south;
            northLatitude = tile.rectangle.north;

            southMercatorY = WebMercatorProjection.geodeticLatitudeToMercatorAngle(southLatitude);

            oneOverMercatorHeight =
                1.0 /
                (WebMercatorProjection.geodeticLatitudeToMercatorAngle(northLatitude) -
                    southMercatorY);

            useWebMercatorProjection = true;
        }
    }

    let surfaceShaderSetOptions = surfaceShaderSetOptionsScratch;
    surfaceShaderSetOptions.frameState = frameState;
    surfaceShaderSetOptions.surfaceTile = surfaceTile;
    surfaceShaderSetOptions.showReflectiveOcean = showReflectiveOcean;
    surfaceShaderSetOptions.showOceanWaves = showOceanWaves;
    surfaceShaderSetOptions.enableLighting = tileProvider.enableLighting;
    surfaceShaderSetOptions.showGroundAtmosphere = showGroundAtmosphere;
    surfaceShaderSetOptions.perFragmentGroundAtmosphere = perFragmentGroundAtmosphere;
    surfaceShaderSetOptions.hasVertexNormals = hasVertexNormals;
    surfaceShaderSetOptions.useWebMercatorProjection = useWebMercatorProjection;
    surfaceShaderSetOptions.clippedByBoundaries = surfaceTile.clippedByBoundaries;

    let tileImageryCollection = surfaceTile.imagery;
    let imageryIndex = 0;
    let imageryLen = tileImageryCollection.length;

    let firstPassRenderState = tileProvider._renderState;
    let otherPassesRenderState = tileProvider._blendRenderState;
    let renderState = firstPassRenderState;

    let initialColor = tileProvider._firstPassInitialColor;

    let context = frameState.context;

    if (!defined(tileProvider._debug.boundingSphereTile)) {
        debugDestroyPrimitive();
    }

    do {
        let numberOfDayTextures = 0;

        let command;
        let uniformMap;

        if (tileProvider._drawCommands.length <= tileProvider._usedDrawCommands) {
            command = new DrawCommand();
            command.owner = tile;
            command.cull = false;
            command.boundingVolume = new BoundingSphere();
            command.orientedBoundingBox = undefined;

            uniformMap = createTileUniformMap(frameState, tileProvider);

            tileProvider._drawCommands.push(command);
            tileProvider._uniformMaps.push(uniformMap);
        } else {
            command = tileProvider._drawCommands[tileProvider._usedDrawCommands];
            uniformMap = tileProvider._uniformMaps[tileProvider._usedDrawCommands];
        }

        command.owner = tile;

        ++tileProvider._usedDrawCommands;

        if (tile === tileProvider._debug.boundingSphereTile) {
            let obb = surfaceTile.orientedBoundingBox;
            // If a debug primitive already exists for this tile, it will not be
            // re-created, to avoid allocation every frame. If it were possible
            // to have more than one selected tile, this would have to change.
            if (defined(obb)) {
                getDebugOrientedBoundingBox(obb, Color.RED).update(frameState);
            } else if (defined(mesh) && defined(mesh.boundingSphere3D)) {
                getDebugBoundingSphere(mesh.boundingSphere3D, Color.RED).update(frameState);
            }
        }

        let uniformMapProperties = uniformMap.properties;
        Cartesian4.clone(initialColor, uniformMapProperties.initialColor);
        uniformMapProperties.oceanNormalMap = oceanNormalMap;
        uniformMapProperties.lightingFadeDistance.x = tileProvider.lightingFadeOutDistance;
        uniformMapProperties.lightingFadeDistance.y = tileProvider.lightingFadeInDistance;
        uniformMapProperties.nightFadeDistance.x = tileProvider.nightFadeOutDistance;
        uniformMapProperties.nightFadeDistance.y = tileProvider.nightFadeInDistance;
        uniformMapProperties.zoomedOutOceanSpecularIntensity =
            tileProvider.zoomedOutOceanSpecularIntensity;

        let highlightFillTile =
            !defined(surfaceTile.vertexArray) &&
            defined(tileProvider.fillHighlightColor) &&
            tileProvider.fillHighlightColor.alpha > 0.0;
        if (highlightFillTile) {
            Color.clone(tileProvider.fillHighlightColor, uniformMapProperties.fillHighlightColor);
        }

        uniformMapProperties.center3D = mesh.center;
        Cartesian3.clone(rtc, uniformMapProperties.rtc);

        Cartesian4.clone(tileRectangle, uniformMapProperties.tileRectangle);
        uniformMapProperties.southAndNorthLatitude.x = southLatitude;
        uniformMapProperties.southAndNorthLatitude.y = northLatitude;
        uniformMapProperties.southMercatorYAndOneOverHeight.x = southMercatorY;
        uniformMapProperties.southMercatorYAndOneOverHeight.y = oneOverMercatorHeight;

        // Convert tile limiter rectangle from cartographic to texture space using the tileRectangle.
        let localizedCartographicLimitRectangle = localizedCartographicLimitRectangleScratch;
        let cartographicLimitRectangle = clipRectangleAntimeridian(
            tile.rectangle,
            tileProvider.cartographicLimitRectangle
        );

        Cartesian3.fromElements(
            hueShift,
            saturationShift,
            brightnessShift,
            uniformMapProperties.hsbShift
        );

        let cartographicTileRectangle = tile.rectangle;
        let inverseTileWidth = 1.0 / cartographicTileRectangle.width;
        let inverseTileHeight = 1.0 / cartographicTileRectangle.height;
        localizedCartographicLimitRectangle.x =
            (cartographicLimitRectangle.west - cartographicTileRectangle.west) * inverseTileWidth;
        localizedCartographicLimitRectangle.y =
            (cartographicLimitRectangle.south - cartographicTileRectangle.south) *
            inverseTileHeight;
        localizedCartographicLimitRectangle.z =
            (cartographicLimitRectangle.east - cartographicTileRectangle.west) * inverseTileWidth;
        localizedCartographicLimitRectangle.w =
            (cartographicLimitRectangle.north - cartographicTileRectangle.south) *
            inverseTileHeight;

        Cartesian4.clone(
            localizedCartographicLimitRectangle,
            uniformMapProperties.localizedCartographicLimitRectangle
        );

        // For performance, use fog in the shader only when the tile is in fog.
        let applyFog =
            enableFog &&
            CesiumMath.fog(tile._distance, frameState.fog.density) > CesiumMath.EPSILON3;
        colorCorrect = colorCorrect && (applyFog || showGroundAtmosphere);

        let applyBrightness = false;
        let applyContrast = false;
        let applyHue = false;
        let applySaturation = false;
        let applyGamma = false;
        let applyAlpha = false;
        let applySplit = false;
        let applyCutout = false;

        while (numberOfDayTextures < maxTextures && imageryIndex < imageryLen) {
            let tileImagery = tileImageryCollection[imageryIndex];
            let imagery = tileImagery.readyImagery;
            ++imageryIndex;

            if (!defined(imagery) || imagery.imageryLayer.alpha === 0.0) {
                continue;
            }

            let texture = tileImagery.useWebMercatorT
                ? imagery.textureWebMercator
                : imagery.texture;

            // >>includeStart('debug', pragmas.debug);
            if (!defined(texture)) {
                // Our "ready" texture isn't actually ready.  This should never happen.
                //
                // Side note: It IS possible for it to not be in the READY ImageryState, though.
                // This can happen when a single imagery tile is shared by two terrain tiles (common)
                // and one of them (A) needs a geographic version of the tile because it is near the poles,
                // and the other (B) does not.  B can and will transition the imagery tile to the READY state
                // without reprojecting to geographic.  Then, later, A will deem that same tile not-ready-yet
                // because it only has the Web Mercator texture, and flip it back to the TRANSITIONING state.
                // The imagery tile won't be in the READY state anymore, but it's still READY enough for B's
                // purposes.
                throw new DeveloperError('readyImagery is not actually ready!');
            }
            // >>includeEnd('debug');

            let imageryLayer = imagery.imageryLayer;

            if (!defined(tileImagery.textureTranslationAndScale)) {
                tileImagery.textureTranslationAndScale = imageryLayer._calculateTextureTranslationAndScale(
                    tile,
                    tileImagery
                );
            }

            uniformMapProperties.dayTextures[numberOfDayTextures] = texture;
            uniformMapProperties.dayTextureTranslationAndScale[numberOfDayTextures] =
                tileImagery.textureTranslationAndScale;
            uniformMapProperties.dayTextureTexCoordsRectangle[numberOfDayTextures] =
                tileImagery.textureCoordinateRectangle;
            uniformMapProperties.dayTextureUseWebMercatorT[numberOfDayTextures] =
                tileImagery.useWebMercatorT;

            uniformMapProperties.dayTextureAlpha[numberOfDayTextures] = imageryLayer.alpha;
            applyAlpha =
                applyAlpha || uniformMapProperties.dayTextureAlpha[numberOfDayTextures] !== 1.0;

            uniformMapProperties.dayTextureBrightness[numberOfDayTextures] =
                imageryLayer.brightness;
            applyBrightness =
                applyBrightness ||
                uniformMapProperties.dayTextureBrightness[numberOfDayTextures] !==
                    ImageryLayer.DEFAULT_BRIGHTNESS;

            uniformMapProperties.dayTextureContrast[numberOfDayTextures] = imageryLayer.contrast;
            applyContrast =
                applyContrast ||
                uniformMapProperties.dayTextureContrast[numberOfDayTextures] !==
                    ImageryLayer.DEFAULT_CONTRAST;

            uniformMapProperties.dayTextureHue[numberOfDayTextures] = imageryLayer.hue;
            applyHue =
                applyHue ||
                uniformMapProperties.dayTextureHue[numberOfDayTextures] !==
                    ImageryLayer.DEFAULT_HUE;

            uniformMapProperties.dayTextureSaturation[numberOfDayTextures] =
                imageryLayer.saturation;
            applySaturation =
                applySaturation ||
                uniformMapProperties.dayTextureSaturation[numberOfDayTextures] !==
                    ImageryLayer.DEFAULT_SATURATION;

            uniformMapProperties.dayTextureOneOverGamma[numberOfDayTextures] =
                1.0 / imageryLayer.gamma;
            applyGamma =
                applyGamma ||
                uniformMapProperties.dayTextureOneOverGamma[numberOfDayTextures] !==
                    1.0 / ImageryLayer.DEFAULT_GAMMA;

            uniformMapProperties.dayTextureSplit[numberOfDayTextures] =
                typeof imageryLayer.splitDirection === 'function'
                    ? imageryLayer.splitDirection()
                    : imageryLayer.splitDirection;
            applySplit =
                applySplit || uniformMapProperties.dayTextureSplit[numberOfDayTextures] !== 0.0;

            // Update cutout rectangle
            let dayTextureCutoutRectangle =
                uniformMapProperties.dayTextureCutoutRectangles[numberOfDayTextures];
            if (!defined(dayTextureCutoutRectangle)) {
                dayTextureCutoutRectangle = uniformMapProperties.dayTextureCutoutRectangles[
                    numberOfDayTextures
                ] = new Cartesian4();
            }

            Cartesian4.clone(Cartesian4.ZERO, dayTextureCutoutRectangle);
            if (defined(imageryLayer.cutoutRectangle)) {
                let cutoutRectangle = clipRectangleAntimeridian(
                    cartographicTileRectangle,
                    imageryLayer.cutoutRectangle
                );
                let intersection = Rectangle.simpleIntersection(
                    cutoutRectangle,
                    cartographicTileRectangle,
                    rectangleIntersectionScratch
                );
                applyCutout = defined(intersection) || applyCutout;

                dayTextureCutoutRectangle.x =
                    (cutoutRectangle.west - cartographicTileRectangle.west) * inverseTileWidth;
                dayTextureCutoutRectangle.y =
                    (cutoutRectangle.south - cartographicTileRectangle.south) * inverseTileHeight;
                dayTextureCutoutRectangle.z =
                    (cutoutRectangle.east - cartographicTileRectangle.west) * inverseTileWidth;
                dayTextureCutoutRectangle.w =
                    (cutoutRectangle.north - cartographicTileRectangle.south) * inverseTileHeight;
            }

            if (defined(imagery.credits)) {
                let credits = imagery.credits;
                for (
                    let creditIndex = 0, creditLength = credits.length;
                    creditIndex < creditLength;
                    ++creditIndex
                ) {
                    creditDisplay.addCredit(credits[creditIndex]);
                }
            }

            ++numberOfDayTextures;
        }

        // trim texture array to the used length so we don't end up using old textures
        // which might get destroyed eventually
        uniformMapProperties.dayTextures.length = numberOfDayTextures;
        uniformMapProperties.waterMask = waterMaskTexture;
        Cartesian4.clone(
            waterMaskTranslationAndScale,
            uniformMapProperties.waterMaskTranslationAndScale
        );

        uniformMapProperties.minMaxHeight.x = encoding.minimumHeight;
        uniformMapProperties.minMaxHeight.y = encoding.maximumHeight;
        Matrix4.clone(encoding.matrix, uniformMapProperties.scaleAndBias);

        // update clipping planes
        let clippingPlanes = tileProvider._clippingPlanes;
        let clippingPlanesEnabled =
            defined(clippingPlanes) && clippingPlanes.enabled && tile.isClipped;
        if (clippingPlanesEnabled) {
            uniformMapProperties.clippingPlanesEdgeColor = Color.clone(
                clippingPlanes.edgeColor,
                uniformMapProperties.clippingPlanesEdgeColor
            );
            uniformMapProperties.clippingPlanesEdgeWidth = clippingPlanes.edgeWidth;
        }

        if (defined(tileProvider.uniformMap)) {
            uniformMap = combine(uniformMap, tileProvider.uniformMap);
        }

        surfaceShaderSetOptions.numberOfDayTextures = numberOfDayTextures;
        surfaceShaderSetOptions.applyBrightness = applyBrightness;
        surfaceShaderSetOptions.applyContrast = applyContrast;
        surfaceShaderSetOptions.applyHue = applyHue;
        surfaceShaderSetOptions.applySaturation = applySaturation;
        surfaceShaderSetOptions.applyGamma = applyGamma;
        surfaceShaderSetOptions.applyAlpha = applyAlpha;
        surfaceShaderSetOptions.applySplit = applySplit;
        surfaceShaderSetOptions.enableFog = applyFog;
        surfaceShaderSetOptions.enableClippingPlanes = clippingPlanesEnabled;
        surfaceShaderSetOptions.clippingPlanes = clippingPlanes;
        surfaceShaderSetOptions.hasImageryLayerCutout = applyCutout;
        surfaceShaderSetOptions.colorCorrect = colorCorrect;
        surfaceShaderSetOptions.highlightFillTile = highlightFillTile;

        command.shaderProgram = tileProvider._surfaceShaderSet.getShaderProgram(
            surfaceShaderSetOptions
        );
        command.castShadows = castShadows;
        command.receiveShadows = receiveShadows;
        command.renderState = renderState;
        command.primitiveType = PrimitiveType.TRIANGLES;
        command.vertexArray = surfaceTile.vertexArray || surfaceTile.fill.vertexArray;
        command.uniformMap = uniformMap;
        command.pass = Pass.GLOBE;

        if (tileProvider._debug.wireframe) {
            createWireframeVertexArrayIfNecessary(context, tileProvider, tile);
            if (defined(surfaceTile.wireframeVertexArray)) {
                command.vertexArray = surfaceTile.wireframeVertexArray;
                command.primitiveType = PrimitiveType.LINES;
            }
        }

        let boundingVolume = command.boundingVolume;
        let orientedBoundingBox = command.orientedBoundingBox;

        if (frameState.mode !== SceneMode.SCENE3D) {
            let tileBoundingRegion = surfaceTile.tileBoundingRegion;
            BoundingSphere.fromRectangleWithHeights2D(
                tile.rectangle,
                frameState.mapProjection,
                tileBoundingRegion.minimumHeight,
                tileBoundingRegion.maximumHeight,
                boundingVolume
            );
            Cartesian3.fromElements(
                boundingVolume.center.z,
                boundingVolume.center.x,
                boundingVolume.center.y,
                boundingVolume.center
            );

            if (frameState.mode === SceneMode.MORPHING) {
                boundingVolume = BoundingSphere.union(
                    mesh.boundingSphere3D,
                    boundingVolume,
                    boundingVolume
                );
            }
        } else {
            command.boundingVolume = BoundingSphere.clone(mesh.boundingSphere3D, boundingVolume);
            command.orientedBoundingBox = OrientedBoundingBox.clone(
                surfaceTile.orientedBoundingBox,
                orientedBoundingBox
            );
        }

        command.dirty = true;
        frameState.commandList.push(command);

        renderState = otherPassesRenderState;
        initialColor = otherPassesInitialColor;
    } while (imageryIndex < imageryLen);
}
