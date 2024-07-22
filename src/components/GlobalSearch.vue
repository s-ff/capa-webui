<template>
  <div class="global-search">
    <span class="p-input-icon-left">
      <i class="pi pi-search" />
      <InputText
        v-model="searchQuery"
        placeholder="Global search"
        class="global-search-input"
        @input="onInput"
      />
    </span>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import InputText from 'primevue/inputtext'

// Define props for the component
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})

// Define emits for the component
const emit = defineEmits(['update:modelValue'])

// Create a reactive reference for the search query
const searchQuery = ref(props.modelValue)

// Watch for changes in the modelValue prop
watch(
  () => props.modelValue,
  (newValue) => {
    searchQuery.value = newValue
  }
)

// Handle input changes
const onInput = () => {
  emit('update:modelValue', searchQuery.value)
}
</script>

<style scoped>
.global-search {
  position: relative;
}

.global-search-input {
  padding-left: 2.5rem;
  min-width: 20rem;
}

/* Ensure the icon is properly positioned */
.p-input-icon-left > i:first-of-type {
  left: 0.75rem;
  color: #6c757d;
}
</style>
