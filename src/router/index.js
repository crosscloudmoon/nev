import Vue from 'vue';
import VueRouter from 'vue-router';
import Home from '../views/home';
import Login from '../views/login';
import Satellite from '../views/satellite';

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
