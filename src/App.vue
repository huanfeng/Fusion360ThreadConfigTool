<script lang="ts" setup>
import { reactive } from 'vue'
import { nextTick, ref } from 'vue'
import { ElInput, genFileId, type UploadInstance } from 'element-plus'
import { Plus, Delete, Upload } from '@element-plus/icons-vue'
import type { FormInstance, FormRules, UploadProps, UploadRawFile } from 'element-plus'
import { generalXml, type XmlConfig } from '@/fusion360_thread_tool'

const templateList = [
  { name: 'ISO 公制螺纹规格', file: 'ISOMetricprofile.xml' },
  { name: 'ISO 公制梯形螺纹', file: 'ISOMetricTrapezoidalThreads.xml' }
]

// do not use same name with ref
const form = reactive({
  name: '3D打印螺纹',
  mode: '0',
  template: templateList[0].file,
  uploadFile: null as UploadRawFile | null,
  extOffsets: [-0.2, -0.5],
  intOffsets: [0.2, 0.5],
  reserveOriginal: true
})

const rules = reactive<FormRules>({
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }]
})

const ruleFormRef = ref<FormInstance>()
const inputExtOffsetValue = ref(0)
const InputExtRef = ref<InstanceType<typeof ElInput>>()
const inputIntOffsetValue = ref(0)
const InputIntRef = ref<InstanceType<typeof ElInput>>()

const handleOffsetRemove = (tag: number, isExt: boolean) => {
  const offsets = isExt ? form.extOffsets : form.intOffsets
  offsets.splice(offsets.indexOf(tag), 1)
}

const handleOffsetAdd = (isExt: boolean) => {
  const value = isExt ? inputExtOffsetValue.value : inputIntOffsetValue.value
  if (value != 0) {
    const offsets = isExt ? form.extOffsets : form.intOffsets
    if (!offsets.includes(value)) {
      offsets.push(value)
      offsets.sort()
    }
  }
}

const handleOffsetClear = (isExt: boolean) => {
  const offsets = isExt ? form.extOffsets : form.intOffsets
  offsets.splice(0, offsets.length)
}

const upload = ref<UploadInstance>()

const handleUploadExceed: UploadProps['onExceed'] = (files) => {
  upload.value!.clearFiles()
  const file = files[0] as UploadRawFile
  file.uid = genFileId()
  upload.value!.handleStart(file)
  form.uploadFile = file
}

const handleUploadChange: UploadProps['onChange'] = (file, files) => {
  if (file?.raw != null) {
    console.log(`handleUploadChange file=${file.name}`)
    form.uploadFile = file?.raw!
  }
}

function downloadXMLFile(xmlString: string, fileName: string) {
  const xmlBlob = new Blob([xmlString], { type: 'text/xml' })

  // 创建一个临时URL，指向XML文件
  const url = URL.createObjectURL(xmlBlob)

  // 创建一个隐藏的<a>元素，设置下载链接并模拟点击
  const a = document.createElement('a')
  a.setAttribute('style', 'display:none')
  a.setAttribute('href', url)
  a.setAttribute('download', fileName)
  document.body.appendChild(a)
  a.click()

  // 释放临时URL
  URL.revokeObjectURL(url)

  // 删除<a>元素
  document.body.removeChild(a)
}

function genernalAndDownload(data: string) {
  const config = {
    name: form.name,
    extOffsets: form.extOffsets,
    intOffsets: form.intOffsets,
    reserveOriginal: form.reserveOriginal
  } as XmlConfig
  const newXml = generalXml(data, config)
  downloadXMLFile(newXml, `${form.name}.xml`)
}
function doGenerate() {
  if (form.mode == '0') {
    fetch(`/template/${form.template}`)
      .then((response) => response.text())
      .then((data) => {
        genernalAndDownload(data)
      })
  } else if (form.mode == '1') {
    form.uploadFile?.text().then((data) => {
      genernalAndDownload(data)
    })
  }
}

const onSubmit = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate((valid, fields) => {
    if (valid) {
      console.log(`submit! form=${JSON.stringify(form)}`)
      doGenerate()
    } else {
      console.log('error submit!', fields)
    }
  })
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
          <el-form-item label="增加外螺纹偏移">
            <el-space>
              <el-input-number
                v-model="inputExtOffsetValue"
                :precision="2"
                :step="0.1"
                :min="-100"
                :max="100"
                class="w-50 m-2"
                controls-position="right"
                ref="InputExtRef"
                @keyup.enter="handleOffsetAdd(true)"
              />
              <el-button @click="handleOffsetAdd(true)" :icon="Plus" />
              <el-tooltip class="box-item" effect="light" content="清空" placement="top">
                <el-button @click="handleOffsetClear(true)" :icon="Delete" />
              </el-tooltip>
              <el-tooltip
                class="box-item"
                effect="light"
                content="文本框可以手动输入, 按回车添加; 这里的单位和源文件中一致, 可能是mm或in"
                placement="right"
              >
                <el-link type="primary" target="_blank">说明</el-link>
              </el-tooltip>
            </el-space>
          </el-form-item>
          <el-form-item label="外螺纹偏移列表">
            <el-space wrap>
              <el-tag
                v-for="item in form.extOffsets"
                :key="item"
                class="mx-1"
                size="large"
                closable
                :disable-transitions="true"
                @close="handleOffsetRemove(item, false)"
              >
                {{ item.toString() }}
              </el-tag>
            </el-space>
          </el-form-item>
          <el-form-item label="增加内螺纹偏移">
            <el-space>
              <el-input-number
                v-model="inputIntOffsetValue"
                :precision="2"
                :step="0.1"
                :min="-100"
                :max="100"
                class="w-50 m-2"
                controls-position="right"
                ref="InputIntRef"
                @keyup.enter="handleOffsetAdd(false)"
              />
              <el-button @click="handleOffsetAdd(false)" :icon="Plus" />
              <el-tooltip class="box-item" effect="light" content="清空" placement="top">
                <el-button @click="handleOffsetClear(false)" :icon="Delete" />
              </el-tooltip>
              <el-tooltip
                class="box-item"
                effect="light"
                content="文本框可以手动输入, 按回车添加; 这里的单位和源文件中一致, 可能是mm或in"
                placement="right"
              >
                <el-link type="primary" target="_blank">说明</el-link>
              </el-tooltip>
            </el-space>
          </el-form-item>
          <el-form-item label="内螺纹偏移列表">
            <el-space wrap>
              <el-tag
                v-for="item in form.intOffsets"
                :key="item"
                class="mx-1"
                size="large"
                closable
                :disable-transitions="true"
                @close="handleOffsetRemove(item, true)"
              >
                {{ item.toString() }}
              </el-tag>
            </el-space>
          </el-form-item>
          <el-form-item label="更多选项">
            <el-tooltip
              class="box-item"
              effect="light"
              content="是否保留原配置, 不保留会稍微减小文件大小"
              placement="right"
            >
              <el-checkbox label="保留原始" name="type" v-model="form.reserveOriginal" />
            </el-tooltip>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" title="Genrate" @click="onSubmit(ruleFormRef)"
              >生成</el-button
            >
            <el-button>重置</el-button>
          </el-form-item>
        </el-form>
      </el-main>
      <!-- <el-footer>Footer</el-footer> -->
    </el-container>
  </div>
</template>
