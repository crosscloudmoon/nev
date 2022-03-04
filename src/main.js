import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import 'reset-css';
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import 'hover.css';
import './style/animate/animate.min.css';
// 引入echarts
// import echarts from 'echarts';
// Vue.prototype.$echarts = echarts;

// import Header from 'C/Header';
// import CustomSource from '@/CustomSource/CustomSource';
// Vue.use(CustomSource);
// Vue.component('Header', Header);

Vue.config.productionTip = false;
Vue.use(ElementUI);
new Vue({
    router,
    store,
    render: h => h(App),
}).$mount('#app');
