<script setup lang="ts"></script>

<template>
  <div class="loading-spinner-container">
    <svg
      class="loading-spinner"
      viewBox="0 0 38 38"
      xmlns="http://www.w3.org/2000/svg"
      width="100"
      height="100"
      stroke="#e8e8e8"
    >
      <g fill="none" fill-rule="evenodd">
        <g transform="translate(1 1)" stroke-width="2">
          <circle stroke-opacity=".25" cx="18" cy="18" r="18" />
          <path d="M36 18c0-9.94-8.06-18-18-18"></path>
        </g>
      </g>
    </svg>
  </div>
</template>
<style scoped>
.loading-spinner-container {
  display: flex;
  justify-content: center;
  align-items: center;
}
.loading-spinner {
  animation: spin-animation 0.8s infinite linear;
}
@keyframes spin-animation {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>
