<script setup>
import { ref } from 'vue'
import FileUpload from 'primevue/fileupload'
//import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import DescriptionPanel from '../components/DescriptionPanel.vue'
import MetadataTable from '../components/MetadataTable.vue'
import CapaTreeTable from '../components/CapaTreeTable.vue'
import SettingsPanel from '../components/SettingsPanel.vue'
import CapasByFunction from '../components/CapasByFunction.vue'

import demoRdoc from '../assets/data/demo-rdoc.json'

const toast = useToast()
const jsonData = ref(null)

const selectedViewingOption = ref('Show capabilities')

const updateViewingOption = (option) => {
  selectedViewingOption.value = option.value
}

const onUpload = (event) => {
  const file = event.files[0]
  const reader = new FileReader()

  reader.onload = (e) => {
    try {
      jsonData.value = JSON.parse(e.target.result)
    } catch (error) {
      console.error('Error parsing JSON:', error)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to parse JSON file',
        life: 3000
      })
    }
  }

  reader.readAsText(file)
}

const loadURL = ref('')

const loadFromURL = async () => {
  try {
    console.log('Loading JSON from URL:', loadURL.value)
    const response = await fetch(loadURL.value)

    if (!response.ok) {
      const errorMessage = `HTTP error! status: ${response.status}`
      throw new Error(errorMessage)
    }

    const data = await response.json()
    jsonData.value = data

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'JSON data loaded successfully',
      life: 3000
    })
  } catch (error) {
    console.error('Error loading JSON from URL:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message,
      life: 3000
    })
  }
}

const loadDemoData = () => {
  jsonData.value = demoRdoc
  toast.add({
    severity: 'success',
    summary: 'Success',
    detail: 'Demo data loaded successfully',
    life: 3000
  })
}
</script>

<template>
  <Panel v-if="!jsonData">
    <DescriptionPanel />
    <Card>
      <template #content>
        <div class="multi-column multi-column-container">
          <div class="md-column">
            <FileUpload
              mode="basic"
              name="model[]"
              accept="application/json"
              :max-file-size="5000000"
              :auto="true"
              :custom-upload="true"
              choose-label="Upload from local"
              @uploader="onUpload"
            />
          </div>
          <div class="or-column">
            <b>OR</b>
          </div>
          <div class="md-column">
            <div class="form-field">
              <FloatLabel>
                <InputText id="url" type="text" v-model="loadURL" />
                <label for="url">Load from URL</label>
              </FloatLabel>
              <Button
                class="load-buttom"
                icon="pi pi-arrow-right"
                @click="loadFromURL(loadURL)"
                :disabled="!loadURL"
              />
            </div>
          </div>
          <div class="or-column">
            <b>OR</b>
          </div>
          <div class="md-column">
            <div class="load-demo-button">
              <Button label="Preview Demo" @click="loadDemoData" />
            </div>
          </div>
        </div>
      </template>
    </Card>
  </Panel>

  <MetadataTable v-if="jsonData" :data="jsonData"> </MetadataTable>
  <SettingsPanel v-if="jsonData" @update:viewing-option="updateViewingOption"></SettingsPanel>
  <CapaTreeTable v-if="jsonData && selectedViewingOption === 'Show capabilities'" :data="jsonData">
  </CapaTreeTable>
  <CapasByFunction
    v-if="jsonData && selectedViewingOption === 'Show capabilities by function'"
    :data="jsonData"
  >
  </CapasByFunction>
</template>

<style scoped>
.multi-column-container {
  padding: 0 24px;
}
.multi-column {
  display: flex;
  &:not(.left-align) {
    justify-content: center;
    align-items: center;
  }
  div.disabled {
    color: gray;
  }
  .form-field,
  .load-demo-button {
    width: 100%;
    display: flex;
    justify-content: center;
    flex-flow: row;
    gap: 10px;
  }
  /* .form-field .load-button {
    width: 100%;
  } */
  .md-column {
    width: 40%;
  }
  .spacer {
    width: 10%;
  }
  .or-column {
    display: flex;
    width: 20%;
    font-size: 8pt;
    justify-content: center;
    align-items: center;
  }
}
</style>
