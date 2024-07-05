<script setup>
import { ref, onMounted, computed } from 'vue'
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
const functionCount = ref(null)
const processCount = ref(null)
const libRatio = ref(0)

const MIN_LIBFUNCS_RATIO = 0.4 // Adjust this value as needed

const parseMetadata = () => {
  if (props.data) {
    const version = props.data.meta.version
    const analysisData =
      version === '7.0.0' ? props.data.meta.static_analysis : props.data.meta.analysis

    metadata.value = [
      { key: 'MD5', value: props.data.meta.sample.md5.toUpperCase() },
      { key: 'SHA1', value: props.data.meta.sample.sha1.toUpperCase() },
      { key: 'SHA256', value: props.data.meta.sample.sha256.toUpperCase() },
      { key: 'Extractor', value: analysisData.extractor },
      { key: 'Analysis', value: props.data.meta.flavor },
      { key: 'OS', value: analysisData.os },
      { key: 'Format', value: analysisData.format },
      { key: 'Arch', value: analysisData.arch },
      { key: 'Path', value: props.data.meta.sample.path },
      { key: 'Version', value: props.data.meta.version },
      { key: 'Timestamp', value: props.data.meta.timestamp }
    ]
    props.data.meta.flavor === 'static'
      ? metadata.value.push(
          {
            key: 'Base Address',
            value:
              version === '7.0.0' && props.data.meta.flavor === 'static'
                ? '0x' + analysisData.base_address.v.u.toString(16).toUpperCase()
                : '0x' + analysisData.base_address.value.toString(16).toUpperCase()
          },
          {
            key: 'Function Count',
            value: analysisData.feature_counts.functions.length
          }
        )
      : metadata.value.push({
          key: 'Process Count',
          value: analysisData.feature_counts.processes.length
        })

    // Populate footer data
    ruleCount.value = Object.keys(props.data.rules).length
    // Count distinct namespaces
    const namespaces = new Set()
    for (const rule of Object.values(props.data.rules)) {
      namespaces.add(rule.meta.namespace)
    }
    namespaceCount.value = namespaces.size

    // Calculate the ratio of library functions
    props.data.meta.flavor === 'static'
      ? (functionCount.value = analysisData.feature_counts.functions.length)
      : (processCount.value = analysisData.feature_counts.processes.length)

    const nLibs = analysisData.library_functions.length
    const nFuncs = analysisData.feature_counts.functions.length
    libRatio.value = nFuncs + nLibs > 0 ? nLibs / (nFuncs + nLibs) : 0
  }
}

const showLibFuncWarning = computed(() => {
  return props.data.meta.flavor === 'static' && libRatio.value < MIN_LIBFUNCS_RATIO
})

const libFuncWarningText = computed(() => {
  return libRatio.value === 0
    ? 'No functions were identified as library functions via FLIRT. Results may contain false positives.'
    : `Only ${(libRatio.value * 100).toFixed(2)}% of all functions were identified as library functions via FLIRT. Results may contain false positives.`
})

const countLabel = computed(() => {
  if (props.data.meta.flavor === 'static') {
    return `${functionCount.value} functions`
  } else {
    return `${processCount.value} processes`
  }
})

onMounted(() => {
  parseMetadata()
})

// const getColor = () => {
//   return 'success'
// }
</script>

<template>
  <Panel header="Program properties (now hidden by default)" toggleable collapsed>
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
        <Tag :value="countLabel" severity="danger" />
      </template>
    </DataTable>
    <br />
    <Message v-if="showLibFuncWarning" severity="warn" icon="pi pi-exclamation-triangle" closable>
      {{ libFuncWarningText }}
    </Message>
  </Panel>
</template>

<style scoped></style>
