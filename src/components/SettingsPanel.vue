<template>
  <Card>
    <template #content>
      <div class="settings-panel">
        <label for="viewing-options">Select a viewing mode:</label>
        <Dropdown
          id="viewing-options"
          v-model="selectedViewingOption"
          :options="viewingOptions"
          optionLabel="label"
          placeholder="Select a viewing mode"
          class="dropdown-field"
          @change="$emit('update:viewing-option', selectedViewingOption)"
        />
      </div>
    </template>
  </Card>
</template>

<script setup>
import { ref } from 'vue'
import Dropdown from 'primevue/dropdown'

const viewingOptions = ref([
  { label: 'Show capabilities', value: 'Show capabilities' },
  { label: 'Show capabilities by function', value: 'Show capabilities by function' }
])

const selectedViewingOption = ref('Show capabilities') // Default option is: Show capabilities
</script>

<style scoped>
.settings-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dropdown-field {
  width: 100%;
}

@media (min-width: 768px) {
  .dropdown-field {
    width: 14rem;
  }
}
</style>
