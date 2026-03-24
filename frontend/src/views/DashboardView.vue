<template>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <h2>🎮 ZeMon, ยินดีต้อนรับ!</h2>
      <p class="status-text">สถานะ: <span class="val-text-cyan">เชื่อมต่อระบบแล้ว</span></p>
    </div>

    <!-- Balance Card -->
    <div class="balance-card" v-if="summary">
      <div class="balance-main">
        <span class="balance-label">ยอดเงินคงเหลือสุทธิ</span>
        <span class="balance-value" :class="summary.currentBalance >= 0 ? 'text-success' : 'text-danger'">
          {{ Number(summary.currentBalance).toLocaleString('th-TH', {minimumFractionDigits: 2}) }} ฿
        </span>
      </div>
      <div class="balance-details">
        <div class="detail-box income-box">
          <span class="box-label">รายรับรวม</span>
          <span class="box-val">+{{ Number(summary.totalIncome).toLocaleString('th-TH', {minimumFractionDigits: 2}) }} ฿</span>
        </div>
        <div class="detail-box expense-box">
          <span class="box-label">รายจ่ายรวม</span>
          <span class="box-val">-{{ Number(summary.totalExpense).toLocaleString('th-TH', {minimumFractionDigits: 2}) }} ฿</span>
        </div>
      </div>
    </div>

    <div class="transaction-section">
      <div class="section-title">
        <h3>ประวัติการทำธุรกรรม</h3>
        <div class="title-line"></div>
      </div>

      <div v-if="paginatedTransactions.length > 0" class="transaction-grid">
        <div v-for="item in paginatedTransactions" :key="item.id" class="transaction-card">
          <div class="card-glow"></div>
          <div class="tx-header">
            <span class="tx-date">{{ new Date(item.createdAt).toLocaleString('th-TH') }}</span>
            <span class="tx-type" :class="item.type">{{ item.type }}</span>
          </div>
          
          <div class="tx-body">
            <div class="tx-amount">
              <span class="currency">฿</span>
              <span class="amount-val">{{ parseFloat(item.amount).toLocaleString(undefined, {minimumFractionDigits: 2}) }}</span>
            </div>
            
            <div class="tx-details">
              <div class="detail-row">
                <span class="detail-label">ธนาคาร:</span>
                <span class="detail-value">{{ item.bank }}</span>
              </div>
              <div class="detail-row" v-if="item.description">
                <span class="detail-label">บันทึก:</span>
                <span class="detail-value tx-desc">{{ item.description }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="empty-state">
        <div class="empty-icon">📂</div>
        <p>ไม่พบประวัติการทำธุรกรรมในระบบ</p>
      </div>

      <!-- Pagination Controls -->
      <div v-if="totalPages > 1" class="pagination-container">
        <button 
          class="btn-page btn-prev" 
          :disabled="currentPage === 1" 
          @click="prevPage"
        >
          &lt; ก่อนหน้า
        </button>
        
        <div class="page-numbers">
          <button 
            v-for="page in totalPages" 
            :key="page" 
            class="btn-page-number" 
            :class="{ active: currentPage === page }"
            @click="goToPage(page)"
          >
            {{ page }}
          </button>
        </div>

        <button 
          class="btn-page btn-next" 
          :disabled="currentPage === totalPages" 
          @click="nextPage"
        >
          ถัดไป &gt;
        </button>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import '@/assets/styles/dashboard.css'
import { useRouter } from 'vue-router';
import { ref, computed, onMounted } from 'vue';

const router = useRouter();
const transactions = ref<any[]>([]);
const summary = ref({ currentBalance: 0, totalIncome: 0, totalExpense: 0, initialBalance: 0 });

// Pagination setup
const currentPage = ref(1);
const itemsPerPage = 6; // แสดง 6 รายการต่อ 1 หน้า

const totalPages = computed(() => {
  return Math.ceil(transactions.value.length / itemsPerPage);
});

const paginatedTransactions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return transactions.value.slice(start, end);
});

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

const goToPage = (page: number) => {
  currentPage.value = page;
};

onMounted(async () => {
  try {
    const summaryRes = await fetch(`${import.meta.env.VITE_API_URL}/transaction/summary`);
    if (summaryRes.ok) {
      summary.value = await summaryRes.json();
    }
    
    const res = await fetch(`${import.meta.env.VITE_API_URL}/transaction`);
    if (res.ok) {
      transactions.value = await res.json();
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
});

</script>

<style scoped>
.balance-card {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}
.balance-main {
  margin-bottom: 2rem;
}
.balance-label {
  display: block;
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 0.5rem;
}
.balance-value {
  font-size: 3rem;
  font-weight: bold;
  text-shadow: 0 2px 10px rgba(0,0,0,0.5);
}
.balance-details {
  display: flex;
  justify-content: center;
  gap: 2rem;
  flex-wrap: wrap;
}
.detail-box {
  background: rgba(255, 255, 255, 0.05);
  padding: 1rem 2rem;
  border-radius: 8px;
  min-width: 180px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}
.box-label {
  display: block;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 0.5rem;
}
.box-val {
  font-size: 1.4rem;
  font-weight: bold;
}
.income-box .box-val { color: #32cd32; }
.expense-box .box-val { color: #ff4d4d; }
.text-success { color: #00ffcc; }
.text-danger { color: #ff4d4d; }
</style>
