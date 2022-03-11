<template>
    <div class="headerIndex">
        <div class="headerWrap">
            <div id="menu">
                <ul class="menu-top">
                    <li>
                        <router-link to="/" class="menu-button">
                            <span class="menu-label">首页</span>
                        </router-link>
                    </li>
                    <li>
                        <router-link to="/aboutEarth" class="menu-button">
                            <span class="menu-label">了解地球</span>
                        </router-link>
                    </li>
                    <!-- <li>
                    <a href="#" class="menu-button menu-drop">
                        <span class="menu-label">About</span>
                    </a>
                    <div class="menu-dropdown menu-dropdown1">
                        <ul class="menu-sub">
                            <li>
                                <a href="#" class="menu-subbutton">
                                    <span class="menu-label">Who We Are</span>
                                </a>
                            </li>
                            <li>
                                <a href="#" class="menu-subbutton">
                                    <span class="menu-label">What We Do</span>
                                </a>
                            </li>
                            <li>
                                <a href="#" class="menu-subbutton">
                                    <span class="menu-label">Our Goals</span>
                                </a>
                            </li>
                            <li>
                                <a href="#" class="menu-subbutton">
                                    <span class="menu-label">Our Awards</span>
                                </a>
                            </li>
                            <li>
                                <a href="#" class="menu-subbutton">
                                    <span class="menu-label">Our Team</span>
                                </a>
                            </li>
                        </ul>
                    </div>
                </li> -->
                    <li>
                        <a href="#" class="menu-button menu-drop">
                            <span class="menu-label">数据可视化</span>
                        </a>
                        <div class="menu-dropdown menu-dropdown2">
                            <ul class="menu-sub">
                                <li>
                                    <router-link to="/dataVisualization" class="menu-subbutton">
                                        <span class="menu-label">世界人口可视化</span>
                                        <div class="menu-desc">直观了解各国人口改变</div>
                                    </router-link>
                                </li>
                                <li>
                                    <router-link to="/dataVisualization" class="menu-subbutton">
                                        <span class="menu-label">各国经济可视化</span>
                                        <div class="menu-desc">观察世界各国经济变化</div>
                                    </router-link>
                                </li>
                                <li>
                                    <router-link to="/dataVisualization" class="menu-subbutton">
                                        <span class="menu-label">中国男女比例可视化</span>
                                        <div class="menu-desc">了解我国男女比例问题</div>
                                    </router-link>
                                </li>
                                <li>
                                    <router-link to="/dataVisualization" class="menu-subbutton">
                                        <span class="menu-label">中国。。。</span>
                                        <div class="menu-desc">。。。</div>
                                    </router-link>
                                </li>
                                <!-- <li>
                                    <a href="#" class="menu-subbutton">
                                        <span class="menu-label">E-commerce</span>
                                        <div class="menu-desc">Lorem ipsum dolor</div>
                                    </a>
                                </li> -->
                            </ul>
                        </div>
                    </li>
                    <li>
                        <a href="#" class="menu-button menu-drop">
                            <span class="menu-label">Portfolio</span>
                        </a>
                        <div class="menu-dropdown menu-dropdown3">
                            <div class="menu-row">
                                <h1>HTML</h1>
                                <ul class="menu-sub">
                                    <li>
                                        <router-link to="/test" class="menu-subbutton">
                                            <span class="menu-label">Pellentesq</span>
                                        </router-link>
                                    </li>
                                    <li>
                                        <a href="#" class="menu-subbutton">
                                            <span class="menu-label">Et rhoncus</span>
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" class="menu-subbutton">
                                            <span class="menu-label">Ligula eget</span>
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" class="menu-subbutton">
                                            <span class="menu-label">Turpis quis</span>
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" class="menu-subbutton">
                                            <span class="menu-label">Vivamus ut</span>
                                        </a>
                                    </li>
                                </ul>
                            </div>
                            <div class="menu-row">
                                <h1>Flash</h1>
                                <ul class="menu-sub">
                                    <li>
                                        <a href="#" class="menu-subbutton">
                                            <span class="menu-label">Commodo</span>
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" class="menu-subbutton">
                                            <span class="menu-label">Pulvinar</span>
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" class="menu-subbutton">
                                            <span class="menu-label">Curabitur</span>
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" class="menu-subbutton">
                                            <span class="menu-label">Aliquam</span>
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" class="menu-subbutton">
                                            <span class="menu-label">Vulputate</span>
                                        </a>
                                    </li>
                                </ul>
                            </div>
                            <div class="menu-row">
                                <h1>Mobile</h1>
                                <ul class="menu-sub">
                                    <li>
                                        <a href="#" class="menu-subbutton">
                                            <span class="menu-label">Lorem ipsum</span>
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" class="menu-subbutton">
                                            <span class="menu-label">Dolor amet</span>
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" class="menu-subbutton">
                                            <span class="menu-label">Consectetur</span>
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" class="menu-subbutton">
                                            <span class="menu-label">Adipiscing</span>
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" class="menu-subbutton">
                                            <span class="menu-label">Duis ut nibh</span>
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </li>
                    <!-- <li>
                    <a href="#" class="menu-button menu-drop">
                        <span class="menu-label">Clients</span>
                    </a>
                    <div class="menu-dropdown menu-dropdown4">
                        <div class="menu-row">
                            <div>
                                <h1>America</h1>
                                <ul class="menu-sub">
                                    <li>
                                        <a href="#" class="menu-subbutton">
                                            <span class="menu-label">Lorem ipsum</span>
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" class="menu-subbutton">
                                            <span class="menu-label">Dolor amet</span>
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" class="menu-subbutton">
                                            <span class="menu-label">Consectetur</span>
                                        </a>
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <h1>Africa</h1>
                                <ul class="menu-sub">
                                    <li>
                                        <a href="#" class="menu-subbutton">
                                            <span class="menu-label">Pulvinar in</span>
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" class="menu-subbutton">
                                            <span class="menu-label">Consectet</span>
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" class="menu-subbutton">
                                            <span class="menu-label">Aliquam eu</span>
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div class="menu-row">
                            <div>
                                <h1>Europe</h1>
                                <ul class="menu-sub">
                                    <li>
                                        <a href="#" class="menu-subbutton">
                                            <span class="menu-label">Pellentesq</span>
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" class="menu-subbutton">
                                            <span class="menu-label">Et rhoncus</span>
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" class="menu-subbutton">
                                            <span class="menu-label">Ligula eget</span>
                                        </a>
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <h1>Asia</h1>
                                <ul class="menu-sub">
                                    <li>
                                        <a href="#" class="menu-subbutton">
                                            <span class="menu-label">Turpis quis</span>
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" class="menu-subbutton">
                                            <span class="menu-label">Vivamus ut</span>
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" class="menu-subbutton">
                                            <span class="menu-label">Commodo</span>
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </li> -->
                    <li>
                        <a href="#" class="menu-button menu-drop">
                            <span class="menu-label">Contact</span>
                        </a>
                        <div class="menu-dropdown menu-dropdown5">
                            <ul class="menu-sub">
                                <li>
                                    <router-link to="/aboutEarthReal" class="menu-subbutton">
                                        <span class="menu-label">Pellente</span>
                                        <span class="menu-desc">- Lorem ipsum dolor sit am</span>
                                    </router-link>
                                </li>
                                <li>
                                    <a href="#" class="menu-subbutton">
                                        <span class="menu-label">Et rhonc</span>
                                        <span class="menu-desc">- Lorem ipsum dolor sit am</span>
                                    </a>
                                </li>
                                <li>
                                    <a href="#" class="menu-subbutton">
                                        <span class="menu-label">Ligulaeg</span>
                                        <span class="menu-desc">- Lorem ipsum dolor sit am</span>
                                    </a>
                                </li>
                                <li>
                                    <a href="#" class="menu-subbutton">
                                        <span class="menu-label">Turpisqu</span>
                                        <span class="menu-desc">- Lorem ipsum dolor sit am</span>
                                    </a>
                                </li>
                                <li>
                                    <a href="#" class="menu-subbutton">
                                        <span class="menu-label">Vivamus</span>
                                        <span class="menu-desc">- Lorem ipsum dolor sit am</span>
                                    </a>
                                </li>
                                <li>
                                    <a href="#" class="menu-subbutton">
                                        <span class="menu-label">Doloram</span>
                                        <span class="menu-desc">- Lorem ipsum dolor sit am</span>
                                    </a>
                                </li>
                                <li>
                                    <a href="#" class="menu-subbutton">
                                        <span class="menu-label">Consect</span>
                                        <span class="menu-desc">- Lorem ipsum dolor sit am</span>
                                    </a>
                                </li>
                                <li>
                                    <a href="#" class="menu-subbutton">
                                        <span class="menu-label">Loremipe</span>
                                        <span class="menu-desc">- Lorem ipsum dolor sit am</span>
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </li>
                    <li class="menu-right">
                        <el-link @click="loadingOpenObserve" class="menu-button">
                            <span class="menu-label">卫星观测</span>
                        </el-link>
                    </li>
                    <li class="menu-right">
                        <a href="#" class="menu-button menu-drop">
                            <span class="menu-label">关于</span>
                        </a>
                        <div class="menu-dropdown menu-dropdown7">
                            <h1 style="font-size: 28px">快速了解</h1>
                            <p>
                                <span class="emp">Lorem ipsum dolor</span>
                                sit amet, optiones congue adipiscing elit, sed diam exp nonummy nibh
                                euismod tincidunt utd.
                            </p>

                            <p></p>
                            <p class="quote">
                                Laoreet dolore magna aliquam erates volutpat. Ut wisi enim ad
                                eleifend exp minim veniam, quis. u feugiat nulla.
                            </p>
                            <p>
                                <span class="emp">Facilisis at vero</span>
                                eros et accumsan et iusto nostrud exerci tation ullamcorper suscipit
                                lobortis nisl ut aliquip ex ea.
                            </p>
                            <p class="quote">
                                Commodo consequat duis autem vel eum iriure dolor in hendrerit in
                                nulla vulputate velit esse consequat erates.
                            </p>
                            <p>
                                <span class="emp">Vel illum dolore</span>
                                e odio dignissim quie blandit praesent luptatum zzril delenis augue
                                duis.
                            </p>
                        </div>
                    </li>
                </ul>
                <div class="btnRight" @click="goLogin">
                    <el-button
                        @click="loadingOpen"
                        v-loading.fullscreen.lock="fullscreenLoading"
                        class="loginBtn hvr-fade"
                    >
                        登录
                    </el-button>
                    <!-- <el-button @click="loadingOpen" v-loading.fullscreen.lock="fullscreenLoading">
                        test
                    </el-button> -->
                </div>
                <!-- <el-link
                    @click="loadingOpen"
                    v-loading.fullscreen.lock="fullscreenLoading"
                    style="color: white"
                    href="http://36.112.11.166:8083/CP/satellite/#/"
                >
                    test222
                </el-link> -->
            </div>
        </div>
    </div>
</template>

<script>
import { Loading } from 'element-ui';
export default {
    name: 'Header',
    data() {
        return {
            fullscreenLoading: false,
        };
    },
    methods: {
        goLogin() {
            this.$router.push({ path: '/login', query: 'magiss' });
        },
        loadingOpen() {
            this.fullscreenLoading = true;
            setTimeout(() => {
                this.fullscreenLoading = false;
            }, 1000);
        },
        loadingOpenObserve() {
            // Loading.service({
            //     fullscreen: true,
            // });
            const loading = this.$loading({
                lock: true,
                text: 'Loading',
                spinner: 'el-icon-loading',
                background: 'rgba(0, 0, 0, 0.7)',
            });
            setTimeout(() => {
                loading.close();
                window.open('http://36.112.11.166:8083/CP/satellite/#/', '_self');
            }, 1000);
        },
    },
};
</script>

<style lang="scss" scope>
.headerIndex {
    @import './theme/css/modern-menu.css';
    width: 100%;
    .headerWrap {
        width: 100%;
        position: fixed;
        top: 0;
        z-index: 100;
        #menu {
            position: relative;
            .btnRight {
                position: absolute;
                right: 60px;
                .loginBtn {
                    // width: 60px;
                }
                .hvr-fade:hover,
                .hvr-fade:focus,
                .hvr-fade:active {
                    background-color: #aaa;
                }
            }
        }
    }
}
</style>
