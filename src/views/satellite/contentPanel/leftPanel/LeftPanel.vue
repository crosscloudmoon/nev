<template>
    <div class="sitDec fadeInLeft">
        <header>
            <span>资源状态</span>
            <img
                alt=""
                class="close"
                :src="require('@/assets/img/button/close.png')"
                @click="$emit('update:isShow', false)"
            />
        </header>
        <el-row>
            <img class="line" :src="require('@/assets/img/background/headerline.png')" alt />
        </el-row>
        <template v-for="country in satelliteCount">
            <el-row :key="country.name">
                <el-col :span="24">
                    <img :src="require('@/assets/img/satellite/' + country.img)" width="20" alt />
                    <span class="text">{{ country.name }}：</span>
                    <span class="num">{{ country.num }}</span>
                </el-col>
                <el-col v-for="type in country.children" :key="type.name" :span="12" class="pl20">
                    <img :src="require('@/assets/img/satellite/' + type.img)" width="20" alt />
                    <span class="text">{{ type.name }}：</span>
                    <span class="num">{{ type.num }}</span>
                </el-col>
            </el-row>
        </template>
        <div class="firchart" ref="firchart" id="situation"></div>
    </div>
</template>

<script>
import echarts from 'echarts';
export default {
    mounted() {
        let myChart = echarts.init(this.$refs.firchart);
        // 绘制图表
        myChart.setOption({
            grid: [
                {
                    // top: 240,
                    bottom: '1%',
                    width: '90%',
                    left: 10,
                    containLabel: true,
                },
            ],
            legend: {
                data: [
                    {
                        name: '卫星',
                        textStyle: {
                            color: '#fff',
                            icon: 'rect',
                        },
                    },
                    {
                        name: '接收站',
                        textStyle: {
                            color: '#fff',
                            icon: 'rect',
                        },
                    },
                ],
                right: '30px',
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow', // 默认为直线，可选为：'line' | 'shadow'
                },
            },
            xAxis: {
                data: this.data,
                type: 'category',
                axisLabel: {
                    textStyle: {
                        color: '#fff',
                    },
                    interval: 0,
                },
                axisLine: {
                    lineStyle: {
                        color: '#405077',
                        width: 2,
                    },
                },
            },
            yAxis: {
                axisLabel: {
                    textStyle: {
                        color: '#fff',
                    },
                },
                axisLine: {
                    show: false,
                },
                splitLine: {
                    lineStyle: {
                        color: '#1E273E',
                    },
                },
            },
            series: this.series,
        });
    },
    data() {
        return {
            text: '资源状态',
            data: ['民用', '商用'],
            satelliteCount: [
                {
                    name: '国内卫星',
                    img: 'satellite.png',
                    num: 55,
                    children: [
                        {
                            name: '民用卫星',
                            img: 'satelliteO.png',
                            num: 31,
                        },
                        {
                            name: '商用卫星',
                            img: 'satellitePi.png',
                            num: 31,
                        },
                    ],
                },
                {
                    name: '国外卫星',
                    img: 'satellite.png',
                    num: 25,
                    children: [
                        {
                            name: '美国',
                            img: 'satellitePu.png',
                            num: 12,
                        },
                        {
                            name: '法国',
                            img: 'satellitePu.png',
                            num: 4,
                        },
                        {
                            name: '欧洲航天局',
                            img: 'satellitePu.png',
                            num: 2,
                        },
                        {
                            name: '加拿大',
                            img: 'satellitePu.png',
                            num: 1,
                        },
                        {
                            name: '日本',
                            img: 'satellitePu.png',
                            num: 2,
                        },
                        {
                            name: '德国',
                            img: 'satellitePu.png',
                            num: 1,
                        },
                        {
                            name: '欧洲气象卫星',
                            img: 'satellitePu.png',
                            num: 3,
                        },
                    ],
                },
            ],
            series: [
                {
                    name: '卫星',
                    barWidth: '20px',
                    type: 'bar',
                    data: [31, 24],
                    label: {
                        normal: {
                            show: true,
                            position: 'inside',
                            fontSize: 10,
                        },
                    },
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: '#01AFF8' },
                        { offset: 1, color: '#0339FF' },
                    ]),
                },
                {
                    name: '接收站',
                    type: 'bar',
                    barWidth: '20px',
                    data: [5, 10],
                    label: {
                        normal: {
                            show: true,
                            position: 'inside',
                            color: '#fff',
                        },
                    },
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: '#34FF9E' },
                        { offset: 1, color: '#01928F' },
                    ]),
                },
            ],
        };
    },
};
</script>

<style lang="scss">
.sitDec {
    position: absolute;
    top: 10vh;
    left: 3vw;
    width: 20vw;
    height: 85vh;
    font-size: 16px;
    color: #fff;
    background-image: url('~@/assets/img/background/background.png');
    background-size: 100% 100%;
    animation-duration: 0.5s;
    padding: 1vw;

    header {
        width: 100%;
        font-size: 1vw;
        font-family: PingFangSC-Regular;
        font-weight: 400;
        color: #2fd5ff;
        text-align: left;
        display: flex;
        align-items: center;
        justify-content: space-between;
        img {
            width: 38px;
            height: 38px;
        }
        .arrow {
            margin-right: 1.06rem;
        }
        .close {
            width: 14px;
            height: 16px;
            cursor: pointer;
        }
    }
    .line {
        width: 100%;
    }
    .el-row {
        padding: 7px 0;
        .el-col {
            display: flex;
            align-items: center;
            text-align: left;
            line-height: 20px;
            margin-top: 8px;
        }
    }
    .num {
        color: #2fd5ff;
    }
    .firchart {
        width: 340px;
        height: 200px;
        margin: 20px auto;
    }
}
</style>
