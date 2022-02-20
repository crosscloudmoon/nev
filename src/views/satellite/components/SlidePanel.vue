<template>
    <div class="layer-manager-panel fadeInRight">
        <header>
            <span>{{ panelName }}</span>
            <img
                alt=""
                class="close"
                :src="require('@/assets/img/button/close.png')"
                @click="$emit('close')"
            />
        </header>
        <el-row>
            <img class="line" :src="require('@/assets/img/background/headerline.png')" alt />
        </el-row>
        <slot></slot>
    </div>
</template>

<script>
export default {
    name: 'layerManage',
    props: {
        panelName: {
            type: String,
            required: true,
        },
    },
};
</script>

<style lang="scss">
.layer-manager-panel {
    overflow: hidden;
    position: absolute;
    top: 10vh;
    right: 3vw;
    height: 85vh;
    animation-duration: 0.5s;
    background-image: url('~@/assets/img/background/background.png');
    background-size: 100% 100%;
    width: 20vw;
    box-sizing: border-box;
    margin-right: 1vw;
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
}
</style>
