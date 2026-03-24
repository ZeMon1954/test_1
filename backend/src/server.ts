process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import 'dotenv/config';
import express from 'express';
import authRoutes from './routes/auth';
import transactionRoutes from './routes/transaction';
import categoryRoutes from './routes/categoryRoutes';
import cors from 'cors';
import { startEmailReader } from './services/emailService';

const app = express();

// อนุญาตให้ API อ่านข้อมูลแบบ JSON จาก req.body ได้
app.use(express.json());
app.use(cors());

// ใช้เส้นทาง auth (register, login)
app.use(authRoutes);

// ใช้เส้นทาง transaction
app.use('/transaction', transactionRoutes);

// ใช้เส้นทาง category mapping
app.use('/api/categories', categoryRoutes);

// เริ่มรันเซิร์ฟเวอร์
app.listen(3000, () => {
    console.log('Server is running on port 3000');

    // เริ่มอ่านอีเมลเมื่อ server พร้อม
    startEmailReader();
});