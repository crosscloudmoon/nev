<template>
    <div class="satelliteIndex">
        卫星观测
        <globe-viewer @viewerReadied="viewerReadied"></globe-viewer>
    </div>
</template>
<script>
import globeViewer from 'V/satellite/components/globeViewer.vue';

export default {
    name: 'Satellite',
    components: {
        globeViewer,
    },
    data() {
        return {
            viewerLoad: false,
        };
    },
    mounted() {},
    methods: {
        viewerReadied() {
            this.viewerLoad = true;
            Cesium.C_layerGroupHandle.addLayerGroup('selectAreaGroup', '选择区域图层组');
            Cesium.C_layerGroupHandle.addLayer(
                'selectAreaGroup',
                'selectAreaLayer',
                '选择区域图层'
            );
        },
    },
};
</script>
<style lang="scss" scoped></style>
