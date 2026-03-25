import { createRouter, createWebHistory } from 'vue-router';
import api from './services/api';
// import Home from './Home.vue';

let meCache = null;
let meCacheTimestamp = 0;

function clearAuthStorage() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('authRoles');
  localStorage.removeItem('authUsername');
  localStorage.removeItem('authDisplayName');
  localStorage.removeItem('authEmail');
}

async function getCurrentUserVerified(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && meCache && now - meCacheTimestamp < 10000) {
    return meCache;
  }

  const response = await api.getCurrentUser();
  meCache = response.data;
  meCacheTimestamp = now;
  return meCache;
}

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
    component: () => import('./views/CourseList.vue'),
    meta: { requiresUser: true }
  },
  {
    path: '/courses/:id',
    name: 'CourseDetail',
    component: () => import('./views/CourseDetail.vue'),
    meta: { requiresUser: true }
  },
  {
    path: '/register/:courseId',
    name: 'Registration',
    component: () => import('./views/Registration.vue'),
    meta: { requiresUser: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('./views/UserLogin.vue')
  },
  {
    path: '/my-sessions',
    name: 'MySessions',
    component: () => import('./views/MySessions.vue'),
    meta: { requiresUser: true }
  },
  {
    path: '/admin/login',
    redirect: '/login'
  },
  {
    path: '/admin',
    component: () => import('./views/admin/AdminLayout.vue'),
    meta: { requiresAdmin: true },
    children: [
      {
        path: '',
        redirect: '/admin/dashboard'
      },
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('./views/admin/AdminDashboard.vue')
      },
      {
        path: 'persons',
        name: 'AdminPersons',
        component: () => import('./views/admin/Persons.vue')
      },
      {
        path: 'courses',
        name: 'AdminCourses',
        component: () => import('./views/admin/Courses.vue')
      },
      {
        path: 'sessions',
        name: 'AdminSessions',
        component: () => import('./views/admin/Sessions.vue')
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});


// Navigation Guard für Admin-Bereich
router.beforeEach(async (to, from, next) => {
  const authToken = localStorage.getItem('authToken');

  if (to.matched.some(record => record.meta.requiresAdmin)) {
    if (!authToken) {
      next({ name: 'Login', query: { redirect: to.fullPath } });
    } else {
      try {
        const me = await getCurrentUserVerified();
        const roles = Array.isArray(me.roles) ? me.roles : [];

        if (!roles.includes('admin')) {
          return next({ name: 'Courses' });
        }

        return next();
      } catch (error) {
        clearAuthStorage();
        return next({ name: 'Login', query: { redirect: to.fullPath } });
      }
    }
  } else if (to.matched.some(record => record.meta.requiresUser)) {
    if (!authToken) {
      next({ name: 'Login', query: { redirect: to.fullPath } });
    } else {
      try {
        await getCurrentUserVerified();
        return next();
      } catch (error) {
        clearAuthStorage();
        return next({ name: 'Login', query: { redirect: to.fullPath } });
      }
    }
  } else {
    meCache = null;
    meCacheTimestamp = 0;
    next();
  }
});


export default router;