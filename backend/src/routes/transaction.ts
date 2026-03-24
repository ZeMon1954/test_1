import { Router } from "express";
import prisma from "../prisma";

const router = Router();

// ข้อมูลภาพรวม Dashboard (Summary)
router.get("/summary", async (req, res) => {
  try {
    const userId = 1; // User จำลอง (ควรอ่านจาก Token ในอนาคต)
    const user = await prisma.users.findUnique({ where: { id: userId } });
    
    // ยอดตั้งต้น (ถ้าไม่พบใน Database ให้ใช้ 93.34 ตามที่ขอ)
    const initialBalance = (user as any)?.initialBalance || 93.34;

    const incomeAgg = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { type: "income" }
    });

    const expenseAgg = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { type: "expense" }
    });

    const totalIncome = incomeAgg._sum.amount || 0;
    const totalExpense = expenseAgg._sum.amount || 0;
    const currentBalance = initialBalance + totalIncome - totalExpense;

    res.json({
      initialBalance,
      totalIncome,
      totalExpense,
      currentBalance
    });
  } catch (error) {
    console.error("Error fetching summary:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลสรุปยอดเงิน" });
  }
});

// ดึง Transaction ทั้งหมด (เรียงตาม createdAt ล่าสุดก่อน)
router.get("/", async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
  }
});

// เพิ่ม Transaction แบบ Manual (กรอกเอง)
router.post("/", async (req, res) => {
  try {
    const { amount, type, bank, keyword, description, category } = req.body;

    if (!amount || !type) {
      return res.status(400).json({ message: "กรุณาระบุจำนวนเงินและประเภทรายการ" });
    }

    const userId = 1; // User จำลอง (ควรอ่านจาก Token ในอนาคต)

    const newTransaction = await prisma.transaction.create({
      data: {
        rawEmail: "MANUAL", // เพื่อเป็นสัญลักษณ์ว่ามาจากผู้ใช้กรอกเอง
        amount: parseFloat(amount),
        type,
        bank: bank || null,
        keyword: keyword || null,
        description: description || null,
        category: category || "uncategorized",
        userId
      }
    });

    // 🟢 ถ้ามีการระบุ keyword และหมวดหมู่ ให้จำไว้ใช้ครั้งหน้าด้วย
    if (category && category !== "uncategorized" && keyword) {
      await prisma.categoryMapping.upsert({
        where: { userId_keyword: { userId, keyword } },
        update: { category },
        create: { userId, keyword, category }
      });
    }

    res.status(201).json(newTransaction);
  } catch (error) {
    console.error("Error creating manual transaction:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" });
  }
});

// แก้ไขข้อมูล Transaction (Amount, Category, Description)
router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { amount, category, description } = req.body;

    const tx = await prisma.transaction.findUnique({ where: { id } });
    if (!tx) return res.status(404).json({ message: "ไม่พบรายการ" });

    const data: any = {};
    if (amount !== undefined) data.amount = amount;
    if (category !== undefined) data.category = category;
    if (description !== undefined) data.description = description;

    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data,
    });

    // 🟢 บันทึกกฎอัตโนมัติ (Method 1)
    const effectiveUserId = tx.userId || 1;
    if (category !== undefined && category !== "uncategorized" && tx.keyword) {
      await prisma.categoryMapping.upsert({
        where: { userId_keyword: { userId: effectiveUserId, keyword: tx.keyword } },
        update: { category },
        create: { userId: effectiveUserId, keyword: tx.keyword, category }
      });
    }

    res.json(updatedTransaction);
  } catch (error) {
    console.error("Error updating transaction:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
  }
});

// แก้ไขหมวดหมู่หลายรายการ
router.post("/bulk-update", async (req, res) => {
  try {
    const { ids, category } = req.body;
    if (!Array.isArray(ids) || ids.length === 0 || !category) {
      return res.status(400).json({ message: "ข้อมูลไม่ถูกต้อง" });
    }

    const transactionsToUpdate = await prisma.transaction.findMany({
      where: { id: { in: ids } }
    });

    await prisma.transaction.updateMany({
      where: { id: { in: ids } },
      data: { category }
    });

    // 🟢 บันทึกกฎอัตโนมัติ (Method 1)
    if (category !== "uncategorized") {
      for (const tx of transactionsToUpdate) {
        if (tx.keyword) {
          const effectiveUserId = tx.userId || 1;
          await prisma.categoryMapping.upsert({
            where: { userId_keyword: { userId: effectiveUserId, keyword: tx.keyword } },
            update: { category },
            create: { userId: effectiveUserId, keyword: tx.keyword, category }
          });
        }
      }
    }

    res.json({ message: "อัปเดตข้อมูลสำเร็จ" });
  } catch (error) {
    console.error("Error bulk updating transactions:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
  }
});

// ลบหลายรายการ
router.post("/bulk-delete", async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "ไม่พบรายการที่ต้องการลบ" });
    }

    await prisma.transaction.deleteMany({
      where: { id: { in: ids } }
    });
    res.json({ message: "ลบข้อมูลสำเร็จ" });
  } catch (error) {
    console.error("Error bulk deleting transactions:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
  }
});

// ลบ Transaction (อันเดียว)
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.transaction.delete({
      where: { id }
    });
    res.json({ message: "ลบข้อมูลสำเร็จ" });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
  }
});

export default router;