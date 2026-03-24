<template>
  <div class="category-mapping-container">
    <h2>ประวัติรายการทั้งหมด (Transaction History)</h2>
    <p class="subtitle">ดูและแก้ไขรายการใช้จ่ายทั้งหมดของคุณ</p>

    <!-- ปุ่มเพิ่มรายการแบบ Manual -->
    <div style="margin-bottom: 20px; display: flex; justify-content: flex-end;">
      <button class="btn-primary" @click="showAddModal = true" style="background-color: #48bb78; border-color: #48bb78;">➕ เพิ่มรายการ (Manual)</button>
    </div>

    <!-- Modal เพิ่มรายการ -->
    <div v-if="showAddModal" class="modal-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000;">
      <div class="modal-content" style="background: white; padding: 25px; border-radius: 12px; width: 400px; max-width: 90%; color: #333; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h3 style="margin-top: 0; margin-bottom: 20px; color: #2d3748;">📝 เพิ่มรายการใหม่</h3>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">ประเภทรายการ</label>
          <select v-model="addForm.type" class="edit-input" style="width: 100%; padding: 8px;">
            <option value="income">รายรับ (Income)</option>
            <option value="expense">รายจ่าย (Expense)</option>
          </select>
        </div>

        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">จำนวนเงิน (บาท)</label>
          <input type="number" step="0.01" v-model="addForm.amount" class="edit-input" style="width: 100%; padding: 8px;" />
        </div>

        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">จากธนาคาร / ช่องทาง</label>
          <input type="text" v-model="addForm.bank" placeholder="เช่น krungthai" class="edit-input" style="width: 100%; padding: 8px;" />
        </div>

        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">ผู้โอน / ชื่อย่อ (Keyword)</label>
          <input type="text" v-model="addForm.keyword" placeholder="เช่น นาย เอ" class="edit-input" style="width: 100%; padding: 8px;" />
        </div>

        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">คำอธิบาย (Description)</label>
          <input type="text" v-model="addForm.description" placeholder="เช่น ค่าขนม, ค่าไฟ" class="edit-input" style="width: 100%; padding: 8px;" />
        </div>

        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">หมวดหมู่ (Category)</label>
          <input type="text" v-model="addForm.category" placeholder="เช่น อาหาร, เดินทาง" class="edit-input" style="width: 100%; padding: 8px;" />
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 10px;">
          <button @click="showAddModal = false" class="btn-cancel" style="padding: 8px 16px;">ยกเลิก</button>
          <button @click="submitAddTransaction" class="btn-save" style="padding: 8px 16px;" :disabled="addingTx || !addForm.amount">
            <span v-if="addingTx">⏳ กำลังบันทึก...</span><span v-else>บันทึก</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="mapping-list-container">
      <div v-if="selectedIds.length > 0" style="margin-bottom: 1rem; padding: 12px; background: rgba(0,0,0,0.2); border-radius: 8px; border-left: 4px solid #63b3ed; display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
        <span style="font-weight: bold; color: #fff;">เลือกไว้ {{ selectedIds.length }} รายการ</span>
        
        <input type="text" v-model="bulkCategory" placeholder="พิมพ์หมวดหมู่ใหม่..." class="edit-input" style="width: 180px; margin-left: 10px;" />
        <button class="btn-primary" @click="bulkUpdateCategory" :disabled="!bulkCategory || bulkUpdating">
          <span v-if="bulkUpdating">⏳...</span><span v-else>เปลี่ยนหมวดหมู่ทั้งหมด</span>
        </button>
        
        <div style="flex-grow: 1"></div>
        
        <button class="btn-delete" @click="bulkDelete" :disabled="bulkDeleting">
          <span v-if="bulkDeleting">กำลังลบ...</span><span v-else>🗑️ ลบที่เลือกทั้งหมด</span>
        </button>
      </div>

      <div v-if="fetching" class="loading-state">กำลังโหลดข้อมูล...</div>
      
      <div v-else-if="transactions.length === 0" class="empty-state">
        ยังไม่มีรายการ
      </div>

      <table v-else class="mapping-table">
        <thead>
          <tr>
            <th style="width: 40px; text-align: center;">
              <input type="checkbox" :checked="selectedIds.length === transactions.length && transactions.length > 0" @change="toggleAll" />
            </th>
            <th>วันที่</th>
            <th>ยอดเงิน</th>
            <th>Type</th>
            <th>คำสำคัญ/รายละเอียด</th>
            <th>หมวดหมู่ (Category)</th>
            <th>จัดการ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tx in transactions" :key="tx.id">
            <!-- Normal View -->
            <template v-if="editingId !== tx.id">
              <td style="text-align: center;">
                <input type="checkbox" :value="tx.id" v-model="selectedIds" />
              </td>
              <td style="font-size: 0.85rem;">{{ new Date(tx.createdAt).toLocaleDateString('th-TH') }}</td>
              <td :class="tx.type === 'income' ? 'text-success' : 'text-danger'">
                {{ tx.type === 'income' ? '+' : '-' }}{{ tx.amount }} ฿
              </td>
              <td>
                {{ tx.type === 'income' ? 'รายรับ' : 'รายจ่าย' }}
                <span v-if="tx.rawEmail === 'MANUAL'" style="font-size: 0.75em; background: #e2e8f0; color: #4a5568; padding: 2px 6px; border-radius: 4px; margin-left: 5px; display: inline-block;">📝 ระบบมือ</span>
                <span v-else style="font-size: 0.75em; background: #ebf8ff; color: #3182ce; padding: 2px 6px; border-radius: 4px; margin-left: 5px; display: inline-block;">📧 อีเมล</span>
              </td>
              <td>
                <div v-if="tx.keyword"><strong>{{ tx.keyword }}</strong></div>
                <div v-if="tx.description" class="tx-desc">{{ tx.description }}</div>
                <div v-if="!tx.keyword && !tx.description" style="color:#aaa;">-</div>
              </td>
              <td>
                <span class="category-badge" :class="{'uncategorized-badge': !tx.category || tx.category === 'uncategorized'}">
                  {{ tx.category || 'uncategorized' }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button @click="startEdit(tx)" class="btn-edit" :disabled="deletingId === tx.id">แก้ไข</button>
                  <button @click="deleteTransaction(tx.id)" class="btn-delete" :disabled="deletingId === tx.id">
                    <span v-if="deletingId === tx.id">...</span>
                    <span v-else>ลบ</span>
                  </button>
                </div>
              </td>
            </template>
            <!-- Edit View -->
            <template v-else>
              <td style="text-align: center;">-</td>
              <td>{{ new Date(tx.createdAt).toLocaleDateString('th-TH') }}</td>
              <td>
                <input v-model="editForm.amount" type="number" step="0.01" class="edit-input" style="width: 80px;" />
              </td>
              <td>{{ tx.type === 'income' ? 'รายรับ' : 'รายจ่าย' }}</td>
              <td>
                <input v-model="editForm.description" type="text" class="edit-input" placeholder="คำอธิบายเพิ่มเติม" />
              </td>
              <td>
                <input v-model="editForm.category" type="text" class="edit-input" placeholder="หมวดหมู่" />
              </td>
              <td>
                <div class="action-buttons">
                  <button @click="saveEdit" class="btn-save" :disabled="savingEdit">บันทึก</button>
                  <button @click="cancelEdit" class="btn-cancel" :disabled="savingEdit">ยกเลิก</button>
                </div>
              </td>
            </template>
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

const API_URL = 'http://localhost:3000/transaction'

const transactions = ref<any[]>([])
const fetching = ref(false)
const savingEdit = ref(false)
const deletingId = ref<number | null>(null)

const editingId = ref<number | null>(null)
const editForm = ref({ id: 0, amount: 0, category: '', description: '' })

// Add Modal States
const showAddModal = ref(false)
const addingTx = ref(false)
const addForm = ref({
  amount: 0,
  type: 'income',
  bank: 'krungthai',
  keyword: '',
  description: '',
  category: ''
})

// Bulk Action States
const selectedIds = ref<number[]>([])
const bulkCategory = ref('')
const bulkUpdating = ref(false)
const bulkDeleting = ref(false)

const getAuthHeaders = () => {
  const token = localStorage.getItem('token') 
  return {
    headers: { Authorization: `Bearer ${token}` }
  }
}

const submitAddTransaction = async () => {
  addingTx.value = true
  try {
    await axios.post(API_URL, addForm.value, getAuthHeaders())
    showAddModal.value = false
    // reset form
    addForm.value = { amount: 0, type: 'income', bank: 'krungthai', keyword: '', description: '', category: '' }
    fetchData()
  } catch (err) {
    console.error('Error adding transaction:', err)
    alert('เพิ่มรายการไม่สำเร็จ')
  } finally {
    addingTx.value = false
  }
}

const fetchData = async () => {
  fetching.value = true
  try {
    const res = await axios.get(API_URL, getAuthHeaders())
    transactions.value = res.data
  } catch (err) {
    console.error('Error fetching transactions:', err)
  } finally {
    fetching.value = false
  }
}

const startEdit = (tx: any) => {
  editingId.value = tx.id
  editForm.value = {
    id: tx.id,
    amount: tx.amount || 0,
    category: tx.category || '',
    description: tx.description || ''
  }
}

const cancelEdit = () => {
  editingId.value = null
}

const saveEdit = async () => {
  savingEdit.value = true
  try {
    const payload = {
      amount: editForm.value.amount,
      category: editForm.value.category,
      description: editForm.value.description
    }
    await axios.put(`${API_URL}/${editForm.value.id}`, payload, getAuthHeaders())
    editingId.value = null
    fetchData()
  } catch (err) {
    console.error('Error saving transaction:', err)
    alert('บันทึกไม่สำเร็จ')
  } finally {
    savingEdit.value = false
  }
}

const deleteTransaction = async (id: number) => {
  if (!confirm('ยืนยันการลบรายการนี้?')) return
  deletingId.value = id
  try {
    await axios.delete(`${API_URL}/${id}`, getAuthHeaders())
    fetchData()
  } catch (err) {
    console.error('Error deleting transaction:', err)
    alert('ลบไม่สำเร็จ')
  } finally {
    deletingId.value = null
  }
}

onMounted(() => {
  fetchData()
})

const toggleAll = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.checked) {
    selectedIds.value = transactions.value.map(t => t.id)
  } else {
    selectedIds.value = []
  }
}

const bulkDelete = async () => {
  if (!confirm(`ยืนยันการลบ ${selectedIds.value.length} รายการที่เลือก?`)) return
  bulkDeleting.value = true
  try {
    await axios.post(`${API_URL}/bulk-delete`, { ids: selectedIds.value }, getAuthHeaders())
    selectedIds.value = []
    fetchData()
  } catch (err) {
    console.error('Error bulk deleting:', err)
    alert('ลบไม่สำเร็จ')
  } finally {
    bulkDeleting.value = false
  }
}

const bulkUpdateCategory = async () => {
  if (!bulkCategory.value) return
  bulkUpdating.value = true
  try {
    await axios.post(`${API_URL}/bulk-update`, { ids: selectedIds.value, category: bulkCategory.value }, getAuthHeaders())
    bulkCategory.value = ''
    selectedIds.value = []
    fetchData()
  } catch (err) {
    console.error('Error bulk updating:', err)
    alert('เปลี่ยนหมวดหมู่ไม่สำเร็จ')
  } finally {
    bulkUpdating.value = false
  }
}
</script>
