import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Trash2, 
  ShieldAlert, 
  UserCheck, 
  Activity, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  X, 
  FileSpreadsheet, 
  Cpu, 
  Layers, 
  Lock, 
  Database,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { User, AuditLog, UserRole } from "../types.js";

interface AuditDashboardProps {
  currentUser: User | null;
  triggerAlert: (type: "success" | "warning" | "error", text: string) => void;
}

interface AuditStats {
  totalLogs: number;
  activeUsersCount: number;
  unauthorizedAttempts: number;
  actionDistribution: Record<string, number>;
  roleDistribution: Record<string, number>;
  activityTrend: Record<string, number>;
}

export const AuditDashboard: React.FC<AuditDashboardProps> = ({ currentUser, triggerAlert }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const [confirmPurge, setConfirmPurge] = useState(false);

  // Filter States
  const [search, setSearch] = useState("");
  const [selectedAction, setSelectedAction] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogsCount, setTotalLogsCount] = useState(0);

  // Available unique actions in PBCS system
  const actionTypes = [
    "USER_LOGIN_SECURE",
    "UNAUTHORIZED_ACCESS_ATTEMPT",
    "BUDGET_CREATE",
    "BUDGET_UPDATE",
    "BUDGET_WORKFLOW",
    "EXPENSE_CREATE",
    "EXPENSE_EDIT",
    "EXPENSE_DELETE",
    "DEPARTMENT_PROVISION",
    "DEPARTMENT_UPDATE",
    "AUDIT_LOGS_PURGED",
    "SYSTEM_INITIALIZE"
  ];

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("orcl_pbcs_token");
      const res = await axios.get("/api/v1/audits", {
        headers: { 
          Authorization: `Bearer ${token}`,
          "X-User-Username": currentUser?.username || ""
        },
        params: {
          search,
          action: selectedAction,
          role: selectedRole,
          startDate,
          endDate,
          page,
          limit
        }
      });

      if (res.data && res.data.success) {
        setLogs(res.data.logs);
        setTotalPages(res.data.pagination.pages);
        setTotalLogsCount(res.data.pagination.total);
      }
    } catch (err: any) {
      console.error("Failed to load compliance audit logs", err);
      triggerAlert("error", err.response?.data?.error || "Failed to load SOX audit logs.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    setIsStatsLoading(true);
    try {
      const token = localStorage.getItem("orcl_pbcs_token");
      const res = await axios.get("/api/v1/audits/stats", {
        headers: { 
          Authorization: `Bearer ${token}`,
          "X-User-Username": currentUser?.username || ""
        }
      });

      if (res.data && res.data.success) {
        setStats(res.data.stats);
      }
    } catch (err: any) {
      console.error("Failed to load audit analytics stats", err);
    } finally {
      setIsStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [search, selectedAction, selectedRole, startDate, endDate, page]);

  const handleResetFilters = () => {
    setSearch("");
    setSelectedAction("");
    setSelectedRole("");
    setStartDate("");
    setEndDate("");
    setPage(1);
    triggerAlert("success", "Audit log query filters cleared.");
  };

  const handlePurgeLogs = async () => {
    try {
      const token = localStorage.getItem("orcl_pbcs_token");
      const res = await axios.post("/api/v1/audits/purge", {}, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "X-User-Username": currentUser?.username || ""
        }
      });

      if (res.data && res.data.success) {
        triggerAlert("success", "Compliance logs initialized. Purge token recorded in ledger.");
        setConfirmPurge(false);
        fetchLogs();
        fetchStats();
      }
    } catch (err: any) {
      triggerAlert("error", err.response?.data?.error || "Failed to purge audit trail.");
    }
  };

  const handleExportCSV = () => {
    try {
      if (logs.length === 0) {
        triggerAlert("warning", "No logs available to compile export pack.");
        return;
      }

      // Prepare compliance CSV content
      const headers = ["Log ID", "Timestamp", "Operator Name", "Role", "System Action", "Compliance Narrative"];
      const csvRows = [headers.join(",")];

      logs.forEach(log => {
        const row = [
          `"${log.id}"`,
          `"${new Date(log.timestamp).toISOString()}"`,
          `"${log.username}"`,
          `"${log.role}"`,
          `"${log.action}"`,
          `"${log.details.replace(/"/g, '""')}"`
        ];
        csvRows.push(row.join(","));
      });

      const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Oracle_PBCS_SOX_Audit_Trail_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      triggerAlert("success", "SOX audit compliance envelope exported successfully.");
    } catch (err) {
      console.error(err);
      triggerAlert("error", "Failed to compile audit export packet.");
    }
  };

  const getBadgeColor = (action: string) => {
    switch (action) {
      case "UNAUTHORIZED_ACCESS_ATTEMPT":
        return "bg-red-950 text-red-400 border-red-800";
      case "AUDIT_LOGS_PURGED":
        return "bg-amber-950 text-amber-400 border-amber-900";
      case "USER_LOGIN_SECURE":
        return "bg-emerald-950 text-emerald-400 border-emerald-900";
      case "BUDGET_CREATE":
      case "BUDGET_UPDATE":
        return "bg-blue-950 text-blue-400 border-blue-900";
      case "EXPENSE_DELETE":
        return "bg-rose-950 text-rose-400 border-rose-900";
      case "BUDGET_WORKFLOW":
        return "bg-purple-950 text-purple-400 border-purple-900";
      default:
        return "bg-[#1E222A] text-gray-400 border-[#2D3139]";
    }
  };

  return (
    <div className="space-y-6">
      {/* BRAND HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#2D2F33] pb-4">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#E5C185]" />
            Enterprise SOX Audit Ledger & Compliance Dashboard
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Real-time continuous verification tracking file modifications, database mutations, and system access trials.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="audit-export-btn"
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-[#212328] hover:bg-[#2D2F33] border border-[#2D2F33] text-xs font-semibold rounded text-white flex items-center gap-2 transition-all"
            title="Download audit trails as CSV package"
          >
            <Download className="w-3.5 h-3.5 text-[#E5C185]" />
            <span>Export SOX Package</span>
          </button>
          <button
            id="audit-refresh-btn"
            onClick={() => { fetchLogs(); fetchStats(); }}
            className="p-1.5 bg-[#212328] hover:bg-[#2D2F33] border border-[#2D2F33] text-xs rounded text-gray-300 hover:text-white transition-all"
            title="Force refresh audit records"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* STATISTICS CARDS */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#16181D] border border-[#2D2F33] rounded p-4 relative overflow-hidden">
            <div className="absolute right-2 top-2 opacity-10">
              <Database className="w-16 h-16 text-white" />
            </div>
            <p className="text-[10px] uppercase font-mono tracking-wider text-gray-400">Total Audit Events</p>
            <p className="text-2xl font-bold text-white mt-1 font-mono">{stats.totalLogs}</p>
            <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1 font-mono">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              100% Immutable Ledger
            </p>
          </div>

          <div className="bg-[#16181D] border border-[#2D2F33] rounded p-4 relative overflow-hidden">
            <div className="absolute right-2 top-2 opacity-10">
              <UserCheck className="w-16 h-16 text-white" />
            </div>
            <p className="text-[10px] uppercase font-mono tracking-wider text-gray-400">Active Operators</p>
            <p className="text-2xl font-bold text-white mt-1 font-mono">{stats.activeUsersCount}</p>
            <p className="text-[10px] text-gray-400 mt-1 font-mono">Unique authenticated users</p>
          </div>

          <div className="bg-[#16181D] border border-[#2D2F33] rounded p-4 relative overflow-hidden">
            <div className="absolute right-2 top-2 opacity-10">
              <ShieldAlert className="w-16 h-16 text-white" />
            </div>
            <p className="text-[10px] uppercase font-mono tracking-wider text-gray-400">Security Threats Blocked</p>
            <p className={`text-2xl font-bold mt-1 font-mono ${stats.unauthorizedAttempts > 0 ? "text-amber-400 animate-pulse" : "text-emerald-400"}`}>
              {stats.unauthorizedAttempts}
            </p>
            <p className="text-[10px] text-gray-400 mt-1 font-mono">Challenge login rejections</p>
          </div>

          <div className="bg-[#16181D] border border-[#2D2F33] rounded p-4 relative overflow-hidden">
            <div className="absolute right-2 top-2 opacity-10">
              <Activity className="w-16 h-16 text-white" />
            </div>
            <p className="text-[10px] uppercase font-mono tracking-wider text-gray-400">System Activity Level</p>
            <p className="text-2xl font-bold text-white mt-1 font-mono">Compliance</p>
            <p className="text-[10px] text-green-400 mt-1 flex items-center gap-1 font-mono">
              <span>● SYSTEM AUDITED</span>
            </p>
          </div>
        </div>
      )}

      {/* FILTER PANEL */}
      <div className="bg-[#16181D] border border-[#2D2F33] rounded p-4 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-300 font-mono uppercase tracking-wider">
          <Filter className="w-3..5 h-3.5 text-[#E5C185]" />
          <span>Active Directory Search & Filters</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-500" />
            <input
              id="audit-filter-search"
              type="text"
              placeholder="Search narrative, user..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-8 w-full bg-[#0A0B0D] border border-[#2D2F33] rounded px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#C19A5B] font-mono"
            />
          </div>

          {/* Action Filter */}
          <div>
            <select
              id="audit-filter-action"
              value={selectedAction}
              onChange={(e) => { setSelectedAction(e.target.value); setPage(1); }}
              className="w-full bg-[#0A0B0D] border border-[#2D2F33] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C19A5B] font-mono"
            >
              <option value="">-- All Actions --</option>
              {actionTypes.map(act => (
                <option key={act} value={act}>{act}</option>
              ))}
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <select
              id="audit-filter-role"
              value={selectedRole}
              onChange={(e) => { setSelectedRole(e.target.value); setPage(1); }}
              className="w-full bg-[#0A0B0D] border border-[#2D2F33] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C19A5B] font-mono"
            >
              <option value="">-- All Roles --</option>
              <option value="Admin">Admin</option>
              <option value="Finance Manager">Finance Manager</option>
              <option value="Department Manager">Department Manager</option>
              <option value="Employee">Employee</option>
            </select>
          </div>

          {/* Start Date */}
          <div className="flex items-center gap-1.5 bg-[#0A0B0D] border border-[#2D2F33] rounded px-2.5 py-1 text-xs">
            <span className="text-gray-500 font-mono text-[9px] uppercase">Start:</span>
            <input
              id="audit-filter-start-date"
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="bg-transparent border-none text-white focus:outline-none text-[11px] font-mono w-full"
            />
          </div>

          {/* End Date */}
          <div className="flex items-center gap-1.5 bg-[#0A0B0D] border border-[#2D2F33] rounded px-2.5 py-1 text-xs">
            <span className="text-gray-500 font-mono text-[9px] uppercase">End:</span>
            <input
              id="audit-filter-end-date"
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="bg-transparent border-none text-white focus:outline-none text-[11px] font-mono w-full"
            />
          </div>
        </div>

        {/* Action controls row */}
        <div className="flex justify-between items-center pt-2 border-t border-[#2D2F33]/60 text-xs">
          <div className="text-gray-400 font-mono">
            Filtered results: <span className="text-[#E5C185] font-bold">{totalLogsCount}</span> transactions matching query
          </div>
          <div className="flex items-center gap-3">
            {(search || selectedAction || selectedRole || startDate || endDate) && (
              <button
                id="audit-clear-filters-btn"
                onClick={handleResetFilters}
                className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-all"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset Query Parameters</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* COMPLIANCE EVENTS TABLE */}
      <div className="bg-[#16181D] border border-[#2D2F33] rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#1F2128] border-b border-[#2D2F33] text-gray-400 uppercase tracking-wider font-mono text-[10px]">
                <th className="p-4 font-bold">Transaction ID / Date</th>
                <th className="p-4 font-bold">Active Operator</th>
                <th className="p-4 font-bold">Action Vector</th>
                <th className="p-4 font-bold">SOX Compliance Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#212328]">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-gray-500 font-mono">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#E5C185] mb-2" />
                    Querying secure general ledger directory nodes...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-gray-500 font-mono">
                    <ShieldAlert className="w-8 h-8 opacity-25 mx-auto mb-2 text-amber-500" />
                    No secure audit logs found matching current filtering vectors.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr 
                    key={log.id} 
                    className="hover:bg-[#1C1F26] transition-colors border-b border-[#212328] last:border-0"
                  >
                    <td className="p-4 font-mono">
                      <div className="text-white font-bold tracking-tight text-[11px] mb-1">
                        {log.id}
                      </div>
                      <div className="text-[10px] text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-600" />
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-gray-200">{log.username}</div>
                      <div className="text-[10px] text-gray-500 font-mono uppercase mt-0.5">
                        {log.role}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-block px-2.5 py-1 text-[9px] font-mono font-bold uppercase rounded border ${getBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 leading-relaxed text-gray-300 font-mono text-[11px] max-w-md">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION PANEL */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[#2D2F33] bg-[#1F2128] flex justify-between items-center text-xs">
            <div className="text-gray-400 font-mono">
              Showing page <span className="text-white font-bold">{page}</span> of <span className="text-white font-bold">{totalPages}</span> ({limit} rows per view)
            </div>
            <div className="flex items-center gap-1 font-mono">
              <button
                id="audit-prev-page"
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="p-1.5 rounded border border-[#2D2F33] bg-[#16181D] hover:bg-[#2D2F33] disabled:opacity-40 text-white transition-all disabled:pointer-events-none"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pNum => (
                <button
                  id={`audit-page-btn-${pNum}`}
                  key={pNum}
                  onClick={() => setPage(pNum)}
                  className={`px-2.5 py-1 rounded text-xs transition-all ${
                    page === pNum
                      ? "bg-[#C19A5B] text-[#0A1D37] font-bold"
                      : "border border-[#2D2F33] hover:bg-[#2D2F33] text-gray-300"
                  }`}
                >
                  {pNum}
                </button>
              ))}
              <button
                id="audit-next-page"
                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
                className="p-1.5 rounded border border-[#2D2F33] bg-[#16181D] hover:bg-[#2D2F33] disabled:opacity-40 text-white transition-all disabled:pointer-events-none"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ADMIN UTILITIES PANEL */}
      <div className="bg-[#1A1112] border border-[#501F21] rounded p-5 space-y-4">
        <div className="flex items-center gap-2 text-rose-400 font-mono uppercase font-bold text-xs tracking-wider">
          <AlertTriangle className="w-4 h-4" />
          <span>Restricted Administrative Maintenance Utilities</span>
        </div>
        <p className="text-[11px] text-gray-400 leading-relaxed max-w-2xl">
          SOX Section 404 guidelines require annual system log initialization during transition audits. 
          Purging logs compiles an automated compliance record preserving the administrative username, origin IP, and timestamp.
        </p>

        {confirmPurge ? (
          <div className="p-4 bg-[#2D1617] border border-red-950 rounded flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="text-xs font-bold text-red-400 font-mono uppercase">
                CRITICAL WARNING: This action cannot be undone!
              </p>
              <p className="text-[11px] text-gray-300 mt-1">
                A permanent signature audit log describing this clear request will be recorded automatically.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                id="audit-confirm-purge-btn"
                onClick={handlePurgeLogs}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-xs font-bold text-white rounded transition-colors"
              >
                Yes, Purge Trail
              </button>
              <button
                id="audit-cancel-purge-btn"
                onClick={() => setConfirmPurge(false)}
                className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-xs font-bold text-gray-300 rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            id="audit-trigger-purge-btn"
            onClick={() => setConfirmPurge(true)}
            className="px-3 py-1.5 bg-red-950 hover:bg-red-900 border border-red-800 text-xs font-bold text-rose-300 rounded flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Purge & Re-Initialize Audit Trail</span>
          </button>
        )}
      </div>
    </div>
  );
};
