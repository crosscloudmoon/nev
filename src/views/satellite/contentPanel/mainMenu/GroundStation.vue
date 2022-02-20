<template>
    <slide-panel
        panelName="地面接收站"
        @close="$emit('close', '地面接收站')"
        class="ground-station-panel"
    >
        <el-tree
            ref="tree"
            :data="defaultData"
            node-key="id"
            :props="defaultProps"
            :default-expand-all="true"
            show-checkbox
            @check-change="handleCheckChange"
        ></el-tree>
    </slide-panel>
</template>

<script>
/* global Cesium viewer */
import SlidePanel from '../../components/SlidePanel';

export default {
    name: 'groundStation',
    data() {
        return {
            defaultProps: {
                children: 'children',
                label: 'label',
            },
            // 图层树默认数据
            defaultData: [
                {
                    id: 'root',
                    label: '民用接收站',
                    type: 'root',
                    children: [
                        {
                            label: '密云',
                            point: [116.837041, 40.375946],
                        },
                        {
                            label: '喀什',
                            point: [75.990807, 39.467897],
                        },
                        {
                            label: '三亚',
                            point: [109.507994, 18.254174],
                        },
                        {
                            label: '昆明',
                            point: [102.831787, 24.882714],
                        },
                        {
                            label: '北极',
                            point: [18.2825277, 65.44980277],
                        },
                    ],
                },
            ],
        };
    },
    components: {
        SlidePanel,
    },
    methods: {
        handleCheckChange(data, checked) {
            if (data.children) {
                return;
            }
            this.addGroundStation(data, checked);
        },
        addGroundStation(data, checked) {
            let entity = viewer.entities.getById(data.label);
            if (entity && !checked) {
                viewer.entities.removeById(data.label);
                return;
            }
            if (!entity && checked) {
                let circle = Cesium.CircleOutlineGeometry.createGeometry(
                    new Cesium.CircleOutlineGeometry({
                        center: Cesium.Cartesian3.fromDegrees(data.point[0], data.point[1]),
                        radius: 1920000.0,
                    })
                );
                let positions = Cesium.Cartesian3.unpackArray(circle.attributes.position.values);
                positions.push(positions[0]);
                viewer.entities.add({
                    id: data.label,
                    position: Cesium.Cartesian3.fromDegrees(data.point[0], data.point[1]),
                    billboard: {
                        image: require('@/assets/img/satellite/groundStation.png'),
                        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                        width: 36,
                        height: 36,
                    },
                    label: {
                        text: data.label,
                        font: '18px 黑体',
                        // fillColor : Cesium.Color.fromCssColorString("#dc6047"),
                        fillColor: Cesium.Color.YELLOW,
                        outlineColor: Cesium.Color.BLACK,
                        horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
                        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                        pixelOffset: new Cesium.Cartesian2(18, 0),
                        outlineWidth: 2,
                        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    },
                    polyline: {
                        positions: positions,
                        width: 2,
                        material: Cesium.Color.YELLOW,
                        clampToGround: true,
                    },
                });
            }
        },
    },
};
</script>

<style lang="scss">
.satellite-manager-panel {
    .el-button {
        width: 1.5vw;
        height: 1.5vw;
        background: #17336b;
        border-radius: 0;
        border: unset;
        padding: 0;
    }
    .more {
        display: inline-block;
        height: 1.5vw;
        width: 88%;
        background-color: #17336b;
        line-height: 1.5vw;
        vertical-align: top;
    }
    .el-tree {
        height: 90%;
        overflow: hidden;
        overflow-y: scroll;

        .custom-tree-node {
            .title {
                display: inline-block;
                width: 250px;
                text-align: left;
            }
            .tool {
                position: absolute;
                right: 5px;
                display: inline-block;
                .trackShow,
                .trackHid,
                .tripShow,
                .tripHid,
                .beamShow,
                .beamHid {
                    background-size: 100%;
                    width: 19px;
                    height: 19px;
                    display: inline-block;
                }
                .trackShow {
                    background-image: url('~@/assets/img/satellite/track2.png');
                }
                .trackHid {
                    background-image: url('~@/assets/img/satellite/track.png');
                }
                .tripShow {
                    background-image: url('~@/assets/img/satellite/trip2.png');
                }
                .tripHid {
                    background-image: url('~@/assets/img/satellite/trip.png');
                }
                .beamShow {
                    background-image: url('~@/assets/img/satellite/beam2.png');
                }
                .beamHid {
                    background-image: url('~@/assets/img/satellite/beam.png');
                }
            }
        }
    }
    .check {
        float: left;
        position: relative;
    }
    .el-tree-node > .el-tree-node__children {
        overflow: unset;
        background-color: transparent;
    }
}
</style>
