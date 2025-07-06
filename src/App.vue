<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useSegmentedID } from '@/stores/segmentedID'
// import VerovioViewer from './components/VerovioViewer.vue'
// import VerovioViewer from './components/VerovioComponent.tsx'
import VerovioViewer from './components/VerovioComponent.vue'
const active = ref(true)
const store = useSegmentedID()
const { update } = store
const { id } = storeToRefs(store)
const handleChange = (value: boolean) => {
  update()
}
onMounted(() => {
  update()
})
</script>

<template>
  <!-- <div class="box"></div>
  <div class="box" v-if="active"><span class="text">{{ id }}</span></div> -->
  <div class="app-container">
    <VerovioViewer v-if="active" />
  </div>
</template>

<style scoped>
.box {
  margin: 10px;
}
.box .text {
  color: #2c3e50;
}
.app-container {
  height: 100%;
  width: 100%;
}
</style>
