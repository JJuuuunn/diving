import { createApp } from 'vue'
import App from './App.vue' // Keep App.vue as the root component
import router from './router' // Import the router instance
import './assets/base.scss' // Corrected import path

const app = createApp(App) // Create app with App.vue as the root component

app.use(router) // Use the router

app.mount('#app')
