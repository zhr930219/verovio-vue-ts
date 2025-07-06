import svgPanZoom from 'svg-pan-zoom'
import { onMounted, ref, shallowRef, watch, onBeforeUnmount } from 'vue'
import type { Ref, ShallowRef } from 'vue'
export const useSvgPanZoom = (
  containerId: SVGElement['id'],
  options: SvgPanZoom.Options = {}
) => {
  const svgPanZoomInstance = svgPanZoom('#' + containerId, options)
  return svgPanZoomInstance
}
