<template>
  <div class="auth-container">
    <h2>สมัครสมาชิก</h2>
    <form @submit.prevent="handleRegister">
      <div class="form-group">
        <label for="name">ชื่อ</label>
        <input id="name" v-model="form.name" type="text" placeholder="กรอกชื่อของคุณ" required />
      </div>
      <div class="form-group">
        <label for="email">อีเมล</label>
        <input id="email" v-model="form.email" type="email" placeholder="example@email.com" required />
      </div>
      <div class="form-group">
        <label for="password">รหัสผ่าน</label>
        <input id="password" v-model="form.password" type="password" placeholder="••••••••" required />
      </div>
      
      <button type="submit" class="btn-submit" :disabled="isLoading">
        {{ isLoading ? 'กำลังดำเนินการ...' : 'สมัครสมาชิก' }}
      </button>
    </form>

    <p v-if="successMessage" class="msg-success">{{ successMessage }}</p>
    <p v-if="errorMessage" class="msg-error">{{ errorMessage }}</p>

    <p class="switch-page">มีบัญชีแล้ว? <RouterLink to="/login">เข้าสู่ระบบ</RouterLink></p>
  </div>
</template>

<script setup lang="ts">
import '@/assets/styles/auth.css'
import { ref } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import axios, { AxiosError } from 'axios';

const router = useRouter();

interface RegisterResponse {
  message: string;
  user?: {
    id: number;
    email: string;
    name: string;
  };
}

const form = ref({
  name: '',
  email: '',
  password: ''
});

const isLoading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

const handleRegister = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    const response = await axios.post<RegisterResponse>(
      'http://localhost:3000/register', 
      form.value
    );
    
    successMessage.value = response.data.message;
    form.value = { name: '', email: '', password: '' };

    setTimeout(() => {
      router.push('/login');
    }, 1500);

  } catch (error) {
    const err = error as AxiosError<RegisterResponse>;
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
