import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue' // Keep App.vue as the root component
import router from './router' // Import the router instance
import '@/assets/scss/main.scss' // Import global styles
import CustomButton from '@/components/CustomButton.vue'
import CustomInput from '@/components/CustomInput.vue'

const app = createApp(App) // Create app with App.vue as the root component
const pinia = createPinia()

app.component('CustomButton', CustomButton)
app.component('CustomInput', CustomInput)
app.use(pinia)
app.use(router) // Use the router

app.mount('#app')
