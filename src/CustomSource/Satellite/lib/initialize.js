/* global Cesium */
import ConicSensorGraphics from './conic/conic-sensor-graphics';
import ConicSensorVisualizer from './conic/conic-sensor-visualizer';
import CustomPatternSensorGraphics from './custom/custom-pattern-sensor-graphics';
import CustomPatternSensorVisualizer from './custom/custom-pattern-sensor-visualizer';
import RectangularSensorGraphics from './rectangular/rectangular-sensor-graphics';
import RectangularSensorVisualizer from './rectangular/rectangular-sensor-visualizer';

const Cartesian3 = Cesium.Cartesian3;
const Color = Cesium.Color;
const defined = Cesium.defined;
const Spherical = Cesium.Spherical;
const TimeInterval = Cesium.TimeInterval;
const CzmlDataSource = Cesium.CzmlDataSource;
const DataSourceDisplay = Cesium.DataSourceDisplay;
const processPacketData = CzmlDataSource.processPacketData;
const processMaterialPacketData = CzmlDataSource.processMaterialPacketData;

function processDirectionData(
    customPatternSensor,
    directions,
    interval,
    sourceUri,
    entityCollection
) {
    let i;
    let len;
    let values = [];
    let unitSphericals = directions.unitSpherical;
    let sphericals = directions.spherical;
    let unitCartesians = directions.unitCartesian;
    let cartesians = directions.cartesian;

    if (defined(unitSphericals)) {
        for (i = 0, len = unitSphericals.length; i < len; i += 2) {
            values.push(new Spherical(unitSphericals[i], unitSphericals[i + 1]));
        }
        directions.array = values;
    } else if (defined(sphericals)) {
        for (i = 0, len = sphericals.length; i < len; i += 3) {
            values.push(new Spherical(sphericals[i], sphericals[i + 1], sphericals[i + 2]));
        }
        directions.array = values;
    } else if (defined(unitCartesians)) {
        for (i = 0, len = unitCartesians.length; i < len; i += 3) {
            let tmp = Spherical.fromCartesian3(
                new Cartesian3(unitCartesians[i], unitCartesians[i + 1], unitCartesians[i + 2])
            );
            Spherical.normalize(tmp, tmp);
            values.push(tmp);
        }
        directions.array = values;
    } else if (defined(cartesians)) {
        for (i = 0, len = cartesians.length; i < len; i += 3) {
            values.push(
                Spherical.fromCartesian3(
                    new Cartesian3(cartesians[i], cartesians[i + 1], cartesians[i + 2])
                )
            );
        }
        directions.array = values;
    }
    processPacketData(
        Array,
        customPatternSensor,
        'directions',
        directions,
        interval,
        sourceUri,
        entityCollection
    );
}

function processCommonSensorProperties(sensor, sensorData, interval, sourceUri, entityCollection) {
    processPacketData(
        Boolean,
        sensor,
        'show',
        sensorData.show,
        interval,
        sourceUri,
        entityCollection
    );
    processPacketData(
        Number,
        sensor,
        'radius',
        sensorData.radius,
        interval,
        sourceUri,
        entityCollection
    );
    processPacketData(
        Boolean,
        sensor,
        'showIntersection',
        sensorData.showIntersection,
        interval,
        sourceUri,
        entityCollection
    );
    processPacketData(
        Color,
        sensor,
        'intersectionColor',
        sensorData.intersectionColor,
        interval,
        sourceUri,
        entityCollection
    );
    processPacketData(
        Number,
        sensor,
        'intersectionWidth',
        sensorData.intersectionWidth,
        interval,
        sourceUri,
        entityCollection
    );
    processMaterialPacketData(
        sensor,
        'lateralSurfaceMaterial',
        sensorData.lateralSurfaceMaterial,
        interval,
        sourceUri,
        entityCollection
    );
}

let iso8601Scratch = {
    iso8601: undefined,
};

function processConicSensor(entity, packet, entityCollection, sourceUri) {
    let conicSensorData = packet.agi_conicSensor;
    if (!defined(conicSensorData)) {
        return;
    }

    let interval;
    let intervalString = conicSensorData.interval;
    if (defined(intervalString)) {
        iso8601Scratch.iso8601 = intervalString;
        interval = TimeInterval.fromIso8601(iso8601Scratch);
    }

    let conicSensor = entity.conicSensor;
    if (!defined(conicSensor)) {
        entity.addProperty('conicSensor');
        conicSensor = new ConicSensorGraphics();
        entity.conicSensor = conicSensor;
    }

    processCommonSensorProperties(
        conicSensor,
        conicSensorData,
        interval,
        sourceUri,
        entityCollection
    );
    processPacketData(
        Number,
        conicSensor,
        'innerHalfAngle',
        conicSensorData.innerHalfAngle,
        interval,
        sourceUri,
        entityCollection
    );
    processPacketData(
        Number,
        conicSensor,
        'outerHalfAngle',
        conicSensorData.outerHalfAngle,
        interval,
        sourceUri,
        entityCollection
    );
    processPacketData(
        Number,
        conicSensor,
        'minimumClockAngle',
        conicSensorData.minimumClockAngle,
        interval,
        sourceUri,
        entityCollection
    );
    processPacketData(
        Number,
        conicSensor,
        'maximumClockAngle',
        conicSensorData.maximumClockAngle,
        interval,
        sourceUri,
        entityCollection
    );
}

function processCustomPatternSensor(entity, packet, entityCollection, sourceUri) {
    let customPatternSensorData = packet.agi_customPatternSensor;
    if (!defined(customPatternSensorData)) {
        return;
    }

    let interval;
    let intervalString = customPatternSensorData.interval;
    if (defined(intervalString)) {
        iso8601Scratch.iso8601 = intervalString;
        interval = TimeInterval.fromIso8601(iso8601Scratch);
    }

    let customPatternSensor = entity.customPatternSensor;
    if (!defined(customPatternSensor)) {
        entity.addProperty('customPatternSensor');
        customPatternSensor = new CustomPatternSensorGraphics();
        entity.customPatternSensor = customPatternSensor;
    }

    processCommonSensorProperties(
        customPatternSensor,
        customPatternSensorData,
        interval,
        sourceUri,
        entityCollection
    );

    // The directions property is a special case value that can be an array of unitSpherical or unit Cartesians.
    // We pre-process this into Spherical instances and then process it like any other array.
    let directions = customPatternSensorData.directions;
    if (defined(directions)) {
        if (Array.isArray(directions)) {
            let length = directions.length;
            for (let i = 0; i < length; i++) {
                processDirectionData(
                    customPatternSensor,
                    directions[i],
                    interval,
                    sourceUri,
                    entityCollection
                );
            }
        } else {
            processDirectionData(
                customPatternSensor,
                directions,
                interval,
                sourceUri,
                entityCollection
            );
        }
    }
}

function processRectangularSensor(entity, packet, entityCollection, sourceUri) {
    let rectangularSensorData = packet.agi_rectangularSensor;
    if (!defined(rectangularSensorData)) {
        return;
    }

    let interval;
    let intervalString = rectangularSensorData.interval;
    if (defined(intervalString)) {
        iso8601Scratch.iso8601 = intervalString;
        interval = TimeInterval.fromIso8601(iso8601Scratch);
    }

    let rectangularSensor = entity.rectangularSensor;
    if (!defined(rectangularSensor)) {
        entity.addProperty('rectangularSensor');
        rectangularSensor = new RectangularSensorGraphics();
        entity.rectangularSensor = rectangularSensor;
    }

    processCommonSensorProperties(
        rectangularSensor,
        rectangularSensorData,
        interval,
        sourceUri,
        entityCollection
    );
    processPacketData(
        Number,
        rectangularSensor,
        'xHalfAngle',
        rectangularSensorData.xHalfAngle,
        interval,
        sourceUri,
        entityCollection
    );
    processPacketData(
        Number,
        rectangularSensor,
        'yHalfAngle',
        rectangularSensorData.yHalfAngle,
        interval,
        sourceUri,
        entityCollection
    );
}

let initialized = false;
export default function initialize() {
    if (initialized) {
        return;
    }

    CzmlDataSource.updaters.push(
        processConicSensor,
        processCustomPatternSensor,
        processRectangularSensor
    );

    let originalDefaultVisualizersCallback = DataSourceDisplay.defaultVisualizersCallback;
    DataSourceDisplay.defaultVisualizersCallback = function(scene, entityCluster, dataSource) {
        let entities = dataSource.entities;
        let array = originalDefaultVisualizersCallback(scene, entityCluster, dataSource);
        return array.concat([
            new ConicSensorVisualizer(scene, entities),
            new CustomPatternSensorVisualizer(scene, entities),
            new RectangularSensorVisualizer(scene, entities),
        ]);
    };

    initialized = true;
}
