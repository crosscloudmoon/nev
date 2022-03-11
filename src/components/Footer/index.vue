<template>
    <div class="footer">
        <ul class="copyright">
            <li>&copy; 杨震宇. All rights reserved.</li>
            <li>
                数学与信息科技学院:
                <a href="#">网络工程1802</a>
            </li>
        </ul>
    </div>
</template>
<script>
export default {
    name: 'Footer',
    components: {},
    data() {
        return {};
    },
    methods: {},
};
</script>
<style lang="scss" scoped>
@import './theme/css/footer.scss';
.footer {
    .copyright {
        padding-top: 10px;
        li:nth-child(1) {
            margin-bottom: 30px;
        }
    }
}
</style>
