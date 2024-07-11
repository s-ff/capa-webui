<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import Menubar from 'primevue/menubar'

const router = useRouter()

const items = ref([
  {
    label: 'Import Analysis',
    icon: 'pi pi-file-import',
    command: () => {
      router.push('/')
    }
  },
  {
    label: 'Toolset',
    icon: 'pi pi-list',
    items: [
      {
        label: 'Capa',
        icon: 'pi pi-github',
        url: 'https://github.com/mandiant/capa'
      },
      {
        label: 'Flare-Floss',
        icon: 'pi pi-github',
        url: 'https://github.com/mandiant/flare-floss'
      },
      {
        label: 'Flare-VM',
        icon: 'pi pi-github',
        url: 'https://github.com/mandiant/flare-vm'
      },
      {
        label: 'Flare-Fakenet-ng',
        icon: 'pi pi-github',
        url: 'https://github.com/mandiant/flare-fakenet-ng'
      },
      {
        label: 'Ghidrathon',
        icon: 'pi pi-github',
        url: 'https://github.com/mandiant/ghidrathon'
      },
      {
        label: 'dncil',
        icon: 'pi pi-github',
        url: 'https://github.com/mandiant/dncil'
      },
      {
        label: 'GoReSym',
        icon: 'pi pi-github',
        url: 'https://github.com/mandiant/GoReSym/'
      },
      {
        separator: true
      },
      {
        label: 'capa-rules',
        icon: 'pi pi-github',
        url: 'https://github.com/mandiant/capa-rules'
      }
    ]
  }
])
</script>

<template>
  <div class="card">
    <Menubar :model="items">
      <template #item="{ item, props, hasSubmenu }">
        <router-link v-if="item.route" v-slot="{ href, navigate }" :to="item.route" custom>
          <a v-ripple :href="href" v-bind="props.action" @click="navigate">
            <span :class="item.icon" />
            <span class="ml-2">{{ item.label }}</span>
          </a>
        </router-link>
        <a v-else v-ripple :href="item.url" :target="item.target" v-bind="props.action">
          <span :class="item.icon" />
          <span class="ml-2">{{ item.label }}</span>
          <span v-if="hasSubmenu" class="pi pi-fw pi-angle-down ml-2" />
        </a>
      </template>
    </Menubar>
  </div>
</template>
