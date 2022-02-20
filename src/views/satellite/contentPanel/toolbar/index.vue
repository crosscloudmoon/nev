<template>
    <div class="toolbar-panel">
        <el-col>
            <el-row v-for="(item, i) in tools" :key="i" :gutter="5">
                <el-image
                    v-if="selectTools.includes(item.name)"
                    :src="require('@/assets/img/menu/' + item.selectImage)"
                    fit="fill"
                    :title="item.name"
                    @click="handleSelect(item.name, false)"
                ></el-image>
                <el-image
                    v-if="!selectTools.includes(item.name)"
                    :src="require('@/assets/img/menu/' + item.image)"
                    fit="fill"
                    :title="item.name"
                    @click="handleSelect(item.name, true)"
                ></el-image>
            </el-row>
        </el-col>
    </div>
</template>

<script>
/* global Cesium viewer */
export default {
    name: 'tools',
    data() {
        return {
            tools: [
                {
                    name: '距离测量',
                    image: 'distanceB.png',
                    selectImage: 'distanceO.png',
                },
                {
                    name: '面积测量',
                    image: 'areaB.png',
                    selectImage: 'areaO.png',
                },
                {
                    name: '二三维切换',
                    image: '3D.png',
                    selectImage: '2D.png',
                },
            ],
            selectTools: [],
            isShowVisTimeLine: false,
        };
    },
    // components: {
    //     visTimeLine,
    // },
    methods: {
        handleSelect(key, flag) {
            switch (key) {
                case '距离测量':
                    // 距离测量
                    this.measure(key, flag, 'Distance');
                    break;
                case '面积测量':
                    // 面积测量
                    this.measure(key, flag, 'Area');
                    break;
                case '二三维切换':
                    // 2D to 3D
                    if (viewer.scene.mode === Cesium.SceneMode.SCENE3D) {
                        viewer.scene.morphTo2D();
                        this.selectTools.push(key);
                    } else {
                        viewer.scene.morphTo3D();
                        this.selectTools.splice(this.selectTools.indexOf(key), 1);
                    }
                    break;
                case '5':
                    this.closeVisTimeLine();
            }
        },
        measure(key, flag, type) {
            if (flag) {
                let removeKey = key === '距离测量' ? '面积测量' : '距离测量';
                let index = this.selectTools.indexOf(removeKey);
                index !== -1 && this.selectTools.splice(index, 1);
                new Cesium.C_DrawHelper(viewer.scene)['startMeasure' + type](
                    {},
                    {
                        endCallback: () => {
                            this.endCallback(key);
                        },
                    }
                );
                this.selectTools.push(key);
            } else {
                new Cesium.C_DrawHelper(viewer.scene).stopDrawing();
                this.endCallback(key);
            }
        },
        endCallback(key) {
            this.selectTools.splice(this.selectTools.indexOf(key), 1);
        },
        closeVisTimeLine() {
            this.isShowVisTimeLine = !this.isShowVisTimeLine;
        },
        selfFun(val) {
            console.log(val);
        },
        setCurrentTime() {
            this.$refs.timeLine.setCurrentTime(new Date());
        },
        setPointTime() {
            let param = [
                {
                    id: 0,
                    content: 'item 0',
                    start: '2014-01-18',
                    type: 'point',
                    className: 'timeLine_point',
                    subgroupStack: true,
                },
                {
                    id: 0,
                    content: 'item 1',
                    start: '2014-01-23 0:0:0',
                    end: '2014-01-25 0:0:0',
                    className: 'timeLine_block',
                    subgroupStack: true,
                },
            ];
            this.$refs.timeLine.addPoint(param);
        },
    },
};
// }
</script>

<style lang="scss">
.toolbar-panel {
    position: absolute;
    right: 1vw;
    bottom: 2vh;
    .el-row {
        .el-image {
            cursor: pointer;
        }
        & + .el-row {
            margin-top: 1vh;
        }
    }
}
</style>
