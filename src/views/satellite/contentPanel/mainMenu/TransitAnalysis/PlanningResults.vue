<template>
    <div class="plan-result">
        <!-- <p class="needList-p">
            <span class="needList-list">卫星列表</span>
        </p> -->
        <el-table
            class="plan-tabel"
            align="center"
            ref="multipleTable"
            :data="planData"
            tooltip-effect="light"
            border
            highlight-current-row
            @row-click="clickTr"
        >
            <el-table-column prop="name" label="卫星" align="center"></el-table-column>
            <el-table-column prop="targetName" label="观测目标" align="center"></el-table-column>
            <el-table-column prop="startTime" label="开始时间" align="center"></el-table-column>
            <el-table-column prop="endTime" label="结束时间" align="center"></el-table-column>
        </el-table>
        <div class="Btn-type">
            <span @click="simulate" :class="{ active: creatNext }" class="btn-name">
                推演
            </span>
            <!-- <span @click="jobGoes" :class="{ active: listNxet }" class="btn-name">
                任务下达
            </span> -->
        </div>
    </div>
</template>

<script>
/* global Cesium viewer SatelliteManager */
// import dataCenterBus from '../utils/dataCenterBus';

export default {
    name: 'satelliteSit',
    props: {
        planData: {
            type: Array,
            required: true,
            defaultValue: [],
        },
    },
    data() {
        return {
            multipleSelection: [],
            selectedRow: null,
            active: 4,
            creatNext: false,
            listNxet: false,
            timeLineShow: false,
        };
    },

    methods: {
        // // 任务下达
        // async jobGoes() {
        //     this.$message({
        //         type: 'success',
        //         message: '生成需求单成功!',
        //         offset: 500,
        //     });
        // },

        // 列表点击单行
        clickTr(row, b) {
            if (row !== this.selectedRow) {
                this.selectedRow = row;
                this.timeLineShow = false;
            }
        },

        // 推演
        simulate() {
            if (!this.selectedRow) {
                this.$message({
                    type: 'warning',
                    message: '请选择需要推演的数据',
                });
                return;
            }
            this.listNxet = false;
            this.creatNext = true;
            this.lastSelection &&
                SatelliteManager.getSatellite(this.lastSelection).removeSimulation();
            if (this.timeLineShow) {
                viewer.clock.currentTime = Cesium.JulianDate.fromDate(new Date());
                this.timeLineShow = false;
                this.selectedRow = null;
                $('tr').removeClass('current-row');
                this.creatNext = false;
            } else {
                this.timeLineShow = true;
                SatelliteManager.disableComponent(Cesium.C_SatelliteComponents.SensorSquareCone);
                let startTime = Cesium.JulianDate.fromDate(new Date(this.selectedRow.startTime));
                let endTime = Cesium.JulianDate.fromDate(new Date(this.selectedRow.endTime));
                let satellite = SatelliteManager.getSatellite(this.selectedRow.name);
                satellite.pitch = this.selectedRow.sideSwingAngle || 0;
                satellite.addSimulation(startTime, endTime);
                viewer.clock.currentTime = Cesium.JulianDate.addSeconds(
                    startTime,
                    -3,
                    new Cesium.JulianDate()
                );
                this.lastSelection = this.selectedRow.name;
            }
        },

        // 选中背景色
        tableRowClassName({ row, rowIndex }) {
            let color = '';
            if (this.selectedRow && row.id === this.selectedRow.id) {
                color = 'checked-row';
            }
            return color;
        },
    },
};
</script>

<style lang="scss">
.plan-result {
    height: calc(85vh - 90px);
    .el-table {
        height: calc(100% - 60px);
        .cell {
            line-height: 12px;
            padding-left: 6px;
        }
    }
}

.Btn-type {
    padding-top: 12px;
    height: 50px;
    text-align: right;
    .btn-name {
        display: inline-block;
        width: 115px;
        text-align: center;
        font-size: 16px;
        height: 37px;
        line-height: 37px;
        cursor: pointer;
        background-image: url('~@/assets/img/button/buttonB.png');
        background-size: 100% 100%;
        color: #fff;
    }
    .btn-name:hover {
        background-image: url('~@/assets/img/button/buttonO.png');
    }
    .active {
        cursor: pointer;
        background-image: url('~@/assets/img/button/buttonO.png');
        background-size: 100% 100%;
    }
}
</style>
