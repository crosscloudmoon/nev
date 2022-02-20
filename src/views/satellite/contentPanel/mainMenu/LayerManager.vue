<template>
    <slide-panel panelName="图层管理" @close="$emit('close', '图层管理')">
        <el-tree
            ref="tree"
            :data="defaultData"
            node-key="id"
            :props="defaultProps"
            :render-after-expand="true"
            :default-checked-keys="defaultCheck"
            show-checkbox
            @check-change="handleCheckChange"
        ></el-tree>
    </slide-panel>
</template>

<script>
import layerManager from 'U/layerManager';
import SlidePanel from '../../components/SlidePanel';

export default {
    name: 'layerManage',
    components: {
        SlidePanel,
    },
    data() {
        return {
            defaultCheck: [],
            defaultProps: {
                children: 'children',
                label: 'label',
            },
            // 图层树默认数据
            defaultData: [],
        };
    },
    // 初始化图层列表数据
    created() {
        let serviceData = this.$config.mapService;
        if (serviceData.imageryLayers) {
            let mapArr = serviceData.imageryLayers;
            let mapService = {
                id: 'mapService',
                label: '地图服务',
                type: 'mapService',
                children: [],
            };
            mapArr.forEach(val => {
                mapService.children.push({
                    id: val.provider.layer,
                    label: val.label,
                    type: 'tileService',
                    param: val,
                });
                if (val.preloading) {
                    this.defaultCheck.push(val.provider.layer);
                }
            });
            this.defaultData.push(mapService);
        }
        if (serviceData.dem) {
            let mapArr = serviceData.dem;
            let mapService = {
                id: 'terrainService',
                label: '地形服务',
                type: 'terrainService',
                children: [],
            };
            mapArr.forEach(val => {
                mapService.children.push({
                    id: val.label,
                    label: val.label,
                    type: 'demService',
                    param: val,
                });
                if (val.preloading) {
                    this.defaultCheck.push(val.label);
                }
            });
            this.defaultData.push(mapService);
        }
    },
    methods: {
        // 控制节点复选款事件
        handleCheckChange(data, checked) {
            if (data.children) {
                return;
            }
            this[data.type](data.param, checked);
        },
        tileService(param, checked) {
            layerManager.setBaseLayer(param, checked);
        },
        demService(param, checked) {
            layerManager.setTerrainLayer(param, checked);
        },
    },
};
</script>

<style lang="scss"></style>
