// expandUtils.js

import { ref, computed, watch } from 'vue'

export function useCapaTable(parseFunction) {
  // Reactive state
  const treeData = ref([])
  const expandedKeys = ref({})
  const filters = ref({})
  const filterMode = ref('lenient')
  const sourceDialogVisible = ref(false)
  const currentSource = ref('')
  const visibleColumns = ref([])

  // Column configuration
  const togglableColumns = [
    { field: 'address', header: 'Address' },
    { field: 'tactic', header: 'ATT&CK Tactic' },
    { field: 'namespace', header: 'Namespace' },
    { field: 'mbc', header: 'MBC' },
    { field: 'source', header: 'Source' }
  ]

  // Initialize visible columns (exclude 'mbc' by default)
  visibleColumns.value = togglableColumns.filter((col) => col.field !== 'mbc')

  // Computed property for filtered tree data
  const filteredTreeData = computed(() => {
    return filterLibraryRules(treeData.value)
  })

  // Function to parse data
  function parseData(data) {
    if (data && (data.rules || data.meta)) {
      treeData.value = parseFunction(data.rules || data)
    } else {
      console.error('Invalid data:', data)
      treeData.value = []
    }
  }

  // Function to filter library rules
  function filterLibraryRules(nodes) {
    return nodes.filter((node) => {
      if (node.data && node.data.lib) return false
      if (node.children) node.children = filterLibraryRules(node.children)
      return true
    })
  }

  // Function to toggle columns
  function onToggle(columns) {
    visibleColumns.value = columns
  }

  // Function to get column header
  function getColumnHeader(col, flavor) {
    return flavor === 'dynamic' && col.field === 'address' ? 'Process' : col.header
  }

  // Function to show source
  function showSource(source) {
    currentSource.value = source
    sourceDialogVisible.value = true
  }

  // Function to toggle all nodes
  function toggleAll() {
    const newExpandedKeys = {}
    if (Object.keys(expandedKeys.value).length === 0) {
      expandAllNodes(treeData.value, newExpandedKeys)
    }
    expandedKeys.value = newExpandedKeys
  }

  // Function to expand all nodes
  function expandAllNodes(nodes, keys) {
    nodes.forEach((node) => {
      if (node.children && node.children.length) {
        keys[node.key] = true
        expandAllNodes(node.children, keys)
      }
    })
  }

  // Function to handle node expansion
  function onNodeExpand(event) {
    const expandedNodeKey = event.key
    const keyParts = expandedNodeKey.split('-')

    if (keyParts.length === 2) {
      const parentKey = keyParts[0]
      collapseSiblings(parentKey, expandedNodeKey)
    }
  }

  // Function to collapse sibling nodes
  function collapseSiblings(parentKey, expandedNodeKey) {
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

  return {
    treeData,
    expandedKeys,
    filters,
    filterMode,
    sourceDialogVisible,
    currentSource,
    visibleColumns,
    togglableColumns,
    filteredTreeData,
    parseData,
    onToggle,
    getColumnHeader,
    showSource,
    toggleAll,
    onNodeExpand
  }
}
