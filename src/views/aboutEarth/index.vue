<template>
    <div class="earthIndex">
        <div class="earthContent">地球详情界面</div>
        <el-upload
            action="#"
            :auto-upload="false"
            :name="'file'"
            :accept="'file/*'"
            :on-change="fileFilter"
        >
            <el-button ref="uploadFileBtn">点击上传文件</el-button>
        </el-upload>
        <div class="pdf" v-show="fileType === 'pdf'">
            <p class="arrow">
                <span @click="changePdfPage(0)" class="turn" :class="{ grey: currentPage == 1 }">
                    Preview
                </span>
                {{ currentPage }} / {{ pageCount }}
                <span
                    @click="changePdfPage(1)"
                    class="turn"
                    :class="{ grey: currentPage == pageCount }"
                >
                    Next
                </span>
            </p>
            <pdf
                :src="src"
                :page="currentPage"
                @num-pages="pageCount = $event"
                @page-loaded="currentPage = $event"
                @loaded="loadPdfHandler"
            ></pdf>
        </div>
        <!-- <pdf ref="pdf" :src="url" v-for="i in numPages" :key="i" :page="i"></pdf> -->
    </div>
</template>
<script>
import pdf from 'vue-pdf';
export default {
    name: 'AboutEarth',
    components: {
        pdf,
    },
    // created: {
    //     this.src = pdf.createLoadingTask(this.src)
    // },
    data() {
        return {
            src: 'http://36.112.11.166:8077/query/inspectupload/data/algorithm/2021-12-02/85f5369efb40e9f24f54079ce97e09d7_piesat.ortho.img_ortho_1.1/SelfEvaluation.pdf',
            currentPage: 0, // pdf文件页码
            pageCount: 0, // pdf文件总页数
            fileType: 'pdf', // 文件类型
            // url: 'http://36.112.11.166:8077/query/inspectupload/data/algorithm/2021-12-02/85f5369efb40e9f24f54079ce97e09d7_piesat.ortho.img_ortho_1.1/SelfEvaluation.pdf', // pdf文件地址
            // numPages: null, // pdf 总页数
        };
    },
    mounted() {
        // this.getNumPages();
    },
    methods: {
        // 改变PDF页码,val传过来区分上一页下一页的值,0上一页,1下一页
        changePdfPage(val) {
            // console.log(val)
            if (val === 0 && this.currentPage > 1) {
                this.currentPage--;
                // console.log(this.currentPage)
            }
            if (val === 1 && this.currentPage < this.pageCount) {
                this.currentPage++;
                // console.log(this.currentPage)
            }
        },

        // pdf加载时
        loadPdfHandler(e) {
            this.currentPage = 1; // 加载的时候先加载第一页
        },

        // 计算pdf页码总数
        getNumPages() {
            let loadingTask = pdf.createLoadingTask(this.url);
            loadingTask.promise
                .then(pdf => {
                    this.numPages = pdf.numPages;
                })
                .catch(err => {
                    console.error('pdf 加载失败', err);
                });
        },

        fileFilter(file) {
            this.$nextTick(() => {
                let fileEle = file.raw;
                this.file = file;
                const isFile = fileEle.type === 'application/pdf';
                const isLt2M = file.size / 5000 / 5000 < 1;
                if (!isFile) {
                    this.$message.error('上传文件只能是 pdf 格式!');
                }
                if (!isLt2M) {
                    this.$message.error('上传图片大小不能超过 1MB!');
                }

                if (isFile && isLt2M) {
                    // this.uploadPdf();
                    let formdata = new window.FormData();
                    console.log(this.file.raw);
                    formdata.append('file', this.file.raw);
                    console.log('succss up');
                }
            });
        },
    },
};
</script>

<style lang="scss" scoped>
.earthIndex {
    .earthContent {
        height: 500px;
    }
    .pdf {
        margin: 0 auto;
        width: 500px;
        height: 800px;
    }
}
</style>
