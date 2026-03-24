<template>
  <div id="app">
    <!-- 🌌 Animated Background -->
    <div class="animated-bg"></div>
    <div class="particles">
      <span class="particle" v-for="n in 15" :key="n"></span>
    </div>
    <div class="scanline"></div>
    <div class="moving-line"></div>

    <!-- 🧭 Navigation for Guests -->
    <nav class="navbar" v-if="!isLoggedInRoute">
      <RouterLink to="/register">สมัครสมาชิก</RouterLink>
      <RouterLink to="/login">เข้าสู่ระบบ</RouterLink>
    </nav>

    <!-- 🌟 Navigation for Logged-in Users -->
    <nav class="navbar app-navbar" v-else>
      <RouterLink to="/dashboard">หน้าหลัก</RouterLink>
      <RouterLink to="/transactions">รายการทั้งหมด</RouterLink>
      <RouterLink to="/settings/categories">หมวดหมู่ตกหล่น</RouterLink>
      <a href="#" @click.prevent="handleLogout" class="logout-link" style="color: #fc8181; font-weight: bold; margin-left: auto;">ออกจากระบบ</a>
    </nav>

    <!-- 📄 Page Content -->
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import '@/assets/styles/navbar.css'
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const isLoggedInRoute = computed(() => {
  const authRoutes = ['/login', '/register', '/']
  return !authRoutes.includes(route.path)
})

const handleLogout = () => {
  localStorage.removeItem('token')
  router.push('/login')
}
</script>
