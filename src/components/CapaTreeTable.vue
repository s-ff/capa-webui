<template>
  <div class="card">
    <TreeTable
      :value="filteredTreeData"
      v-model:expandedKeys="expandedKeys"
      size="small"
      :filters="filters"
      :filterMode="filterMode.value"
      sortField="namespace"
      :sortOrder="-1"
      removableSort
      :showGridlines="false"
      :indentation="2"
      v-model:selectionKeys="selectedNodeKeys"
      :row-hover="true"
      :style="{
        'font-size': '0.9rem',
        'line-height': '1.2',
        '--row-height': '1rem'
      }"
      :pt="{
        bodyRow: { style: 'height: var(--row-height);' },
        bodyCell: { style: 'padding: 0.15rem 0.5rem;' }
      }"
      @node-expand="onNodeExpand"
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
          <div style="display: flex; align-items: center; flex-direction: row; gap: 10px">
            <label>Toggle columns:</label>
            <MultiSelect
              :modelValue="visibleColumns"
              @update:modelValue="onToggle"
              :options="togglableColumns"
              optionLabel="header"
              class="w-full sm:w-64"
              display="chip"
              placeholder="Toggle columns"
            />
          </div>
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
        <template #filter>
          <InputText
            v-model="filters['name']"
            type="text"
            placeholder="Filter by Rule or Feature"
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
            <span v-if="slotProps.node.data.matchCount > 1" style="font-style: italic">{{
              `(${slotProps.node.data.matchCount} matches)`
            }}</span>

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
        :header="
          props.data.meta.flavor === 'dynamic' && col.field === 'address' ? 'Process' : col.header
        "
        :sortable="col.field !== 'source'"
        filterMatchMode="contains"
      >
        <!-- Filter template -->
        <template #filter v-if="col.field !== 'source'">
          <InputText
            v-model="filters[col.field]"
            type="text"
            :placeholder="`Filter by ${col.header}`"
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
                {{ attack.technique }} ({{ attack.id }})
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

        <!-- MBC column body template -->
        <template v-if="col.field === 'mbc'" #body="slotProps">
          <div v-if="slotProps.node.data.mbc">
            <div v-for="(mbc, index) in slotProps.node.data.mbc" :key="index" class="mbc-entry">
              {{ `${mbc.objective}::${mbc.behavior}::${mbc.method} [${mbc.id}]` }}
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
            text
            raised
            rounded
            v-if="slotProps.node.data.source"
            icon="pi pi-external-link"
            size="small"
            severity="secondary"
            class="custom-source-button"
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

// Function to handle node expansion
// If one match is is expanded,
// it will collapse all the others
const onNodeExpand = (event) => {
  const expandedNodeKey = event.key
  const keyParts = expandedNodeKey.split('-')

  // Check if the expanded node is a match node (key format: n-m)
  if (keyParts.length === 2) {
    const parentKey = keyParts[0]

    // Collapse all sibling match nodes
    Object.keys(expandedKeys.value).forEach((key) => {
      if (
        key.startsWith(parentKey + '-') &&
        key.split('-').length == 2 &&
        key !== expandedNodeKey
      ) {
        expandedKeys.value[key] = false
      }
    })
  }
}

// Function to expand all children of a node
const expandAllChildren = (node) => {
  if (node.children) {
    node.children.forEach((child) => {
      expandedKeys.value[child.key] = true
      expandAllChildren(child)
    })
  }
}

// All available columns
const togglableColumns = ref([
  { field: 'address', header: 'Address' },
  { field: 'tactic', header: 'ATT&CK Tactic' },
  { field: 'namespace', header: 'Namespace' },
  { field: 'mbc', header: 'MBC' },
  { field: 'source', header: 'Source' }
])

// Define initially visible columns
// const visibleColumns = ref(togglableColumns.value)
// Define initially visible columns (excluding 'mbc')
const visibleColumns = ref(togglableColumns.value.filter((col) => col.field !== 'mbc'))

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

const parseNode = (node, key, rules, lib) => {
  if (!node) return null

  const isNotStatement = node.node.statement && node.node.statement.type === 'not'

  // Handle 'not' statements by creating a new object with inverted success values for children
  const processedNode = isNotStatement ? invertNotStatementSuccess(node) : node

  // After inverting, discard all non-success nodes
  if (!processedNode.success) {
    return null
  }

  let childCounter = 0

  const result = {
    key: key,
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
      .map((child) => {
        const childNode = parseNode(child, `${key}-${childCounter}`, rules, lib)
        if (childNode) {
          childCounter++
        }
        return childNode
      })
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
      return `${node.node.statement.scope}:`
    } else if (node.node.statement.type === 'range') {
      const { child, min, max } = node.node.statement
      const { type, [type]: value } = child

      //let rangeType = `count(${type}(${value}))`
      let rangeType = value || value === 0 ? `count(${type}(${value}))` : `count(${type})`
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

function parseRules(rules) {
  return Object.entries(rules).map(([ruleName, rule], index) => {
    const ruleNode = {
      key: index.toString(),
      data: {
        name: rule.meta.name,
        lib: rule.meta.lib,
        matchCount: rule.matches.length,
        namespace: rule.meta.namespace,
        mbc: rule.meta.mbc,
        source: rule.source,
        tactic: JSON.stringify(rule.meta.attack),
        attack: rule.meta.attack
          ? rule.meta.attack.map((attack) => ({
              tactic: attack.tactic,
              technique: attack.technique,
              id: attack.id.includes('.') ? attack.id.split('.')[0] : attack.id,
              techniques: attack.subtechnique
                ? [{ technique: attack.subtechnique, id: attack.id }]
                : []
            }))
          : null
      },
      children: []
    }

    let matchCounter = 0
    ruleNode.children = rule.matches.map((match) => {
      const matchKey = `${index}-${matchCounter}`
      const matchNode = {
        key: matchKey,
        data: {
          name:
            props.data.meta.flavor === 'static'
              ? `${rule.meta.scopes.static} @ ${formatAddress(match[0].value)}`
              : `${rule.meta.scopes.dynamic}: ${match[0].value}`,
          address:
            props.data.meta.flavor === 'static'
              ? `${formatAddress(match[0].value)}`
              : `${match[0].value}`,
          isLocationNode: true
        },
        children: [parseNode(match[1], `${matchKey}-0`, rules, rule.meta.lib)]
      }
      matchCounter++
      return matchNode
    })

    return ruleNode
  })
}

function formatAddress(address) {
  if (address === undefined || address === null) {
    return null
  }
  return `0x${address.toString(16).toUpperCase()}`
}

// Expand/Collapse All nodes
const toggleAll = () => {
  const anyRootExpanded = treeData.value.some((rootNode) => expandedKeys.value[rootNode.key])

  if (!anyRootExpanded) {
    // Expand all root nodes and their first match node
    treeData.value.forEach((rootNode) => {
      expandedKeys.value[rootNode.key] = true
      if (rootNode.children && rootNode.children.length > 0) {
        // Expand only the first match node
        expandedKeys.value[rootNode.children[0].key] = true
        // Expand all children of the first match node
        expandAllChildren(rootNode.children[0])
      }
    })
  } else {
    // Collapse only root
    treeData.value.forEach((rootNode) => {
      expandedKeys.value[rootNode.key] = false
    })
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
    expandedKeys.value = {}
    treeData.value.forEach((rootNode) => {
      expandedKeys.value[rootNode.key] = false
      if (rootNode.children) {
        rootNode.children.forEach((matchNode) => {
          expandedKeys.value[matchNode.key] = false
          if (matchNode.children) {
            expandAllChildren(matchNode)
          }
        })
        expandedKeys.value[rootNode.children[0].key] = true
      }
    })
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

/* Hide the toggle icon for statement and features */
:deep(.p-treetable-tbody) tr:not(:is([aria-level='1'], [aria-level='2'])) svg {
  display: none;
}

/* Optional: Add a subtle background to root-level rows for better distinction */
:deep(.p-treetable-tbody > tr[aria-level='1']) {
  background-color: #f9f9f9;
}

:deep(.p-treetable) .p-treetable-tbody > tr > td {
  border: none !important;
}

.mbc-entry {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
/*
 .mbc-entry:not(:last-child) {
  margin-bottom: 0.5em;
} */

:deep(.p-treetable-tbody > tr > td) {
  padding: 0.1rem 0.5rem !important;
}

:deep(.p-treetable-tbody > tr) {
  height: 2rem;
}

:deep(.custom-source-button) {
  padding: 0 !important;
  height: 1.5rem !important;
  width: 1.5rem !important;
}

:deep(.custom-source-button .p-button-icon) {
  font-size: 0.8rem;
}
</style>
