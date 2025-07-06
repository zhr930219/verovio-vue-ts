<script setup lang="ts">
import { ref, shallowRef, onMounted } from 'vue'
import { VerovioToolkit } from 'verovio/esm'
import createVerovioModule from 'verovio/wasm'
import type { VerovioOptions, VerovioModule } from 'verovio'
const angle = ref(0)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const draw = () => {
  const canvas = canvasRef.value as HTMLCanvasElement
  if (!canvas) return
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
  if (!ctx) return
  const squareSize = 30
  const x = (canvas.width - squareSize) / 2
  const y = (canvas.height - squareSize) / 2
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.save()
  ctx.translate(x + squareSize / 2, y + squareSize / 2)
  ctx.rotate((angle.value * Math.PI) / 180)
  ctx.fillStyle = '#2c3e50'
  ctx.fillRect(-squareSize / 2, -squareSize / 2, squareSize, squareSize)
  ctx.restore()
  angle.value = (angle.value + 2) % 360
  requestAnimationFrame(draw)
}
defineProps({})
const page = ref(1)
const total = ref(0)
const renderResultList = ref<string[]>([])
// console.log(VerovioToolkit)
// console.log(createVerovioModule)
const verovioWorkerOptions: VerovioOptions = {
  footer: 'none',
  scale: 5
}
const verovioModule = shallowRef<VerovioModule | null>(null)
const verovioToolkit = shallowRef<VerovioToolkit | null>(null)

const init = async () => {
  verovioModule.value = await createVerovioModule()
  verovioToolkit.value = new VerovioToolkit(verovioModule.value)
  verovioToolkit.value.setOptions(verovioWorkerOptions)
  console.log(verovioToolkit)
}
const renderMusicXML = (xml: string) => {
  const toolkit = verovioToolkit.value as VerovioToolkit
  toolkit.loadData(xml)
  total.value = toolkit.getPageCount()
  Array.from({ length: total.value }, (_, i) => i + 1).forEach((page) => {
    const svg = toolkit.renderToSVG(page)
    renderResultList.value.push(svg)
    if (page === 1) {
      const container = document.getElementById('verovio-container') as HTMLElement
      container.innerHTML = svg
    }
  })
}
const handleFileChange = (e: Event) => {
  console.log(e)
  const target = e.target as HTMLInputElement
  const files = target.files
  if (!files || !files.length) {
    console.warn('No file selected.')
    return
  }
  const file = files[0]
  const reader = new FileReader()
  reader.onload = (e) => {
    const musicXmlString = e.target ? e.target.result : ''
    // console.log('MusicXML content as string:')
    // console.log(musicXmlString)
    renderMusicXML(musicXmlString as string)
  }
  reader.readAsText(file)
  return false
}
const handlePageChange = (page: number) => {
  const toolkit = verovioToolkit.value as VerovioToolkit
  const svg = toolkit.renderToSVG(page, true)
  requestAnimationFrame(() => {
    const container = document.getElementById('verovio-container') as HTMLElement
    container.innerHTML = svg
  })
}
onMounted(() => {
  draw()
  init()
})
</script>

<template>
  <div class="verovio">
    <input ref="fileInputRef" style="display: none;" @change="handleFileChange" :multiple="false" type="file" id="fileInput" />
    <label for="fileInput">
      <button class="btn" @click="fileInputRef?.click()">choose musicXML</button>
    </label>
    <div class="performance">
      <canvas width="60" height="60" ref="canvasRef" id="canvas"></canvas>
    </div>
    <div id="verovio-container"></div>
    <div id="verovio-list-container">
      <span
        @click="handlePageChange(index + 1)"
        v-html="item"
        v-for="(item, index) in renderResultList"
        :key="index"
      ></span>
    </div>
  </div>
</template>

<style scoped>

#verovio-container {
  /* display: flex;
  justify-content: center;
  align-items: center; */
  width: 100%;
  height: 100%;
}

#verovio-container :deep(svg) {
  flex-grow: 1;
  max-width: 100vw;
  height: auto;
}

.performance {
  position: absolute;
  right: 0;
  top: 0;
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
</style>
