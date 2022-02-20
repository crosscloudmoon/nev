<template>
    <div class="missionFirst">
        <el-row class="task-info">
            <img
                :src="require('@/assets/img/planning/addB.png')"
                alt
                title="添加观测目标"
                @click="openAdd"
            />
            <img
                :src="
                    targetShow
                        ? require('@/assets/img/planning/lookO.png')
                        : require('@/assets/img/planning/onLookB.png')
                "
                alt
                :title="targetShow ? '隐藏观测区域' : '显示观测区域'"
                @click="controlTargetShow"
            />
        </el-row>

        <el-table :data="missionPlanList" stripe style="width: 100%" ref="table" height="340px">
            <el-table-column prop="DMMC" label="观测目标">
                <template slot-scope="scope">
                    <div style=" cursor: pointer; " :title="scope.row.DMMC" @click="openAdd(scope)">
                        {{ scope.row.DMMC }}
                    </div>
                </template>
            </el-table-column>
            <el-table-column prop="position" label="观测目标">
                <template slot-scope="scope">
                    <div style=" white-space: initial; " :title="scope.row.WZ">
                        {{ scope.row.WZ ? changeText(scope.row.WZ)[0] : null }}
                        <br />
                        {{ scope.row.WZ ? changeText(scope.row.WZ)[1] : null }}...
                    </div>
                </template>
            </el-table-column>
            <el-table-column prop="address" label="观测区域">
                <template slot-scope="scope">
                    <div>
                        <el-button
                            class="circle"
                            :class="scope.row.type === 1 ? 'circle-act' : null"
                            title="画圆"
                            @click="draw('circle', scope)"
                        ></el-button>
                        <el-button
                            class="square"
                            :class="scope.row.type === 2 ? 'square-act' : null"
                            title="矩形"
                            @click="draw('rectangle', scope)"
                        ></el-button>
                        <el-button
                            class="manual"
                            :class="scope.row.type === 3 ? 'manual-act' : null"
                            title="区域"
                            @click="draw('area', scope)"
                        ></el-button>
                    </div>
                </template>
            </el-table-column>
            <el-table-column label="操作">
                <template slot-scope="scope">
                    <el-button class="del" title="删除" @click="del(scope.$index)"></el-button>
                </template>
            </el-table-column>
        </el-table>

        <div class="operating" v-show="operationShow">
            <template v-if="drawType === 'circle'">
                <div class="text">圆半径(Km):</div>
                <el-input
                    size="small"
                    v-model="radius"
                    type="number"
                    :max="500"
                    :min="0"
                ></el-input>
                <el-row>
                    <el-button @click="createArea('circle')">确定</el-button>
                    <el-button @click="closeOperation">取消</el-button>
                </el-row>
            </template>
            <template v-else-if="drawType === 'rectangle'">
                <div class="text">边长(Km):</div>
                <el-input
                    size="small"
                    v-model="sideLength"
                    type="number"
                    :max="500"
                    :min="0"
                ></el-input>
                <el-row>
                    <el-button @click="createArea('extent')">确定</el-button>
                    <el-button @click="closeOperation">取消</el-button>
                </el-row>
            </template>
            <template v-else>
                <div class="text">是否重新选择区域</div>
                <el-row>
                    <el-button @click="createArea('area')">确定</el-button>
                    <el-button @click="closeOperation">取消</el-button>
                </el-row>
            </template>
        </div>

        <div class="param_box">
            <div class="time_box">
                <span class="text_box">
                    <img
                        class="img_right"
                        :src="require('@/assets/img/planning/dataQueryParamtime.png')"
                    />
                    <span class="param_box_text">日期</span>
                </span>

                <div class="missionPlan_time_box">
                    <el-date-picker
                        v-model="timeValue1"
                        type="datetime"
                        placeholder="开始时间"
                        size="mini"
                    ></el-date-picker>
                    <el-date-picker
                        v-model="timeValue2"
                        type="datetime"
                        placeholder="结束时间"
                        size="mini"
                    ></el-date-picker>
                </div>
            </div>
            <div class="type_box">
                <span class="text_box">
                    <img
                        class="img_right"
                        :src="require('@/assets/img/planning/dataQueryParamtime.png')"
                    />
                    <span>类别</span>
                </span>
                <el-checkbox-group v-model="typeCheckList">
                    <el-checkbox label="民用卫星">民</el-checkbox>
                    <el-checkbox label="商业卫星">商</el-checkbox>
                </el-checkbox-group>
            </div>
            <div class="sensor_box">
                <span class="text_box">
                    <img
                        class="img_right"
                        :src="require('@/assets/img/planning/dataQueryParamtime.png')"
                    />
                    <span>传感器</span>
                </span>
                <el-checkbox-group v-model="sensorCheckList">
                    <el-checkbox label="光学卫星">光学</el-checkbox>
                    <el-checkbox label="雷达遥感卫星">雷达</el-checkbox>
                </el-checkbox-group>
            </div>
        </div>
        <el-row class="bottom_button">
            <el-button @click="clearData">清除</el-button>
            <el-button @click="changeTab">分析</el-button>
        </el-row>
        <addDisPlace
            v-if="addDisShow"
            @addDis="addDis"
            @close="closeDis"
            class="addDisPlace"
            :index="missionPlanList.length"
            :changeDis="changeDis"
        ></addDisPlace>
    </div>
</template>

<script>
/* global Cesium viewer SatelliteManager */
import addDisPlace from './addDisPlace';
import missionPlanFunc from 'U/missionPlanFunc';

export default {
    components: {
        addDisPlace,
    },
    data() {
        return {
            operationShow: false,
            radius: 0.5,
            drawType: '',
            sideLength: 0.5,
            currentItem: null,
            addDisShow: false,
            PinBuilder: new Cesium.C_CustomPinBuilder('markers'),
            changeDis: null,
            changeDisIndex: null,
            timeValue1: '',
            timeValue2: '',
            typeCheckList: [],
            sensorCheckList: [],
            isNeedEmpty: {
                value: ['timeValue1', 'timeValue2'],
                arr: ['typeCheckList', 'sensorCheckList'],
            },
            paramList: ['timeValue1', 'timeValue2', 'typeCheckList', 'sensorCheckList'],

            targetShow: true,
            missionPlanList: [],
        };
    },

    methods: {
        // 判断数据是否为空
        returnData(data, defindData) {
            let resData = data;
            if (data === null || typeof data === 'undefined') {
                resData = defindData;
            }
            return resData;
        },
        changeText(str) {
            let [point1, point2] = str.split(';')[0].split(' ');
            return [Number(point1).toFixed(2), Number(point2).toFixed(2)];
        },
        openAdd(scope) {
            // 修改边长和半径为默认
            this.radius = 0.5;
            this.sideLength = 0.5;

            if (scope.row) {
                this.changeDis = scope.row;
                this.changeDisIndex = scope.$index;
            }
            this.addDisShow = true;
        },
        addDis(disInfo) {
            if (Object.prototype.toString.call(disInfo) === '[object Object]') {
                this.drawDisInfo(disInfo);
            } else {
                disInfo.forEach(dis => {
                    dis && this.drawDisInfo(dis);
                });
            }
        },
        drawDisInfo({ DMMC, WZ, level }) {
            if (this.changeDisIndex !== null) {
                this.changeDisPlace(DMMC, level);
                return;
            }
            let positions = WZ.split(';');
            let position = null;
            let lonSum = 0;
            let latSum = 0;
            let id = Cesium.createGuid();

            try {
                for (let i = 0; i < positions.length; i++) {
                    position = positions[i].split(' ');
                    latSum += Number(position[1]);
                    lonSum += Number(position[0]);
                    positions[i] = Cesium.Cartesian3.fromDegrees(
                        Number(position[0]),
                        Number(position[1])
                    );
                }
                missionPlanFunc.addTarget(
                    id,
                    positions,
                    [lonSum / positions.length, latSum / positions.length],
                    this.missionPlanList.length + 1
                );
            } catch (err) {
                this.$message({
                    type: 'error',
                    message: '输入参数格式不正确',
                    offset: 500,
                });
                return;
            }
            let data = {
                DMMC: DMMC,
                DMBS: id,
                WZ: WZ,
                center: [lonSum / positions.length, latSum / positions.length],
                type: '',
                level: level,
            };
            this.missionPlanList.push(data);
            this.currentItem = data;
            positions.length > 1
                ? missionPlanFunc.createPolygon(this, positions)
                : missionPlanFunc.createExtent(this, true);
        },
        addDisByAllInfo(param) {
            let positions = param.WZ.split(';');
            let position = null;
            let lonSum = 0;
            let latSum = 0;

            try {
                for (let i = 0; i < positions.length; i++) {
                    position = positions[i].split(' ');
                    latSum += Number(position[1]);
                    lonSum += Number(position[0]);
                    positions[i] = Cesium.Cartesian3.fromDegrees(
                        Number(position[0]),
                        Number(position[1])
                    );
                }
                missionPlanFunc.addTarget(
                    param.DMBS,
                    positions,
                    [lonSum / positions.length, latSum / positions.length],
                    this.missionPlanList.length
                );
            } catch (err) {
                this.$message({
                    type: 'error',
                    message: '输入参数格式不正确',
                    offset: 500,
                });
                return;
            }
            this.currentItem = param;
            if (param.type === 1) {
                missionPlanFunc.createCircle(this, true);
            } else if (param.type === 2) {
                missionPlanFunc.createExtent(this, true);
            } else if (param.type === 3) {
                let pArr = [];
                for (let i = 0; i < param.coordinates.length; ++i) {
                    pArr[i] = Cesium.Cartesian3.fromDegrees(
                        param.coordinates[i].longitude,
                        param.coordinates[i].latitude
                    );
                }
                missionPlanFunc.createPolygon(this, pArr, true);
            }
        },
        changeDisPlace(DMMC, level) {
            this.missionPlanList[this.changeDisIndex].DMMC = DMMC;
            this.missionPlanList[this.changeDisIndex].level = level;
        },
        closeDis() {
            this.addDisShow = false;
            if (this.changeDisIndex !== null) {
                this.changeDisIndex = null;
                this.changeDis = null;
            } else {
                new Cesium.C_DrawHelper(viewer.scene).stopDrawing();
            }
        },
        del(index) {
            let id = this.missionPlanList.splice(index, 1)[0].DMBS;
            let image = viewer.entities.getById(id).billboard.image;
            viewer.entities.removeById(id);
            Cesium.C_layerGroupHandle.removeGeometry(id, 'selectAreaGroup', 'selectAreaLayer');
            for (let i = index; i < this.missionPlanList.length; ++i) {
                let b1 = viewer.entities.getById(this.missionPlanList[i].DMBS).billboard;
                let img = b1.image;
                b1.image = image;
                image = img;
            }
        },
        draw(type, data) {
            this.operationShow = true;
            this.drawType = type;
            this.currentItem = data.row;
            // 修改弹出框的半径或者边长
            if (data.row.radius) {
                if (type === 'circle') {
                    this.radius = data.row.radius;
                } else if (type === 'rectangle') {
                    this.sideLength = data.row.radius;
                }
            }
        },
        clearData() {
            missionPlanFunc.clearAllTarget(this.missionPlanList);
            this.$store.state.missionPlanList.splice(0, this.$store.state.missionPlanList.length);

            this.isNeedEmpty.arr.forEach(item => {
                this[item] = [];
            });
            this.isNeedEmpty.value.forEach(item => {
                this[item] = '';
            });
        },
        closeOperation() {
            this.operationShow = false;
        },
        changeTab() {
            if (this.missionPlanList.length === 0) {
                this.$message({
                    type: 'warning',
                    message: '请录入观测区域！',
                    offset: 500,
                });
                return;
            }
            let param = {};
            this.paramList.forEach(item => {
                param[item] = this[item];
            });
            param.targetList = this.missionPlanList;
            let needTable = SatelliteManager.setGroundPosition(param);

            this.$emit('update:plan-data', needTable);
            this.$emit('update:active-name', 'second');
        },

        createArea(type) {
            if (
                (type === 'circle' && (!this.radius || this.radius > 500)) ||
                (type === 'extent' && (!this.sideLength || this.sideLength > 500))
            ) {
                this.$message({
                    type: 'warning',
                    message: '输入参数有误，请输入0~500之间的数值',
                });
                return;
            }
            this.closeOperation();
            //  将圆或者方形的半径或者边长存入全局变量
            let missionPlanList = this.$store.state.missionPlanList;
            for (let i in missionPlanList) {
                if (missionPlanList[i].DMBS === this.currentItem.DMBS) {
                    missionPlanList[i].radius =
                        this.drawType === 'rectangle' ? this.sideLength : this.radius;
                }
            }

            missionPlanFunc.createArea(type, this);
        },
        controlTargetShow() {
            this.targetShow = !this.targetShow;
            missionPlanFunc.hideAllTarget(this.missionPlanList, this.targetShow);
        },
    },
};
</script>

<style lang="scss">
.missionFirst {
    height: calc(85vh - 90px);
    .task-info {
        padding-top: 10px;
        text-align: end;
        .task-text {
            display: inline-block;
            font-size: 14px;
        }
        .task-name {
            width: 50%;
        }
        > img {
            width: 20px;
            vertical-align: middle;
            margin-left: 20px;
            cursor: pointer;
        }
    }
    .operating {
        position: absolute;
        margin-top: 20px;
        font-size: 16px;
        background-image: url('~@/assets/img/background/backgroundH.png');
        background-size: 100% 100%;
        padding: 20px;
        width: 260px;
        top: 20%;
        left: 15%;
        z-index: 2;
        color: #fff;
        .text {
            margin-bottom: 10px;
        }
        .el-input {
            margin: 8px 0;
        }
        .el-button {
            padding: 8px 10px;
        }
    }

    .param_box {
        color: #fff;
        font-size: 13px;
        text-align: left;
        height: calc(100% - 440px);
        overflow: hidden;
        overflow-y: scroll;
        > div {
            padding: 10px 0;
            .el-slider__stop {
                display: none;
            }
        }
        .resolution_input {
            display: inline-block;
        }
        .min_num {
            width: 100px;
            border: 1px solid #273761;
            .el-select {
                width: 37px;
            }
            .el-input__inner {
                padding-right: 26px;
                width: 100%;
                height: 28px;
                line-height: 28px;
                background-color: #0d1e49 !important;
                border-radius: 0px;
                border: 0px;
            }
            & + .min_num {
                margin-left: 10px;
            }
            .el-input-group__append .el-input__suffix .el-select__caret {
                line-height: 31px !important;
            }
        }
        .el-input--prefix .el-input__inner {
            padding-left: 26px;
        }
        .el-input--suffix .el-input__inner {
            padding-right: 22px;
        }
        .el-date-editor--date {
            width: 135px;
        }

        .missionPlan_time_box {
            display: inline-block;
            margin-top: 10px;
            .el-date-editor {
                width: 48%;
                & + .el-date-editor {
                    margin-left: 10px;
                }
            }
        }
        .text_box {
            width: 87px;
            text-align: left;
            display: inline-block;
        }
        .el-checkbox-group {
            width: calc(100% - 100px);
            display: inline-block;
            .el-checkbox {
                color: #fff;
            }
            .el-checkbox__inner {
                background: none;
            }
        }

        &::before {
            content: ' ';
            background-color: #17336b;
            display: inline-block;
            width: 100%;
            height: 1px;
        }
    }

    .el-table,
    .el-table th,
    .el-table tr,
    .el-table td {
        border: 0;
    }
    .el-table tr {
        background-color: unset !important;
        color: #fff;
        font-size: 12px;
    }
    .el-table--border::after,
    .el-table--group::after,
    .el-table::before {
        background-color: unset;
    }
    .el-table .checked-row {
        background-color: unset;
    }
    .el-table {
        .el-button + .el-button {
            margin-left: 0px;
        }
        th.is-leaf {
            border: 0;
            color: #2fd5ff;
            font-size: 14px;
        }
        .cell {
            padding: 0;
        }
        .el-table__header-wrapper tr {
            background-color: unset !important;
        }
        .el-button {
            width: 21px;
            height: 21px;
        }
        .circle {
            background-image: url('~@/assets/img/planning/circleB.png');
        }
        .circle-act,
        .circle:hover {
            background-image: url('~@/assets/img/planning/circleO.png');
        }
        .square {
            background-image: url('~@/assets/img/planning/rectangleB.png');
        }
        .square-act,
        .square:hover {
            background-image: url('~@/assets/img/planning/rectangleO.png');
        }
        .manual {
            background-image: url('~@/assets/img/planning/polygonB.png');
        }
        .manual-act,
        .manual:hover {
            background-image: url('~@/assets/img/planning/polygonO.png');
        }
        .del {
            background-image: url('~@/assets/img/planning/deleteB.png');
        }
        .del:hover {
            background-image: url('~@/assets/img/planning/deleteO.png');
        }
        .el-table-column--selection .cell {
            padding-left: 5px;
            padding-right: 5px;
        }
        .index {
            width: 50%;
            display: inline-block;
            position: relative;
            left: -7px;
            height: 27px;
            line-height: 7px;
            span {
                display: inline-block;
                position: absolute;
            }
            .top {
                top: -6px;
                left: 26px;
                border: 6px solid transparent;
                border-bottom: 8px solid #fff;
            }
            .top:hover {
                border-bottom: 8px solid #2fd5ff;
            }
            .bottom {
                top: 14px;
                left: 26px;
                border: 6px solid transparent;
                border-top: 8px solid #fff;
            }
            .bottom:hover {
                border-top: 8px solid #2fd5ff;
            }
        }
    }

    // .sortable-ghost {
    //     opacity: 0.8;
    //     color: #fff !important;
    //     background: #42b983 !important;
    // }

    .bottom_button {
        margin: 20px 0;
        text-align: end;
        .el-button {
            padding: 8px 15px;
        }
    }
    .addDisPlace {
        position: absolute;
        top: 31%;
        left: 7%;
        padding: 20px 20px 20px 10px;
        width: 85%;
        background-image: url('~@/assets/img/background/backgroundH_small.png');
        background-size: 100% 100%;
        z-index: 1001;
    }
    // .changyong_font_style {
    //     color: #2fd5ff;
    //     font-size: 17px;
    //     margin-left: 20px;
    //     cursor: pointer;
    // }

    // .resolution_box .title {
    //     display: inline-block;
    //     width: 86px;
    // }
    // .priority_box .el-radio__inner {
    //     border: 1.5px solid #dcdfe6 !important;
    //     background-color: #00092f;
    // }
    // .priority_box .el-radio__label {
    //     color: #fff !important;
    // }
    // .hide_dom {
    //     display: none;
    // }
}
</style>
