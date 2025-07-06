import Hammer from 'hammerjs'

type CustomEventsHandler = {
  haltEventListeners: string[]
  hammer?: HammerManager
  init(options: SvgPanZoom.CustomEventOptions): void
  destroy(): void
}

const handler = {
  haltEventListeners: ['touchstart', 'touchend', 'touchmove', 'touchleave', 'touchcancel'],
  init: function (options) {
    const instance = options.instance
    let initialScale = 1
    let pannedX = 0
    let pannedY = 0
    
    this.hammer = new Hammer(options.svgElement, {
      inputClass: Hammer.TouchInput
    })
    
    this.hammer.get('pinch').set({ enable: true })
    
    this.hammer.on('doubletap', function (ev) {
      instance.zoomIn()
    })
    
    this.hammer.on('panstart panmove', function (ev) {
      if (ev.type === 'panstart') {
        pannedX = 0
        pannedY = 0
      }
      instance.panBy({ x: ev.deltaX - pannedX, y: ev.deltaY - pannedY })
      pannedX = ev.deltaX
      pannedY = ev.deltaY
    })
    
    this.hammer.on('pinchstart pinchmove', function (ev) {
      if (ev.type === 'pinchstart') {
        initialScale = instance.getZoom()
        instance.zoomAtPoint(initialScale * ev.scale, { x: ev.center.x, y: ev.center.y })
      }
      instance.zoomAtPoint(initialScale * ev.scale, { x: ev.center.x, y: ev.center.y })
    })
    
    options.svgElement.addEventListener('touchmove', (e) => {
      e.preventDefault()
    })
  },
  destroy: function () {
    this.hammer?.destroy()
  }
} as CustomEventsHandler

export default handler
