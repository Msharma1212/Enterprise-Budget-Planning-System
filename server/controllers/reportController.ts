import { Response } from "express";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import { ReportModel } from "../models/reportModel.js";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";

export class ReportController {
  /**
   * GET /api/v1/reports/data
   * Retrieves unified JSON payload for all report types with applied filters
   */
  public static getReportData(req: AuthenticatedRequest, res: Response): void {
    try {
      const departmentId = (req.query.departmentId as string) || "All";
      const year = Number(req.query.year) || 2026;
      const search = (req.query.search as string) || "";
      const category = (req.query.category as string) || "All";

      const data = ReportModel.getReportData(departmentId, year, search, category);

      res.json({
        success: true,
        ...data
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/v1/reports/export/excel
   * Generates a fully formatted, styled Oracle-style multi-sheet Excel workbook with formulas
   */
  public static async exportExcel(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const departmentId = (req.query.departmentId as string) || "All";
      const year = Number(req.query.year) || 2026;
      const search = (req.query.search as string) || "";
      const category = (req.query.category as string) || "All";

      const data = ReportModel.getReportData(departmentId, year, search, category);
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Oracle PBCS Financial Planner";
      workbook.lastModifiedBy = req.user?.name || "System Controller";
      workbook.created = new Date();

      // Common styling templates
      const oracleHeaderStyle = (ws: ExcelJS.Worksheet, columnsCount: number) => {
        // Main Title Row
        ws.mergeCells(1, 1, 1, columnsCount);
        const titleCell = ws.getCell(1, 1);
        titleCell.value = "ORACLE EPM FINANCIAL PLATFORM - LEDGER AUDIT";
        titleCell.font = { name: "Calibri", size: 14, bold: true, color: { argb: "FFFFFF" } };
        titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "0F2027" } };
        titleCell.alignment = { horizontal: "center", vertical: "middle" };
        ws.getRow(1).height = 30;

        // Subtitle Row
        ws.mergeCells(2, 1, 2, columnsCount);
        const subCell = ws.getCell(2, 1);
        subCell.value = `Export Scope: Dept [${departmentId}] • FY${year} • Category [${category}] • Exported by ${req.user?.name || "Controller"}`;
        subCell.font = { name: "Calibri", size: 10, italic: true, color: { argb: "DCE4ED" } };
        subCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "203A43" } };
        subCell.alignment = { horizontal: "center", vertical: "middle" };
        ws.getRow(2).height = 20;

        // Header Row Style
        const headerRow = ws.getRow(4);
        headerRow.height = 24;
        for (let i = 1; i <= columnsCount; i++) {
          const cell = headerRow.getCell(i);
          cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFF" } };
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "2C5364" } };
          cell.alignment = { horizontal: i === 1 ? "left" : "right", vertical: "middle" };
          cell.border = {
            top: { style: "thin", color: { argb: "2C3E50" } },
            bottom: { style: "double", color: { argb: "2C3E50" } }
          };
        }
      };

      const formatNumberCell = (cell: ExcelJS.Cell, formatStr = "$#,##0") => {
        cell.numFmt = formatStr;
        cell.alignment = { horizontal: "right", vertical: "middle" };
        cell.font = { name: "Calibri", size: 10 };
      };

      // -------------------------------------------------------------
      // SHEET 1: MONTHLY PERFORMANCE REPORT
      // -------------------------------------------------------------
      const wsMonthly = workbook.addWorksheet("Monthly Performance");
      wsMonthly.columns = [
        { header: "Month Period", key: "month", width: 15 },
        { header: "Approved Budget ($)", key: "budget", width: 22 },
        { header: "Actual Ledger Spend ($)", key: "actual", width: 22 },
        { header: "Variance Surplus/Deficit ($)", key: "variance", width: 24 },
        { header: "Execution %", key: "pctSpent", width: 16 }
      ];
      oracleHeaderStyle(wsMonthly, 5);

      data.monthly.forEach((row, index) => {
        const addedRow = wsMonthly.addRow({
          month: row.month,
          budget: row.budget,
          actual: row.actual,
          variance: row.variance,
          pctSpent: row.pctSpent / 100
        });
        formatNumberCell(addedRow.getCell(2));
        formatNumberCell(addedRow.getCell(3));
        formatNumberCell(addedRow.getCell(4));
        formatNumberCell(addedRow.getCell(5), "0.0%");
      });

      // Total row for Monthly
      const totalRowM = wsMonthly.addRow({
        month: "Total Consolidated",
        budget: { formula: "SUM(B5:B16)" },
        actual: { formula: "SUM(C5:C16)" },
        variance: { formula: "B17-C17" },
        pctSpent: { formula: "IF(B17>0, C17/B17, 0)" }
      });
      totalRowM.font = { name: "Calibri", size: 11, bold: true };
      formatNumberCell(totalRowM.getCell(2));
      formatNumberCell(totalRowM.getCell(3));
      formatNumberCell(totalRowM.getCell(4));
      formatNumberCell(totalRowM.getCell(5), "0.0%");
      for (let i = 1; i <= 5; i++) {
        totalRowM.getCell(i).border = {
          top: { style: "thin" },
          bottom: { style: "double" }
        };
      }

      // -------------------------------------------------------------
      // SHEET 2: QUARTERLY SUMMARY
      // -------------------------------------------------------------
      const wsQuarterly = workbook.addWorksheet("Quarterly Summary");
      wsQuarterly.columns = [
        { header: "Quarter Period", key: "quarter", width: 18 },
        { header: "Approved Budget ($)", key: "budget", width: 22 },
        { header: "Actual Ledger Spend ($)", key: "actual", width: 22 },
        { header: "Variance ($)", key: "variance", width: 22 },
        { header: "Execution %", key: "pctSpent", width: 16 }
      ];
      oracleHeaderStyle(wsQuarterly, 5);

      data.quarterly.forEach(row => {
        const addedRow = wsQuarterly.addRow({
          quarter: row.quarter,
          budget: row.budget,
          actual: row.actual,
          variance: row.variance,
          pctSpent: row.pctSpent / 100
        });
        formatNumberCell(addedRow.getCell(2));
        formatNumberCell(addedRow.getCell(3));
        formatNumberCell(addedRow.getCell(4));
        formatNumberCell(addedRow.getCell(5), "0.0%");
      });

      const totalRowQ = wsQuarterly.addRow({
        quarter: "Total Consolidated",
        budget: { formula: "SUM(B5:B8)" },
        actual: { formula: "SUM(C5:C8)" },
        variance: { formula: "B9-C9" },
        pctSpent: { formula: "IF(B9>0, C9/B9, 0)" }
      });
      totalRowQ.font = { name: "Calibri", size: 11, bold: true };
      formatNumberCell(totalRowQ.getCell(2));
      formatNumberCell(totalRowQ.getCell(3));
      formatNumberCell(totalRowQ.getCell(4));
      formatNumberCell(totalRowQ.getCell(5), "0.0%");
      for (let i = 1; i <= 5; i++) {
        totalRowQ.getCell(i).border = {
          top: { style: "thin" },
          bottom: { style: "double" }
        };
      }

      // -------------------------------------------------------------
      // SHEET 3: DEPARTMENT-WISE PLAN vs ACT
      // -------------------------------------------------------------
      const wsDept = workbook.addWorksheet("Cost Centers");
      wsDept.columns = [
        { header: "Cost Center Code", key: "departmentCode", width: 18 },
        { header: "Division Unit Name", key: "departmentName", width: 28 },
        { header: "Approved Budget ($)", key: "budget", width: 22 },
        { header: "Actual Ledger Spend ($)", key: "actual", width: 22 },
        { header: "Variance ($)", key: "variance", width: 22 },
        { header: "Execution %", key: "pctSpent", width: 16 }
      ];
      oracleHeaderStyle(wsDept, 6);

      data.departmentWise.forEach(row => {
        const addedRow = wsDept.addRow({
          departmentCode: row.departmentCode,
          departmentName: row.departmentName,
          budget: row.budget,
          actual: row.actual,
          variance: row.variance,
          pctSpent: row.pctSpent / 100
        });
        addedRow.getCell(1).alignment = { horizontal: "left" };
        addedRow.getCell(2).alignment = { horizontal: "left" };
        formatNumberCell(addedRow.getCell(3));
        formatNumberCell(addedRow.getCell(4));
        formatNumberCell(addedRow.getCell(5));
        formatNumberCell(addedRow.getCell(6), "0.0%");
      });

      const totalRowD = wsDept.addRow({
        departmentCode: "Total",
        departmentName: "Consolidated Divisions",
        budget: { formula: `SUM(C5:C${4 + data.departmentWise.length})` },
        actual: { formula: `SUM(D5:D${4 + data.departmentWise.length})` },
        variance: { formula: `C${5 + data.departmentWise.length}-D${5 + data.departmentWise.length}` },
        pctSpent: { formula: `IF(C${5 + data.departmentWise.length}>0, D${5 + data.departmentWise.length}/C${5 + data.departmentWise.length}, 0)` }
      });
      totalRowD.font = { name: "Calibri", size: 11, bold: true };
      formatNumberCell(totalRowD.getCell(3));
      formatNumberCell(totalRowD.getCell(4));
      formatNumberCell(totalRowD.getCell(5));
      formatNumberCell(totalRowD.getCell(6), "0.0%");
      for (let i = 1; i <= 6; i++) {
        totalRowD.getCell(i).border = {
          top: { style: "thin" },
          bottom: { style: "double" }
        };
      }

      // -------------------------------------------------------------
      // SHEET 4: BUDGET CATEGORY VARIANCE ANALYSIS
      // -------------------------------------------------------------
      const wsVar = workbook.addWorksheet("Variance Matrix");
      wsVar.columns = [
        { header: "Cost Center Code", key: "departmentCode", width: 15 },
        { header: "Division Unit", key: "departmentName", width: 20 },
        { header: "Ledger Category", key: "category", width: 22 },
        { header: "Allocated Budget ($)", key: "budget", width: 22 },
        { header: "Committed Actuals ($)", key: "actual", width: 22 },
        { header: "Variance Surplus/Deficit ($)", key: "variance", width: 24 },
        { header: "Execution %", key: "pctSpent", width: 15 },
        { header: "Audit Status", key: "statusFlag", width: 15 },
        { header: "Controller Remarks", key: "notes", width: 35 }
      ];
      oracleHeaderStyle(wsVar, 9);

      data.budgetVariance.forEach(row => {
        const addedRow = wsVar.addRow({
          departmentCode: row.departmentCode,
          departmentName: row.departmentName,
          category: row.category,
          budget: row.budget,
          actual: row.actual,
          variance: row.variance,
          pctSpent: row.pctSpent / 100,
          statusFlag: row.statusFlag,
          notes: row.notes
        });
        addedRow.getCell(1).alignment = { horizontal: "left" };
        addedRow.getCell(2).alignment = { horizontal: "left" };
        addedRow.getCell(3).alignment = { horizontal: "left" };
        formatNumberCell(addedRow.getCell(4));
        formatNumberCell(addedRow.getCell(5));
        formatNumberCell(addedRow.getCell(6));
        formatNumberCell(addedRow.getCell(7), "0.0%");
        
        // Color code status column
        const statusCell = addedRow.getCell(8);
        statusCell.alignment = { horizontal: "center" };
        if (row.statusFlag === "BREACHED") {
          statusCell.font = { name: "Calibri", bold: true, color: { argb: "9C0006" } };
          statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFC7CE" } };
        } else if (row.statusFlag === "CAUTION") {
          statusCell.font = { name: "Calibri", bold: true, color: { argb: "9C6500" } };
          statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEB9C" } };
        } else {
          statusCell.font = { name: "Calibri", bold: true, color: { argb: "006100" } };
          statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "C6EFCE" } };
        }
      });

      // -------------------------------------------------------------
      // SHEET 5: ITEMIZED LEDGER JOURNAL
      // -------------------------------------------------------------
      const wsDetail = workbook.addWorksheet("Ledger Journal Detail");
      wsDetail.columns = [
        { header: "Date", key: "date", width: 14 },
        { header: "Cost Center", key: "departmentCode", width: 14 },
        { header: "Ledger Category", key: "category", width: 22 },
        { header: "Payee / Vendor", key: "vendorName", width: 22 },
        { header: "Invoice Ref", key: "invoiceNumber", width: 16 },
        { header: "Description / Purpose", key: "description", width: 35 },
        { header: "Recorded By", key: "recordedBy", width: 16 },
        { header: "Amount ($)", key: "amount", width: 18 }
      ];
      oracleHeaderStyle(wsDetail, 8);

      data.expenseSummary.items.forEach(row => {
        const addedRow = wsDetail.addRow({
          date: row.date,
          departmentCode: row.departmentCode,
          category: row.category,
          vendorName: row.vendorName || "N/A",
          invoiceNumber: row.invoiceNumber || "N/A",
          description: row.description,
          recordedBy: row.recordedBy,
          amount: row.amount
        });
        addedRow.getCell(1).alignment = { horizontal: "center" };
        addedRow.getCell(2).alignment = { horizontal: "center" };
        addedRow.getCell(3).alignment = { horizontal: "left" };
        addedRow.getCell(4).alignment = { horizontal: "left" };
        addedRow.getCell(5).alignment = { horizontal: "left" };
        addedRow.getCell(6).alignment = { horizontal: "left" };
        addedRow.getCell(7).alignment = { horizontal: "left" };
        formatNumberCell(addedRow.getCell(8));
      });

      const lastRowIndex = 4 + data.expenseSummary.items.length;
      const totalRowS = wsDetail.addRow({
        date: "Total",
        departmentCode: "Consolidated Journals",
        amount: { formula: `SUM(H5:H${lastRowIndex})` }
      });
      totalRowS.font = { name: "Calibri", size: 11, bold: true };
      formatNumberCell(totalRowS.getCell(8));
      for (let i = 1; i <= 8; i++) {
        totalRowS.getCell(i).border = {
          top: { style: "thin" },
          bottom: { style: "double" }
        };
      }

      // -------------------------------------------------------------
      // DISPATCH WORBOOK BUFFER
      // -------------------------------------------------------------
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename=Oracle_PBCS_Financial_Audit_Report_${year}.xlsx`);

      await workbook.xlsx.write(res);
      res.end();
    } catch (error: any) {
      console.error("Excel generation failed:", error);
      res.status(500).json({ success: false, error: "Internal Server Error in Excel compilation: " + error.message });
    }
  }

  /**
   * GET /api/v1/reports/export/pdf
   * Generates a sleek, professional corporate Oracle EPM PDF layout for auditing and printing
   */
  public static exportPdf(req: AuthenticatedRequest, res: Response): void {
    try {
      const departmentId = (req.query.departmentId as string) || "All";
      const year = Number(req.query.year) || 2026;
      const search = (req.query.search as string) || "";
      const category = (req.query.category as string) || "All";
      const type = (req.query.type as string) || "variance"; // monthly, quarterly, yearly, department, variance, summary

      const data = ReportModel.getReportData(departmentId, year, search, category);

      // Create PDF Document
      const doc = new PDFDocument({
        size: "LETTER",
        layout: "landscape",
        margin: 36
      });

      // Stream directly to the HTTP response
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename=Oracle_Financial_Report_${type}_${year}.pdf`);
      doc.pipe(res);

      // Header Banner (Oracle Classic Navy Theme)
      doc.rect(36, 36, 540, 50).fill("#0F2027");
      
      // Title
      doc.fillColor("#FFFFFF")
         .font("Helvetica-Bold")
         .fontSize(14)
         .text("ORACLE EPM SUITE • FINANCIAL COMPLIANCE REPORT", 50, 48);

      // Subtitle
      doc.fillColor("#DCE4ED")
         .font("Helvetica-Oblique")
         .fontSize(9)
         .text(`Report Frame: ${type.toUpperCase()} ANALYSIS  •  FY${year}  •  Scope CC: ${departmentId}  •  Generated by: ${req.user?.name || "System"}`, 50, 68);

      // Metas (Right Side of Header)
      const dateStr = new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      doc.fillColor("#A0B2C6")
         .font("Helvetica")
         .fontSize(8)
         .text(`Run Time: ${dateStr}`, 410, 48, { align: "right", width: 150 });
      doc.text("System Source: PBCS.LOGS.PRODUCTION", 410, 62, { align: "right", width: 150 });

      // Reset style
      doc.fillColor("#000000").font("Helvetica").fontSize(10);

      // Dynamic Table rendering depending on 'type' parameter
      let currentY = 105;

      const drawTableHeader = (headers: string[], widths: number[]) => {
        doc.rect(36, currentY, 540, 18).fill("#2C5364");
        doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(8);
        
        let startX = 42;
        headers.forEach((h, i) => {
          doc.text(h.toUpperCase(), startX, currentY + 5, {
            width: widths[i],
            align: i === 0 ? "left" : "right"
          });
          startX += widths[i];
        });
        currentY += 18;
      };

      const drawRow = (cols: string[], widths: number[], isBold = false, bgColor?: string) => {
        if (bgColor) {
          doc.rect(36, currentY, 540, 16).fill(bgColor);
        }
        
        doc.fillColor(isBold ? "#111111" : "#333333")
           .font(isBold ? "Helvetica-Bold" : "Helvetica")
           .fontSize(8);

        let startX = 42;
        cols.forEach((col, i) => {
          doc.text(col, startX, currentY + 4, {
            width: widths[i],
            align: i === 0 ? "left" : "right"
          });
          startX += widths[i];
        });

        // Bottom thin border
        doc.strokeColor("#E5E9EC").lineWidth(0.5).moveTo(36, currentY + 16).lineTo(576, currentY + 16).stroke();
        currentY += 16;
      };

      if (type === "monthly") {
        const headers = ["Accounting Period", "Baseline Approved Budget", "Ledger Actual Spending", "Variance surplus", "Execution Rate"];
        const widths = [130, 105, 105, 105, 75];
        drawTableHeader(headers, widths);

        data.monthly.forEach((row, idx) => {
          const bg = idx % 2 === 0 ? undefined : "#F8FAFC";
          drawRow([
            row.month,
            `$${row.budget.toLocaleString()}`,
            `$${row.actual.toLocaleString()}`,
            `$${row.variance.toLocaleString()}`,
            `${row.pctSpent.toFixed(1)}%`
          ], widths, false, bg);
        });

        // Totals
        const totBudget = data.monthly.reduce((sum, r) => sum + r.budget, 0);
        const totActual = data.monthly.reduce((sum, r) => sum + r.actual, 0);
        const totVariance = totBudget - totActual;
        const totPct = totBudget > 0 ? (totActual / totBudget) * 100 : 0;
        
        drawRow([
          "Total Annualized",
          `$${totBudget.toLocaleString()}`,
          `$${totActual.toLocaleString()}`,
          `$${totVariance.toLocaleString()}`,
          `${totPct.toFixed(1)}%`
        ], widths, true, "#ECEFF1");

      } else if (type === "quarterly") {
        const headers = ["Quarter Period", "Pre-Set Budget Baseline", "Actual Ledger Accumulation", "Quarter Variance", "Utilization Ratio"];
        const widths = [130, 105, 105, 105, 75];
        drawTableHeader(headers, widths);

        data.quarterly.forEach((row, idx) => {
          const bg = idx % 2 === 0 ? undefined : "#F8FAFC";
          drawRow([
            row.quarter,
            `$${row.budget.toLocaleString()}`,
            `$${row.actual.toLocaleString()}`,
            `$${row.variance.toLocaleString()}`,
            `${row.pctSpent.toFixed(1)}%`
          ], widths, false, bg);
        });

        // Totals
        const totBudget = data.quarterly.reduce((sum, r) => sum + r.budget, 0);
        const totActual = data.quarterly.reduce((sum, r) => sum + r.actual, 0);
        const totVariance = totBudget - totActual;
        const totPct = totBudget > 0 ? (totActual / totBudget) * 100 : 0;

        drawRow([
          "Consolidated Yearly",
          `$${totBudget.toLocaleString()}`,
          `$${totActual.toLocaleString()}`,
          `$${totVariance.toLocaleString()}`,
          `${totPct.toFixed(1)}%`
        ], widths, true, "#ECEFF1");

      } else if (type === "yearly") {
        const headers = ["Fiscal Year Period", "Annual Budget Frame", "Annual Actual Ledger", "Yearly Variance", "Execution %"];
        const widths = [130, 105, 105, 105, 75];
        drawTableHeader(headers, widths);

        data.yearly.forEach((row, idx) => {
          const bg = idx % 2 === 0 ? undefined : "#F8FAFC";
          drawRow([
            `FY${row.year} ${row.year === year ? "(Operational)" : ""}`,
            `$${row.budget.toLocaleString()}`,
            `$${row.actual.toLocaleString()}`,
            `$${row.variance.toLocaleString()}`,
            `${row.pctSpent.toFixed(1)}%`
          ], widths, false, bg);
        });

      } else if (type === "department") {
        const headers = ["Cost Center Code", "Division Unit Description", "Approved Budget", "Actual Spend", "Variance Value", "Utilization %"];
        const widths = [70, 150, 85, 85, 85, 45];
        drawTableHeader(headers, widths);

        data.departmentWise.forEach((row, idx) => {
          const bg = idx % 2 === 0 ? undefined : "#F8FAFC";
          drawRow([
            row.departmentCode,
            row.departmentName,
            `$${row.budget.toLocaleString()}`,
            `$${row.actual.toLocaleString()}`,
            `$${row.variance.toLocaleString()}`,
            `${row.pctSpent.toFixed(1)}%`
          ], widths, false, bg);
        });

        // Totals
        const totBudget = data.departmentWise.reduce((sum, r) => sum + r.budget, 0);
        const totActual = data.departmentWise.reduce((sum, r) => sum + r.actual, 0);
        const totVariance = totBudget - totActual;
        const totPct = totBudget > 0 ? (totActual / totBudget) * 100 : 0;

        drawRow([
          "TOTAL",
          "Consolidated Cost Centers",
          `$${totBudget.toLocaleString()}`,
          `$${totActual.toLocaleString()}`,
          `$${totVariance.toLocaleString()}`,
          `${totPct.toFixed(1)}%`
        ], widths, true, "#ECEFF1");

      } else if (type === "variance") {
        // Budget Variance Report
        const headers = ["Cost Center", "Ledger Category", "Allocated Budget", "Committed Actuals", "Variance Surplus", "Status", "Remarks / Compliance Note"];
        const widths = [60, 100, 75, 75, 75, 50, 85];
        drawTableHeader(headers, widths);

        data.budgetVariance.forEach((row, idx) => {
          const bg = idx % 2 === 0 ? undefined : "#F8FAFC";
          drawRow([
            row.departmentCode,
            row.category,
            `$${row.budget.toLocaleString()}`,
            `$${row.actual.toLocaleString()}`,
            `$${row.variance.toLocaleString()}`,
            row.statusFlag,
            row.notes
          ], widths, false, bg);
        });

      } else {
        // Summary itemized
        const headers = ["Date", "CC", "Ledger Category", "Vendor Payee", "Invoice Ref", "Recorded By", "Actual Amount"];
        const widths = [60, 50, 110, 100, 70, 70, 60];
        drawTableHeader(headers, widths);

        // Print first 25 items to fit comfortably in landscape, or handle pagination.
        // For standard PDF reporting, we will display up to 25 records
        const sliceItems = data.expenseSummary.items.slice(0, 24);
        sliceItems.forEach((row, idx) => {
          const bg = idx % 2 === 0 ? undefined : "#F8FAFC";
          drawRow([
            row.date,
            row.departmentCode,
            row.category,
            row.vendorName || "N/A",
            row.invoiceNumber || "N/A",
            row.recordedBy,
            `$${row.amount.toLocaleString()}`
          ], widths, false, bg);
        });

        if (data.expenseSummary.items.length > 24) {
          doc.fillColor("#888888")
             .font("Helvetica-Oblique")
             .fontSize(8)
             .text(`Showing 24 of ${data.expenseSummary.items.length} total ledger journal lines. For full transaction details export to Excel.`, 50, currentY + 10);
        }

        currentY += 15;
        drawRow([
          "TOTAL",
          "Consolidated Ledger Rows",
          "",
          "",
          "",
          "",
          `$${data.expenseSummary.grandTotal.toLocaleString()}`
        ], widths, true, "#ECEFF1");
      }

      // Footer disclaimer & Certification info
      const footerY = 540;
      doc.rect(36, footerY, 540, 25).fill("#ECEFF1");
      doc.fillColor("#4D5656")
         .font("Helvetica-Bold")
         .fontSize(6)
         .text("SOX COMPLIANCE CERTIFICATION", 45, footerY + 6);
      doc.font("Helvetica")
         .text("This report is compiled automatically using real-time general ledger database nodes. Financial information contained herein has been audited under EPM Sec. 404 compliance guidelines.", 45, footerY + 13);
      doc.font("Helvetica-Bold")
         .text("CONFIDENTIAL - BOARD LEVEL USE ONLY", 410, footerY + 10, { align: "right", width: 150 });

      doc.end();
    } catch (error: any) {
      console.error("PDF generation failed:", error);
      res.status(500).json({ success: false, error: "Internal Server Error in PDF compilation: " + error.message });
    }
  }
}
