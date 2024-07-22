<template>
  <!-- Display namespace only if it's not a library rule -->
  <span v-if="!node.data.lib">
    {{ node.data.namespace }}
  </span>
</template>

<script setup>
defineProps({
  node: {
    type: Object,
    required: true
  }
})
</script>
