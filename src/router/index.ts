import { createRouter, createWebHistory } from 'vue-router'
import { RouterName } from '@/mappings/enum'
import { useAuthStore } from '@/stores/auth'

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
        children: [
          {
            path: '',
            name: RouterName.Logbook,
            component: () => import('@/views/logbook/LogbookMain.vue')
          },
          {
            path: 'new',
            name: RouterName.LogbookNew,
            component: () => import('@/views/logbook/LogbookForm.vue')
          },
          {
            path: ':id',
            name: RouterName.LogbookDetail,
            component: () => import('@/views/logbook/LogbookDetail.vue')
          },
          {
            path: 'edit/:id',
            name: RouterName.LogbookEdit,
            component: () => import('@/views/logbook/LogbookForm.vue')
          }
        ]
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
      {
        path: 'apnea',
        name: RouterName.Apnea,
        component: () => import('@/views/apnea/ApneaMain.vue')
      },
      {
        path: 'time-select-test',
        name: RouterName.TimeSelectLab,
        component: () => import('@/views/dev/TimeSelectLab.vue')
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
        component: () => import('@/views/admin/CompetitionAdmin.vue'),
        meta: { requiresAuth: true }
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

router.beforeEach((to, _from, next) => {
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    const authStore = useAuthStore();
    if (!authStore.isAuthenticated) {
      // requiresAuth 라우트 접근 시 useAuthStore().isAuthenticated 검사
      // 미인증 시 메인 또는 패스코드 인증 화면/모달로 리다이렉트 또는 접근 차단 처리
      // (CompetitionAdmin 화면에서 미인증 시 인증 모달/폼을 제공하도록 허용)
      next();
      return;
    }
  }
  next();
});

export default router
