<template>
    <div class="loginIndex">
        <div class="login-wrap">
            <h1>Login</h1>
            <!-- <form :model="formInf" action="" class="login-content">
                <div class="items">
                    <input :model="formInf.account" type="text" class="account" required />
                    <label for="">User</label>
                </div>
                <div class="items">
                    <input :model="testmodle" type="text" class="password" required />
                    <label for="">PassWords</label>
                </div>
                <button @click="sumbitForm(formInf)" type="button" class="btn">
                    SUBMIT
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </form> -->

            <el-form :model="InfForm" class="login-content">
                <el-form-item class="items">
                    <el-input
                        v-model="InfForm.account"
                        class="account"
                        placeholder="请输入帐号"
                        style="color: #fff"
                        required
                    ></el-input>
                </el-form-item>
                <el-form-item class="items">
                    <el-input
                        v-model="InfForm.password"
                        class="password"
                        placeholder="请输入密码"
                        style="color: #fff"
                        required
                    ></el-input>
                </el-form-item>
                <button @click="loginT(InfForm)" type="button" class="btn">
                    SUBMIT
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </el-form>
        </div>
    </div>
</template>
<script>
export default {
    name: 'Login',
    components: {},
    data() {
        return {
            formInf: {
                account: '',
                password: '',
            },
            testmodle: '',
            InfForm: {
                account: '',
                password: '',
            },
        };
    },
    mounted() {
        console.log('form', this.formInf);
    },
    watch: {
        formInf: function (newVal, oldVal) {
            console.log('form', newVal);
        },
    },
    methods: {
        sumbitForm(param) {
            // console.log('account', this.formInf.account, 'password', this.formInf.password);
            // console.log('22', this.testmodle);
            // if (param.account === 'admin' && param.password === '123') {
            //     this.$router.push({ path: '/' });
            // }
            console.log('param', param);
        },

        // 登录
        loginT(param) {
            if (param.account === 'admin' && param.password === '123') {
                this.$router.push({ path: '/' });
            } else {
                this.$message({ message: '帐号或密码错误', type: 'error' });
            }
            console.log('param', param);
        },
    },
};
</script>
<style lang="scss">
.loginIndex {
    height: 100%;
    background-image: url(./theme/img/loginBg.jpeg);
    background-repeat: no-repeat;
    background-size: 120% 120%;
    background-position: center;
    padding: 300px 0 0 42%;

    .login-wrap {
        width: 300px;
        height: 450px;
        padding: 20px;
        box-sizing: border-box;
        background-color: #000;
        opacity: 60%;
    }
    h1 {
        font-size: 36px;
    }
    .login-content {
        width: 100%;
        margin-top: 50px;
    }

    .items {
        width: 100%;
        display: flex;
        flex-direction: column;
        position: relative;
    }

    .login-content input {
        display: inline-block;
        width: 80%;
        height: 30px;
        outline: none;
        margin: 15px auto;
        border: 0;
        border-bottom: 3px solid aqua;
        background-color: transparent;
        color: white;
        font-size: 20px;
        z-index: 10;
    }

    .login-content input:focus + label,
    .login-content input:valid + label {
        color: white;
        font-size: 14px;
        top: 0;
    }

    .login-content label {
        color: turquoise;
        font-size: 20px;
        position: absolute;
        top: 20px;
        left: 25px;
        transition: all 0.5s linear;
        z-index: 5;
    }

    .login-wrap h1 {
        text-align: center;
        color: white;
        margin-top: 30px;
    }

    .login-content button {
        display: inline-block;
        width: 50%;
        margin-top: 50px;
        position: relative;
        overflow: hidden;
        background: transparent;
        color: aqua;
        border: 0;
    }
    .btn {
        font-weight: 800;
        font-size: 18px;
    }
    .btn span {
        position: absolute;
    }

    .btn > span:nth-child(1) {
        width: 100%;
        height: 3px;
        background: -webkit-linear-gradient(left, transparent, turquoise);
        left: -100%;
        top: 0px;
        animation: line1 1s linear infinite;
    }

    @keyframes line1 {
        50%,
        100% {
            left: 100%;
        }
    }

    .btn > span:nth-child(2) {
        width: 3px;
        height: 100%;
        background: -webkit-linear-gradient(top, transparent, turquoise);
        top: -100%;
        right: 0px;
        animation: line2 1s 0.25s linear infinite;
    }

    @keyframes line2 {
        50%,
        100% {
            top: 100%;
        }
    }

    .btn > span:nth-child(3) {
        width: 100%;
        height: 3px;
        background: -webkit-linear-gradient(right, transparent, turquoise);
        right: -100%;
        bottom: 0px;
        animation: line3 1s 0.5s linear infinite;
    }

    @keyframes line3 {
        50%,
        100% {
            right: 100%;
        }
    }

    .btn > span:nth-child(4) {
        width: 3px;
        height: 100%;
        background: -webkit-linear-gradient(bottom, transparent, turquoise);
        bottom: -100%;
        left: 0px;
        animation: line4 1s 0.75s linear infinite;
    }

    @keyframes line4 {
        50%,
        100% {
            bottom: 100%;
        }
    }

    .login-content .btn:hover {
        color: white;
        border-radius: 5px;
        background-color: rgb(49, 231, 213);
        box-shadow: 0 0 5px 0 turquoise, 0 0 15px 0 turquoise, 0 0 25px 0 turquoise,
            0 0 35px 0 turquoise;
        /* -webkit-box-shadow: 0 0 5px 0 turquoise, 0 0 15px 0 turquoise,
    0 0 25px 0 turquoise, 0 0 35px 0 turquoise; */
        /* z-index: 999; */
    }
}
</style>
