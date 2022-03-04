<template>
    <div class="dataVisualIndex">
        <div class="dataVisualMain">
            可视化化界面
            <div class="chartsArea">
                <div id="testEcharts"></div>
                <div id="testEcharts2"></div>
                <div id="testEcharts3"></div>
            </div>
        </div>
    </div>
</template>
<script>
import * as echarts from 'echarts';
// import echarts from "echarts";
// import "echarts-gl";
// import world from "echarts/map/js/world.js";
export default {
    name: 'DataVisualization',
    components: {},
    mounted() {
        this.echartsLoad();
        this.echartsLoad2();
        this.echartsLoad3();
    },
    data() {
        return {};
    },
    methods: {
        echartsLoad() {
            let myChart = echarts.init(document.getElementById('testEcharts'));
            myChart.setOption({
                title: {
                    text: 'ECharts 入门示例',
                },
                tooltip: {},
                xAxis: {
                    data: ['衬衫', '羊毛衫', '雪纺衫', '裤子', '高跟鞋', '袜子'],
                },
                yAxis: {},
                series: [
                    {
                        name: '销量',
                        type: 'bar',
                        data: [5, 20, 36, 10, 10, 20],
                    },
                ],
            });
            // myChart.setOption(option);
        },
        echartsLoad2() {
            let companyData = [
                { companyTypeCode: '1120', companyTypeName: '商场、超市', totalNumber: 6 },
                { companyTypeCode: '1163', companyTypeName: '咖啡厅', totalNumber: 4 },
                {
                    companyTypeCode: '10000',
                    companyTypeName: '粮、棉、木材、百货等物资仓库和堆场',
                    totalNumber: 4,
                },
                { companyTypeCode: '1112', companyTypeName: '饭店', totalNumber: 4 },
                { companyTypeCode: '1000', companyTypeName: '人员密集场所', totalNumber: 1 },
                {
                    companyTypeCode: '11000',
                    companyTypeName: '国家和省级重点工程的施工现场',
                    totalNumber: 1,
                },
                { companyTypeCode: '15000', companyTypeName: '小微企业', totalNumber: 1 },
                {
                    companyTypeCode: '12000',
                    companyTypeName:
                        '其他发生火灾可能性较大以及一旦发生火灾可能造成人身重大伤亡或重大财产损失的单位',
                    totalNumber: 1,
                },
                { companyTypeCode: '14000', companyTypeName: '出租房', totalNumber: 1 },
            ];
            let dataName = [];
            let data1 = [];
            let defaultData = [];
            let maxData = 0;
            companyData.forEach(item => {
                dataName.push(item.companyTypeName);
                data1.push(item.totalNumber);
                if (maxData < item.totalNumber) {
                    maxData = item.totalNumber;
                }
            });
            for (let i = 0; i < data1.length; i++) {
                defaultData.push(maxData);
            }
            let colorList = [
                '#00AAFF',
                '#A52A2A',
                '#FF752D',
                '#FFCF31',
                '#FF3129',
                '#006400',
                '#8B4513',
                '#FF8C00',
                '#FFB6C1',
                '#7B68EE',
                '#87CEFA',
                '#008000',
                '#D2B48C',
            ];
            let myChart = echarts.init(document.getElementById('testEcharts2'));
            myChart.setOption({
                backgroundColor: '#36467E',
                grid: {
                    left: '5%',
                    right: '5%',
                    bottom: '5%',
                    top: '10%',
                    containLabel: true,
                },
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'shadow',
                    },
                    position: function (point, params, dom, rect, size) {
                        // console.log(point)

                        return [point[0], point[1]];
                    },
                    confine: false,
                    // formatter: '{b}:{c}'
                    formatter: function (params) {
                        // console.log(params)
                        let title = params[0].name;
                        if (title.length > 30) {
                            title =
                                title.substring(0, 15) +
                                '<br/>' +
                                title.substring(15, 30) +
                                '<br/>' +
                                title.substring(30);
                        } else if (title.length > 15) {
                            title = title.substring(0, 15) + '<br/>' + title.substring(15);
                        }
                        let name = title + ' : ' + params[0].value;
                        return name;
                    },
                },
                // backgroundColor: 'rgb(20,28,52)',
                xAxis: {
                    show: false,
                    type: 'value',
                },
                yAxis: [
                    {
                        type: 'category',
                        inverse: true,
                        // axisLabel: {
                        //   show: true,
                        //   textStyle: {
                        //     color: '#fff'
                        //   },
                        //   rotate: 0
                        // },
                        splitLine: {
                            show: false,
                        },
                        axisTick: {
                            show: false,
                        },
                        axisLine: {
                            show: false,
                        },
                        axisLabel: {
                            textStyle: {
                                color: '#ffffff',
                                fontSize: '12',
                            },
                            formatter: function (value) {
                                value = value.length > 7 ? value.substring(0, 7) + '...' : value;
                                return value;
                            },
                        },
                        data: dataName,
                    },
                    {
                        type: 'category',
                        inverse: true,
                        axisTick: 'none',
                        axisLine: 'none',
                        show: true,
                        axisLabel: {
                            textStyle: {
                                color: '#ffffff',
                                fontSize: '12',
                            },
                            formatter: function (value) {
                                return value;
                            },
                        },
                        data: data1,
                    },
                ],
                series: [
                    {
                        name: '数量',
                        type: 'bar',
                        zlevel: 1,
                        itemStyle: {
                            normal: {
                                barBorderRadius: [0, 30, 30, 0],
                                color: params => {
                                    return new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                                        {
                                            offset: 0,
                                            color: 'rgba(54,69,129,1)',
                                        },
                                        {
                                            offset: 0.8,
                                            color: colorList[params.dataIndex],
                                        },
                                        {
                                            offset: 1,
                                            color: 'rgba(255,255,255,0.8)',
                                        },
                                    ]);
                                },
                                // color: (params) => {
                                //   return colorList[params.dataIndex]
                                // }
                            },
                        },
                        barWidth: 15,
                        data: data1,
                    },
                    {
                        name: '背景',
                        type: 'bar',
                        barWidth: 15,
                        barGap: '-100%',
                        data: defaultData,
                        itemStyle: {
                            normal: {
                                color: '#1B375E',
                                barBorderRadius: [0, 30, 30, 0],
                            },
                        },
                    },
                ],
            });
            // myChart.setOption(option);
        },
        echartsLoad3() {
            let myChart = echarts.init(document.getElementById('testEcharts3'));
            let bgPatternImg = new Image();
            bgPatternImg.src = '/asset/get/s/data-1623324803979-ugSvPhTCK.png';
            const chartData = [
                {
                    value: 520,
                    name: 'A',
                },
                {
                    value: 280,
                    name: 'B',
                },
                {
                    value: 100,
                    name: 'C',
                },
                {
                    value: 100,
                    name: 'D',
                },
            ];
            const colorList = [
                new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    {
                        offset: 0,
                        color: '#CA8CCA',
                    },
                    {
                        offset: 1,
                        color: '#EFA5BB',
                    },
                ]),
                new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    {
                        offset: 0,
                        color: '#BFA4E4',
                    },
                    {
                        offset: 1,
                        color: '#E29CE2',
                    },
                ]),
                new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    {
                        offset: 0,
                        color: '#A8AAE5',
                    },
                    {
                        offset: 1,
                        color: '#BEA3E3',
                    },
                ]),
                new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    {
                        offset: 0,
                        color: '#A4D37D',
                    },
                    {
                        offset: 1,
                        color: '#E5F2A7',
                    },
                ]),
            ];
            const sum = chartData.reduce((per, cur) => per + cur.value, 0);
            const gap = (1 * Number(sum)) / 100;
            const pieData1 = [];
            const pieData2 = [];
            const gapData = {
                name: '',
                value: gap,
                itemStyle: {
                    color: 'transparent',
                },
            };
            for (let i = 0; i < chartData.length; i++) {
                pieData1.push({
                    ...chartData[i],
                    itemStyle: {
                        borderRadius: 100,
                        shadowColor: '#2a2a34',
                        shadowBlur: 5,
                        shadowOffsetY: 0,
                        shadowOffsetX: 0,
                        borderColor: '#2a2a34',
                        borderWidth: 2,
                    },
                });
                pieData1.push(gapData);

                pieData2.push({
                    ...chartData[i],
                    itemStyle: {
                        borderRadius: 10,
                        color: colorList[i],
                        opacity: 0.1,
                        shadowColor: '#000',
                        shadowBlur: 1,
                        shadowOffsetY: 5,
                        shadowOffsetX: 0,
                    },
                });
                pieData2.push(gapData);
            }
            myChart.setOption({
                backgroundColor: {
                    image: bgPatternImg,
                    repeat: 'repeat',
                },
                title: [
                    {
                        text: '75.0%',
                        x: '50%',
                        y: '43%',
                        textAlign: 'center',
                        textStyle: {
                            fontSize: '40',
                            fontWeight: '500',
                            color: '#98b5d2',
                            textAlign: 'center',
                            textShadowColor: '#000',
                            textShadowBlur: '1',
                            textShadowOffsetX: 2,
                            textShadowOffsetY: 2,
                        },
                    },
                    {
                        text: 'DESIGN ELEMENTS',
                        left: '50%',
                        top: '52%',
                        textAlign: 'center',
                        textStyle: {
                            fontSize: '18',
                            fontWeight: '400',
                            color: '#5c5a68',
                            textAlign: 'center',
                            textShadowColor: '#000',
                            textShadowBlur: '1',
                            textShadowOffsetX: 1,
                            textShadowOffsetY: 1,
                        },
                    },
                ],
                legend: {
                    left: '10%',
                    top: '35%',
                    align: 'left',
                    itemGap: 18,
                    itemWidth: 20,
                    itemHeight: 20,
                    shadowBlur: 10,
                    shadowOffsetY: 0,
                    shadowOffsetX: 0,
                    borderColor: '#2a2a34',
                    borderWidth: 2,
                    textStyle: {
                        color: '#D8DDE3',
                        rich: {
                            name: {
                                verticalAlign: 'right',
                                align: 'left',
                                fontSize: 18,
                                color: '#D8DDE3',
                            },
                            percent: {
                                padding: [0, 0, 0, 10],
                                color: '#D8DDE3',
                                fontSize: 18,
                            },
                        },
                    },
                    formatter: name => {
                        const item = chartData.find(i => {
                            return i.name === name;
                        });
                        const p = ((item.value / sum) * 100).toFixed(0);
                        return '{name|' + name + '}' + '{percent|' + p + '}' + ' %';
                    },
                },

                color: colorList,

                series: [
                    {
                        type: 'pie',
                        z: 3,
                        roundCap: true,
                        radius: ['44%', '51%'],
                        center: ['50%', '50%'],
                        label: {
                            show: false,
                        },
                        labelLine: {
                            show: false,
                        },
                        data: pieData1,
                    },
                    {
                        type: 'pie',
                        z: 2,
                        radius: ['40%', '55%'],
                        center: ['50%', '50%'],
                        label: {
                            show: false,
                        },
                        labelLine: {
                            show: false,
                        },
                        silent: true,
                        data: pieData2,
                    },
                ],
            });
            // myChart.setOption(option);
        },
    },
};
</script>
<style lang="scss" scoped>
.dataVisualIndex {
    .dataVisualMain {
        .chartsArea {
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
            div {
                margin: 200px;
            }
            #testEcharts {
                width: 200px;
                height: 300px;
            }
            #testEcharts2 {
                width: 400px;
                height: 600px;
            }
            #testEcharts3 {
                width: 600px;
                height: 600px;
            }
        }
    }
}
</style>
