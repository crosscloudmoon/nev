<template>
    <div>
        <right-menu @menuClick="menuClick" :currentPanel="currentPanel"></right-menu>
        <layer-manager v-show="currentPanel === '图层管理'" @close="closePanel"></layer-manager>

        <satellite-situation
            v-show="currentPanel === '卫星态势'"
            @close="closePanel"
        ></satellite-situation>
        <ground-station v-show="currentPanel === '地面接收站'" @close="closePanel"></ground-station>
        <transit-analysis
            v-show="currentPanel === '过顶分析'"
            @close="closePanel"
        ></transit-analysis>
    </div>
</template>

<script>
/* global Cesium viewer */
import RightMenu from './RightMenu';
import LayerManager from './LayerManager';
import SatelliteSituation from './SatelliteSituation';
import GroundStation from './GroundStation';
import TransitAnalysis from './TransitAnalysis/TransitAnalysis';

export default {
    name: 'mainMenu',
    components: {
        RightMenu,
        LayerManager,
        SatelliteSituation,
        GroundStation,
        TransitAnalysis,
    },
    data() {
        return {
            currentPanel: '',
        };
    },
    methods: {
        menuClick(menu) {
            this.currentPanel = this.currentPanel === menu.name ? '' : menu.name;
        },
        closePanel() {
            this.currentPanel = '';
            new Cesium.C_DrawHelper(viewer.scene).stopDrawing();
        },
    },
};
</script>

<style></style>
