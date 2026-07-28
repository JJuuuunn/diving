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
      },
      {
        path: 'quiz',
        children: [
          {
            path: '',
            name: RouterName.QuizDashboard,
            component: () => import('@/views/quiz/QuizDashboard.vue')
          },
          {
            path: 'play/:setId',
            name: RouterName.QuizPlay,
            component: () => import('@/views/quiz/QuizPlay.vue')
          },
          {
            path: 'result',
            name: RouterName.QuizResult,
            component: () => import('@/views/quiz/QuizResult.vue')
          }
        ]
      },
      {
        path: 'medical',
        name: RouterName.MedicalFinder,
        component: () => import('@/views/medical/MedicalFinder.vue')
      },
      // 개발 모드(npm run dev)일 때만 Playground 등록
      ...(import.meta.env.DEV
        ? [
            {
              path: 'playground',
              name: RouterName.ComponentPlayground,
              component: () => import('@/views/dev/ComponentPlayground.vue'),
            },
          ]
        : []),
      {
        path: 'competition',
        name: RouterName.Competition,
        component: () => import('@/views/competition/CompetitionMain.vue')
      },
      {
        path: 'ops/aida-sync-history',
        name: RouterName.CompetitionAdmin,
        component: () => import('@/views/admin/CompetitionAdmin.vue')
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
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth', top: 140 };
    }
    return { top: 0, behavior: 'smooth' };
  }
})

export default router
