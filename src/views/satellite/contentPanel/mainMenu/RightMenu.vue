<template>
    <div class="right-menu">
        <el-col>
            <el-row v-for="(item, i) in menu" :key="i" :gutter="5">
                <el-image
                    v-if="currentPanel === item.name"
                    :src="require('@/assets/img/menu/' + item.selectImage)"
                    fit="fill"
                    :title="item.name"
                    @click="$emit('menuClick', item)"
                ></el-image>
                <el-image
                    v-if="currentPanel !== item.name"
                    :src="require('@/assets/img/menu/' + item.image)"
                    fit="fill"
                    :title="item.name"
                    @click="$emit('menuClick', item)"
                ></el-image>
            </el-row>
        </el-col>
    </div>
</template>

<script>
export default {
    name: 'rightMenuContainer',
    props: {
        currentPanel: {
            type: String,
            required: true,
        },
    },

    data() {
        return {
            menu: [
                {
                    name: '图层管理',
                    image: 'layerManageB.png',
                    selectImage: 'layerManageO.png',
                },
                {
                    name: '卫星态势',
                    image: 'satelliteB.png',
                    selectImage: 'satelliteO.png',
                },
                {
                    name: '地面接收站',
                    image: 'groundStationB.png',
                    selectImage: 'groundStationO.png',
                },
                {
                    name: '过顶分析',
                    image: 'transitAnalysisB.png',
                    selectImage: 'transitAnalysisO.png',
                },
            ],
        };
    },
};
</script>

<style lang="scss">
.right-menu {
    position: absolute;
    right: 1vw;
    top: 10vh;
    .el-row {
        .el-image {
            cursor: pointer;
        }
        & + .el-row {
            margin-top: 1vh;
        }
    }
}
</style>
