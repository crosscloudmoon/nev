<template>
    <div class="addDisPlace">
        <el-form label-width="80px">
            <el-form-item label="观测地名">
                <el-input v-model="disInfo.DMMC" size="small"></el-input>
            </el-form-item>
            <el-form-item label="观测目标" v-if="!changeDis">
                <el-input type="textarea" size="small" v-model="disInfo.WZ"></el-input>
                <el-button :class="{ active: type === 1 }" @click="draw('point')">选择点</el-button>
                <el-button :class="{ active: type === 2 }" @click="draw('area')">
                    选择区域
                </el-button>
                <el-tooltip
                    class="item"
                    effect="dark"
                    content="格式：180.00 90.00;180.00 90.00;180.00 90.00"
                    placement="bottom"
                >
                    <img :src="require('@/assets/img/planning/info.png')" alt class="dataTips" />
                </el-tooltip>
            </el-form-item>
        </el-form>
        <el-button @click="submitForm('ruleForm')">
            {{ this.changeDis ? '修改' : '添加' }}
        </el-button>
        <el-button @click="close">取消</el-button>
    </div>
</template>

<script>
/* global Cesium viewer */
import addDisPlaceFunc from 'U/addDisPlaceFunc';

export default {
    props: ['index', 'changeDis'],
    data() {
        return {
            disInfo: {
                DMMC: this.changeDis ? this.changeDis.DMMC : `默认地名${this.index + 1}`,
                level: this.changeDis ? this.changeDis.level : '紧急',
                WZ: '',
            },
            options: [
                {
                    label: '紧急',
                },
                {
                    label: '一般',
                },
            ],
            radio: '',
            type: 1,
        };
    },
    methods: {
        submitForm() {
            let WZ = this.disInfo.WZ.split(';').filter(item => item);
            if (this.type === 1 && WZ.length > 1) {
                this.disInfo = WZ.map(item => {
                    if (item) {
                        let info = item.split(/[,，]/);
                        let obj = {
                            DMMC: info[0],
                            WZ: info[1],
                            level: this.disInfo.level,
                        };
                        return obj;
                    } else {
                        return '';
                    }
                });
            }
            this.$emit('addDis', this.disInfo);
            this.close();
            if (!this.changeDis) {
                addDisPlaceFunc.clearPrimitive();
                new Cesium.C_DrawHelper(viewer.scene).stopDrawing();
            }
        },
        close() {
            this.$emit('close');
            addDisPlaceFunc.clearPrimitive();
        },
        draw(type) {
            if (type === 'point') {
                this.type = 1;
                addDisPlaceFunc.addPoint(this.index + 1, this.disInfo);
            } else {
                this.type = 2;
                addDisPlaceFunc.addArea(this.disInfo);
            }
        },
    },
    mounted() {
        if (!this.changeDis) {
            this.draw('point');
        }
    },
};
</script>

<style lang="scss">
.addDisPlace {
    text-align: center;
    .el-form {
        text-align: left;
    }
    .el-form-item__label {
        color: #fff;
    }
    .text {
        color: #ffffffc9;
        line-height: 25px;
        font-size: 14px;
        text-align: left;
        padding-top: 5px;
    }
    > .el-button {
        padding: 5px 10px;
    }
    .el-button.active {
        color: #409eff;
    }
}
.dataTips {
    width: 23px;
    vertical-align: middle;
    margin-left: 8px;
}
</style>
