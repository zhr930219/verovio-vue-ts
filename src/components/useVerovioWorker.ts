import { ref, type Ref } from 'vue'
import { omit, generateSegmentedID } from '@/utils/utils'
import type { toolkit } from 'verovio'

export class Deferred {
  func: keyof toolkit | '' = ''
  promise: Promise<any> | null = null
  reject: (reason?: any) => void = () => {}
  resolve: (value?: any) => void = () => {}
  constructor (func: keyof toolkit) {
    this.func = func
    this.promise = new Promise((resolve, reject) => {
      this.reject = reject
      this.resolve = resolve
    })
  }
}
type MessageArgs = {
  [K in keyof toolkit]: {
    func: K
    data: Parameters<toolkit[K]>
    key?: string,
    deferred?: Deferred,
    callback?: (data: any) => void
  }
}[keyof toolkit]

export class VerovioWorker {
  worker: Worker = new Worker(new URL('@/components/verovioWorker.ts', import.meta.url), { type: 'module' })
  msgList: MessageArgs[] = []
  listeners = new Map<string, Function[]>()

  constructor() {
    console.log(this.worker)
    this.init(this.worker)
  }

  init(worker: Worker) {
    worker.onmessage = (e) => {
      // console.log(e)
      const { data, func, key } = e.data
      const callbacks = this.listeners.get(func)
      if (callbacks) {
        callbacks.forEach((callback) => {
          callback(data, func, key)
        })
      }
      const msgItemIdx = this.msgList.findIndex((item) => item.key === key)
      if (msgItemIdx > -1) {
        const deferred = this.msgList[msgItemIdx].deferred
        if (deferred) {
          deferred.resolve(data)
        }
        this.msgList.splice(msgItemIdx, 1)
      }
    }
    worker.onerror = (error) => {
      console.error(error)
    }
  }

  addListener(func: string, callback: (data: any, func: string, key: string) => void) {
    this.listeners.has(func) || this.listeners.set(func, [])
    this.listeners.get(func)!.push(callback)
  }

  removeListener(func: string, callback: (data: any, func: string, key: string) => void) {
    const callbacks = this.listeners.get(func)
    if (callbacks) {
      const index = callbacks.reduce((i, listener, index) => {
        return listener === callback ? index : i
      }, -1)
      if (index > -1) {
        callbacks.splice(index, 1)
        this.listeners.set(func, callbacks)
      }
    }
  }
  postMessage<T extends keyof toolkit>(data: MessageArgs) {
    const deferred = new Deferred(data.func)
    if (!data.key) {
      data.key = generateSegmentedID(3, 6)
    }
    this.worker.postMessage(omit(data, ['deferred']))
    this.msgList.push(Object.assign(data, { deferred }))
    return deferred.promise as Promise<ReturnType<toolkit[T]>>
  }
  destroy() {
    this.worker.terminate()
    this.msgList = []
    this.listeners = new Map()
    this.worker = {} as Worker
  }
}

export const useVerovioWorker = (): VerovioWorker => {
  const worker = new VerovioWorker()
  return worker
}
