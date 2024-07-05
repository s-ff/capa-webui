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
      :showGridlines="false"
      :indentation="2"
      v-model:selectionKeys="selectedNodeKeys"
      selectionMode="checkbox"
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
            <InputText v-model="filters['global']" placeholder="Global Search" />
          </IconField>
        </div>
      </template>

      <template #footer>
        <div style="display: flex; justify-content: flex-start">
          <Button icon="pi pi-arrow-up" label="Go Up" severity="warn" @click="scrollToTop" />
        </div>
      </template>

      <Column field="name" header="Rule" sortable expander filterMatchMode="contains">
        <template #filter>
          <InputText
            style="width: 70%"
            v-model="filters['name']"
            type="text"
            placeholder="Filter by rule or nested feature"
          />
        </template>
        <template #body="slotProps">
          <span
            :style="{
              color:
                !slotProps.node.children || slotProps.node.children.length === 0
                  ? 'green'
                  : 'inherit',
              fontWeight:
                slotProps.node.children &&
                slotProps.node.children.length > 0 &&
                slotProps.node.key.includes('-')
                  ? 'bold'
                  : 'normal'
            }"
          >
            {{ slotProps.node.data.name }}
          </span>
          <Badge
            v-if="slotProps.node.data.matchCount > 1"
            :value="`${slotProps.node.data.matchCount} matches`"
            severity="contrast"
          ></Badge>
        </template>
      </Column>

      <Column field="address" sortable header="Address" filterMatchMode="contains">
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

      <Column field="namespace" sortable header="Namespace" filterMatchMode="contains">
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
const selectedNodeKeys = ref([])

const showSource = (source) => {
  currentSource.value = source
  sourceDialogVisible.value = true
}

const invertNotStatementSuccess = (node) => {
  if (!node) return null

  // Create a new object, keeping the parent node's success as is
  const invertedNode = {
    ...node,
    children: node.children
      ? node.children.map((child) => ({
          ...child,
          success: !child.success, // Invert success for children
          children: child.children ? invertNotStatementSuccess(child).children : []
        }))
      : []
  }

  return invertedNode
}

const parseNode = (node, parentKey, index, rules) => {
  if (!node) return null

  const isNotStatement = node.node.statement && node.node.statement.type === 'not'

  // Handle 'not' statements by creating a new object with inverted success values for children
  const processedNode = isNotStatement ? invertNotStatementSuccess(node) : node

  // If it's not successful, return null
  if (!processedNode.success) {
    return null
  }

  const key = `${parentKey}-${index}`
  const result = {
    key,
    data: {
      success: processedNode.success,
      name: getNodeName(processedNode),
      address: getNodeAddress(processedNode),
      namespace: null,
      matchCount: null,
      source: null
    },
    children: []
  }

  if (processedNode.children && Array.isArray(processedNode.children)) {
    result.children = processedNode.children
      .map((child, childIndex) => parseNode(child, key, childIndex, rules))
      .filter((child) => child !== null)
  }

  if (processedNode.node.feature && processedNode.node.feature.type === 'match') {
    const ruleName = processedNode.node.feature.match
    const rule = rules[ruleName]
    if (rule) {
      result.data.source = rule.source
    }
    // TODO(s-ff): should match statement be expandable? if yes remove this
    result.children = []
  }

  // Handle optional statements
  if (processedNode.node.statement && processedNode.node.statement.type === 'optional') {
    // if the optional statement has no children, do not render it
    if (result.children.length === 0) return null
  }

  return result
}

const getNodeName = (node) => {
  // statements (or, and, optional, ... etc)
  if (node.node.statement) {
    if (node.node.statement.type === 'subscope') {
      return `${node.node.statement.type}: ${node.node.statement.scope}`
    } else if (node.node.statement.type === 'range') {
      const { child, min, max } = node.node.statement
      const { type, [type]: value } = child

      //let rangeType = `count(${type}(${value}))`
      let rangeType = value ? `count(${type}(${value}))` : `count(${type})`
      let rangeValue = ''

      if (min === max) {
        rangeValue = `${min}`
      } else if (max >= Number.MAX_SAFE_INTEGER) {
        // this is the infinity case
        rangeValue = `${min} or more`
      } else {
        // this is when a range is specified
        rangeValue = `between ${min} and ${max}`
      }

      return `${rangeType}: ${rangeValue} `
    } else if (node.node.statement.type === 'some') {
      return `${node.node.statement.count} or more`
    }

    return `${node.node.statement.type}`
    // features (api, some, range, regex, ... etc)
  } else if (node.node.feature) {
    if (node.node.feature.type === 'number') {
      const value = node.node.feature.number
      return `${node.node.feature.type}: 0x${value.toString(16).toUpperCase()}`
    } else if (node.node.feature.type === 'offset') {
      const value = node.node.feature.offset
      return `${node.node.feature.type}: 0x${value.toString(16).toUpperCase()}`
    } else if (node.node.feature.type === 'operand offset') {
      const value = node.node.feature.operand_offset
      return `operand[${node.node.feature.index}].offset: 0x${value.toString(16).toUpperCase()} = ${node.node.feature.description}`
    } else {
      return `${node.node.feature.type}: ${node.node.feature[node.node.feature.type]}`
    }
  }
  return node.node.type || 'unknown'
}

const getNodeAddress = (node) => {
  if (node.locations && node.locations.length > 0 && node.locations[0].type === 'absolute') {
    return `0x${node.locations[0].value.toString(16).toUpperCase()}`
    // return props.data.meta.version === '7.0.0'
    //   ? 'TODO'
    //   : `0x${node.locations[0].value.toString(16).toUpperCase()}`
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

// Expand All/Collapse All
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

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

onMounted(() => {
  if (props.data && props.data.rules) {
    treeData.value = parseRules(props.data.rules)
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
