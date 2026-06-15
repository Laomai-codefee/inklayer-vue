import { createApp } from 'vue'
import { createPinia } from 'pinia'
import DemoApp from './DemoApp.vue'
import i18n from '../src/i18n'
import '../src/assets/tailwind.css'

const app = createApp(DemoApp)
app.use(createPinia())
app.use(i18n)
app.mount('#app')
