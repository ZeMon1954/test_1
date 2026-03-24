import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// คีย์ลับสำหรับสร้าง Token
const JWT_SECRET = process.env.JWT_SECRET || 'my_super_secret_key_123';

// ==========================================
// 📝 1. สมัครสมาชิก (Register)
// ==========================================
export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, name } = req.body;

        // 1.1 ตรวจสอบว่ามีอีเมลนี้ในระบบหรือยัง
        const existingUser = await prisma.users.findUnique({
            where: { email: email }
        });

        if (existingUser) {
            return res.status(400).json({ message: "อีเมลนี้ถูกใช้งานแล้ว" });
        }

        // 1.2 เข้ารหัสผ่าน (Hashing) ด้วย bcrypt
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // 1.3 บันทึกข้อมูลลงฐานข้อมูลผ่าน Prisma
        const newUser = await prisma.users.create({
            data: {
                email: email,
                password: hashedPassword,
                name: name
            }
        });

        res.status(201).json({ 
            message: "สมัครสมาชิกสำเร็จ", 
            user: { id: newUser.id, email: newUser.email, name: newUser.name } 
        });

    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
    }
};

// ==========================================
// 🔐 2. เข้าสู่ระบบ (Login)
// ==========================================
export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // 2.1 ค้นหา User จากอีเมล
        const user = await prisma.users.findUnique({
            where: { email: email }
        });

        if (!user) {
            return res.status(401).json({ message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
        }

        // 2.2 ตรวจสอบรหัสผ่านว่าตรงกันไหม
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
        }

        // 2.3 สร้าง JWT Token
        const token = jwt.sign(
            { userId: user.id, email: user.email }, 
            JWT_SECRET, 
            { expiresIn: '1d' } 
        );

        res.status(200).json({ 
            message: "เข้าสู่ระบบสำเร็จ", 
            token: token
        });

    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
    }
};
