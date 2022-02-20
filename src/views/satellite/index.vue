<template>
    <div class="satelliteIndex">
        卫星观测
        <!-- <globe-viewer @viewerReadied="viewerReadied"></globe-viewer> -->
        <!-- <content-panel v-if="viewerLoad"></content-panel> -->
        <a href="http://36.112.11.166:8083/CP/satellite/#/"></a>
    </div>
</template>
<script>
// import globeViewer from 'V/satellite/components/globeViewer.vue';
// import contentPanel from './contentPanel';

export default {
    name: 'Satellite',
    components: {
        // globeViewer,
        // contentPanel,
    },
    data() {
        return {
            viewerLoad: false,
        };
    },
    methods: {
        // viewerReadied() {
        //     this.viewerLoad = true;
        //     Cesium.C_layerGroupHandle.addLayerGroup('selectAreaGroup', '选择区域图层组');
        //     Cesium.C_layerGroupHandle.addLayer(
        //         'selectAreaGroup',
        //         'selectAreaLayer',
        //         '选择区域图层'
        //     );
        // },
    },
};
</script>
<style lang="scss" scoped></style>
