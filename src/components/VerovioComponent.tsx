import { defineComponent } from 'vue'
import type { PropType } from 'vue'
import { createUseStyles } from 'vue-jss-vite'
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
type FuncTypes = {
  [K in keyof toolkit]: K
}
type MessageArgs<T extends keyof toolkit> = {
    func: T
    data: Parameters<toolkit[T]>
    key?: string
}
type PostMessage = <K extends keyof toolkit>(
  msg: MessageArgs<K>
) => Promise<Awaited<ReturnType<toolkit[K]>>>

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
        spz.value = useSvgPanZoom('verovio-container', {
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
    document.getElementById('verovio-container')!.innerHTML = ''
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
      spz.value = useSvgPanZoom('verovio-container', {
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

const getMEI = async () => {
  const response = await postMessage({
    func: 'getMEI',
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

const useStyle = createUseStyles({
  verovio: {
    height: '100%',
    width: '100%'
  },
  verovioContainer: {
    width: '100%',
    height: 'calc(80% - 20px)'
  },
  verovioListContainer: {
    width: '100%',
    height: 'calc(20% - 20px)',
    overflowY: 'auto',
    overflowX: 'hidden',
    display: 'flex',
    flexWrap: 'wrap'
  },
  verovioContainerSvg: {
    width: '100%',
    height: '100%'
  },
  performance: {
    position: 'absolute',
    right: 0,
    top: 0
  },
  box: {
    margin: '10px'
  },
  text: {
    color: '#2c3e50'
  },
  btn: {
    outline: 'none',
    border: 'solid 1px #2c3e50',
    borderRadius: '4px',
    margin: '6px',
    backgroundColor: '#fff',
    color: '#2c3e50',
    '&:hover': {
      backgroundColor: '#2c3e50',
      color: '#fff',
      cursor: 'pointer'
    }
  },
  pageNum: {
    display: 'flex',
    justifyContent: 'center',
    color: '#2c3e50'
  }
})

const VerovioComponent = defineComponent({
  setup (props) {
    const classes = useStyle()
    const store = useSegmentedID()
    const { update } = store
    const { id } = storeToRefs(store)
    return () => {
      return (
        <div class={ classes.value.verovio }>
          <div class={ classes.value.performance }>
            <canvas width={ '60' } height={ '60' } ref={ canvasRef } id={ 'canvas' }></canvas>
          </div>
          <span class={ classes.value.text }>{ id.value }</span>
          <button class={ classes.value.btn } onClick={ update.bind(this, 3, 6) }>updateSegmentedID</button>
          <button class={ classes.value.btn } onClick={ getOptions }>getOptions</button>
          <button class={ classes.value.btn } onClick={ getDefaultOptions }>getDefaultOptions</button>
          <button class={ classes.value.btn } onClick={ getMEI }>getMEI</button>
          <input ref={ fileInputRef } style={{ display: 'none' }} onChange={ handleFileChange } multiple={false} type={ 'file' } id={ 'fileInput' } />
          <label for={ 'fileInput' }>
            <button class={ classes.value.btn } onClick={ fileInputRef.value?.click.bind(document.getElementById('fileInput')) }>choose musicXML</button>
          </label>
          {
            loading.value ?
            <div class={ classes.value.verovioContainer }>
              <LoadingSpinner class={ classes.value.verovioContainerSvg }></LoadingSpinner>
            </div> :
            <div class={ classes.value.verovioContainer }>
              <svg innerHTML={ svgRef.value } class={ classes.value.verovioContainerSvg } id={ 'verovio-container' }></svg>
            </div>
          }
           <div class={ classes.value.verovioListContainer } id={ 'verovio-list-container' }>
            {
              renderResultList.value.map((item, index) => {
                return (
                  <div
                    onClick={ handlePageChange.bind(this, index + 1) }
                    key={ index }
                  >
                    <div innerHTML={ item }></div>
                    <div class={ classes.value.pageNum }>{ index + 1 }</div>
                  </div>
                )
              })
            }
          </div>
        </div>
      )
    }
  },
  components: {
    LoadingSpinner
  },
  mounted() {
    draw()
    window.addEventListener('resize', handleResize)
  },
  beforeUnmount () {
    verovioWorker.value.removeListener('ready', ready)
    window.removeEventListener('resize', handleResize)
    verovioWorker.value.destroy()
  }
})

export default VerovioComponent
