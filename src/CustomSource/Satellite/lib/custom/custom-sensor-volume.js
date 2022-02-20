/* global Cesium */
import CustomSensorVolumeFS from './custom-sensor-volume-fs.js';
import CustomSensorVolumeVS from './custom-sensor-volume-vs.js';
import SensorVolume from '../sensor-volume.js';

const BoundingSphere = Cesium.BoundingSphere;
const Cartesian3 = Cesium.Cartesian3;
const Color = Cesium.Color;
const combine = Cesium.combine;
const ComponentDatatype = Cesium.ComponentDatatype;
const defaultValue = Cesium.defaultValue;
const defined = Cesium.defined;
const defineProperties = Object.defineProperties;
const destroyObject = Cesium.destroyObject;
const DeveloperError = Cesium.DeveloperError;
const Matrix4 = Cesium.Matrix4;
const PrimitiveType = Cesium.PrimitiveType;
const Buffer = Cesium.Buffer;
const BufferUsage = Cesium.BufferUsage;
const DrawCommand = Cesium.DrawCommand;
const Pass = Cesium.Pass;
const RenderState = Cesium.RenderState;
const ShaderProgram = Cesium.ShaderProgram;
const ShaderSource = Cesium.ShaderSource;
const VertexArray = Cesium.VertexArray;
const BlendingState = Cesium.BlendingState;
const CullFace = Cesium.CullFace;
const Material = Cesium.Material;
const SceneMode = Cesium.SceneMode;

const attributeLocations = {
    position: 0,
    normal: 1,
};

const FAR = 5906376272000.0; // distance from the Sun to Pluto in meters.

/**
 * DOC_TBA
 *
 * @alias CustomSensorVolume
 * @constructor
 */
const CustomSensorVolume = function(options) {
    options = defaultValue(options, defaultValue.EMPTY_OBJECT);

    this._pickId = undefined;
    this._pickPrimitive = defaultValue(options._pickPrimitive, this);

    this._frontFaceColorCommand = new DrawCommand();
    this._backFaceColorCommand = new DrawCommand();
    this._pickCommand = new DrawCommand();

    this._boundingSphere = new BoundingSphere();
    this._boundingSphereWC = new BoundingSphere();

    this._frontFaceColorCommand.primitiveType = PrimitiveType.TRIANGLES;
    this._frontFaceColorCommand.boundingVolume = this._boundingSphereWC;
    this._frontFaceColorCommand.owner = this;

    this._backFaceColorCommand.primitiveType = this._frontFaceColorCommand.primitiveType;
    this._backFaceColorCommand.boundingVolume = this._frontFaceColorCommand.boundingVolume;
    this._backFaceColorCommand.owner = this;

    this._pickCommand.primitiveType = this._frontFaceColorCommand.primitiveType;
    this._pickCommand.boundingVolume = this._frontFaceColorCommand.boundingVolume;
    this._pickCommand.owner = this;

    /**
     * <code>true</code> if this sensor will be shown; otherwise, <code>false</code>
     *
     * @type {Boolean}
     * @default true
     */
    this.show = defaultValue(options.show, true);

    /**
     * When <code>true</code>, a polyline is shown where the sensor outline intersections the globe.
     *
     * @type {Boolean}
     *
     * @default true
     *
     * @see CustomSensorVolume#intersectionColor
     */
    this.showIntersection = defaultValue(options.showIntersection, true);

    /**
     * <p>
     * Determines if a sensor intersecting the ellipsoid is drawn through the ellipsoid and potentially out
     * to the other side, or if the part of the sensor intersecting the ellipsoid stops at the ellipsoid.
     * </p>
     *
     * @type {Boolean}
     * @default false
     */
    this.showThroughEllipsoid = defaultValue(options.showThroughEllipsoid, false);
    this._showThroughEllipsoid = this.showThroughEllipsoid;

    /**
     * The 4x4 transformation matrix that transforms this sensor from model to world coordinates.  In it's model
     * coordinates, the sensor's principal direction is along the positive z-axis.  The clock angle, sometimes
     * called azimuth, is the angle in the sensor's X-Y plane measured from the positive X-axis toward the positive
     * Y-axis.  The cone angle, sometimes called elevation, is the angle out of the X-Y plane along the positive Z-axis.
     * <br /><br />
     * <div align='center'>
     * <img src='images/CustomSensorVolume.setModelMatrix.png' /><br />
     * Model coordinate system for a custom sensor
     * </div>
     *
     * @type {Matrix4}
     * @default {@link Matrix4.IDENTITY}
     *
     * @example
     * // The sensor's vertex is located on the surface at -75.59777 degrees longitude and 40.03883 degrees latitude.
     * // The sensor's opens upward, along the surface normal.
     * let center = Cesium.Cartesian3.fromDegrees(-75.59777, 40.03883);
     * sensor.modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(center);
     */
    this.modelMatrix = Matrix4.clone(defaultValue(options.modelMatrix, Matrix4.IDENTITY));
    this._modelMatrix = new Matrix4();

    /**
     * DOC_TBA
     *
     * @type {Number}
     * @default {@link Number.POSITIVE_INFINITY}
     */
    this.radius = defaultValue(options.radius, Number.POSITIVE_INFINITY);

    this._directions = undefined;
    this._directionsDirty = false;
    this.directions = defined(options.directions) ? options.directions : [];

    /**
     * The surface appearance of the sensor.  This can be one of several built-in {@link Material} objects or a custom material, scripted with
     * {@link https://github.com/AnalyticalGraphicsInc/cesium/wiki/Fabric|Fabric}.
     * <p>
     * The default material is <code>Material.ColorType</code>.
     * </p>
     *
     * @type {Material}
     * @default Material.fromType(Material.ColorType)
     *
     * @see {@link https://github.com/AnalyticalGraphicsInc/cesium/wiki/Fabric|Fabric}
     *
     * @example
     * // 1. Change the color of the default material to yellow
     * sensor.lateralSurfaceMaterial.uniforms.color = new Cesium.Color(1.0, 1.0, 0.0, 1.0);
     *
     * // 2. Change material to horizontal stripes
     * sensor.lateralSurfaceMaterial = Cesium.Material.fromType(Material.StripeType);
     */
    this.lateralSurfaceMaterial = defined(options.lateralSurfaceMaterial)
        ? options.lateralSurfaceMaterial
        : Material.fromType(Material.ColorType);
    this._lateralSurfaceMaterial = undefined;
    this._translucent = undefined;

    /**
     * The color of the polyline where the sensor outline intersects the globe.  The default is {@link Color.WHITE}.
     *
     * @type {Color}
     * @default {@link Color.WHITE}
     *
     * @see CustomSensorVolume#showIntersection
     */
    this.intersectionColor = Color.clone(defaultValue(options.intersectionColor, Color.WHITE));

    /**
     * The approximate pixel width of the polyline where the sensor outline intersects the globe.  The default is 5.0.
     *
     * @type {Number}
     * @default 5.0
     *
     * @see CustomSensorVolume#showIntersection
     */
    this.intersectionWidth = defaultValue(options.intersectionWidth, 5.0);

    /**
     * User-defined object returned when the sensors is picked.
     *
     * @type Object
     *
     * @default undefined
     *
     * @see Scene#pick
     */
    this.id = options.id;
    this._id = undefined;

    let that = this;

    /* eslint-disable camelcase */
    this._uniforms = {
        u_showThroughEllipsoid: function() {
            return that.showThroughEllipsoid;
        },
        u_showIntersection: function() {
            return that.showIntersection;
        },
        u_sensorRadius: function() {
            return isFinite(that.radius) ? that.radius : FAR;
        },
        u_intersectionColor: function() {
            return that.intersectionColor;
        },
        u_intersectionWidth: function() {
            return that.intersectionWidth;
        },
        u_normalDirection: function() {
            return 1.0;
        },
    };
    /* eslint-enable camelcase */

    this._mode = SceneMode.SCENE3D;
};

defineProperties(CustomSensorVolume.prototype, {
    directions: {
        get: function() {
            return this._directions;
        },
        set: function(value) {
            this._directions = value;
            this._directionsDirty = true;
        },
    },
});

let n0Scratch = new Cartesian3();
let n1Scratch = new Cartesian3();
let n2Scratch = new Cartesian3();

function computePositions(customSensorVolume) {
    let directions = customSensorVolume._directions;
    let length = directions.length;
    let positions = new Float32Array(3 * length);
    let r = isFinite(customSensorVolume.radius) ? customSensorVolume.radius : FAR;

    let boundingVolumePositions = [Cartesian3.ZERO];

    for (let i = length - 2, j = length - 1, k = 0; k < length; i = j++, j = k++) {
        // PERFORMANCE_IDEA:  We can avoid redundant operations for adjacent edges.
        let n0 = Cartesian3.fromSpherical(directions[i], n0Scratch);
        let n1 = Cartesian3.fromSpherical(directions[j], n1Scratch);
        let n2 = Cartesian3.fromSpherical(directions[k], n2Scratch);

        // Extend position so the volume encompasses the sensor's radius.
        let theta = Math.max(Cartesian3.angleBetween(n0, n1), Cartesian3.angleBetween(n1, n2));
        let distance = r / Math.cos(theta * 0.5);
        let p = Cartesian3.multiplyByScalar(n1, distance, new Cartesian3());

        positions[j * 3] = p.x;
        positions[j * 3 + 1] = p.y;
        positions[j * 3 + 2] = p.z;

        boundingVolumePositions.push(p);
    }

    BoundingSphere.fromPoints(boundingVolumePositions, customSensorVolume._boundingSphere);

    return positions;
}

let nScratch = new Cartesian3();

function createVertexArray(customSensorVolume, context) {
    let positions = computePositions(customSensorVolume);

    let length = customSensorVolume._directions.length;
    let vertices = new Float32Array(2 * 3 * 3 * length);

    let k = 0;
    for (let i = length - 1, j = 0; j < length; i = j++) {
        let p0 = new Cartesian3(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
        let p1 = new Cartesian3(positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]);
        let n = Cartesian3.normalize(Cartesian3.cross(p1, p0, nScratch), nScratch); // Per-face normals

        vertices[k++] = 0.0; // Sensor vertex
        vertices[k++] = 0.0;
        vertices[k++] = 0.0;
        vertices[k++] = n.x;
        vertices[k++] = n.y;
        vertices[k++] = n.z;

        vertices[k++] = p1.x;
        vertices[k++] = p1.y;
        vertices[k++] = p1.z;
        vertices[k++] = n.x;
        vertices[k++] = n.y;
        vertices[k++] = n.z;

        vertices[k++] = p0.x;
        vertices[k++] = p0.y;
        vertices[k++] = p0.z;
        vertices[k++] = n.x;
        vertices[k++] = n.y;
        vertices[k++] = n.z;
    }

    let vertexBuffer = Buffer.createVertexBuffer({
        context: context,
        typedArray: new Float32Array(vertices),
        usage: BufferUsage.STATIC_DRAW,
    });

    let stride = 2 * 3 * Float32Array.BYTES_PER_ELEMENT;

    let attributes = [
        {
            index: attributeLocations.position,
            vertexBuffer: vertexBuffer,
            componentsPerAttribute: 3,
            componentDatatype: ComponentDatatype.FLOAT,
            offsetInBytes: 0,
            strideInBytes: stride,
        },
        {
            index: attributeLocations.normal,
            vertexBuffer: vertexBuffer,
            componentsPerAttribute: 3,
            componentDatatype: ComponentDatatype.FLOAT,
            offsetInBytes: 3 * Float32Array.BYTES_PER_ELEMENT,
            strideInBytes: stride,
        },
    ];

    return new VertexArray({
        context: context,
        attributes: attributes,
    });
}

/**
 * Called when {@link Viewer} or {@link CesiumWidget} render the scene to
 * get the draw commands needed to render this primitive.
 * <p>
 * Do not call this function directly.  This is documented just to
 * list the exceptions that may be propagated when the scene is rendered:
 * </p>
 *
 * @exception {DeveloperError} this.radius must be greater than or equal to zero.
 * @exception {DeveloperError} this.lateralSurfaceMaterial must be defined.
 */
// eslint-disable-next-line complexity
CustomSensorVolume.prototype.update = function(frameState) {
    this._mode = frameState.mode;
    if (!this.show || this._mode !== SceneMode.SCENE3D) {
        return;
    }

    let context = frameState.context;
    let commandList = frameState.commandList;

    // >>includeStart('debug', pragmas.debug);
    if (this.radius < 0.0) {
        throw new DeveloperError('this.radius must be greater than or equal to zero.');
    }
    if (!defined(this.lateralSurfaceMaterial)) {
        throw new DeveloperError('this.lateralSurfaceMaterial must be defined.');
    }
    // >>includeEnd('debug');

    let translucent = this.lateralSurfaceMaterial.isTranslucent();

    // Initial render state creation
    if (
        this._showThroughEllipsoid !== this.showThroughEllipsoid ||
        !defined(this._frontFaceColorCommand.renderState) ||
        this._translucent !== translucent
    ) {
        this._showThroughEllipsoid = this.showThroughEllipsoid;
        this._translucent = translucent;

        let rs;

        if (translucent) {
            rs = RenderState.fromCache({
                depthTest: {
                    // This would be better served by depth testing with a depth buffer that does not
                    // include the ellipsoid depth - or a g-buffer containing an ellipsoid mask
                    // so we can selectively depth test.
                    enabled: !this.showThroughEllipsoid,
                },
                depthMask: false,
                blending: BlendingState.ALPHA_BLEND,
                cull: {
                    enabled: true,
                    face: CullFace.BACK,
                },
            });

            this._frontFaceColorCommand.renderState = rs;
            this._frontFaceColorCommand.pass = Pass.TRANSLUCENT;

            rs = RenderState.fromCache({
                depthTest: {
                    enabled: !this.showThroughEllipsoid,
                },
                depthMask: false,
                blending: BlendingState.ALPHA_BLEND,
                cull: {
                    enabled: true,
                    face: CullFace.FRONT,
                },
            });

            this._backFaceColorCommand.renderState = rs;
            this._backFaceColorCommand.pass = Pass.TRANSLUCENT;

            rs = RenderState.fromCache({
                depthTest: {
                    enabled: !this.showThroughEllipsoid,
                },
                depthMask: false,
                blending: BlendingState.ALPHA_BLEND,
            });
            this._pickCommand.renderState = rs;
        } else {
            rs = RenderState.fromCache({
                depthTest: {
                    enabled: true,
                },
                depthMask: true,
            });
            this._frontFaceColorCommand.renderState = rs;
            this._frontFaceColorCommand.pass = Pass.OPAQUE;

            rs = RenderState.fromCache({
                depthTest: {
                    enabled: true,
                },
                depthMask: true,
            });
            this._pickCommand.renderState = rs;
        }
    }

    // Recreate vertex buffer when directions change
    let directionsChanged = this._directionsDirty;
    if (directionsChanged) {
        this._directionsDirty = false;
        this._va = this._va && this._va.destroy();

        let directions = this._directions;
        if (directions && directions.length >= 3) {
            this._frontFaceColorCommand.vertexArray = createVertexArray(this, context);
            this._backFaceColorCommand.vertexArray = this._frontFaceColorCommand.vertexArray;
            this._pickCommand.vertexArray = this._frontFaceColorCommand.vertexArray;
        }
    }

    if (!defined(this._frontFaceColorCommand.vertexArray)) {
        return;
    }

    let pass = frameState.passes;

    let modelMatrixChanged = !Matrix4.equals(this.modelMatrix, this._modelMatrix);
    if (modelMatrixChanged) {
        Matrix4.clone(this.modelMatrix, this._modelMatrix);
    }

    if (directionsChanged || modelMatrixChanged) {
        BoundingSphere.transform(this._boundingSphere, this.modelMatrix, this._boundingSphereWC);
    }

    this._frontFaceColorCommand.modelMatrix = this.modelMatrix;
    this._backFaceColorCommand.modelMatrix = this._frontFaceColorCommand.modelMatrix;
    this._pickCommand.modelMatrix = this._frontFaceColorCommand.modelMatrix;

    let materialChanged = this._lateralSurfaceMaterial !== this.lateralSurfaceMaterial;
    this._lateralSurfaceMaterial = this.lateralSurfaceMaterial;
    this._lateralSurfaceMaterial.update(context);

    if (pass.render) {
        let frontFaceColorCommand = this._frontFaceColorCommand;
        let backFaceColorCommand = this._backFaceColorCommand;

        // Recompile shader when material changes
        if (materialChanged || !defined(frontFaceColorCommand.shaderProgram)) {
            let fsSource = new ShaderSource({
                sources: [
                    SensorVolume,
                    this._lateralSurfaceMaterial.shaderSource,
                    CustomSensorVolumeFS,
                ],
            });

            frontFaceColorCommand.shaderProgram = ShaderProgram.replaceCache({
                context: context,
                shaderProgram: frontFaceColorCommand.shaderProgram,
                vertexShaderSource: CustomSensorVolumeVS,
                fragmentShaderSource: fsSource,
                attributeLocations: attributeLocations,
            });

            frontFaceColorCommand.uniformMap = combine(
                this._uniforms,
                this._lateralSurfaceMaterial._uniforms
            );

            backFaceColorCommand.shaderProgram = frontFaceColorCommand.shaderProgram;
            backFaceColorCommand.uniformMap = combine(
                this._uniforms,
                this._lateralSurfaceMaterial._uniforms
            );
            // eslint-disable-next-line camelcase
            backFaceColorCommand.uniformMap.u_normalDirection = function() {
                return -1.0;
            };
        }

        if (translucent) {
            commandList.push(this._backFaceColorCommand, this._frontFaceColorCommand);
        } else {
            commandList.push(this._frontFaceColorCommand);
        }
    }

    if (pass.pick) {
        let pickCommand = this._pickCommand;

        if (!defined(this._pickId) || this._id !== this.id) {
            this._id = this.id;
            this._pickId = this._pickId && this._pickId.destroy();
            this._pickId = context.createPickId({
                primitive: this._pickPrimitive,
                id: this.id,
            });
        }

        // Recompile shader when material changes
        if (materialChanged || !defined(pickCommand.shaderProgram)) {
            let pickFS = new ShaderSource({
                sources: [
                    SensorVolume,
                    this._lateralSurfaceMaterial.shaderSource,
                    CustomSensorVolumeFS,
                ],
                pickColorQualifier: 'uniform',
            });

            pickCommand.shaderProgram = ShaderProgram.replaceCache({
                context: context,
                shaderProgram: pickCommand.shaderProgram,
                vertexShaderSource: CustomSensorVolumeVS,
                fragmentShaderSource: pickFS,
                attributeLocations: attributeLocations,
            });

            let that = this;
            let uniforms = {
                // eslint-disable-next-line camelcase
                czm_pickColor: function() {
                    return that._pickId.color;
                },
            };
            pickCommand.uniformMap = combine(
                combine(this._uniforms, this._lateralSurfaceMaterial._uniforms),
                uniforms
            );
        }

        pickCommand.pass = translucent ? Pass.TRANSLUCENT : Pass.OPAQUE;
        commandList.push(pickCommand);
    }
};

/**
 * DOC_TBA
 */
CustomSensorVolume.prototype.isDestroyed = function() {
    return false;
};

/**
 * DOC_TBA
 */
CustomSensorVolume.prototype.destroy = function() {
    this._frontFaceColorCommand.vertexArray =
        this._frontFaceColorCommand.vertexArray &&
        this._frontFaceColorCommand.vertexArray.destroy();
    this._frontFaceColorCommand.shaderProgram =
        this._frontFaceColorCommand.shaderProgram &&
        this._frontFaceColorCommand.shaderProgram.destroy();
    this._pickCommand.shaderProgram =
        this._pickCommand.shaderProgram && this._pickCommand.shaderProgram.destroy();
    this._pickId = this._pickId && this._pickId.destroy();
    return destroyObject(this);
};

export default CustomSensorVolume;
