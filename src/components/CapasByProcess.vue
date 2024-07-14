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

    <template #footer>
      <div style="display: flex; justify-content: flex-start">
        <Button icon="pi pi-arrow-up" label="Go Up" severity="warn" @click="scrollToTop" />
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

    <Column field="matchcount" header="Rule Matches"></Column>

    <Column field="namespace" sortable header="Namespace" filterMatchMode="contains">
      <template #filter>
        <InputText v-model="filters['namespace']" type="text" placeholder="Filter by namespace" />
      </template>
    </Column>

    <Column field="source" header="Source">
      <template #body="slotProps">
        <Button
          v-if="slotProps.node.data.source"
          icon="pi pi-external-link"
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

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

const treeData = computed(() => {
  const data = []
  const processes = props.data.meta.analysis.layout.processes

  let processKey = 1

  for (const processInfo of processes) {
    const processName = processInfo.name
    const matchingRules = []

    for (const ruleId in props.data.rules) {
      const rule = props.data.rules[ruleId]

      if (!props.showLibraryRules && rule.meta.lib) {
        continue
      }

      if (rule.meta.scopes.dynamic === 'process') {
        const matches = rule.matches.filter(
          (match) =>
            match[0].type === 'process' &&
            match[0].value.every((addr) => processInfo.address.value.includes(addr))
        )

        if (matches.length > 0) {
          matchingRules.push({
            key: `${processName}-${matchingRules.length}`,
            data: {
              processname: `rule: ${rule.meta.name}`,
              type: 'rule',
              matchcount: null,
              namespace: rule.meta.namespace,
              procID: processInfo.address.value.join(', '),
              source: rule.source
            }
          })
        }
      }
    }

    if (matchingRules.length > 0) {
      data.push({
        key: `process-${processKey++}`,
        data: {
          processname: processName,
          type: 'process',
          matchcount: matchingRules.length,
          namespace: null,
          procID: processInfo.address.value.join(', '),
          source: null
        },
        children: matchingRules
      })
    }
  }

  return data
})
</script>
