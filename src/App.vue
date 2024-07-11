<template>
  <header>
    <div class="wrapper">
      <BannerHeader />
      <NavBar />
    </div>
  </header>
  <RouterView />
</template>

<script setup>
import { RouterView } from 'vue-router'
import NavBar from './components/NavBar.vue'
import BannerHeader from './components/BannerHeader.vue'
</script>

<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}
</style>
