import 'primeicons/primeicons.css'
import './assets/main.css'

import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import Ripple from 'primevue/ripple'
import Aura from '@primevue/themes/aura'
import App from './App.vue'
import MenuBar from 'primevue/menubar'
import Card from 'primevue/card'
import Panel from 'primevue/panel'
import Column from 'primevue/column'
import FloatLabel from 'primevue/floatlabel'
import Tooltip from 'primevue/tooltip'
import ToastService from 'primevue/toastservice'
import router from './router'

const app = createApp(App)

app.use(router)

app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: 'light'
    }
  },
  //preset: Aura,
  ripple: true
})
app.use(ToastService)

app.directive('tooltip', Tooltip)
app.directive('ripple', Ripple)

app.component('Card', Card)
app.component('Panel', Panel)
app.component('MenuBar', MenuBar)
app.component('FloatLabel', FloatLabel)
app.component('Column', Column)

app.mount('#app')
