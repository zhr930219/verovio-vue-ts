<script setup lang="ts">
import { ref, onMounted, shallowRef, onBeforeUnmount, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import IdleTaskQueue from './task'
import { generateSegmentedID } from '@/utils/utils'
import { usePerformanceChecker } from './usePerformanceChecker'
import { useVerovioWorker } from './useVerovioWorker'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import { useSegmentedID } from '@/stores/segmentedID'
import { useSvgPanZoom } from './useSvgPanZoom'
import svgpanzoom from 'svg-pan-zoom'
import customEventsHandler from '@/components/CustomEventsHandler'
import type { VerovioOptions } from 'verovio'
import { toolkit } from 'verovio'
type MessageArgs<T extends keyof toolkit> = {
    func: T
    data: Parameters<toolkit[T]>
    key?: string
}
type FuncTypes = {
  [K in keyof toolkit]: K
}
type PostMessage = <K extends keyof toolkit>(
  msg: MessageArgs<K>
) => Promise<Awaited<ReturnType<toolkit[K]>>>

const store = useSegmentedID()
const { update } = store
const { id } = storeToRefs(store)
const random = ref(generateSegmentedID(3, 6))
const idleTaskQueue = new IdleTaskQueue()
const verovioWorker = shallowRef(useVerovioWorker())
const page = ref(1)
const total = ref(0)
const fileInputRef = ref<HTMLInputElement | null>(null)
const fileList = ref<File[] | null[]>([])
const renderResultList = ref<string[]>([])
const svgRef = ref<string>('')
const spz = shallowRef<typeof svgpanzoom | null>(null)
const loading = ref(false)

defineProps({})
const canvasRef = ref<HTMLCanvasElement | null>(null)
const { draw, stop } = usePerformanceChecker({ canvasRef })

const ready = async (data: string[]) => {
  const options: VerovioOptions = {
    footer: 'none',
    scale: 5
  }
  const response = await postMessage({ func: 'setOptions', data: [options] })
  console.log(response)
}
verovioWorker.value.addListener('ready', ready)

const loadData = (total: number) => {
  const promises = []
  loading.value = true
  for (const num of Array.from({ length: total }, (_, i) => i + 1)) {
    promises.push(postMessage({
      func: 'renderToSVG',
      data: [num, true]
    }).then((response) => {
      // console.log(response)
      if (num === 1) {
        svgRef.value = ref(response).value
      }
      renderPage(response)
    }))
  }
  Promise.all(promises).then(() => {
    console.log('all done')
    loading.value = false
    if (svgRef.value) {
      nextTick(() => {
        spz.value = useSvgPanZoom('verovio-container' + '-' + random.value, {
          zoomEnabled: true,
          fit: true,
          center: true,
          customEventsHandler: customEventsHandler
        })
      })
    }
  })
}

const renderPage = (data: any) => {
  // console.log(data.page)
  idleTaskQueue.addTask(() => {
    // setTimeout(() => {
    //   document.getElementById('verovio-list-container')?.insertAdjacentHTML('beforeend', data.svg)
    // }, page * 500)
    renderResultList.value.push(data)
  })
}
const loadMusicXML = async (xml: string) => {
  loading.value = true
  const status = await postMessage({
    func: 'loadData',
    data: [ xml ]
  })
  const response = await postMessage({
    func: 'getPageCount',
    data: []
  })
  loading.value = false
  // console.log(status)
  // console.log(response)
  total.value = response
  loadData(response)
}
const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  const files = target.files
  if (!files || !files.length) {
    fileList.value = []
    return
  }
  fileList.value = [ files[0] ]
  const file = files[0]
  console.log(file)
  if (!file) {
    console.warn('No file selected.')
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    const musicXmlString = e.target ? e.target.result : ''
    // console.log('MusicXML content as string:')
    // console.log(musicXmlString)
    renderResultList.value = []
    document.getElementById('verovio-container' + '-' + random.value)!.innerHTML = ''
    loadMusicXML(musicXmlString as string)
  }
  reader.readAsText(file)
}
const handlePageChange = async (current: number) => {
  page.value = current
  loading.value = true
  const response = await postMessage({
    func: 'renderToSVG',
    data: [current, true]
  })
  // console.log(response)
  svgRef.value = ref(response).value
  loading.value = false
  if (svgRef.value) {
    nextTick(() => {
      spz.value = useSvgPanZoom('verovio-container' + '-' + random.value, {
        zoomEnabled: true,
        fit: true,
        center: true,
        customEventsHandler: customEventsHandler
      })
    })
  }
}

const getOptions = async () => {
  const response = await postMessage({
    func: 'getOptions',
    data: []
  })
  console.log(response)
}

const getDefaultOptions = async () => {
  const response = await postMessage({
    func: 'getDefaultOptions',
    data: []
  })
  console.log(response)
}

const postMessage: PostMessage = async<T extends keyof toolkit> (data: MessageArgs<T>): Promise<Awaited<ReturnType<toolkit[T]>>> => {
  return verovioWorker.value.postMessage(data)
}

const handleResize = () => {
  if (spz.value) {
    spz.value.resize()
    spz.value.fit()
    spz.value.center()
  }
}

onMounted(() => {
  draw()
  window.addEventListener('resize', handleResize)
})
onBeforeUnmount(() => {
  verovioWorker.value.removeListener('ready', ready)
  window.removeEventListener('resize', handleResize)
  verovioWorker.value.destroy()
})
</script>

<template>
  <div class="verovio">
    <div class="performance">
      <canvas width="60" height="60" ref="canvasRef" id="canvas"></canvas>
    </div>
    <span class="text">{{ id }}</span>
    <button class="btn" @click="update()">updateSegmentedID</button>
    <button class="btn" @click="getOptions()">getOptions</button>
    <button class="btn" @click="getDefaultOptions()">getDefaultOptions</button>
    <input ref="fileInputRef" style="display: none;" @change="handleFileChange" :multiple="false" type="file" :id="'fileInput' + '-' + random" />
    <label :for="'fileInput' + '-' + random">
      <button class="btn" @click="fileInputRef?.click()">choose musicXML</button>
    </label>
    <div class="verovio-container-wrapper">
      <div class="verovio-list-container" :id="'verovio-list-container' + '-' + random">
        <div
          class="verovio-list-item"
          @click="handlePageChange(index + 1)"
          v-for="(item, index) in renderResultList"
          :key="index"
        >
          <div class="svg-container" v-html="item"></div>
          <div class="page-num">{{ index + 1 }}</div>
        </div>
      </div>
      <div class="verovio-container" v-if="!loading">
        <svg v-html="svgRef" class="verovio-container-svg" :id="'verovio-container' + '-' + random"></svg>
      </div>
      <div class="verovio-container" v-else>
        <LoadingSpinner class="verovio-container-svg"></LoadingSpinner>
      </div>
    </div>
  </div>
</template>

<style scoped>
.verovio {
  height: 100%;
  width: 100%;
}
.verovio-container-wrapper {
  display: flex;
  width: 100%;
  height: 100%;
}
.verovio-container {
  width: 100%;
  /* display: flex;
  justify-content: center;
  align-items: center; */
  height: calc(100% - 25px);
}
.verovio-list-container {
  height: calc(100% - 25px);
  overflow-y: auto;
  overflow-x: hidden;
}
.verovio-list-container::-webkit-scrollbar {
  width: 6px;
}
.verovio-list-container:hover::-webkit-scrollbar-thumb,
.verovio-list-container:active::-webkit-scrollbar-thumb {
  background: #2c3e50;
}
.verovio-list-container::-webkit-scrollbar-track {
  background-color: #fff;
}
.verovio-list-container::-webkit-scrollbar-thumb {
  background: #fff;
  border-radius: 20px;
}
.verovio-container-svg {
  width: 100%;
  height: 100%;
}
.verovio-list-item {
  padding: 12px;
}

.performance {
  position: absolute;
  right: 0;
  top: 0;
}
.box {
  margin: 10px;
}
.box .text {
  color: #2c3e50;
}

.btn {
  outline: none;
  border: solid 1px #2c3e50;
  border-radius: 4px;
  margin: 6px;
  background-color: #fff;
  color: #2c3e50;
}
.btn:hover {
  background-color: #2c3e50;
  color: #fff;
  cursor: pointer;
}

.verovio-list-container .svg-container {
  justify-content: center;
  display: flex;
}

:deep(.verovio-list-item .svg-container svg) {
  margin: 12px;
}

.verovio-list-item .page-num {
  display: flex;
  justify-content: center;
  color: #2c3e50;
}
</style>
