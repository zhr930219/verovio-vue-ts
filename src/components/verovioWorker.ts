import { VerovioToolkit } from 'verovio/esm'
import createVerovioModule from 'verovio/wasm'
const VerovioModule = await createVerovioModule()
const verovioToolkit = new VerovioToolkit(VerovioModule)
import type { toolkit } from 'verovio'
type EventDataArgs = {
  [K in keyof toolkit]: {
    func: K
    data: Parameters<toolkit[K]>
    key: string
  }
}[keyof toolkit]
type ObjectType =
  | 'Object'
  | 'Array'
  | 'Function'
  | 'Date'
  | 'RegExp'
  | 'Error'
  | 'Promise'
  | 'Map'
  | 'Set'
  | 'WeakMap'
  | 'WeakSet'
  | 'ArrayBuffer'
  | 'DataView'
  | 'Int8Array'
  | 'Uint8Array'
  | 'Uint8ClampedArray'
  | 'Int16Array'
  | 'Uint16Array'
  | 'Int32Array'
  | 'Uint32Array'
  | 'Float32Array'
  | 'Float64Array'
  | 'AsyncFunction'
  | 'GeneratorFunction'
  | 'Symbol'
  | 'BigInt'
  | 'Null'
  | 'Undefined'
  | 'String'
  | 'Number'
  | 'Boolean'

type ObjectTypeMap = {
  Object: object
  Array: any[]
  Function: Function
  String: string
  Number: number
  Boolean: boolean
  Null: null
  Undefined: undefined
  Date: Date
  RegExp: RegExp
  Error: Error
  Promise: Promise<any>
  Map: Map<any, any>
  Set: Set<any>
  WeakMap: WeakMap<object, any>
  WeakSet: WeakSet<object>
  ArrayBuffer: ArrayBuffer
  DataView: DataView
  Int8Array: Int8Array
  Uint8Array: Uint8Array
  Uint8ClampedArray: Uint8ClampedArray
  Int16Array: Int16Array
  Uint16Array: Uint16Array
  Int32Array: Int32Array
  Uint32Array: Uint32Array
  Float32Array: Float32Array
  Float64Array: Float64Array
  AsyncFunction: Function
  GeneratorFunction: Function
  Symbol: symbol
  BigInt: bigint
}
const getProp = <T, K extends keyof T>(obj: T, key: K): T[K] => {
  return obj[key]
}
const isType = <T extends ObjectType>(value: any, type: T): value is ObjectTypeMap[T] => {
  return Object.prototype.toString.call(value).slice(8, -1) === type
}

const destroy = () => {
  console.log('destroy')
  self.removeEventListener('message', handleMessage)
  verovioToolkit.destroy()
}
const postMessage = ({ func, data, key }: { func: string; data: any; key: string }) => {
  self.postMessage({ func, data, key })
}
const handleMessage = async (event: { data: EventDataArgs }) => {
  const { func, data, key } = event.data  as EventDataArgs
  // console.log(data, type)
  if (func === 'destroy') {
    destroy()
  }
  if (isType(verovioToolkit[func], 'Function')) {
    // @ts-ignore
    const result: ReturnType<typeof verovioToolkit[typeof func]> = verovioToolkit[func](...data)
    postMessage({ func, data: result, key })
  } else if (isType(verovioToolkit[func], 'Promise')) {
    // @ts-ignore
    const result: Awaited<ReturnType<typeof verovioToolkit[typeof func]>> = await verovioToolkit[func](...data)
    postMessage({ func, data: result, key })
  }
}

self.addEventListener('message', handleMessage)

self.postMessage({ func: 'ready', data: Object.keys(VerovioToolkit) })
