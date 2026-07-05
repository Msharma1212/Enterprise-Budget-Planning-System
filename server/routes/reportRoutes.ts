import { Router } from "express";
import { ReportController } from "../controllers/reportController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = Router();

/**
 * @route   GET /api/v1/reports/data
 * @desc    Fetch corporate-grade compiled audit reporting models with applied filters
 * @access  Private
 */
router.get("/data", authenticateToken as any, ReportController.getReportData as any);

/**
 * @route   GET /api/v1/reports/export/excel
 * @desc    Compile and stream a dynamic, styled Excel spreadsheet with formula columns
 * @access  Private
 */
router.get("/export/excel", authenticateToken as any, ReportController.exportExcel as any);

/**
 * @route   GET /api/v1/reports/export/pdf
 * @desc    Stream high-fidelity landscape-oriented PDF documents with official SOX seal
 * @access  Private
 */
router.get("/export/pdf", authenticateToken as any, ReportController.exportPdf as any);

export const reportRouter = router;
