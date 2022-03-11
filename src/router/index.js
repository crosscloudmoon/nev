import Vue from 'vue';
import VueRouter from 'vue-router';
import Home from '../views/home';
import Login from '../views/login';
import Satellite from '../views/satellite';
import DataVisualization from '../views/dataVisualization';
import AboutEarth from '../views/aboutEarth';
import AboutEarthReal from '../views/aboutEarth/about.vue';
import test from '../views/test';

Vue.use(VueRouter);

const routes = [
    {
        path: '/',
        name: 'Home',
        meta: {
            title: '我是首页',
            isShowHeader: true,
            isShowFooter: true,
        },
        component: Home,
    },
    {
        path: '/login',
        name: 'Login',
        meta: {
            title: '我在登录',
            isShowHeader: false,
            isShowFooter: false,
        },
        component: Login,
    },
    {
        path: '/satellite',
        name: 'Satellite',
        meta: {
            title: '卫星观测',
            isShowHeader: false,
            isShowFooter: false,
        },
        component: Satellite,
    },
    {
        path: '/dataVisualization',
        name: 'DataVisualization',
        meta: {
            title: '数据可视化模块',
            isShowHeader: true,
            isShowFooter: true,
        },
        component: DataVisualization,
    },
    {
        path: '/aboutEarth',
        name: 'AboutEarth',
        meta: {
            title: '了解我们的地球',
            isShowHeader: false,
            isShowFooter: false,
        },
        component: AboutEarth,
    },
    {
        path: '/aboutEarthReal',
        name: 'AboutEarth',
        meta: {
            title: '了解我们的地球',
            isShowHeader: false,
            isShowFooter: false,
        },
        component: AboutEarthReal,
    },
    {
        path: '/test',
        name: 'test',
        meta: {
            title: 'test',
            isShowHeader: false,
            isShowFooter: false,
        },
        component: test,
    },

    // {
    //     path: '/about',
    //     name: 'About',
    //     // route level code-splitting
    //     // this generates a separate chunk (about.[hash].js) for this route
    //     // which is lazy-loaded when the route is visited.
    //     component: () => import(/* webpackChunkName: "about" */ '../views/About.vue'),
    // },
];

const router = new VueRouter({
    mode: 'history',
    base: process.env.BASE_URL,
    routes,
});

export default router;
