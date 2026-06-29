import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '@/services/supabase'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'MainPage',
      component: () => import('../pages/LoginRegister/MainPageView.vue'),
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('../pages/LoginRegister/Login.vue'),
    },
    {
      path: '/register',
      name: 'AdminRegister',
      component: () => import('../pages/LoginRegister/Register.vue'),
    },
    // Admin Routes
    {
      path: '/admin/dashboard',
      name: 'AdminDashboard',
      component: () => import('../pages/admin/Dashboard.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/branch/dashboard',
      name: 'BranchDashboard',
      // Update the path to match your filename:
      component: () => import('../pages/branch/BranchDashboard.vue'),
      meta: { requiresAuth: true },
    },
    // Branch Routes (Ensure these files exist in your folders)
    // {
    //   path: '/branch/dashboard',
    //   name: 'BranchDashboard',
    //   component: () => import('../pages/branch/Dashboard.vue'), // Update this path
    //   meta: { requiresAuth: true },
    // },
    // Shared Admin Routes
    {
      path: '/admin/incident',
      name: 'IncidentQueue',
      component: () => import('../pages/admin/IncidentQueue.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin/analytics',
      name: 'AdminAnalytics',
      component: () => import('../pages/admin/Analytics.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin/map',
      name: 'AdminMap',
      component: () => import('../pages/admin/MapView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin/advisory',
      name: 'AdminAdvisory',
      component: () => import('../pages/admin/Advisory.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin/linemen',
      name: 'LinemanMonitoring',
      component: () => import('@/pages/admin/LinemanMonitoring.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin/lineman/:id',
      name: 'LinemanDetail',
      component: () => import('@/pages/admin/LinemanProfile.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin/settings',
      name: 'AdminSettings',
      component: () => import('@/pages/admin/Settings.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin/support',
      name: 'AdminSupport',
      component: () => import('@/pages/admin/Support.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

// Authentication guard
router.beforeEach(async (to) => {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Prevent logged-in users from seeing the landing/login pages
  if ((to.name === 'MainPage' || to.name === 'Login' || to.name === 'AdminRegister') && session) {
    // Optional: Add logic here to check the user's role from your DB to redirect to correct dashboard
    return { name: 'AdminDashboard' }
  }

  // Protect routes
  if (to.meta.requiresAuth && !session) {
    return { name: 'Login' }
  }
})

export default router
