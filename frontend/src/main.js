import { createApp } from 'vue'
import App from './App.vue'
import { createRouter, createWebHistory } from 'vue-router'
import i18n from './i18n'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap'

// Route components
import CourseList from './views/CourseList.vue'
import Registration from './views/Registration.vue'
import AdminLogin from './views/admin/AdminLogin.vue'
import AdminDashboard from './views/admin/AdminDashboard.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/courses' },
    { path: '/courses', component: CourseList },
    { path: '/registration/:id', component: Registration },
    { path: '/admin/login', component: AdminLogin },
    { path: '/admin/dashboard', component: AdminDashboard }
  ]
})

// Navigation guard for admin routes
router.beforeEach((to, from, next) => {
  if (to.path.startsWith('/admin') && to.path !== '/admin/login') {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      next('/admin/login')
      return
    }
  }
  next()
})


const app = createApp(App)
app.use(router)
app.use(i18n)
app.mount('#app')