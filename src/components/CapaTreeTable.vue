<template>
  <div class="card">
    <TreeTable
      :value="filteredTreeData"
      v-model:expandedKeys="allExpandedKeys"
      :expandable="(node) => node.children && node.children.length > 0 && !node.data.address"
      @node-expand="toggleNode"
      @node-collapse="toggleNode"
      size="small"
      :filters="filters"
      :filterMode="filterMode.value"
      sortField="namespace"
      :sortOrder="-1"
      :paginator="true"
      :rows="50"
      :rowsPerPageOptions="[5, 10, 25, 50]"
      removableSort
      :showGridlines="false"
      :indentation="2"
      v-model:selectionKeys="selectedNodeKeys"
      :row-hover="true"
    >
      <template #header>
        <div
          style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
          "
        >
          <Button icon="pi pi-expand" @click="toggleAll" label="Toggle All" />
          <MultiSelect
            :modelValue="visibleColumns"
            @update:modelValue="onToggle"
            :options="togglableColumns"
            optionLabel="header"
            class="w-full sm:w-64"
            display="chip"
            placeholder="Toggle columns"
          />
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

      <!-- Name column (always visible) -->
      <Column
        field="name"
        header="Rule"
        :sortable="true"
        :expander="true"
        filterMatchMode="contains"
      >
        <template #filter="{ filterModel, filterCallback }">
          <InputText
            v-model="filters['name']"
            type="text"
            @input="filterCallback()"
            placeholder="Filter by rule or feature"
          />
        </template>
        <template #body="slotProps">
          <div
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
            <span
              v-if="slotProps.node.data.description"
              style="font-style: none; font-size: 90%; font-weight: normal; color: grey"
            >
              {{ '  ' + slotProps.node.data.description }}
            </span>
            <Badge
              v-if="slotProps.node.data.matchCount > 1"
              :value="`${slotProps.node.data.matchCount} matches`"
              severity="contrast"
            ></Badge>
            <Tag
              v-if="slotProps.node.data.lib && slotProps.node.data.matchCount"
              class="info-tooltip"
              v-tooltip.top="{
                value: 'Library rules capture common logic',
                showDelay: 100,
                hideDelay: 100
              }"
              value="lib"
              severity="info"
            ></Tag>
          </div>
        </template>
      </Column>

      <Column
        v-for="col in visibleColumns"
        :key="col.field"
        :field="col.field"
        :header="col.header"
        :sortable="col.field !== 'source'"
        filterMatchMode="contains"
      >
        <!-- Filter template -->
        <template #filter="{ filterModel, filterCallback }" v-if="col.field !== 'source'">
          <InputText
            v-model="filters[col.field]"
            type="text"
            @input="filterCallback()"
            :placeholder="`Filter by ${col.header.toLowerCase()}`"
          />
        </template>

        <!-- Address column body template -->
        <template v-if="col.field === 'address'" #body="slotProps">
          {{ slotProps.node.data.address }}
        </template>

        <!-- Tactic column body template -->
        <template v-if="col.field === 'tactic'" #body="slotProps">
          <div v-if="slotProps.node.data.attack">
            <div v-for="(attack, index) in slotProps.node.data.attack" :key="index">
              <a :href="'https://attack.mitre.org/techniques/' + attack.id" target="_blank">
                {{ attack.tactic }} ({{ attack.id }})
              </a>
              <div
                v-for="(technique, techIndex) in attack.techniques"
                :key="techIndex"
                style="font-size: 0.8em; margin-left: 1em"
              >
                <a
                  :href="
                    'https://attack.mitre.org/techniques/' +
                    technique.id.split('.')[0] +
                    '/' +
                    technique.id.split('.')[1]
                  "
                  target="_blank"
                >
                  ↳ {{ technique.technique }} ({{ technique.id }})
                </a>
              </div>
            </div>
          </div>
        </template>

        <!-- Namespace column body template -->
        <template v-if="col.field === 'namespace'" #body="slotProps">
          <span v-if="!slotProps.node.data.lib">
            {{ slotProps.node.data.namespace }}
          </span>
        </template>

        <!-- Source column body template -->
        <template v-if="col.field === 'source'" #body="slotProps">
          <Button
            v-if="slotProps.node.data.source"
            icon="pi pi-external-link"
            @click="showSource(slotProps.node.data.source)"
          />
        </template>
      </Column>
    </TreeTable>

    <Dialog v-model:visible="sourceDialogVisible" :style="{ width: '50vw' }">
      <highlightjs autodetect :code="currentSource" />
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import TreeTable from 'primevue/treetable'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import Column from 'primevue/column'
import Button from 'primevue/button'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Badge from 'primevue/badge'
import MultiSelect from 'primevue/multiselect'

const props = defineProps({
  data: {
    type: Object,
    required: true
  },
  showLibraryRules: {
    type: Boolean,
    default: false
  }
})

const treeData = ref([])
const filters = ref({})
const filterMode = ref({ value: 'lenient' })
const sourceDialogVisible = ref(false)
const currentSource = ref('')
const expandedKeys = ref({})
const selectedNodeKeys = ref([])

const allExpandedKeys = computed(() => {
  const allKeys = { ...expandedKeys.value }

  const expandAllChildren = (node) => {
    if (node.children && node.children.length) {
      node.children.forEach((child) => {
        allKeys[child.key] = true
        expandAllChildren(child)
      })
    }
  }

  treeData.value.forEach((rootNode) => {
    if (expandedKeys.value[rootNode.key]) {
      expandAllChildren(rootNode)
    }
  })

  return allKeys
})

// Toggle individual root nodes
const toggleNode = (node) => {
  if (node.children && node.children.length > 0 && !node.data.address) {
    if (expandedKeys.value[node.key]) {
      delete expandedKeys.value[node.key]
    } else {
      expandedKeys.value[node.key] = true
    }
    expandedKeys.value = { ...expandedKeys.value }
  }
}

// All available columns
const togglableColumns = ref([
  { field: 'address', header: 'Address' },
  { field: 'tactic', header: 'ATT&CK Tactic' },
  { field: 'namespace', header: 'Namespace' },
  { field: 'source', header: 'Source' }
])

// Define initially visible columns
const visibleColumns = ref(togglableColumns.value)
// Define initially visible columns (excluding 'tactic')
// const visibleColumns = ref(allColumns.value.filter((col) => col.field !== 'tactic'))

const onToggle = (val) => {
  visibleColumns.value = togglableColumns.value.filter((col) => val.includes(col))
}

// Filter out the treeData for showing/hiding lib rules
const filteredTreeData = computed(() => {
  if (props.showLibraryRules) {
    return treeData.value // Return all data when showLibraryRules is true
  } else {
    // Filter out library rules when showLibraryRules is false
    const filterNode = (node) => {
      if (node.data && node.data.lib) {
        return false
      }
      if (node.children) {
        node.children = node.children.filter(filterNode)
      }
      return true
    }
    return treeData.value.filter(filterNode)
  }
})

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

const parseNode = (node, parentKey, index, rules, lib) => {
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
      lib: lib,
      address: getNodeAddress(processedNode),
      description: getNodeDescription(processedNode),
      namespace: null,
      matchCount: null,
      source: null
    },
    children: []
  }

  if (processedNode.children && Array.isArray(processedNode.children)) {
    result.children = processedNode.children
      .map((child, childIndex) => parseNode(child, key, childIndex, rules, lib))
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

const getNodeDescription = (node) => {
  if (node.node.statement) {
    return node.node.statement.description
  } else if (node.node.feature) {
    return node.node.feature.description
  } else {
    return null
  }
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

    return `${node.node.statement.type}: `
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
      return `operand[${node.node.feature.index}].offset: 0x${value.toString(16).toUpperCase()}`
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
      lib: rule.meta.lib,
      matchCount: rule.matches.length,
      namespace: rule.meta.namespace,
      address: null,
      source: rule.source,
      tactic: JSON.stringify(rule.meta.attack),
      attack: rule.meta.attack
        ? rule.meta.attack.map((attack) => ({
            tactic: attack.tactic,
            id: attack.id.includes('.') ? attack.id.split('.')[0] : attack.id,
            techniques: attack.subtechnique
              ? [{ technique: attack.subtechnique, id: attack.id }]
              : []
          }))
        : null
    },
    children: rule.matches
      .map((match, matchIndex) =>
        parseNode(match[1], index.toString(), matchIndex, rules, rule.meta.lib)
      )
      .filter((child) => child !== null)
  }))
}

// Expand/Collapse All nodes
const toggleAll = () => {
  const rootKeys = treeData.value.map((node) => node.key)
  const allExpanded = rootKeys.every((key) => expandedKeys.value[key])

  if (allExpanded) {
    expandedKeys.value = {}
  } else {
    expandedKeys.value = rootKeys.reduce((acc, key) => {
      acc[key] = true
      return acc
    }, {})
  }
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
.info-tooltip {
  margin-left: 10px;
}

a {
  text-decoration: none;
  color: inherit;
}

:deep(.p-treetable-tbody) tr:not([aria-level='1']) svg {
  display: none;
}
/* Optional: Add a subtle background to root-level rows for better distinction */
:deep(.p-treetable-tbody > tr[aria-level='1']) {
  background-color: #f9f9f9;
}

:deep(.p-treetable) .p-treetable-tbody > tr > td {
  border: none !important;
}
</style>
