import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import SettlementContent from '../views/settlement/Content.vue'
import NotFound from '../views/NotFound.vue'
import { RouterName } from '../mappings/enum'

const routes = [
  {
    // 메인 루트 경로 ('/')
    // GitHub Pages 저장소 주소 뒤에 바로 이어지는 경로입니다.
    path: '/',
    children: [
      {
        // 1. 메인 화면
        // 주소: https://아이디.github.io/diving/
        path: '', 
        name: RouterName.Main,
        component: Home
      },
      {
        // 2. 정산 화면 (자식 라우트)
        // Home 컴포넌트 내부의 <router-view> 위치에 렌더링됩니다.
        // 주소: https://아이디.github.io/diving/settlement
        path: 'settlement',
        name: RouterName.Settlement,
        component: SettlementContent
      }
    ]
  },
  {
    // 404 에러 처리 (Catch-all 라우트)
    // 위에서 정의되지 않은 모든 경로(.*)로 접근했을 때 실행됩니다.
    path: '/:pathMatch(.*)*',
    name: RouterName.NotFound,
    component: NotFound
  }
]

const router = createRouter({
  // [중요] History 모드 설정
  // 1. createWebHistory(): URL에서 '#'을 제거하여 깔끔한 주소를 만듭니다.
  // 2. '/diving/': GitHub Pages의 저장소 이름(Base URL)을 명시합니다.
  //    이 설정이 있어야 새로고침 시 경로가 꼬이지 않고 올바른 리소스를 찾습니다.
  history: createWebHistory('/diving/'), 
  routes
})

export default router