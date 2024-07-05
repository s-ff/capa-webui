<template>
  <TreeTable
    :value="treeData"
    size="small"
    removableSort
    sortField="processname"
    :sortOrder="1"
    :paginator="true"
    :rows="10"
    :rowsPerPageOptions="[5, 10, 25, 50]"
    :expandedKeys="expandedKeys"
  >
    <template #header>
      <div style="margin-bottom: 16px; margin-left: 16px">
        <Button icon="pi pi-expand" @click="toggleAll" label="Toggle All" />
      </div>
    </template>
    <template #footer>
      <div style="display: flex; justify-content: flex-start">
        <Button icon="pi pi-arrow-up" label="Go Up" severity="warn" @click="scrollToTop" />
      </div>
    </template>
    <Column field="processname" sortable header="Process Name" expander>
      <template #body="slotProps">
        {{ slotProps.node.data.processname }}
        <Badge
          v-if="slotProps.node.data.matchcount > 1"
          :value="`${slotProps.node.data.matchcount} matches`"
          severity="contrast"
        ></Badge>
      </template>
    </Column>
    <Column field="matchcount" hidden header="Rule Matches"></Column>
    <Column field="firstmatchaddr" sortable header="PID"></Column>
    <Column field="namespace" sortable header="Namespace"></Column>

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
import Badge from 'primevue/badge'

const props = defineProps({
  data: {
    type: Object,
    required: true
  }
})

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

const sourceDialogVisible = ref(false)
const currentSource = ref('')

const showSource = (source) => {
  currentSource.value = source
  sourceDialogVisible.value = true
}

const treeData = computed(() => {
  const data = []
  const processes = props.data.meta.analysis.layout.processes

  for (const processInfo of processes) {
    const processName = processInfo.name
    const matchingRules = []

    for (const ruleId in props.data.rules) {
      const rule = props.data.rules[ruleId]

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
              matchcount: null,
              namespace: rule.meta.namespace,
              firstmatchaddr: processInfo.address.value.join(', '),
              source: rule.source
            }
          })
        }
      }
    }

    if (matchingRules.length > 0) {
      data.push({
        key: processName,
        data: {
          processname: processName,
          matchcount: matchingRules.length,
          namespace: null,
          firstmatchaddr: null,
          source: null
        },
        children: matchingRules
      })
    }
  }

  return data
})

// Expand All/Collapse All
const expandedKeys = ref({})

const toggleAll = () => {
  let _expandedKeys = {}

  if (Object.keys(expandedKeys.value).length === 0) {
    // If no nodes are expanded, expand all nodes
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
</script>
