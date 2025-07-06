import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { generateSegmentedID } from '@/utils/utils'

export const useSegmentedIDFactory = () => {
  return defineStore('segmentedID' + '_' + generateSegmentedID(3, 6), () => {
    const id = ref<string>('')
    const update = (segmentCount: number = 3, segmentLength: number = 6) => {
      id.value = generateSegmentedID(segmentCount, segmentLength)
    }

    return { id, update }
  })()
}

export const useSegmentedIDStore = defineStore('segmentedID', () => {
  const id = ref<string>('')
  const update = (segmentCount: number = 3, segmentLength: number = 6) => {
    id.value = generateSegmentedID(segmentCount, segmentLength)
  }

  return { id, update }
})

export const useSegmentedID = () => useSegmentedIDStore()
