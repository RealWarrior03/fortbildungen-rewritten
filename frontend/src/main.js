import { createApp } from 'vue'
import App from './App.vue'
import i18n from './i18n'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap'
import router from './router'
import 'bootstrap-icons/font/bootstrap-icons.css'



const app = createApp(App)
app.use(router)
app.use(i18n)
app.mount('#app')