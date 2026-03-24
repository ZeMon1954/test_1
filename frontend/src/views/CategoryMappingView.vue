<template>
  <div class="category-mapping-container">
    <h2>หมวดหมู่ตกหล่น (Uncategorized)</h2>
    <p class="subtitle">รายการที่ระบบยังไม่รู้ว่าคือค่าอะไร ช่วยใส่หมวดหมู่ให้หน่อยนะ!</p>

    <div class="mapping-list-container">
      <div v-if="fetching" class="loading-state">กำลังโหลดข้อมูล...</div>
      
      <div v-else-if="uncategorized.length === 0" class="empty-state">
        เยี่ยมมาก! ไม่มีรายการที่รอจัดหมวดหมู่ 🎉
      </div>

      <table v-else class="mapping-table">
        <thead>
          <tr>
            <th>วันที่</th>
            <th>ยอดเงิน</th>
            <th>Type</th>
            <th>รายละเอียดต้นฉบับ (อีเมล/สลิป)</th>
            <th>กำหนดหมวดหมู่</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tx in uncategorized" :key="tx.id">
            <td style="font-size: 0.85rem;">{{ new Date(tx.createdAt).toLocaleDateString('th-TH') }}</td>
            <td :class="tx.type === 'income' ? 'text-success' : 'text-danger'">
              {{ tx.type === 'income' ? '+' : '-' }}{{ tx.amount }} ฿
            </td>
            <td>{{ tx.type === 'income' ? 'รายรับ' : 'รายจ่าย' }}</td>
            <td style="max-width: 300px;">
              <div v-if="tx.keyword" style="margin-bottom: 4px;"><strong>{{ tx.keyword }}</strong></div>
              <div v-else-if="tx.description" style="margin-bottom: 4px;">{{ tx.description }}</div>
              
              <!-- Raw Email View -->
              <div v-if="tx.rawEmail" class="raw-email-container">
                <span v-if="!tx.showFullEmail">
                  {{ tx.rawEmail.substring(0, 45) }}{{ tx.rawEmail.length > 45 ? '...' : '' }}
                  <button v-if="tx.rawEmail.length > 45" @click="tx.showFullEmail = true" class="btn-link">อ่านตัวเต็ม</button>
                </span>
                <span v-else>
                  {{ tx.rawEmail }}
                  <button @click="tx.showFullEmail = false" class="btn-link">ย่อ</button>
                </span>
              </div>
              <div v-else style="color:#aaa; font-size: 0.8rem;">(ไม่มีข้อมูลต้นฉบับ)</div>
            </td>
            <td>
              <div style="display: flex; gap: 0.5rem; align-items: center;">
                <input 
                  type="text" 
                  class="edit-input" 
                  v-model="tx.newCategory" 
                  placeholder="พิมพ์หมวดหมู่..." 
                  style="width: 150px;"
                  @keyup.enter="saveCategory(tx)"
                >
                <button 
                  class="btn-save" 
                  @click="saveCategory(tx)" 
                  :disabled="!tx.newCategory"
                >บันทึก</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import '@/assets/styles/category-mapping.css'

const API_CATEGORIES = `${import.meta.env.VITE_API_URL}/api/categories`
const API_TRANSACTIONS = `${import.meta.env.VITE_API_URL}/transaction`

const uncategorized = ref<any[]>([])
const fetching = ref(false)

const getAuthHeaders = () => {
  const token = localStorage.getItem('token') 
  return {
    headers: { Authorization: `Bearer ${token}` }
  }
}

const fetchData = async () => {
  fetching.value = true
  try {
    const res = await axios.get(`${API_CATEGORIES}/uncategorized`, getAuthHeaders())
    uncategorized.value = res.data.map((tx: any) => ({
      ...tx,
      newCategory: '',
      showFullEmail: false // <-- เพิ่มตัวแปรสำหรับเปิด/ปิดข้อความยาวๆ
    }))
  } catch (err) {
    console.error('Error fetching data:', err)
  } finally {
    fetching.value = false
  }
}

const saveCategory = async (tx: any) => {
  if (!tx.newCategory) return;
  
  try {
    // ทำการเซฟการแก้ไขแค่ Category ส่งไปที่ Database
    await axios.put(
      `${API_TRANSACTIONS}/${tx.id}`,
      { category: tx.newCategory },
      getAuthHeaders()
    )
    
    // พอบันทึกสำเร็จ ให้ดึงออกจากคิว "รายการที่ตกหล่น" ทันที จะได้ดูรู้เรื่องว่าจัดการแล้ว
    uncategorized.value = uncategorized.value.filter(t => t.id !== tx.id)
  } catch (err) {
    console.error('Error updating category:', err)
    alert('เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่')
  }
}

onMounted(() => {
  fetchData()
})
</script>
