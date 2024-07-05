<template>
  <div v-if="showBanner" class="banner">
    <div class="banner-title">This is a pre-alpha release</div>
    <div class="banner-description">
      <span>Please report any bugs, enhacements or features in the </span>
    </div>
    <a v-ripple href="https://github.com/mandiant/capa/issues" class="learn-more-link">
      <span>Github issues</span>
      <i id="github-icon" class="pi pi-github"></i>
    </a>
    <a v-ripple class="close-button" @click="closeBanner">
      <i class="pi pi-times"></i>
    </a>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const showBanner = ref(true)

const closeBanner = () => {
  showBanner.value = false
}
</script>

<style scoped>
.banner {
  background-color: #263238; /* bg-bluegray-900 */
  color: #f3f4f6; /* text-gray-100 */
  padding: 0.75rem; /* p-3 */
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
}

.banner-title {
  font-weight: bold;
  margin-right: 2rem; /* mr-8 */
}

.banner-description {
  display: none;
  align-items: center;
  line-height: 1.5; /* line-height-3 */
}

.learn-more-link {
  display: flex;
  align-items: center;
  margin-left: 0.5rem; /* ml-2 */
  margin-right: 2rem; /* mr-8 */
  color: white;
  text-decoration: none;
}

.learn-more-link span {
  font-weight: bold;
}

.close-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  color: #f9fafb; /* text-gray-50 */
  cursor: pointer;
  transition: background-color 0.15s;
}

.close-button:hover {
  background-color: #455a64; /* bg-bluegray-700 */
}

@media (min-width: 1024px) {
  /* lg breakpoint */
  .banner {
    justify-content: center;
  }

  .banner-description {
    display: flex;
  }
}

#github-icon {
  margin-left: 10px;
}
</style>
