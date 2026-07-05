import { Request, Response } from "express";
import { DepartmentModel } from "../models/departmentModel.js";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { UserRole } from "../../src/types.js";

export class DepartmentController {
  /**
   * Get all departments with enterprise metrics (budgets, headcount)
   */
  public static getDepartments(req: Request, res: Response): void {
    try {
      const depts = DepartmentModel.getAllDepartments();
      res.json(depts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get specific department by ID
   */
  public static getDepartment(req: Request, res: Response): void {
    try {
      const { id } = req.params;
      const dept = DepartmentModel.getDepartmentById(id);
      if (!dept) {
        res.status(404).json({ error: "Department not found." });
        return;
      }
      res.json(dept);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Create a new corporate department (Admin / Finance Manager only)
   */
  public static createDepartment(req: AuthenticatedRequest, res: Response): void {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Authentication context is missing." });
        return;
      }

      const { name, code, managerId } = req.body;
      const operator = req.user;

      const dept = DepartmentModel.createDepartment(
        { name, code, managerId },
        operator
      );

      res.status(201).json({
        success: true,
        message: "Department created successfully.",
        department: dept
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Update department details (Admin / Finance Manager only)
   */
  public static updateDepartment(req: AuthenticatedRequest, res: Response): void {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Authentication context is missing." });
        return;
      }

      const { id } = req.params;
      const { name, code, managerId } = req.body;
      const operator = req.user;

      const updated = DepartmentModel.updateDepartment(
        id,
        { name, code, managerId },
        operator
      );

      res.json({
        success: true,
        message: "Department updated successfully.",
        department: updated
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Delete / Decommission a department (Admin only)
   */
  public static deleteDepartment(req: AuthenticatedRequest, res: Response): void {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Authentication context is missing." });
        return;
      }

      const { id } = req.params;
      const operator = req.user;

      DepartmentModel.deleteDepartment(id, operator);

      res.json({
        success: true,
        message: "Department decommissioned successfully and retired from active registry."
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
