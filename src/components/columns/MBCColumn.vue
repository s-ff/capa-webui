<template>
  <!-- iterate over the node.data.mbc object, and construct the column text -->
  <div v-if="node.data.mbc">
    <!-- Display each MBC entry, seperated by :: ending with [id] -->
    <div v-for="(mbc, index) in node.data.mbc" :key="index" class="mbc-entry">
      {{ `${mbc.objective}::${mbc.behavior}::${mbc.method} [${mbc.id}]` }}
    </div>
  </div>
</template>

<script setup>
defineProps({
  node: {
    type: Object,
    required: true
  }
})
</script>

<style scoped>
/* style for the mbc-entry div */
.mbc-entry {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
