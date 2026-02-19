import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'

import SettlementContent from '@/views/settlement/Content.vue'

import DptiContent from '@/views/dpti/Content.vue'
import DptiAllTypes from '@/views/dpti/DptiAllTypes.vue'
import DptiResult from '@/views/dpti/DptiResult.vue'

import NotFound from '@/views/NotFound.vue'
import { RouterName } from '@/mappings/enum'

const routes = [
  {
    path: '/',
    children: [
      {
        path: '', 
        name: RouterName.Main,
        component: Home
      },
      {
        path: 'settlement',
        name: RouterName.Settlement,
        component: SettlementContent
      },
      {
        path: 'dpti',
        children: [
          {
            path: '',
            name: RouterName.Dpti,
            component: DptiContent
          },
          {
            path: 'result/:code',
            name: RouterName.DptiResult,
            component: DptiResult
          },
          {
            path: 'all-types',
            name: RouterName.DptiAllTypes,
            component: DptiAllTypes
          }
        ]
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: RouterName.NotFound,
    component: NotFound
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