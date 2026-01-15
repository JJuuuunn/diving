import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import SettlementContent from '../views/Settlement/Content.vue' // Corrected path
import NotFound from '../views/NotFound.vue'
import { RouterName } from '../mappings/enum' // Import RouterName

const routes = [
  {
    path: '/diving',
    name: RouterName.Home, // Assuming RouterName.Home is the correct name for the main diving page
    component: Home
  },
  {
    path: '/diving/settlement',
    name: RouterName.Settlement,
    component: SettlementContent
  },
  {
    path: '/:pathMatch(.*)*',
    name: RouterName.NotFound,
    component: NotFound
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
