/* global Cesium */
// const CustomDataSource = Cesium.CustomDataSource;
const CesiumMath = Cesium.Math;
const EntityView = Cesium.EntityView;
const HeadingPitchRange = Cesium.HeadingPitchRange;
const Entity = Cesium.Entity;
const Cartesian3 = Cesium.Cartesian3;
const VelocityOrientationProperty = Cesium.VelocityOrientationProperty;

export class EntityWrapper {
    constructor(viewer, options) {
        this.viewer = viewer;
        this.entities = {};
        this.defaultStatus = undefined;

        // this.satelliteDataSource = new CustomDataSource('SatelliteDataSource');
        // this.entityCollection =  this.satelliteDataSource.entities;
        // this.viewer.dataSources.add(this.satelliteDataSource);
        this.entityCollection = options.entities;
    }

    get created() {
        return this.components.length > 0;
    }

    get enabled() {
        return this.enabledComponents.length > 0;
    }

    show(components = this.components) {
        for (let entity of components) {
            this.enableComponent(entity);
        }
    }

    // 隐藏卫星要素
    hide(components = this.components) {
        for (let entity of components) {
            this.disableComponent(entity);
        }
    }

    // 获取卫星要素
    get components() {
        return Object.keys(this.entities);
    }

    get enabledComponents() {
        return Object.values(this.entities).filter(entity =>
            this.entityCollection.contains(entity)
        );
    }

    enableComponent(name) {
        if (typeof name === 'undefined') {
            return;
        }
        if (name in this.entities && !this.entityCollection.contains(this.entities[name])) {
            this.entityCollection.add(this.entities[name]);
        }
    }

    disableComponent(name) {
        if (typeof name === 'undefined') {
            return;
        }
        if (name in this.entities && this.entityCollection.contains(this.entities[name])) {
            this.entityCollection.remove(this.entities[name]);
        }
    }

    get isSelected() {
        return Object.values(this.entities).some(entity => this.viewer.selectedEntity === entity);
    }

    get isTracked() {
        return Object.values(this.entities).some(entity => this.viewer.trackedEntity === entity);
    }

    // 跟踪卫星
    track(animate = false) {
        if (typeof this.defaultEntity === 'undefined') {
            return;
        }
        if (!animate) {
            this.viewer.trackedEntity = this.defaultEntity;
            return;
        }

        this.viewer.trackedEntity = undefined;
        const clockRunning = this.viewer.clock.shouldAnimate;
        this.viewer.clock.shouldAnimate = false;

        this.viewer
            .flyTo(this.defaultEntity, {
                offset: new HeadingPitchRange(0, -CesiumMath.PI_OVER_FOUR, 1580000),
            })
            .then(result => {
                if (result) {
                    this.viewer.trackedEntity = this.defaultEntity;
                    this.viewer.clock.shouldAnimate = clockRunning;
                }
            });
    }

    setSelectedOnTickCallback(onTickCallback = () => {}, onUnselectCallback = () => {}) {
        const onTickEventRemovalCallback = this.viewer.clock.onTick.addEventListener(clock => {
            onTickCallback(clock);
        });
        const onSelectedEntityChangedRemovalCallback = this.viewer.selectedEntityChanged.addEventListener(
            () => {
                onTickEventRemovalCallback();
                onSelectedEntityChangedRemovalCallback();
                onUnselectCallback();
            }
        );
    }

    setTrackedOnTickCallback(onTickCallback = () => {}, onUntrackCallback = () => {}) {
        const onTickEventRemovalCallback = this.viewer.clock.onTick.addEventListener(clock => {
            onTickCallback(clock);
        });
        const onTrackedEntityChangedRemovalCallback = this.viewer.trackedEntityChanged.addEventListener(
            () => {
                onTickEventRemovalCallback();
                onTrackedEntityChangedRemovalCallback();
                onUntrackCallback();
            }
        );
    }

    artificiallyTrack(onTickCallback = () => {}, onUntrackCallback = () => {}) {
        const cameraTracker = new EntityView(
            this.defaultEntity,
            this.viewer.scene,
            this.viewer.scene.globe.ellipsoid
        );
        this.setTrackedOnTickCallback(
            clock => {
                cameraTracker.update(clock.currentTime);
                onTickCallback();
            },
            () => {
                onUntrackCallback();

                if (typeof this.viewer.trackedEntity === 'undefined') {
                    this.viewer.flyTo(this.defaultEntity, {
                        offset: new HeadingPitchRange(0, CesiumMath.toRadians(-90.0), 2000000),
                    });
                }
            }
        );
    }

    // 创建对象
    createCesiumEntity(entityName, entityKey, entityValue, name, description, position, moving) {
        const entity = new Entity({
            name: name,
            description: description,
            position: position,
            viewFrom: new Cartesian3(0, -3600000, 4200000),
        });

        if (moving) {
            entity.orientation = new VelocityOrientationProperty(position);
        }

        entity[entityKey] = entityValue;
        this.entities[entityName] = entity;
    }
}
