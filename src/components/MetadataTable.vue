<script setup>
import { ref, onMounted } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Panel from 'primevue/panel'
import Tag from 'primevue/tag'
import Message from 'primevue/message'

const props = defineProps({
  data: {
    type: Object,
    required: true
  }
})

const metadata = ref([])
const ruleCount = ref(0)
const namespaceCount = ref(0)
const functionCount = ref(0)

const parseMetadata = () => {
  if (props.data) {
    metadata.value = [
      { key: 'MD5', value: props.data.meta.sample.md5.toUpperCase() },
      { key: 'SHA1', value: props.data.meta.sample.sha1.toUpperCase() },
      { key: 'SHA256', value: props.data.meta.sample.sha256.toUpperCase() },
      { key: 'Extractor', value: props.data.meta.analysis.extractor },
      { key: 'Analysis', value: props.data.meta.flavor },
      { key: 'OS', value: props.data.meta.analysis.os },
      { key: 'Format', value: props.data.meta.analysis.format },
      { key: 'Arch', value: props.data.meta.analysis.arch },
      { key: 'Path', value: props.data.meta.sample.path },
      {
        key: 'Base Address',
        value: '0x' + props.data.meta.analysis.base_address.value.toString(16).toUpperCase()
      },
      { key: 'Version', value: props.data.meta.version },
      { key: 'Timestamp', value: props.data.meta.timestamp },
      {
        key: 'Function Count',
        value: props.data.meta.analysis.feature_counts.functions.length
      }
    ]

    // Populate footer data
    ruleCount.value = Object.keys(props.data.rules).length
    namespaceCount.value = 'X'
    functionCount.value = props.data.meta.analysis.feature_counts.functions.length
  }
}

onMounted(() => {
  parseMetadata()
})

// const getColor = () => {
//   return 'success'
// }
</script>

<template>
  <Panel header="Program properties" toggleable>
    <DataTable :value="metadata" stripedRows size="small" tableStyle="min-width: 50rem">
      <Column field="key" header="Property">
        <template #body="slotProps">
          <span style="font-weight: bold">{{ slotProps.data.key }}</span>
        </template>
        ></Column
      >
      <Column field="value" header="Value">
        <template #body="slotProps">
          <Tag
            v-if="slotProps.data.key.toLowerCase() === 'extractor'"
            :value="slotProps.data.value"
            severity="info"
          />
          <Tag
            v-else-if="slotProps.data.key.toLowerCase() === 'os'"
            :value="slotProps.data.value"
            severity="info"
          />
          <Tag
            v-else-if="slotProps.data.key.toLowerCase() === 'analysis'"
            :value="slotProps.data.value"
            severity="info"
          />
          <Tag
            v-else-if="slotProps.data.key.toLowerCase() === 'format'"
            :value="slotProps.data.value"
            severity="info"
          />
          <Tag
            v-else-if="slotProps.data.key.toLowerCase() === 'arch'"
            :value="slotProps.data.value"
            severity="info"
          />
          <template v-else>
            {{ slotProps.data.value }}
          </template>
        </template>
      </Column>
      <template #footer>
        The sample matched
        <Tag :value="ruleCount + ' rules'" severity="danger" /> accross
        <Tag :value="namespaceCount + ' namespaces'" severity="danger" /> in
        <Tag :value="functionCount + ' functions'" severity="danger" />
      </template>
    </DataTable>
    <br />
    <Message severity="warn" icon="pi pi-exclamation-triangle" closable
      >Only XX.X% of all functions were identified as library functions via FLIRT. Results may
      contain false positives.</Message
    >
  </Panel>
</template>

<style scoped></style>
