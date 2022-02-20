<template>
    <div>
        <div class="left-menu" v-show="!isShow">
            <el-col>
                <el-row :gutter="5">
                    <el-image
                        :src="require('@/assets/img/menu/open.png')"
                        fit="fill"
                        title="统计信息"
                        @click="controlPanel(true)"
                    ></el-image>
                </el-row>
            </el-col>
        </div>
        <left-panel v-show="isShow" :isShow.sync="isShow"></left-panel>
    </div>
</template>

<script>
import LeftPanel from './LeftPanel';
export default {
    name: 'leftMenu',
    components: {
        LeftPanel,
    },
    data() {
        return {
            isShow: false,
        };
    },
    methods: {
        // prevent(e) {
        //     e.preventDefault();
        // },
        // isTaskShow() {
        //     this.$emit('isTaskShow');
        //     this.$refs.taskState.clearTimer();
        //     this.$refs.unicomStatus.close();
        // },
        // init() {
        //     this.$refs.taskState.init();
        //     this.$refs.taskState.initTask();
        //     this.$refs.unicomStatus.init();
        // },
        controlPanel(flag) {
            this.isShow = flag;
        },
    },
};
</script>

<style lang="scss">
// .task {
// height: 85%;
.left-menu {
    position: absolute;
    left: 1vw;
    top: 10vh;
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
