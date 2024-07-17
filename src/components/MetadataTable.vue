<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  data: {
    type: Object,
    required: true
  }
})

const keyMetrics = ref({
  ruleCount: 0,
  namespaceCount: 0,
  functionOrProcessCount: 0
})

const fileName = computed(() => props.data.meta.sample.path.split('/').pop())
const analysisType = computed(() => props.data.meta.flavor)
const sha256 = computed(() => props.data.meta.sample.sha256.toUpperCase())

const parseMetadata = () => {
  if (props.data) {
    keyMetrics.value = {
      ruleCount: Object.keys(props.data.rules).length,
      namespaceCount: new Set(Object.values(props.data.rules).map((rule) => rule.meta.namespace))
        .size,
      functionOrProcessCount:
        analysisType.value === 'static'
          ? props.data.meta.analysis.feature_counts.functions.length
          : props.data.meta.analysis.feature_counts.processes.length
    }
  }
}

onMounted(() => {
  parseMetadata()
})
</script>

<template>
  <div class="metadata-banner">
    <div class="file-info">
      <h1>{{ fileName }}</h1>
      <p class="sha256" :title="sha256">{{ `SHA256: ${sha256}` }}</p>
    </div>
    <div class="divider"></div>
    <div class="analysis-info">
      <p>
        {{ props.data.meta.analysis.os }} / {{ props.data.meta.analysis.format }} /
        {{ props.data.meta.analysis.arch }}
      </p>
      <p>
        {{ analysisType }} analysis with {{ props.data.meta.analysis.extractor }} | CAPA v{{
          props.data.meta.version
        }}
        |
        {{ new Date(props.data.meta.timestamp).toLocaleString() }}
      </p>
    </div>
    <div class="divider"></div>
    <div class="key-metrics">
      <div class="metric">
        <span class="metric-value">{{ keyMetrics.ruleCount }}</span>
        <span class="metric-label">Rules</span>
      </div>
      <div class="metric">
        <span class="metric-value">{{ keyMetrics.namespaceCount }}</span>
        <span class="metric-label">Namespaces</span>
      </div>
      <div class="metric">
        <span class="metric-value">{{ keyMetrics.functionOrProcessCount }}</span>
        <span class="metric-label">{{
          analysisType === 'static' ? 'Functions' : 'Processes'
        }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.metadata-banner {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(to right, #2c3e50, #3498db);
  color: #ecf0f1;
  padding: 10px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  box-sizing: border-box;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.file-info {
  flex: 2;
}

.file-info h1 {
  font-size: 1.2rem;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sha256 {
  font-size: 0.7rem;
  margin: 2px 0 0;
  opacity: 0.7;
}

.analysis-info {
  flex: 3;
  font-size: 0.8rem;
}

.analysis-info p {
  margin: 0;
  line-height: 1.4;
}

.key-metrics {
  flex: 2;
  display: flex;
  justify-content: space-around;
}

.metric {
  text-align: center;
}

.metric-value {
  display: block;
  font-size: 1.2rem;
  font-weight: bold;
}

.metric-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  opacity: 0.7;
}

.divider {
  width: 1px;
  height: 30px;
  background-color: rgba(236, 240, 241, 0.3);
  margin: 0 15px;
}

@media (max-width: 768px) {
  .metadata-banner {
    flex-direction: column;
    align-items: flex-start;
  }

  .divider {
    display: none;
  }

  .file-info,
  .analysis-info,
  .key-metrics {
    width: 100%;
    margin-bottom: 10px;
  }
}
</style>
