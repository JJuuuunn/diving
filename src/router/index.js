import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
// 만약 Home.vue가 레이아웃 역할만 한다면, 기존 메인 내용을 보여줄 별도 컴포넌트(예: Dashboard)가 필요할 수 있습니다.
// 여기서는 구조 변경에 집중하여 작성합니다.
import SettlementContent from '../views/settlement/Content.vue' 
import NotFound from '../views/NotFound.vue'
import { RouterName } from '../mappings/enum' 

const routes = [
  {
    path: '/diving',
    children: [
      {
        path: '', 
        name: RouterName.Home,
        component: Home
      },
      {
        path: 'settlement',
        name: RouterName.Settlement,
        component: SettlementContent
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
  history: createWebHistory(),
  routes
})

export default router