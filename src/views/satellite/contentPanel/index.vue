<script>
const files = require.context('./', true, /\index.vue/);
let components = {};
files.keys().forEach(key => {
    let directory = key.split('/');
    if (directory.length === 3) {
        components[directory[1]] = files(key).default || files(key);
    }
});

export default {
    components: { ...components },
    render(createElement) {
        let doms = [];
        Object.keys(components).forEach(key => {
            doms.push(createElement(key));
        });
        return createElement('div', doms);
    },
};
</script>
