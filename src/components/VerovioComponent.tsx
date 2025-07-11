import { defineComponent } from 'vue'
import type { PropType } from 'vue'
import { createUseStyles } from 'vue-jss-vite'
import { ref, onMounted, shallowRef, onBeforeUnmount, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import IdleTaskQueue from './task'
import { generateSegmentedID, omit } from '@/utils/utils'
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

const useStyle = createUseStyles({
  verovio: {
    height: '100%',
    width: '100%'
  },
  verovioContainerWrapper: {  
    display: 'flex',
    width: '100%',
    height: '100%'
  },
  verovioContainer: {
    width: '100%',
    height: 'calc(100% - 25px)'
  },
  verovioListContainer: {
    height: 'calc(100% - 25px)',
    'overflow-y': 'auto',
    'overflow-x': 'hidden',
    '&::-webkit-scrollbar': {
      width: '6px'
    },
    '&:hover::-webkit-scrollbar-thumb': {
      backgroundColor: '#2c3e50'
    },
    '&:active::-webkit-scrollbar-thumb': {
      backgroundColor: '#2c3e50'
    },
    '&::-webkit-scrollbar-track': {
      'background-color': '#fff'

    },
    '&::-webkit-scrollbar-thumb': {
      'background-color': '#fff',
      'border-radius': '20px'
    }
  },
  verovioListItem: {
    padding: '12px'
  },
  verovioContainerSvg: {
    width: '100%',
    height: '100%'
  },
  svgContainer: {
    'justify-content': 'center',
    display: 'flex',
    '&:first-child': {
      margin: '12px'
    }
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
    const random = ref(generateSegmentedID(3, 6))
    const classes = useStyle()
    const store = useSegmentedID()
    const { update } = store
    const { id } = storeToRefs(store)
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
    const currentNodeId = ref('')
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
            requestAnimationFrame(() => {
              const svg = document.getElementById('verovio-container' + '-' + random.value)
              if (svg) {
                console.log('SVG is ready')
                const allG = svg.querySelectorAll('g')
                const nodes: SVGGElement[] = []
                Array.from(allG).forEach((g) => {
                  if (g.attributes['class'] && g.attributes['class'].value === 'note') {
                    nodes.push(g)
                    g.addEventListener('click', (e) => {
                      console.log(g.id)
                      currentNodeId.value = g.id
                      nodes.forEach(item => {
                        item.removeAttribute('fill')
                        item.classList.remove('active')
                      })
                      g.setAttribute('fill', '#25d3d1')
                      g.classList.add('active')
                    })
                  }
                })
              }
            })
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

    const getMEI = async () => {
      const response = await postMessage({
        func: 'getMEI',
        data: []
      })
      console.log(response)
    }

    const edit = async () => {
      const response = await postMessage({
        func: 'edit',
        data: [{
          action: 'set',
          param: {
            elementId: currentNodeId.value,
            attribute: 'pname',
            value: 'g'
          }
        }]
      })
      console.log(response)
      const container = document.querySelector('.svg-pan-zoom_viewport')
      console.log(container)
      const newSvgStr = await postMessage({
        func: 'renderToSVG',
        data: [page.value, true]
      })
      console.log(newSvgStr)
      // const parser = new DOMParser()
      // const doc = parser.parseFromString(newSvgStr, 'image/svg+xml')
      // const svg = container.querySelector('svg')
      // console.log(svg)
      // console.log(doc.documentElement)
      // container.replaceChild(doc.documentElement, svg)
    }

    const getElementAttr = async () => {
      const response = await postMessage({
        func: 'getElementAttr',
        data: ['bxw0xpq']
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
    const handleKeyUp = async (e: KeyboardEvent) => { 
      console.log(e)
      if (e.code !== 'ArrowUp' && e.code !== 'ArrowDown' && e.code!== 'ArrowLeft' && e.code !== 'ArrowRight') return
      console.log(currentNodeId.value)
      const attr = await postMessage({
        func: 'getElementAttr',
        data: [currentNodeId.value]
      })
      if (e.code === 'ArrowUp') {
        console.log(attr)
      }
      if (e.code === 'ArrowDown') {
        console.log(attr)
      }
    }
    const handleSvgDom = () => {
      const nodes = document.getElementById('verovio-container' + '-' + random.value).querySelectorAll('g.note')
      console.log(nodes)
    }
    onMounted(() => {
      draw()
      window.addEventListener('resize', handleResize)
      window.addEventListener('keyup', handleKeyUp)
    })
    onBeforeUnmount(() => {
      verovioWorker.value.removeListener('ready', ready)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('keyup', handleKeyUp)
      verovioWorker.value.destroy()
    })
    return () => {
      return (
        <div class={ classes.value.verovio }>
          <div class={ classes.value.performance }>
            <canvas width={ '60' } height={ '60' } ref={ canvasRef }></canvas>
          </div>
          <span class={ classes.value.text }>{ id.value }</span>
          <button class={ classes.value.btn } onClick={ update.bind(this, 3, 6) }>updateSegmentedID</button>
          <button class={ classes.value.btn } onClick={ getOptions }>getOptions</button>
          <button class={ classes.value.btn } onClick={ getDefaultOptions }>getDefaultOptions</button>
          <button class={ classes.value.btn } onClick={ getMEI }>getMEI</button>
          <button class={ classes.value.btn } onClick={ edit }>edit</button>
          <button class={ classes.value.btn } onClick={ getElementAttr }>getElementAttr</button>
          <input ref={ fileInputRef } style={{ display: 'none' }} onChange={ handleFileChange } multiple={false} type={ 'file' } id={ 'fileInput' + '-' + random.value } />
          <label for={ 'fileInput' + '-' + random.value }>
            <button class={ classes.value.btn } onClick={ fileInputRef.value?.click.bind(document.getElementById('fileInput' + '-' + random.value)) }>choose musicXML</button>
          </label>
          <div class={ classes.value.verovioContainerWrapper }>
            <div class={ classes.value.verovioListContainer } id={ 'verovio-list-container' + '-' + random.value }>
              {
                renderResultList.value.map((item, index) => {
                  return (
                    <div
                      class={ classes.value.verovioListItem }
                      onClick={ handlePageChange.bind(this, index + 1) }
                      key={ index }
                    >
                      <div class={ classes.value.svgContainer } innerHTML={ item }></div>
                      <div class={ classes.value.pageNum }>{ index + 1 }</div>
                    </div>
                  )
                })
              }
            </div>
            {
              loading.value ?
              <div class={ classes.value.verovioContainer }>
                <LoadingSpinner class={ classes.value.verovioContainerSvg }></LoadingSpinner>
              </div> :
              <div class={ classes.value.verovioContainer }>
                <svg innerHTML={ svgRef.value } class={ classes.value.verovioContainerSvg } id={ 'verovio-container' + '-' + random.value }></svg>
              </div>
            }
          </div>
        </div>
      )
    }
  },
  components: {
    LoadingSpinner
  }
})

export default VerovioComponent
