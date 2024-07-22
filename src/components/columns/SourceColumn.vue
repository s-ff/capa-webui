<template>
  <!-- Display a button to show source code if available -->
  <Button
    v-if="node.data.source"
    text
    raised
    rounded
    icon="pi pi-external-link"
    size="small"
    severity="primary"
    class="custom-source-button"
    @click="$emit('showSource', node.data.source)"
  />
</template>

<script setup>
import Button from 'primevue/button'

defineProps({
  node: {
    type: Object,
    required: true
  }
})

// Define emit event showSource, which will be used to show source code inside of a Dialog
// when the button is clicked, i.e. @click="$emit('showSource', node.data.source')"
defineEmits(['showSource'])
</script>

<style scoped>
/* styling for the source button */
.custom-source-button {
  padding: 0 !important;
  height: 1.5rem !important;
  width: 1.5rem !important;
}

.custom-source-button :deep(.p-button-icon) {
  font-size: 0.8rem;
}
</style>
