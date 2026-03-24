import prisma from "../prisma";
import { parseTransaction } from "./emailParser";

export const getUncategorizedTransactions = async () => {
  return await prisma.transaction.findMany({
    where: {
      OR: [
        { category: "uncategorized" },
        { category: null }
      ]
    },
    orderBy: { createdAt: "desc" },
  });
};

export const mapTransactionCategory = async (data: { transactionId: number, keyword: string, category: string, userId: number }) => {
  const { transactionId, keyword, category, userId } = data;

  // 1. บันทึก/อัปเดตลงตารางความจำ CategoryMapping
  await prisma.categoryMapping.upsert({
    where: {
      userId_keyword: { // ใช้ composite unique key
        userId: userId,
        keyword: keyword
      }
    },
    update: {
      category: category
    },
    create: {
      userId: userId,
      keyword: keyword,
      category: category
    }
  });

  // 2. อัปเดต Transaction ทีี่ถูกเลือกให้เป็นหมวดหมู่นี้
  await prisma.transaction.update({
    where: { id: transactionId },
    data: { category: category }
  });

  // 3. (Optional) อัปเดต Transaction อื่นๆ ที่มี keyword เดียวกันและยังเป็น uncategorized
  await prisma.transaction.updateMany({
    where: {
      keyword: keyword,
      OR: [
        { category: "uncategorized" },
        { category: null }
      ]
    },
    data: { category: category }
  });
};

export const getCategoryMappings = async (userId: number) => {
  return await prisma.categoryMapping.findMany({
    where: { userId: userId },
    orderBy: { createdAt: "desc" }
  });
};

export const updateCategoryMapping = async (id: number, data: { keyword: string, category: string }) => {
  const { keyword, category } = data;
  const updatedMapping = await prisma.categoryMapping.update({
    where: { id: id },
    data: { keyword, category }
  });
  
  // (Optional) Update all existing uncategorized transactions that match the new keyword
  await prisma.transaction.updateMany({
    where: {
      keyword: keyword,
      OR: [
        { category: "uncategorized" },
        { category: null }
      ]
    },
    data: { category: category }
  });

  return updatedMapping;
};

export const deleteCategoryMapping = async (id: number) => {
  await prisma.categoryMapping.delete({
    where: { id: id }
  });
};

export const resyncUserTransactions = async (userId: number) => {
  // 1. ดึง uncategorized
  const uncategorizedTxs = await prisma.transaction.findMany({
    where: { 
      OR: [
        { category: "uncategorized" },
        { category: null }
      ]
    }
  });

  if (uncategorizedTxs.length === 0) {
    return 0; // No updated count
  }

  // 2. ดึง mappings ทั้งหมดของ user
  const mappings = await prisma.categoryMapping.findMany({
    where: { userId: userId }
  });

  let updatedCount = 0;

  for (const tx of uncategorizedTxs) {
    let currentKeyword = tx.keyword;

    // ถ้าในอดีตไม่ได้เซฟ keyword ไว้ ให้ลอง parse ใหม่จาก rawEmail
    if (!currentKeyword && tx.rawEmail) {
      const parsedData = parseTransaction(tx.rawEmail);
      if (parsedData.keyword) {
        currentKeyword = parsedData.keyword;
        // อัปเดต keyword กลับเข้าไปในฐานข้อมูล
        await prisma.transaction.update({
           where: { id: tx.id },
           data: { keyword: currentKeyword }
        });
      }
    }

    // ถ้ามี keyword แล้ว ให้ลองเทียบกับ Mapping ที่เซตไว้
    if (currentKeyword) {
      const matchedMapping = mappings.find(m => 
        currentKeyword!.toLowerCase().includes(m.keyword.toLowerCase())
      );

      if (matchedMapping) {
        await prisma.transaction.update({
          where: { id: tx.id },
          data: { category: matchedMapping.category }
        });
        updatedCount++;
      }
    }
  }

  return updatedCount;
};
