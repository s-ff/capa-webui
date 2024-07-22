<template>
  <TreeTable
    :value="treeData"
    v-model:expandedKeys="expandedKeys"
    size="small"
    :filters="filters"
    :filterMode="filterMode.value"
    sortField="processname"
    :sortOrder="1"
    :paginator="true"
    :rows="10"
    :rowsPerPageOptions="[5, 10, 25, 50]"
    removableSort
    :showGridlines="false"
    :indentation="2"
    :row-hover="true"
  >
    <template #header>
      <div
        style="
          margin-bottom: 16px;
          margin-left: 16px;
          display: flex;
          justify-content: space-between;
        "
      >
        <Button icon="pi pi-expand" @click="toggleAll" label="Toggle All" />
        <IconField>
          <InputIcon class="pi pi-search" />
          <InputText v-model="filters['global']" placeholder="Global search" />
        </IconField>
      </div>
    </template>
    <Column field="processname" sortable header="Process Name" expander filterMatchMode="contains">
      <template #filter>
        <InputText
          style="width: 70%"
          v-model="filters['processname']"
          type="text"
          placeholder="Filter by process"
        />
      </template>
      <template #body="slotProps">
        <span v-if="slotProps.node.data.type === 'process'">
          {{
            `${slotProps.node.data.processname} (PID: ${slotProps.node.data.procID.split(', ')[0]}, PPID: ${slotProps.node.data.procID.split(', ')[1]})`
          }}
          <span v-if="slotProps.node.data.matchcount > 1" style="font-style: italic">
            - {{ slotProps.node.data.matchcount }} matches
          </span>
        </span>

        <span v-else>
          {{ slotProps.node.data.processname }}
        </span>
      </template>
    </Column>

    <Column field="namespace" sortable header="Namespace" filterMatchMode="contains">
      <template #filter>
        <InputText v-model="filters['namespace']" type="text" placeholder="Filter by namespace" />
      </template>
    </Column>

    <Column field="source" header="Source">
      <template #body="slotProps">
        <Button
          text
          raised
          rounded
          v-if="slotProps.node.data.source"
          icon="pi pi-external-link"
          size="small"
          severity="primary"
          class="custom-source-button"
          @click="showSource(slotProps.node.data.source)"
        />
      </template>
    </Column>
  </TreeTable>

  <Dialog v-model:visible="sourceDialogVisible" :style="{ width: '50vw' }">
    <pre>{{ currentSource }}</pre>
  </Dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import TreeTable from 'primevue/treetable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'

const props = defineProps({
  data: {
    type: Object,
    required: true
  },
  showCapabilitiesByProcess: {
    type: Boolean,
    default: false
  },
  showLibraryRules: {
    type: Boolean,
    default: false
  }
})

const filters = ref({})
const filterMode = ref({ value: 'lenient' })
const sourceDialogVisible = ref(false)
const currentSource = ref('')
const expandedKeys = ref({})

const showSource = (source) => {
  currentSource.value = source
  sourceDialogVisible.value = true
}

const toggleAll = () => {
  let _expandedKeys = {}
  if (Object.keys(expandedKeys.value).length === 0) {
    const expandAll = (node) => {
      if (node.children && node.children.length) {
        _expandedKeys[node.key] = true
        node.children.forEach(expandAll)
      }
    }

    treeData.value.forEach(expandAll)
  }
  expandedKeys.value = _expandedKeys
}

const mapMatchesToProcesses = (rules) => {
  const threadToProcess = {}
  const matchesByProcess = {}

  // Collect unique thread values and map them to processes
  for (const ruleName in rules) {
    const ruleData = rules[ruleName]
    for (const match of ruleData.matches) {
      const threadValue = match[0].value
      const threadKey = threadValue.join(',')
      if (!threadToProcess[threadKey]) {
        const processId = threadValue[0]
        threadToProcess[threadKey] = processId
      }
    }
  }

  // Group matches by process
  for (const ruleName in rules) {
    const ruleData = rules[ruleName]
    for (const match of ruleData.matches) {
      const threadValue = match[0].value
      const threadKey = threadValue.join(',')
      const processId = threadToProcess[threadKey]
      if (!matchesByProcess[processId]) {
        matchesByProcess[processId] = {}
      }
      if (!matchesByProcess[processId][ruleName]) {
        matchesByProcess[processId][ruleName] = []
      }
      matchesByProcess[processId][ruleName].push(match)
    }
  }

  return matchesByProcess
}

const treeData = computed(() => {
  const data = []
  const matchesByProcess = mapMatchesToProcesses(props.data.rules)

  for (const processId in matchesByProcess) {
    const processMatches = matchesByProcess[processId]
    const processNode = {
      key: `process-${processId}`,
      data: {
        processname: `Process ${processId}`,
        type: 'process',
        matchcount: Object.keys(processMatches).length,
        namespace: null,
        procID: processId,
        source: null
      },
      children: []
    }

    for (const ruleName in processMatches) {
      const ruleMatches = processMatches[ruleName]
      const rule = props.data.rules[ruleName]

      if (!props.showLibraryRules && rule.meta.lib) {
        continue
      }

      const ruleNode = {
        key: `${processId}-${ruleName}`,
        data: {
          processname: `rule: ${rule.meta.name}`,
          type: 'rule',
          matchcount: ruleMatches.length,
          namespace: rule.meta.namespace,
          procID: processId,
          source: rule.source
        }
      }

      processNode.children.push(ruleNode)
    }

    data.push(processNode)
  }

  return data
})
</script>
