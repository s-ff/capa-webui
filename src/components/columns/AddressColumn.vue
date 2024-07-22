<template>
  <span>{{ node.data.address }}</span>
</template>

<script setup>
defineProps({
  node: {
    type: Object,
    required: true
  }
})
</script>
