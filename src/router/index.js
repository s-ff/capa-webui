import { createRouter, createWebHistory } from 'vue-router'
import ImportView from '../views/ImportView.vue'
//import HomeView from '../views/HomeView.vue'

const router = createRouter({
  // We need to Hash-based history because the vite-plugin-singlefile
  // does not support createWebHistory
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: ImportView
    },
    {
      path: '/rules',
      name: 'rules',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/RulesView.vue')
    }
    // {
    //   path: '/import',
    //   name: 'import',
    //   component: () => import('../views/ImportView.vue')
    // }
  ]
})

export default router
