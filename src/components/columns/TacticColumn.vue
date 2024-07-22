<template>
  <div v-if="node.data.attack">
    <!-- Iterate over the object node.data.attack -->
    <div v-for="(attack, index) in node.data.attack" :key="index">
      <!-- Link to the MITRE ATT&CK technique -->
      <a :href="'https://attack.mitre.org/techniques/' + attack.id" target="_blank">
        {{ attack.technique }} ({{ attack.id }})
      </a>
      <!-- Display sub-techniques if any -->
      <div
        v-for="(technique, techIndex) in attack.techniques"
        :key="techIndex"
        class="sub-technique"
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

<script setup>
defineProps({
  node: {
    type: Object,
    required: true
  }
})
</script>

<style scoped>
/* Make the sub-techniques appear indented with a smaller font */
.sub-technique {
  font-size: 0.8em;
  margin-left: 1em;
}

/* remove the default underline from the links */
a {
  text-decoration: none;
  color: inherit;
}
</style>
