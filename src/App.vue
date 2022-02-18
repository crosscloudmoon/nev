<template>
    <div id="app">
        <!-- <div id="nav">
            <router-link to="/">Home</router-link>
        </div> -->
        <Header v-show="$route.meta.isShowHeader" />
        <router-link to="/"></router-link>
        <router-view />
        <Footer v-show="$route.meta.isShowFooter" />
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
}
</style>
