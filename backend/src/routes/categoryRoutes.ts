import { Router } from "express";
import { 
  getUncategorized, 
  mapCategory, 
  getMappings, 
  updateMapping, 
  deleteMapping, 
  resyncHistoricalData 
} from '../controllers/categoryController';

const router = Router();

// GET /api/categories/uncategorized - ดึงรายการที่ยังไม่ได้จัดหมวดหมู่
router.get("/uncategorized", getUncategorized);

// POST /api/categories/map - บันทึกการจัดหมวดหมู่และอัปเดต transaction เดิม
router.post("/map", mapCategory);

// GET /api/categories/mappings - ดึงกฎการจับคู่ทั้งหมด (เผื่อเอาไปแสดงหน้าตั้งค่า)
router.get("/mappings/:userId", getMappings);

// PUT /api/categories/mappings/:id - แก้ไขกฎการจับคู่
router.put("/mappings/:id", updateMapping);

// DELETE /api/categories/mappings/:id - ลบกฎการจับคู่
router.delete("/mappings/:id", deleteMapping);

// POST /api/categories/resync - จัดหมวดหมู่ใหม่ให้กับรายการเก่าทั้งหมด
router.post("/resync", resyncHistoricalData);

export default router;
