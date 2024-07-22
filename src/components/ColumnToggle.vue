<template>
  <div class="column-toggle">
    <MultiSelect
      v-model="selectedColumns"
      :options="options"
      optionLabel="header"
      placeholder="Toggle columns"
      :maxSelectedLabels="2"
      :selectedItemsLabel="`${selectedColumns.length} columns selected`"
      class="column-toggle-select"
    >
      <template #value="slotProps">
        <div class="column-toggle-value" v-if="slotProps.value">
          Columns: {{ slotProps.value.length }}
        </div>
        <div class="column-toggle-placeholder" v-else>
          {{ slotProps.placeholder }}
        </div>
      </template>
      <template #option="slotProps">
        <div class="column-toggle-option">
          <Checkbox
            :modelValue="selectedColumns.some((col) => col.field === slotProps.option.field)"
            :binary="true"
          />
          <span class="ml-2">{{ slotProps.option.header }}</span>
        </div>
      </template>
    </MultiSelect>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import MultiSelect from 'primevue/multiselect'
import Checkbox from 'primevue/checkbox'

// Define props for the component
const props = defineProps({
  modelValue: {
    type: Array,
    required: true
  },
  options: {
    type: Array,
    required: true
  }
})

// Define emits for the component
const emit = defineEmits(['update:modelValue', 'change'])

// Create a reactive reference for selected columns
const selectedColumns = ref(props.modelValue)

// Watch for changes in the modelValue prop
watch(
  () => props.modelValue,
  (newValue) => {
    selectedColumns.value = newValue
  }
)

// Watch for changes in the selectedColumns ref
watch(
  selectedColumns,
  (newValue) => {
    // Emit the update:modelValue event with the new value
    emit('update:modelValue', newValue)
    // Emit the change event with the new value
    emit('change', newValue)
  },
  { deep: true }
)
</script>

<style scoped>
.column-toggle {
  min-width: 14rem;
}

.column-toggle-select {
  width: 100%;
}

.column-toggle-value,
.column-toggle-placeholder {
  padding: 0.5rem;
}

.column-toggle-option {
  display: flex;
  align-items: center;
  padding: 0.5rem;
}
</style>
