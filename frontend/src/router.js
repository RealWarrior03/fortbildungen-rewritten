import { createRouter, createWebHistory } from 'vue-router';
// import Home from './Home.vue';

const routes = [
  {
    path: '/',
    redirect: '/courses'
    // path: '/',
    // name: 'Home',
    // component: Home
  },
  {
    path: '/courses',
    name: 'Courses',
    component: () => import('./views/CourseList.vue')
  },
  {
    path: '/courses/:id',
    name: 'CourseDetail',
    component: () => import('./views/CourseDetail.vue')
  },
  {
    path: '/register/:courseId',
    name: 'Registration',
    component: () => import('./views/Registration.vue')
  },
  {
    path: '/admin',
    name: 'AdminLogin',
    component: () => import('./views/admin/AdminLogin.vue')
  },
  {
    path: '/admin/dashboard',
    name: 'AdminDashboard',
    component: () => import('./views/admin/AdminDashboard.vue'),
    meta: { requiresAdmin: true }
  },
  {
    path: '/admin/persons',
    name: 'AdminPersons',
    component: () => import('./views/admin/Persons.vue'),
    meta: { requiresAdmin: true }
  },
  {
    path: '/admin/courses',
    name: 'AdminCourses',
    component: () => import('./views/admin/Courses.vue'),
    meta: { requiresAdmin: true }
  },
  {
    path: '/admin/sessions',
    name: 'AdminSessions',
    component: () => import('./views/admin/Sessions.vue'),
    meta: { requiresAdmin: true }
  }/*,
  {
    path: '/admin/registrations',
    name: 'AdminRegistrations',
    component: () => import('./views/admin/Registrations.vue'),
    meta: { requiresAdmin: true }
  }*/
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});


// Navigation Guard für Admin-Bereich
router.beforeEach((to, from, next) => {
  if (to.matched.some(record => record.meta.requiresAdmin)) {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      next({ name: 'AdminLogin' });
    } else {
      next();
    }
  } else {
    next();
  }
});


export default router;