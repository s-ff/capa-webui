<template>
  <TreeTable
    :value="treeData"
    v-model:expandedKeys="expandedKeys"
    size="small"
    :filters="filters"
    :filterMode="filterMode.value"
    sortField="funcaddr"
    :sortOrder="1"
    :paginator="true"
    :rows="50"
    :rowsPerPageOptions="[5, 10, 25, 50]"
    removableSort
    :showGridlines="false"
    :indentation="2"
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

    <Column field="funcaddr" sortable header="Function Address" expander filterMatchMode="contains">
      <template #filter>
        <InputText
          style="width: 70%"
          v-model="filters['funcaddr']"
          type="text"
          placeholder="Filter by function address"
        />
      </template>
      <template #body="slotProps">
        {{ slotProps.node.data.funcaddr }}
        <Badge
          v-if="slotProps.node.data.matchcount > 1"
          :value="`${slotProps.node.data.matchcount} matches`"
          severity="contrast"
        ></Badge>
        <Tag
          v-if="slotProps.node.data.lib"
          class="info-tooltip"
          v-tooltip.top="{
            value: 'Library rules capture common logic',
            showDelay: 100,
            hideDelay: 100
          }"
          value="lib"
          severity="info"
        ></Tag>
      </template>
    </Column>

    <Column field="matchcount" hidden header="Rule Matches"></Column>

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
    <highlightjs lang="yml" :code="currentSource" />
  </Dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import TreeTable from 'primevue/treetable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Badge from 'primevue/badge'
import Tag from 'primevue/tag'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'

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

  for (const functionInfo of props.data.meta.analysis.layout.functions) {
    const functionAddress = functionInfo.address.value.toString(16).toUpperCase()
    const matchingRules = []

    for (const ruleId in props.data.rules) {
      const rule = props.data.rules[ruleId]

      if (!props.showLibraryRules && rule.meta.lib) {
        continue
      }

      const matches = rule.matches.filter((match) =>
        functionInfo.matched_basic_blocks.some((block) => block.address.value === match[0].value)
      )

      if (matches.length > 0) {
        matchingRules.push({
          key: `${functionAddress}-${matchingRules.length}`,
          data: {
            funcaddr: `rule: ${rule.meta.name}`,
            lib: rule.meta.lib,
            matchcount: null,
            namespace: rule.meta.namespace,
            source: rule.source
          }
        })
      }
    }

    if (matchingRules.length > 0) {
      data.push({
        key: functionAddress,
        data: {
          funcaddr: `function: 0x${functionAddress}`,
          lib: false,
          matchcount: matchingRules.length,
          namespace: null,
          source: null
        },
        children: matchingRules
      })
    }
  }

  return data
})
</script>

<style scoped>
.info-tooltip {
  margin-left: 10px;
}
</style>
