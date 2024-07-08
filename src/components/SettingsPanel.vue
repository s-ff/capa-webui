<template>
  <Card>
    <template #content>
      <div class="settings-panel">
        <div class="checkbox-container">
          <label for="viewing-options" style="width: 100%">Select a viewing mode: </label>
          <Dropdown
            id="viewing-options"
            v-model="selectedViewingOption"
            :options="viewingOptions"
            optionLabel="label"
            placeholder="Select a viewing mode"
            class="dropdown-field"
            @change="emitViewingOption"
          />
        </div>
        <div class="checkbox-container">
          <Checkbox v-model="showLibraryRules" inputId="showLibraryRules" :binary="true" />
          <label for="showLibraryRules">Show library rules</label>
        </div>
      </div>
    </template>
  </Card>
</template>

<script setup>
import { ref, watch } from 'vue'
import Dropdown from 'primevue/dropdown'
import Checkbox from 'primevue/checkbox'

const viewingOptions = [
  { label: 'Show capabilities', value: 'Show capabilities' },
  { label: 'Show capabilities by function', value: 'Show capabilities by function' }
]

const selectedViewingOption = ref('Show capabilities')
const showLibraryRules = ref(false)

const emit = defineEmits(['update:viewing-option', 'update:show-library-rules'])

const emitViewingOption = () => {
  emit('update:viewing-option', selectedViewingOption.value)
}

watch(showLibraryRules, (newValue) => {
  emit('update:show-library-rules', newValue)
})
</script>

<style scoped>
.settings-panel {
  display: flex;
  align-items: center;
  flex-direction: row;
  gap: 10px;
}

.dropdown-field {
  width: 100%;
}

.checkbox-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
}
/* 
@media (min-width: 768px) {
  .dropdown-field {
    width: 14rem;
  }
} */
</style>
