import { Department, User, Budget, Expense, UserRole } from "../../src/types.js";
import { dbService } from "../../src/dbService.js";

export interface EnrichedDepartment extends Department {
  managerName?: string;
  memberCount: number;
  totalApprovedBudget: number;
  totalActualExpenses: number;
}

export class DepartmentModel {
  /**
   * List all departments with enterprise aggregate metrics (Member Count, Budgets, and Actual Expenses)
   */
  public static getAllDepartments(): EnrichedDepartment[] {
    const departments = dbService.getDepartments();
    const users = dbService.getUsers();
    const budgets = dbService.getBudgets();
    const expenses = dbService.getExpenses();

    return departments.map(dept => {
      const manager = users.find(u => u.id === dept.managerId);
      const memberCount = users.filter(u => u.departmentId === dept.id).length;
      
      // Calculate approved budget total
      const totalApprovedBudget = budgets
        .filter(b => b.departmentId === dept.id && b.status === "Approved")
        .reduce((sum, b) => sum + b.totalAmount, 0);

      // Calculate actual expenses recorded
      const totalActualExpenses = expenses
        .filter(e => e.departmentId === dept.id)
        .reduce((sum, e) => sum + e.amount, 0);

      return {
        ...dept,
        managerName: manager ? manager.name : "Unassigned",
        memberCount,
        totalApprovedBudget,
        totalActualExpenses
      };
    });
  }

  /**
   * Fetch single department by ID
   */
  public static getDepartmentById(id: string): EnrichedDepartment | null {
    const depts = this.getAllDepartments();
    return depts.find(d => d.id === id) || null;
  }

  /**
   * Helper to validate Department input schemas
   */
  public static validateDepartment(data: { name: string; code: string; managerId?: string }, excludeId?: string): { error?: string } {
    if (!data.name || data.name.trim().length < 3) {
      return { error: "Department Name must be at least 3 characters in length." };
    }

    if (!data.code || data.code.trim().length < 2) {
      return { error: "Department Code is required and must be at least 2 characters." };
    }

    // Code formatting: e.g. FIN-01, IT-02, uppercase, letters, digits, and hyphens only
    const codeRegex = /^[A-Z0-9\-]+$/;
    if (!codeRegex.test(data.code)) {
      return { error: "Department Code must be uppercase and contain only alphanumeric characters and hyphens (e.g. FIN-01)." };
    }

    // Check unique constraints on code & name
    const depts = dbService.getDepartments();
    
    const duplicateCode = depts.find(d => d.code.toUpperCase() === data.code.toUpperCase() && d.id !== excludeId);
    if (duplicateCode) {
      return { error: `Department Code "${data.code}" is already in use by another corporate unit.` };
    }

    const duplicateName = depts.find(d => d.name.toLowerCase() === data.name.trim().toLowerCase() && d.id !== excludeId);
    if (duplicateName) {
      return { error: `Department Name "${data.name}" is already in use.` };
    }

    // If manager is provided, check existence in user directory
    if (data.managerId) {
      const users = dbService.getUsers();
      const managerExists = users.some(u => u.id === data.managerId);
      if (!managerExists) {
        return { error: "Assigned manager does not exist in the active directory." };
      }
    }

    return {};
  }

  /**
   * Provision a new corporate department
   */
  public static createDepartment(
    data: { name: string; code: string; managerId: string },
    operator: { id: string; username: string; role: string }
  ): Department {
    const validation = this.validateDepartment(data);
    if (validation.error) {
      throw new Error(validation.error);
    }

    const depts = dbService.getDepartments();
    const newId = "d_" + Math.random().toString(36).substr(2, 9);
    
    const newDept: Department = {
      id: newId,
      name: data.name.trim(),
      code: data.code.toUpperCase(),
      managerId: data.managerId || ""
    };

    depts.push(newDept);
    
    // Save state
    (dbService as any).save();

    // Log security compliance audit trail
    dbService.addAudit(
      operator.id,
      operator.username,
      operator.role,
      "DEPARTMENT_CREATE",
      `Provisioned corporate department: ${newDept.name} (${newDept.code}) with manager ID: ${newDept.managerId}`
    );

    return newDept;
  }

  /**
   * Modify properties of an existing department
   */
  public static updateDepartment(
    id: string,
    data: { name: string; code: string; managerId: string },
    operator: { id: string; username: string; role: string }
  ): Department {
    const depts = dbService.getDepartments();
    const idx = depts.findIndex(d => d.id === id);
    if (idx === -1) {
      throw new Error("Target corporate department not found.");
    }

    const validation = this.validateDepartment(data, id);
    if (validation.error) {
      throw new Error(validation.error);
    }

    const previous = depts[idx];
    const updatedDept: Department = {
      ...previous,
      name: data.name.trim(),
      code: data.code.toUpperCase(),
      managerId: data.managerId || ""
    };

    depts[idx] = updatedDept;
    (dbService as any).save();

    // Security compliance audit trail
    dbService.addAudit(
      operator.id,
      operator.username,
      operator.role,
      "DEPARTMENT_UPDATE",
      `Updated corporate department ${id}: changed name "${previous.name}"->"${updatedDept.name}", code "${previous.code}"->"${updatedDept.code}", manager "${previous.managerId}"->"${updatedDept.managerId}"`
    );

    return updatedDept;
  }

  /**
   * Retire / Decommission a department from service with referential integrity locks
   */
  public static deleteDepartment(
    id: string,
    operator: { id: string; username: string; role: string }
  ): void {
    const depts = dbService.getDepartments();
    const idx = depts.findIndex(d => d.id === id);
    if (idx === -1) {
      throw new Error("Target corporate department not found.");
    }

    const dept = depts[idx];

    // Referential Integrity Validation Rules:
    // 1. Cannot delete if users are still assigned to this department
    const users = dbService.getUsers();
    const assignedUsers = users.filter(u => u.departmentId === id);
    if (assignedUsers.length > 0) {
      throw new Error(`Integrity Lock: Cannot delete department. ${assignedUsers.length} employee(s) are still active in this department. Reassign them first.`);
    }

    // 2. Cannot delete if there are expenses recorded against this department
    const expenses = dbService.getExpenses();
    const assignedExpenses = expenses.filter(e => e.departmentId === id);
    if (assignedExpenses.length > 0) {
      throw new Error(`Integrity Lock: Cannot decommission department. There are ${assignedExpenses.length} historical expenses totaling $${assignedExpenses.reduce((s, e) => s + e.amount, 0).toLocaleString()} recorded against this business unit.`);
    }

    // 3. Cannot delete if there are active budgets
    const budgets = dbService.getBudgets();
    const assignedBudgets = budgets.filter(b => b.departmentId === id);
    if (assignedBudgets.length > 0) {
      throw new Error(`Integrity Lock: Cannot decommission department. Active/historical EPM budgets exist for this department. Delete or archive the budgets first.`);
    }

    // Perform removal if it passes all integrity gates
    depts.splice(idx, 1);
    (dbService as any).save();

    // Security compliance audit trail
    dbService.addAudit(
      operator.id,
      operator.username,
      operator.role,
      "DEPARTMENT_DELETE",
      `Decommissioned corporate department: ${dept.name} (${dept.code})`
    );
  }
}
