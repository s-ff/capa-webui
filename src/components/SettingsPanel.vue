<template>
  <Card>
    <template #content>
      <div class="settings-panel">
        <div class="checkbox-container">
          <Checkbox
            v-model="showCapabilitiesByFunctionOrProcess"
            inputId="showCapabilitiesByFunctionOrProcess"
            :binary="true"
          />
          <label for="showCapabilitiesByFunctionOrProcess">{{ capabilitiesLabel }}</label>
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
import { ref, computed, watch } from 'vue'
import Checkbox from 'primevue/checkbox'

const props = defineProps({
  flavor: {
    type: String,
    required: true
  }
})

const showCapabilitiesByFunctionOrProcess = ref(false)
const showLibraryRules = ref(false)

const emit = defineEmits([
  'update:show-capabilities-by-function-or-process',
  'update:show-library-rules'
])

const capabilitiesLabel = computed(() => {
  return props.flavor === 'static'
    ? 'Show capabilities by function'
    : 'Show capabilities by process'
})

watch(showCapabilitiesByFunctionOrProcess, (newValue) => {
  emit('update:show-capabilities-by-function-or-process', newValue)
})

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
