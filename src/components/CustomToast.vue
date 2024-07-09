<template>
  <Toast position="bottom-center" group="bc" @close="onClose">
    <template #message="slotProps">
      <div class="toast-content">
        <div class="toast-header">
          <i :class="iconClass(slotProps.message.severity)"></i>
          <span class="toast-summary">{{ slotProps.message.summary }}</span>
        </div>
        <div class="toast-detail">{{ slotProps.message.detail }}</div>
      </div>
    </template>
  </Toast>
</template>

<script setup>
import Toast from 'primevue/toast'

const emit = defineEmits(['close'])

const onClose = () => {
  emit('close')
}

const iconClass = (severity) => {
  const baseClass = 'pi mr-2 toast-icon'
  switch (severity) {
    case 'success':
      return `${baseClass} pi-check`
    case 'info':
      return `${baseClass} pi-info-circle`
    case 'warn':
      return `${baseClass} pi-exclamation-triangle`
    case 'error':
      return `${baseClass} pi-times-circle`
    default:
      return `${baseClass} pi-info-circle`
  }
}
</script>

<style scoped>
.toast-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1 1 auto;
}

.toast-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.toast-icon {
  font-size: 1.5rem;
}

.toast-summary {
  font-weight: bold;
}

.toast-detail {
  font-size: 1.125rem;
  font-weight: 500;
  margin-top: 1rem;
  margin-bottom: 1rem;
}

:deep(.p-toast-message-success .toast-icon) {
  color: #22c55e;
}

:deep(.p-toast-message-info .toast-icon) {
  color: #3b82f6;
}

:deep(.p-toast-message-warn .toast-icon) {
  color: #f59e0b;
}

:deep(.p-toast-message-error .toast-icon) {
  color: #ef4444;
}
</style>
