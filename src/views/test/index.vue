<template>
    <div class="test">
        test
        <div id="mainGl" style="width: 600px; height: 400px"></div>
    </div>
</template>
<script>
import echarts from 'echarts';
import 'echarts-gl';

// let option = {
//     grid3D: {},
//     xAxis3D: {},
//     yAxis3D: {},
//     zAxis3D: {},
// };
export default {
    name: 'test',
    components: {},
    data() {
        return {};
    },
    mounted() {
        this.testGl();
    },
    methods: {
        // testGl() {
        //     let myChart = echarts.init(document.getElementById('mainGl'));
        //     // 绘制图表
        //     myChart.setOption({
        //         title: {
        //             text: 'ECharts 入门示例',
        //         },
        //         tooltip: {},
        //         xAxis: {
        //             data: ['衬衫', '羊毛衫', '雪纺衫', '裤子', '高跟鞋', '袜子'],
        //         },
        //         yAxis: {},
        //         series: [
        //             {
        //                 name: '销量',
        //                 type: 'bar',
        //                 data: [5, 20, 36, 10, 10, 20],
        //             },
        //         ],
        //     });
        // },
        testGl() {
            let option = {
                grid3D: {},
                xAxis3D: {},
                yAxis3D: {},
                zAxis3D: {},
            };
        },
    },
};
</script>
<style lang="scss" scoped>
.test {
    width: 100vw;
    height: 100vh;
    position: absolute;
}
</style>
