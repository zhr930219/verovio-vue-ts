/// <reference types="vite/client" />
/// <reference types="vue" />


declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const VueComponent: DefineComponent<{}, {}, any>
  export default VueComponent
}

declare global {
  namespace JSX {
    interface ElementAttributesProperty {
      $props: {}
    }
    interface IntrinsicElements {
      [elem: string]: any
    }
  }
}
