import { createRouter, createWebHistory } from 'vue-router'
import { RouterName } from '@/mappings/enum'

const routes = [
  {
    path: '/',
    children: [
      {
        path: '', 
        name: RouterName.Main,
        component: () => import('@/views/Home.vue')
      },
      {
        path: 'settlement',
        name: RouterName.Settlement,
        component: () => import('@/views/settlement/SettlementMain.vue')
      },
      {
        path: 'dpti',
        children: [
          {
            path: '',
            name: RouterName.Dpti,
            component: () => import('@/views/dpti/DptiMain.vue')
          },
          {
            path: 'result/:code',
            name: RouterName.DptiResult,
            component: () => import('@/views/dpti/DptiResult.vue')
          },
          {
            path: 'all-types',
            name: RouterName.DptiAllTypes,
            component: () => import('@/views/dpti/DptiAllTypes.vue')
          }
        ]
      },
      {
        path: 'logbook',
        name: RouterName.Logbook,
        component: () => import('@/views/logbook/LogbookMain.vue')
      }
    ]
  },

  {
    path: '/:pathMatch(.*)*',
    name: RouterName.NotFound,
    component: () => import('@/views/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory('/diving/'), 
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0, behavior: 'smooth' };
    }
  }
})

export default router