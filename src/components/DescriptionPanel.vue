<template>
  <div class="description">
    <div class="logo">
      <h1>
        <img src="../assets/images/logo-full.png" alt="Capa: identify program capabilities" />
        <h6>capa: identify program capabilities</h6>
      </h1>
    </div>
    <div>
      <p>
        Capa-WebUI is a web-based tool for exploring the capabilities identified in a program. It
        can be used to search and display the rule matches in different viewing modes.
      </p>
    </div>
    <div class="help-links-container">
      <Button label="Help" @click="openDialog('help')" icon="pi pi-info-circle" outlined />
      <Button label="Changelog" @click="openDialog('changelog')" icon="pi pi-history" outlined />
    </div>
  </div>

  <Dialog v-model:visible="helpDialogVisible" header="Help" modal>
    <p>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam quam elit, lacinia at lorem
      non, mollis elementum orci.
    </p>
  </Dialog>

  <Dialog v-model:visible="changelogDialogVisible" header="Changelog" modal>
    <p>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut
      labore et dolore magna aliqua.
    </p>
  </Dialog>
</template>

<script setup>
import { ref } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'

const helpDialogVisible = ref(false)
const changelogDialogVisible = ref(false)

const openDialog = (type) => {
  if (type === 'help') {
    helpDialogVisible.value = true
  } else if (type === 'changelog') {
    changelogDialogVisible.value = true
  }
}
</script>

<style scoped>
.description {
  display: flex;
  flex-flow: column wrap;
  align-items: center;
}

.description div p {
  max-width: 75ch;
  font-size: 1.2em;
}

.logo {
  text-align: center;
  font-size: 1em;
}

.logo h6 {
  text-decoration: none;
  color: rgb(176, 26, 26);
  font-weight: 500;
}

.help-links-container {
  display: flex;
  justify-content: center;
  margin-bottom: 1em;
  width: 100%;
  gap: 1rem;
}
</style>
