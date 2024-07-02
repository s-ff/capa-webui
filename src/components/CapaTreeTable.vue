<template>
  <div class="card">
    <TreeTable
      :value="treeData"
      v-model:expandedKeys="expandedKeys"
      size="small"
      :filters="filters"
      :filterMode="filterMode.value"
      sortField="namespace"
      :sortOrder="-1"
      :paginator="true"
      :rows="10"
      :rowsPerPageOptions="[5, 10, 25, 50]"
      removableSort
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
          <Button icon="pi pi-expand" @click="toggleAllNodes" label="Toggle All" />

          <IconField>
            <InputIcon class="pi pi-search" />
            <InputText v-model="filters['global']" placeholder="Global Search" />
          </IconField>
        </div>
      </template>

      <Column field="name" header="Rule" sortable expander>
        <template #filter>
          <InputText v-model="filters['name']" type="text" placeholder="Filter by rule" />
        </template>
        <template #body="slotProps">
          {{ slotProps.node.data.name }}
          <Badge
            v-if="slotProps.node.data.matchCount > 1"
            :value="`${slotProps.node.data.matchCount} matches`"
            severity="contrast"
          ></Badge>
        </template>
      </Column>

      <Column field="address" sortable header="Address">
        <template #filter>
          <InputText v-model="filters['address']" type="text" placeholder="Filter by address" />
          <span
            class="address-tooltip"
            v-tooltip="
              'Features might match in multiple locations. Only the fist match location is shown.'
            "
          >
            <i class="pi pi-info-circle" />
          </span>
        </template>
      </Column>

      <Column field="namespace" sortable header="Namespace">
        <template #filter>
          <InputText v-model="filters['namespace']" type="text" placeholder="Filter by namespace" />
        </template>
        <template #body="slotProps">
          <Tag
            v-if="slotProps.node.data.namespace"
            :style="getNamespaceStyle(slotProps.node.data.namespace)"
          >
            {{ slotProps.node.data.namespace }}
          </Tag>
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import TreeTable from 'primevue/treetable'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import Column from 'primevue/column'
import Button from 'primevue/button'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Badge from 'primevue/badge'

const props = defineProps({
  data: {
    type: Object,
    required: true
  }
})

const treeData = ref([])
const filters = ref({})
const filterMode = ref({ value: 'lenient' })
const sourceDialogVisible = ref(false)
const currentSource = ref('')
const expandedKeys = ref({})

const showSource = (source) => {
  currentSource.value = source
  sourceDialogVisible.value = true
}

const parseNode = (node, parentKey, index, rules) => {
  if (!node || !node.success) return null

  const key = `${parentKey}-${index}`
  const result = {
    key,
    data: {
      name: getNodeName(node),
      address: getNodeAddress(node),
      namespace: null,
      matchCount: null,
      source: null
    },
    children: []
  }

  if (node.node.feature && node.node.feature.type === 'match') {
    const ruleName = node.node.feature.match
    const rule = rules[ruleName]
    if (rule) {
      result.data.source = rule.source
    }
  }

  if (node.children && Array.isArray(node.children)) {
    result.children = node.children
      .map((child, childIndex) => parseNode(child, key, childIndex, rules))
      .filter((child) => child !== null)
  }

  return result
}

const getNodeName = (node) => {
  if (node.node.statement) {
    return `${node.node.statement.type}`
  } else if (node.node.feature) {
    if (node.node.feature.type === 'number' || node.node.feature.type === 'offset') {
      const value = node.node.feature.number || node.node.feature.offset
      return `${node.node.feature.type}: 0x${value.toString(16).toUpperCase()}`
    } else {
      return `${node.node.feature.type}: ${node.node.feature[node.node.feature.type]}`
    }
  }
  return node.node.type || 'unknown'
}

const getNodeAddress = (node) => {
  if (node.locations && node.locations.length > 0 && node.locations[0].type === 'absolute') {
    return `0x${node.locations[0].value.toString(16).toUpperCase()}`
  }
  return null
}

const parseRules = (rules) => {
  return Object.entries(rules).map(([ruleName, rule], index) => ({
    key: index.toString(),
    data: {
      name: rule.meta.name,
      matchCount: rule.matches.length,
      namespace: rule.meta.namespace,
      address: null,
      source: rule.source
    },
    children: rule.matches
      .map((match, matchIndex) => parseNode(match[1], index.toString(), matchIndex, rules))
      .filter((child) => child !== null)
  }))
}

const namespaceColors = {
  'anti-analysis': { background: '#e0f2fe', text: '#075985' },
  collection: { background: '#fef3c7', text: '#92400e' },
  communication: { background: '#dcfce7', text: '#166534' },
  compiler: { background: '#fae8ff', text: '#86198f' },
  'data-manipulation': { background: '#e2e8f0', text: '#334155' },
  executable: { background: '#ffedd5', text: '#9a3412' },
  'host-interaction': { background: '#f1f5f9', text: '#475569' },
  impact: { background: '#fef2f2', text: '#991b1b' },
  internal: { background: '#e0e7ff', text: '#3730a3' },
  lib: { background: '#fdf4ff', text: '#9d174d' },
  linking: { background: '#f5f3ff', text: '#6b21a8' },
  'load-code': { background: '#fff7ed', text: '#c2410c' },
  'malware-family': { background: '#fae8ff', text: '#86198f' },
  nursery: { background: '#f4f4f5', text: '#44403c' },
  persistence: { background: '#fff1f2', text: '#9f1239' },
  runtime: { background: '#dbeafe', text: '#1e3a8a' },
  targeting: { background: '#f0fdf4', text: '#14532d' }
}

function getNamespaceStyle(namespace) {
  const rootNamespace = namespace.split('/')[0]
  const colors = namespaceColors[rootNamespace] || { background: '#f5f5f5', text: '#737373' }
  return {
    backgroundColor: colors.background,
    color: colors.text
  }
}

const initializeExpandedKeys = (data) => {
  const keys = {}
  const traverse = (node) => {
    if (node.children) {
      keys[node.key] = true
      node.children.forEach(traverse)
    }
  }
  data.forEach(traverse)
  expandedKeys.value = keys
}

const toggleAllNodes = () => {
  if (Object.keys(expandedKeys.value).length > 0) {
    // If there are expanded nodes, collapse all
    expandedKeys.value = {}
  } else {
    // If all nodes are collapsed, expand all
    initializeExpandedKeys(treeData.value)
  }
}

onMounted(() => {
  if (props.data && props.data.rules) {
    treeData.value = parseRules(props.data.rules)
    console.log('Parsed tree data:', treeData.value)
    initializeExpandedKeys(treeData.value)
  } else {
    console.error('Invalid data prop:', props.data)
  }
})
</script>

<style scoped>
.address-tooltip {
  margin-left: 10px;
}
</style>
