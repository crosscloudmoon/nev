<template>
    <div class="transit-analysis fadeInRight">
        <span class="close_class" @click="$emit('close', '过顶分析')">
            <img alt="" class="close" :src="require('@/assets/img/button/close.png')" />
        </span>
        <el-tabs v-model="activeName">
            <el-tab-pane label="观测需求" name="first">
                <observation-requirements
                    :plan-data.sync="planData"
                    :active-name.sync="activeName"
                ></observation-requirements>
            </el-tab-pane>
            <el-tab-pane label="规划结果" name="second">
                <planning-results :planData="planData"></planning-results>
            </el-tab-pane>
        </el-tabs>
    </div>
</template>

<script>
import ObservationRequirements from './ObservationRequirements';
import PlanningResults from './PlanningResults';

export default {
    name: 'satelliteSit',
    components: {
        ObservationRequirements,
        PlanningResults,
    },
    data() {
        return {
            activeName: 'first',
            planData: [],
        };
    },
};
</script>

<style lang="scss">
.transit-analysis {
    overflow: hidden;
    position: absolute;
    top: 10vh;
    right: 3vw;
    height: 85vh;
    animation-duration: 0.5s;
    background-image: url('~@/assets/img/background/background.png');
    background-size: 100% 100%;
    width: 20vw;
    box-sizing: border-box;
    margin-right: 1vw;
    float: right;
    padding: 1vw;
    .close_class {
        position: relative;
        float: right;
        top: 11px;
        right: 24px;
        cursor: pointer;
        z-index: 2;
    }
    /* 标签页 */
    .el-tabs__item {
        color: #fff;
        font-size: 1vw;
        font-family: PingFangSC-Regular;
        font-weight: 400;
    }
    .el-tabs__item.is-active {
        color: #2fd5ff;
    }
    .el-tabs__active-bar {
        background: linear-gradient(270deg, #2b74eb 0%, #1fe2fb 100%);
    }
    .el-tabs__nav-wrap::after {
        background-color: unset;
    }
    .el-tabs__item:hover {
        color: #2fd5ff;
    }
    .el-tabs__nav-wrap::after {
        background-image: url('~@/assets/img/background/headerline.png');
        background-size: 100% 100%;
    }
}
</style>
