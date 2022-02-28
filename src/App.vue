<template>
    <div id="app" class="page-component__scroll">
        <!-- <div id="nav">
            <router-link to="/">Home</router-link>
        </div> -->
        <Header v-show="$route.meta.isShowHeader" />
        <!-- <router-link to="/"></router-link> -->
        <router-view />
        <Footer v-show="$route.meta.isShowFooter" />
        <el-backtop target=".page-component__scroll .el-scrollbar__wrap" :bottom="100">
            <div
                style="
                     {
                        height: 100%;
                        width: 100%;
                        background-color: #f2f5f6;
                        box-shadow: 0 0 6px rgba(0, 0, 0, 0.12);
                        text-align: center;
                        line-height: 40px;
                        color: #1989fa;
                    }
                "
            >
                UP
            </div>
        </el-backtop>
    </div>
</template>
<script>
import Header from 'C/Header';
import Footer from 'C/Footer';

export default {
    name: 'App',
    components: {
        Header,
        Footer,
    },
};
</script>

<style lang="scss">
@import '@/style/public.scss';
@import '@/style/common.scss';
#app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    height: 100vh;
}
.page-component__scroll {
    height: 100%;
}
</style>
