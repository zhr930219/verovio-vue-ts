<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useSegmentedID } from '@/stores/segmentedID'
// import VerovioViewer from './components/VerovioViewer.vue'
import VerovioViewer from './components/VerovioComponent.tsx'
// import VerovioViewer from './components/VerovioComponent.vue'
const active = ref(true)
const store = useSegmentedID()
const { update } = store
const { id } = storeToRefs(store)
const handleChange = (value: boolean) => {
  update()
}
const change = () => {
  active.value = !active.value
}
onMounted(() => {
  update()
})
</script>

<template>
  <!-- <div class="box">
    <button class="btn" @click="change()">change</button>
  </div> -->
  <!-- <div class="box" v-if="active"><span class="text">{{ id }}</span></div> -->
  <div class="app-container">
    <VerovioViewer v-if="active" />
    <!-- <VerovioViewer v-if="active" /> -->
  </div>
</template>

<style scoped>
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
