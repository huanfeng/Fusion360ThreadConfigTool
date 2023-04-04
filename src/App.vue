<script lang="ts" setup>
import { reactive } from 'vue'
import { nextTick, ref } from 'vue'
import { ElInput, genFileId, type UploadFile, type UploadInstance } from 'element-plus'
import { Plus, Delete, Upload } from '@element-plus/icons-vue'
import type { FormInstance, FormRules, UploadProps, UploadRawFile } from 'element-plus'

const templateList = [
  { name: 'ISO标准', file: 'ISOMetricprofile.xml' },
  { name: 'ISO梯型标准', file: 'ISOMetricTrapezoidalThreads.xml' }
]

// do not use same name with ref
const form = reactive({
  name: '',
  mode: '0',
  template: templateList[0].file,
  uploadFile: null as UploadRawFile | null,
  updateFileContent: '',
  offsets: [0.5, 1.0],
  handleInternel: true,
  handleExternal: true,
  reserveOriginal: true
})

const rules = reactive<FormRules>({
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  // mode: [{ required: true, trigger: 'change' }],
  offsets: [{ required: true, message: '偏移列表不能为空!', trigger: 'change' }]
})

const ruleFormRef = ref<FormInstance>()
const inputOffsetValue = ref(0)
const InputRef = ref<InstanceType<typeof ElInput>>()

const handleOffsetRemove = (tag: number) => {
  form.offsets.splice(form.offsets.indexOf(tag), 1)
}

const handleOffsetAdd = () => {
  const value = inputOffsetValue.value
  if (value != 0 && !form.offsets.includes(value)) {
    form.offsets.push(value)
    form.offsets.sort()
  }
}

const handleOffsetClear = () => {
  form.offsets.splice(0, form.offsets.length)
}

const upload = ref<UploadInstance>()

const handleUploadExceed: UploadProps['onExceed'] = (files) => {
  upload.value!.clearFiles()
  const file = files[0] as UploadRawFile
  file.uid = genFileId()
  upload.value!.handleStart(file)
  form.uploadFile = file
  form.uploadFile?.text().then((text) => (form.updateFileContent = text))
}

const handleUploadChange: UploadProps['onChange'] = (file, files) => {
  if (file?.raw != null) {
    console.log(`handleUploadChange file=${file.name}`)
    form.uploadFile = file?.raw!
    form.uploadFile?.text().then((text) => (form.updateFileContent = text))
  }
}

const onSubmit = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate((valid, fields) => {
    if (valid) {
      console.log('submit!')
    } else {
      console.log('error submit!', fields)
    }
  })
  console.log(`submit! form=${JSON.stringify(form)}`)
  console.log(`FILE: ${form.updateFileContent}`)
}
</script>

<template>
  <div class="common-layout">
    <el-container>
      <el-header><h1>Fusion 360 3D打印螺纹配置生成工具</h1></el-header>
      <el-main>
        <el-form ref="ruleFormRef" :model="form" :rules="rules" label-width="120px">
          <el-form-item label="名称" prop="name">
            <el-input v-model="form.name" placeholder="请输入想要在Fusion 360中显示的名称" />
          </el-form-item>
          <el-form-item label="生成方式" prop="mode">
            <el-radio-group v-model="form.mode">
              <el-radio label="0">模板</el-radio>
              <el-radio label="1">上传文件</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item v-if="form.mode == '0'" label="模板">
            <el-select v-model="form.template" placeholder="请选择模板">
              <el-option v-for="temp in templateList" :label="temp.name" :value="temp.file"
                >{{ temp.name }} ({{ temp.file }})</el-option
              >
            </el-select>
          </el-form-item>
          <el-form-item v-if="form.mode == '1'" label="文件">
            <el-upload
              ref="upload"
              class="upload-demo"
              :on-exceed="handleUploadExceed"
              :on-change="handleUploadChange"
              :auto-upload="false"
              :limit="1"
              drag
            >
              <el-icon class="el-icon--upload"><Upload /></el-icon>
              <div class="el-upload__text">拖放文件到这里或<em>点击进行上传</em></div>
            </el-upload>
          </el-form-item>
          <el-form-item label="增加偏移">
            <el-space>
              <el-input-number
                v-model="inputOffsetValue"
                :precision="2"
                :step="0.1"
                :min="-100"
                :max="100"
                class="w-50 m-2"
                controls-position="right"
                ref="InputRef"
                @keyup.enter="handleOffsetAdd"
              />
              <el-button @click="handleOffsetAdd" :icon="Plus" circle />
              <el-tooltip class="box-item" effect="light" content="清空" placement="top">
                <el-button @click="handleOffsetClear" :icon="Delete" circle />
              </el-tooltip>
              <el-tooltip
                class="box-item"
                effect="light"
                content="文本框可以手动输入, 按回车添加"
                placement="top"
              >
                <el-link type="primary" target="_blank">说明</el-link>
              </el-tooltip>
            </el-space>
          </el-form-item>
          <el-form-item label="偏移列表" prop="offsets">
            <el-space wrap>
              <el-tag
                v-for="item in form.offsets"
                :key="item"
                class="mx-1"
                size="large"
                closable
                :disable-transitions="true"
                @close="handleOffsetRemove(item)"
              >
                {{ item.toString() }}mm
              </el-tag>
            </el-space>
          </el-form-item>
          <el-form-item label="更多选项">
            <el-checkbox label="处理内螺纹" name="type" v-model="form.handleInternel" />
            <el-checkbox label="处理外螺纹" name="type" v-model="form.handleExternal" />
            <el-checkbox label="保留原始" name="type" v-model="form.reserveOriginal" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="onSubmit(ruleFormRef)">生成</el-button>
            <el-button>重置</el-button>
          </el-form-item>
        </el-form>
      </el-main>
      <!-- <el-footer>Footer</el-footer> -->
    </el-container>
  </div>
</template>
