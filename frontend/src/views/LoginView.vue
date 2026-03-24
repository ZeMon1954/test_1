<template>
  <div class="auth-container">
    <h2>เข้าสู่ระบบ</h2>
    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <label for="email">อีเมล</label>
        <input id="email" v-model="form.email" type="email" placeholder="example@email.com" required />
      </div>
      <div class="form-group">
        <label for="password">รหัสผ่าน</label>
        <input id="password" v-model="form.password" type="password" placeholder="••••••••" required />
      </div>
      
      <button type="submit" class="btn-submit" :disabled="isLoading">
        {{ isLoading ? 'กำลังดำเนินการ...' : 'เข้าสู่ระบบ' }}
      </button>
    </form>

    <p v-if="successMessage" class="msg-success">{{ successMessage }}</p>
    <p v-if="errorMessage" class="msg-error">{{ errorMessage }}</p>

    <p class="switch-page">ยังไม่มีบัญชี? <RouterLink to="/register">สมัครสมาชิก</RouterLink></p>
  </div>
</template>

<script setup lang="ts">
import '@/assets/styles/auth.css'
import { ref } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import axios, { AxiosError } from 'axios';

const router = useRouter();

interface LoginResponse {
  message: string;
  token?: string;
}

const form = ref({
  email: '',
  password: ''
});

const isLoading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

const handleLogin = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    const response = await axios.post<LoginResponse>(
      `${import.meta.env.VITE_API_URL}/login`, 
      form.value
    );
    
    successMessage.value = response.data.message;
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }

    setTimeout(() => {
      router.push('/dashboard');
    }, 1000);

  } catch (error) {
    const err = error as AxiosError<LoginResponse>;
    if (err.response) {
      errorMessage.value = err.response.data.message;
    } else {
      errorMessage.value = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้';
    }
  } finally {
    isLoading.value = false;
  }
};
</script>
