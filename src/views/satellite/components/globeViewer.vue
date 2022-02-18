<template>
    <div id="ViewerContainer"></div>
</template>

<script>
import initViewer from 'U/initViewer';
export default {
    name: 'ViewerContainer',
    data() {
        return {};
    },
    mounted: function() {
        initViewer('ViewerContainer');
        this.$emit('viewerReadied', true);
    },
};
</script>

<style scoped>
#ViewerContainer {
    width: 100%;
    height: 100%;
    overflow: hidden;
}
</style>
