import { Request, Response } from "express";
import * as categoryService from "../services/categoryService";

export const getUncategorized = async (req: Request, res: Response) => {
  try {
    const transactions = await categoryService.getUncategorizedTransactions();
    res.json(transactions);
  } catch (error) {
    console.error("Error fetching uncategorized:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const mapCategory = async (req: Request, res: Response) => {
  try {
    const { transactionId, keyword, category, userId } = req.body;

    if (!transactionId || !keyword || !category || !userId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    await categoryService.mapTransactionCategory({
      transactionId: Number(transactionId),
      keyword,
      category,
      userId: Number(userId)
    });

    res.json({ message: "Category mapped successfully" });
  } catch (error) {
    console.error("Error mapping category:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getMappings = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId as string, 10);
    const mappings = await categoryService.getCategoryMappings(userId);
    res.json(mappings);
  } catch (error) {
    console.error("Error fetching mappings:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateMapping = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const { keyword, category } = req.body;

    if (!keyword || !category) {
      return res.status(400).json({ message: "Keyword and category are required" });
    }

    const updatedMapping = await categoryService.updateCategoryMapping(id, { keyword, category });
    res.json(updatedMapping);
  } catch (error) {
    console.error("Error updating mapping:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteMapping = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    await categoryService.deleteCategoryMapping(id);
    res.json({ message: "Mapping deleted" });
  } catch (error) {
    console.error("Error deleting mapping:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const resyncHistoricalData = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "userId is required for resync" });
    }

    const updatedCount = await categoryService.resyncUserTransactions(Number(userId));
    res.json({ message: "Resync completed", updatedCount });
  } catch (error) {
    console.error("Error resyncing historical data:", error);
    res.status(500).json({ message: "Server error during resync" });
  }
};
