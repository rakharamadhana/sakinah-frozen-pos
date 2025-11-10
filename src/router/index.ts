import { createRouter, createWebHistory } from '@ionic/vue-router'
import { RouteRecordRaw } from 'vue-router'
import TabsPage from '../views/TabsPage.vue'

const routes: Array<RouteRecordRaw> = [
    {
        path: '/',
        redirect: 'dashboard'
    },
    {
        path: '/',
        component: TabsPage,
        children: [
            { path: '', redirect: 'dashboard' },
            { path: 'dashboard', component: () => import('@/views/DashboardPage.vue')},
            { path: 'orders', component: () => import('@/views/OrdersPage.vue') },
            { path: 'order/:id', component: () => import('@/views/OrderDetailPage.vue') },
            { path: 'products', component: () => import('@/views/ProductsPage.vue') },
            { path: 'customers', component: () => import('@/views/CustomersPage.vue') },
            { path: 'profile', component: () => import('@/views/ProfilePage.vue') },
            { path: 'new-order', component: () => import('@/views/NewOrderPage.vue') }
        ]
    }
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
    scrollBehavior: () => ({ left: 0, top: 0 }) // optional
})


export default router
