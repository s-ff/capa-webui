<template>
  <div :style="nodeStyle">
    <!-- Display the rule or feature name -->
    {{ node.data.name }}

    <!-- Display the description if available -->
    <span v-if="node.data.description" class="description">
      {{ '  ' + node.data.description }}
    </span>

    <!-- Display match count if more than one -->
    <span v-if="node.data.matchCount > 1" class="match-count">
      ({{ node.data.matchCount }} matches)
    </span>

    <!-- Display 'lib' tag for library rules with matches -->
    <Tag
      v-if="node.data.lib && node.data.matchCount"
      class="info-tooltip"
      v-tooltip.top="'Library rules capture common logic'"
      value="lib"
      severity="info"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Tag from 'primevue/tag'

// Define props for the component
const props = defineProps({
  node: {
    type: Object,
    required: true
  }
})

// Compute the style for the node based on its properties
// for statement, use a bold font
// for matched features, use a green color
const nodeStyle = computed(() => ({
  // Set color to green if the node has no children (leaf node)
  color: !props.node.children || props.node.children.length === 0 ? 'green' : 'inherit',
  // Set font weight to bold for statement and match location (e.g. basic block @ <addr>) nodes
  fontWeight:
    props.node.children && props.node.children.length > 0 && props.node.key.includes('-')
      ? 'bold'
      : 'normal'
}))
</script>

<style scoped>
/* Style for the description text */
.description {
  font-style: normal;
  font-size: 90%;
  font-weight: normal;
  color: grey;
}

/* Style for the match count text */
.match-count {
  font-style: italic;
}

/* Style for the 'lib' tag tooltip */
.info-tooltip {
  margin-left: 10px;
}
</style>
