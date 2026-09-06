import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '@/services/supabase'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'MainPage',
      component: () => import('../pages/LoginRegister/Login.vue'),
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
    {
      path: '/branch/analytics',
      name: 'BranchAnalytics',
      component: () => import('../pages/branch/BranchAnalytics.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/branch/map',
      name: 'BranchMap',
      component: () => import('../pages/branch/BranchMapView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/branch/notification',
      name: 'BranchNotification',
      component: () => import('../pages/branch/BranchNotification.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/branch/reports/:id',
      name: 'BranchReportDetails',
      component: () => import('../pages/branch/BranchReportDetails.vue'),
      props: true,
      meta: { requiresAuth: true },
    },
    {
      path: '/branch/profile',
      name: 'BranchProfile',
      component: () => import('../pages/branch/BranchProfile.vue'),
      meta: { requiresAuth: true },
    },
    // {
    //   path: '/branch/support',
    //   name: 'BranchSupport',
    //   component: () => import('../pages/branch/BranchSupport.vue'),
    //   meta: { requiresAuth: true },
    // },
    {
      path: '/branch/settings',
      name: 'BranchSettings',
      component: () => import('../pages/branch/BranchSettings.vue'),
      meta: { requiresAuth: true },
    },
    // {
    //   path: '/branch/user-management',
    //   name: 'BranchUserManagement',
    //   component: () => import('../pages/Settings/UserManagement.vue'),
    //   meta: { requiresAuth: true },
    // },
    {
      path: '/branch/audit-log',
      name: 'BranchAuditLog',
      component: () => import('../pages/Settings/AuditLog.vue'),
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
    // {
    //   path: '/admin/incident-wait-list',
    //   name: 'IncidentWaitList',
    //   component: () => import('../pages/admin/IncidentWaitList.vue'),
    //   meta: { requiresAuth: true },
    // },
    {
      path: '/branch/incident',
      name: 'BranchIncidentQueue',
      component: () => import('../pages/branch/BranchIncidentQueue.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/branch/linemen',
      name: 'BranchLinemanMonitoring',
      component: () => import('../pages/branch/BranchLinemanMonitoring.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/branch/lineman/:id',
      name: 'BranchLinemanProfile',
      component: () => import('../pages/branch/BranchLinemanProfile.vue'),
      meta: { requiresAuth: true },
    },
    // {
    //   path: '/admin/analytics',
    //   name: 'AdminAnalytics',
    //   component: () => import('../pages/admin/Analytics.vue'),
    //   meta: { requiresAuth: true },
    // },
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
    // {
    //   path: '/admin/user-management',
    //   name: 'UserManagement',
    //   // Matches your folder structure in src/pages/Settings/UserManagement.vue
    //   component: () => import('@/pages/Settings/UserManagement.vue'),
    //   meta: { requiresAuth: true },
    // },
    // {
    //   path: '/admin/support',
    //   name: 'AdminSupport',
    //   component: () => import('@/pages/admin/Support.vue'),
    //   meta: { requiresAuth: true },
    // },
    {
      path: '/admin/archive',
      name: 'Archive',
      component: () => import('@/pages/Settings/Archive.vue'),
      meta: { requiresAuth: true },
    },
    // {
    //   path: '/admin/settings', // This must match the URL path exactly
    //   name: 'AdminSettings',
    //   component: () => import('@/pages/Settings/Settings.vue'),
    //   meta: { requiresAuth: true },
    // },
    {
      path: '/admin/profile',
      name: 'AdminProfile',
      component: () => import('@/pages/admin/Profile.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/notifications',
      name: 'Notifications',
      component: () => import('@/pages/admin/Notification.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin/reports/:id',
      name: 'ReportDetails',
      component: () => import('@/pages/admin/ReportDetails.vue'),
      props: true,
    },
    {
      path: '/admin/account-verification',
      name: 'AccountVerification',
      component: () => import('../pages/admin/AccountVerification.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin/create-lineman',
      name: 'CreateLineman',
      // Notice the exact path matching your VS Code sidebar
      component: () => import('@/pages/User Management/CreateLineman.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin/create-branch',
      name: 'CreateBranchAccount',
      component: () => import('@/pages/User Management/CreateBranchAccount.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin/audit-log',
      name: 'AuditLog',
      component: () => import('@/pages/Settings/AuditLog.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin/security',
      name: 'Security',
      component: () => import('@/pages/Settings/Security.vue'),
      meta: { requiresAuth: true },
    },
    // Inside your router routes configuration array:
    {
      path: '/admin/about',
      name: 'AboutUs',
      component: () => import('@/pages/Settings/AboutUs.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/user-management',
      name: 'UserManagement',
      component: () => import('@/pages/User Management/UserManagement.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin/reports/best-lineman',
      name: 'BestLinemanReport',
      component: () => import('@/pages/printables/BestLinemanReport.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin/reports',
      name: 'Reports',
      component: () => import('@/pages/printables/Reports.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin/reports/power-advisory',
      name: 'PowerAdvisoryReport',
      component: () => import('@/pages/printables/PowerAdvisoryReport.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin/incident-list',
      name: 'IncidentList',
      component: () => import('@/pages/admin/IncidentList.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/branch/security',
      name: 'BranchSecurity',
      component: () => import('@/pages/branch/BranchSettings.vue'),
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
