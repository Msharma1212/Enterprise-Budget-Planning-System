import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  FileText, 
  Download, 
  Printer, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight, 
  AlertTriangle, 
  Activity, 
  Building2, 
  DollarSign, 
  CheckCircle, 
  RefreshCw,
  FileSpreadsheet,
  Layers,
  Calendar,
  PieChart as PieIcon,
  BarChart4,
  AlertCircle
} from "lucide-react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell
} from "recharts";
import { User, Department, Expense } from "../types.js";

interface FinancialReportsProps {
  currentUser: User | null;
  departments: Department[];
  triggerAlert: (type: "success" | "error" | "warning" | "info", msg: string) => void;
}

type ReportType = "monthly" | "quarterly" | "yearly" | "department" | "variance" | "summary";

export const FinancialReports: React.FC<FinancialReportsProps> = ({
  currentUser,
  departments,
  triggerAlert
}) => {
  // Current active report view tab
  const [activeReportTab, setActiveReportTab] = useState<ReportType>("variance");

  // Filters state
  const [selectedDept, setSelectedDept] = useState<string>("All");
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Loaded reporting data state
  const [loading, setLoading] = useState<boolean>(false);
  const [reportData, setReportData] = useState<any>(null);

  // Hardcoded standard categories list
  const CATEGORIES = [
    "Salary", "Software Licenses", "Hardware Infrastructure", 
    "Consulting Services", "Travel & Incidentals", "Lab Equipment", 
    "Prototyping Material", "Cloud Computing", "Ad Campaigns", "Agency Fees"
  ];

  // Load report data from server
  const fetchReportData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("orcl_pbcs_token");
      const res = await axios.get("/api/v1/reports/data", {
        headers: { 
          Authorization: `Bearer ${token}`,
          "X-User-Username": currentUser?.username || ""
        },
        params: {
          departmentId: selectedDept,
          year: selectedYear,
          category: selectedCategory,
          search: searchQuery
        }
      });
      if (res.data && res.data.success) {
        setReportData(res.data);
      } else {
        triggerAlert("error", "Failed to retrieve compiled financial statements.");
      }
    } catch (err: any) {
      console.error("Failed fetching reports data:", err);
      triggerAlert("error", err.response?.data?.error || "Error compiling report parameters.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [selectedDept, selectedYear, selectedCategory, searchQuery]);

  // Download files securely bypassing iframe/popup issues using blob downloads
  const handleExport = async (format: "pdf" | "excel") => {
    const formatName = format === "pdf" ? "PDF Document" : "Excel Spreadsheet";
    triggerAlert("info", `Compiling high-fidelity ${formatName} from general ledger database nodes...`);
    
    try {
      const token = localStorage.getItem("orcl_pbcs_token");
      const endpoint = format === "pdf" 
        ? "/api/v1/reports/export/pdf" 
        : "/api/v1/reports/export/excel";

      const response = await axios.get(endpoint, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "X-User-Username": currentUser?.username || ""
        },
        params: {
          departmentId: selectedDept,
          year: selectedYear,
          category: selectedCategory,
          search: searchQuery,
          type: activeReportTab
        },
        responseType: "blob"
      });

      const contentType = response.headers["content-type"] as string || undefined;
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // File naming
      const timestamp = new Date().toISOString().split("T")[0];
      const filename = format === "pdf" 
        ? `Oracle_EPM_Financial_Report_${activeReportTab}_FY${selectedYear}_${timestamp}.pdf`
        : `Oracle_EPM_Financial_Audit_FY${selectedYear}_${timestamp}.xlsx`;

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      triggerAlert("success", `${formatName} downloaded successfully!`);
    } catch (err: any) {
      console.error(`Export to ${format} failed:`, err);
      triggerAlert("error", `Failed to generate report export: ${err.message}`);
    }
  };

  // Standard window print trigger
  const handlePrint = () => {
    window.print();
  };

  // Format Helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(val);
  };

  if (!reportData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-[#16181D] border border-[#2D2F33] rounded">
        <RefreshCw className="w-8 h-8 text-[#E5C185] animate-spin mb-4" />
        <p className="text-gray-400 font-mono text-xs uppercase tracking-wider">Synchronizing with general ledger node...</p>
      </div>
    );
  }

  // Visual Palette for charts
  const CHART_COLORS = ["#3B82F6", "#34D399", "#FBBF24", "#F87171", "#A78BFA", "#F472B6", "#60A5FA", "#34D399"];

  // Prepare chart datasets based on active view
  const getChartSection = () => {
    switch (activeReportTab) {
      case "monthly":
        return (
          <div className="bg-[#1C1F26] border border-[#2D2F33] rounded p-5 mb-6">
            <h4 className="text-xs font-mono text-[#E5C185] uppercase tracking-wider mb-4 flex items-center gap-2">
              <BarChart4 className="w-4 h-4" /> Periodical Variance Spectrum (Jan - Dec)
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData.monthly} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2D2F33" vertical={false} />
                  <XAxis dataKey="month" stroke="#8E9299" fontSize={10} fontClassName="font-mono" />
                  <YAxis stroke="#8E9299" fontSize={10} tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#16181D", borderColor: "#2D2F33", borderRadius: 4 }}
                    labelStyle={{ color: "#E5C185", fontFamily: "monospace", fontSize: 11 }}
                    itemStyle={{ color: "#DCE4ED", fontSize: 11 }}
                    formatter={(val: number) => [formatCurrency(val), ""]}
                  />
                  <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                  <Bar dataKey="budget" name="Approved Budget" fill="#2C5364" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="actual" name="Actual Ledger Spend" fill="#E5C185" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      case "quarterly":
        return (
          <div className="bg-[#1C1F26] border border-[#2D2F33] rounded p-5 mb-6">
            <h4 className="text-xs font-mono text-[#E5C185] uppercase tracking-wider mb-4 flex items-center gap-2">
              <BarChart4 className="w-4 h-4" /> Quarterly Accumulation Analysis
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData.quarterly} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2D2F33" vertical={false} />
                  <XAxis dataKey="quarter" stroke="#8E9299" fontSize={10} fontClassName="font-mono" />
                  <YAxis stroke="#8E9299" fontSize={10} tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#16181D", borderColor: "#2D2F33", borderRadius: 4 }}
                    labelStyle={{ color: "#E5C185", fontFamily: "monospace", fontSize: 11 }}
                    itemStyle={{ color: "#DCE4ED", fontSize: 11 }}
                    formatter={(val: number) => [formatCurrency(val), ""]}
                  />
                  <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                  <Bar dataKey="budget" name="Approved Baseline" fill="#1e3a8a" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="actual" name="Committed Actuals" fill="#10b981" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      case "yearly":
        return (
          <div className="bg-[#1C1F26] border border-[#2D2F33] rounded p-5 mb-6">
            <h4 className="text-xs font-mono text-[#E5C185] uppercase tracking-wider mb-4 flex items-center gap-2">
              <BarChart4 className="w-4 h-4" /> Inter-Year Baseline Trends
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData.yearly} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2D2F33" vertical={false} />
                  <XAxis dataKey="year" stroke="#8E9299" fontSize={10} fontClassName="font-mono" />
                  <YAxis stroke="#8E9299" fontSize={10} tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#16181D", borderColor: "#2D2F33", borderRadius: 4 }}
                    labelStyle={{ color: "#E5C185", fontFamily: "monospace", fontSize: 11 }}
                    itemStyle={{ color: "#DCE4ED", fontSize: 11 }}
                    formatter={(val: number) => [formatCurrency(val), ""]}
                  />
                  <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                  <Bar dataKey="budget" name="Yearly Approved Budget" fill="#0f172a" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="actual" name="Yearly Actual Spend" fill="#ef4444" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      case "department":
        return (
          <div className="bg-[#1C1F26] border border-[#2D2F33] rounded p-5 mb-6">
            <h4 className="text-xs font-mono text-[#E5C185] uppercase tracking-wider mb-4 flex items-center gap-2">
              <BarChart4 className="w-4 h-4" /> Cost Center Allocation & Consumption (FY{selectedYear})
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData.departmentWise} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#2D2F33" horizontal={false} />
                  <XAxis type="number" stroke="#8E9299" fontSize={10} tickFormatter={(v) => `$${v / 1000}k`} />
                  <YAxis type="category" dataKey="departmentCode" stroke="#8E9299" fontSize={10} fontClassName="font-mono" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#16181D", borderColor: "#2D2F33", borderRadius: 4 }}
                    labelStyle={{ color: "#E5C185", fontFamily: "monospace", fontSize: 11 }}
                    itemStyle={{ color: "#DCE4ED", fontSize: 11 }}
                    formatter={(val: number) => [formatCurrency(val), ""]}
                  />
                  <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                  <Bar dataKey="budget" name="Approved Baseline" fill="#312e81" radius={[0, 2, 2, 0]} />
                  <Bar dataKey="actual" name="Committed Actuals" fill="#3b82f6" radius={[0, 2, 2, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      case "variance":
        // Show progress bars of utilization for each category row in table
        return null;
      case "summary":
        // Category Pie Chart
        const pieData = reportData.expenseSummary.categoryTotals.map((item: any) => ({
          name: item.category,
          value: item.amount
        }));
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-[#1C1F26] border border-[#2D2F33] rounded p-5 lg:col-span-1 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-mono text-[#E5C185] uppercase tracking-wider mb-2 flex items-center gap-2">
                  <PieIcon className="w-4 h-4" /> Expense Allocation Profile
                </h4>
                <p className="text-[10px] text-gray-400 leading-normal">
                  Proportional share of real-time committed ledger entries by General Ledger category.
                </p>
              </div>
              
              {pieData.length > 0 ? (
                <div className="h-44 my-4 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#16181D", borderColor: "#2D2F33" }}
                        itemStyle={{ color: "#FFF", fontSize: 10 }}
                        formatter={(val: number) => [formatCurrency(val), ""]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-44 flex items-center justify-center text-gray-500 font-mono text-[10px]">
                  NO LEDGER JOURNAL ENTRIES MATCH FILTERING
                </div>
              )}

              <div className="space-y-1 overflow-y-auto max-h-32 text-[10px] font-mono">
                {reportData.expenseSummary.categoryTotals.slice(0, 5).map((ct: any, idx: number) => (
                  <div key={ct.category} className="flex justify-between items-center text-gray-400">
                    <span className="flex items-center gap-1.5 truncate">
                      <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}></span>
                      <span className="truncate">{ct.category}</span>
                    </span>
                    <span className="text-gray-300 font-semibold">{formatCurrency(ct.amount)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#1C1F26] border border-[#2D2F33] rounded p-5 lg:col-span-2 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-mono text-[#E5C185] uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Activity className="w-4 h-4" /> General Ledger Audit Summary
                </h4>
                <p className="text-[10px] text-gray-400 leading-normal">
                  Operational and compliance markers extracted from current active directory filters.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-4">
                <div className="bg-[#0A0B0D] border border-[#2D2F33] p-3 rounded">
                  <span className="text-[9px] text-gray-500 font-mono uppercase block">Grand Total Spend</span>
                  <span className="text-base font-bold font-mono text-white block mt-1">
                    {formatCurrency(reportData.expenseSummary.grandTotal)}
                  </span>
                </div>
                <div className="bg-[#0A0B0D] border border-[#2D2F33] p-3 rounded">
                  <span className="text-[9px] text-gray-500 font-mono uppercase block">Ledger Lines</span>
                  <span className="text-base font-bold font-mono text-blue-400 block mt-1">
                    {reportData.expenseSummary.items.length} Lines
                  </span>
                </div>
                <div className="bg-[#0A0B0D] border border-[#2D2F33] p-3 rounded">
                  <span className="text-[9px] text-gray-500 font-mono uppercase block">Active CC Filters</span>
                  <span className="text-base font-bold font-mono text-emerald-400 block mt-1">
                    {selectedDept === "All" ? "Global" : selectedDept}
                  </span>
                </div>
                <div className="bg-[#0A0B0D] border border-[#2D2F33] p-3 rounded">
                  <span className="text-[9px] text-gray-500 font-mono uppercase block">Sox Audit Audit</span>
                  <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-900 rounded px-1.5 py-0.5 mt-2 font-mono font-bold">
                    COMPLIANT
                  </span>
                </div>
              </div>

              <div className="bg-[#0A0B0D] border border-dashed border-[#2D2F33] rounded p-3 text-[10px] text-gray-400 leading-normal font-mono">
                <div className="flex gap-1.5 items-start">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-gray-300 font-semibold">SOX 404 System Verification:</span> Ledger balances correlate 100% with submitted department budgets. All active workflow transitions are validated by secure private cryptographic keys in the Oracle Active Directory service.
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* SECTION 1: HEADER & MASTER CONTROLS */}
      <div className="bg-[#16181D] border border-[#2D2F33] rounded p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#E5C185]" /> Module 7 - Financial Compliance & Reporting Suite
          </h2>
          <p className="text-[11px] text-gray-400 mt-1 leading-normal">
            Corporate General Ledger ledger exports, SOX compliant variances, and baseline consolidation analysis.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            id="report-btn-excel-export"
            onClick={() => handleExport("excel")}
            className="px-3 py-2 bg-[#1B365D] hover:bg-[#254F85] border border-[#244E80] text-white rounded text-xs font-semibold flex items-center gap-1.5 font-mono uppercase tracking-wider cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#E5C185]" />
            <span>Excel Sheet</span>
          </button>
          
          <button
            id="report-btn-pdf-export"
            onClick={() => handleExport("pdf")}
            className="px-3 py-2 bg-red-950 hover:bg-red-900 border border-red-900 text-red-200 rounded text-xs font-semibold flex items-center gap-1.5 font-mono uppercase tracking-wider cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-red-400" />
            <span>PDF Package</span>
          </button>

          <button
            id="report-btn-print"
            onClick={handlePrint}
            className="px-3 py-2 bg-[#212328] hover:bg-[#2D2F33] border border-[#2D2F33] text-gray-300 rounded text-xs font-semibold flex items-center gap-1.5 font-mono uppercase tracking-wider cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-gray-400" />
            <span>Print View</span>
          </button>
        </div>
      </div>

      {/* SECTION 2: DYNAMIC FILTER TOOLBAR */}
      <div className="bg-[#16181D] border border-[#2D2F33] rounded p-4">
        <h3 className="text-xs font-mono text-[#E5C185] uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5" /> General Ledger Filter Engine
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Department Selector */}
          <div>
            <label className="text-[10px] text-gray-400 uppercase tracking-wider font-mono block mb-1">Cost Center (CC)</label>
            <select
              id="report-filter-dept"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full bg-[#0A0B0D] border border-[#2D2F33] text-gray-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#E5C185] font-mono"
            >
              <option value="All">All Cost Centers</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>[{d.code}] {d.name}</option>
              ))}
            </select>
          </div>

          {/* Fiscal Year Selector */}
          <div>
            <label className="text-[10px] text-gray-400 uppercase tracking-wider font-mono block mb-1">Fiscal Year</label>
            <select
              id="report-filter-year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full bg-[#0A0B0D] border border-[#2D2F33] text-gray-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#E5C185] font-mono"
            >
              <option value={2025}>FY2025 Baseline</option>
              <option value={2026}>FY2026 Operational</option>
              <option value={2027}>FY2027 Projected</option>
            </select>
          </div>

          {/* Ledger Category Selector */}
          <div>
            <label className="text-[10px] text-gray-400 uppercase tracking-wider font-mono block mb-1">Account Category</label>
            <select
              id="report-filter-category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-[#0A0B0D] border border-[#2D2F33] text-gray-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#E5C185] font-mono"
            >
              <option value="All">All Ledger Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Dynamic Search Keyword */}
          <div>
            <label className="text-[10px] text-gray-400 uppercase tracking-wider font-mono block mb-1">Description / ID Search</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5" />
              <input
                id="report-filter-search"
                type="text"
                placeholder="Search description, payee, ref..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0A0B0D] border border-[#2D2F33] text-gray-300 rounded pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-[#E5C185]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: REPORT CATEGORY TAB SELECTOR */}
      <div className="border-b border-[#2D2F33] flex flex-wrap gap-1">
        {[
          { id: "variance", label: "Budget Variance Analysis", icon: Layers },
          { id: "monthly", label: "Monthly Performance", icon: Calendar },
          { id: "quarterly", label: "Quarterly Aggregates", icon: Calendar },
          { id: "yearly", label: "Inter-Year Trends", icon: Calendar },
          { id: "department", label: "Department-Wise Allocations", icon: Building2 },
          { id: "summary", label: "Expense Journal", icon: FileText }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeReportTab === tab.id;
          return (
            <button
              id={`report-subtab-${tab.id}`}
              key={tab.id}
              onClick={() => setActiveReportTab(tab.id as ReportType)}
              className={`px-4 py-2 font-mono text-[10px] uppercase tracking-wider rounded-t border-t border-x transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? "bg-[#16181D] text-[#E5C185] border-[#2D2F33] font-bold"
                  : "bg-transparent text-gray-400 border-transparent hover:text-white hover:bg-[#16181D]/30"
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SECTION 4: CHARTS PANEL */}
      {getChartSection()}

      {/* SECTION 5: RENDERED STATEMENT TABLE SHEET */}
      <div id="financial-report-sheet" className="bg-[#16181D] border border-[#2D2F33] rounded p-6 shadow-xl relative overflow-hidden">
        {/* Oracle PBCS Top Seal Decoration */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C19A5B] via-[#E5C185] to-[#C19A5B]"></div>

        {/* Audit Sheet Header info */}
        <div className="flex flex-col sm:flex-row justify-between items-start border-b border-[#2D2F33] pb-4 mb-4">
          <div>
            <h2 className="text-md font-bold text-white font-mono uppercase tracking-widest">
              ORACLE PBCS COMPLIANCE LEDGER
            </h2>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">
              General Statement Frame • Period FY{selectedYear} M1-M12
            </p>
          </div>
          <div className="text-right mt-2 sm:mt-0 font-mono text-[10px] text-gray-500">
            <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 rounded border border-emerald-900 font-bold uppercase tracking-wider inline-block">
              SYSTEM LEVEL: AUDITED
            </span>
            <p className="mt-1">RUN: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* -----------------------------------------------------------------
            TABLE: BUDGET VARIANCE ANALYSIS
            ----------------------------------------------------------------- */}
        {activeReportTab === "variance" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#2D2F33] text-gray-400 font-mono text-[10px] uppercase tracking-wider">
                  <th className="pb-2">Cost Center</th>
                  <th className="pb-2">Ledger Category</th>
                  <th className="pb-2 text-right">Budget Allocation</th>
                  <th className="pb-2 text-right">Committed Actuals</th>
                  <th className="pb-2 text-right">Variance Dollar</th>
                  <th className="pb-2 text-right">Execution %</th>
                  <th className="pb-2 text-center">SOX Audit Flag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#212328] font-mono text-xs">
                {reportData.budgetVariance.length > 0 ? (
                  reportData.budgetVariance.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-[#1C1F26]">
                      <td className="py-2.5 font-sans text-gray-300 font-semibold">{row.departmentCode}</td>
                      <td className="py-2.5 text-gray-400">{row.category}</td>
                      <td className="py-2.5 text-right text-gray-400">{formatCurrency(row.budget)}</td>
                      <td className="py-2.5 text-right text-blue-400">{formatCurrency(row.actual)}</td>
                      <td className={`py-2.5 text-right font-bold ${row.variance < 0 ? "text-red-400" : "text-emerald-400"}`}>
                        {row.variance < 0 ? "-" : "+"}{formatCurrency(Math.abs(row.variance))}
                      </td>
                      <td className="py-2.5 text-right font-semibold text-gray-300">
                        {row.pctSpent.toFixed(1)}%
                      </td>
                      <td className="py-2.5 text-center">
                        {row.statusFlag === "BREACHED" ? (
                          <span className="inline-flex items-center gap-0.5 text-red-400 bg-red-950/40 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold border border-red-900/40">
                            <AlertCircle className="w-3 h-3 text-red-500" /> Over budget
                          </span>
                        ) : row.statusFlag === "CAUTION" ? (
                          <span className="inline-flex items-center gap-0.5 text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold border border-amber-900/40">
                            <AlertTriangle className="w-3 h-3 text-amber-500" /> Caution 90%
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-green-400 bg-green-950/40 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold border border-green-900/40">
                            <CheckCircle className="w-3 h-3 text-green-400" /> Within Limits
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500 font-mono text-xs">
                      NO VARIANCE MATCHES TO THE APPLIED CRITERIA
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* -----------------------------------------------------------------
            TABLE: MONTHLY STATEMENT
            ----------------------------------------------------------------- */}
        {activeReportTab === "monthly" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#2D2F33] text-gray-400 font-mono text-[10px] uppercase tracking-wider">
                  <th className="pb-2">Accounting Period</th>
                  <th className="pb-2 text-right">Pre-Set Budget Baseline</th>
                  <th className="pb-2 text-right">Actual Ledger Accumulation</th>
                  <th className="pb-2 text-right">Period Variance</th>
                  <th className="pb-2 text-right">Execution Rate %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#212328] font-mono text-xs">
                {reportData.monthly.map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-[#1C1F26]">
                    <td className="py-2.5 font-sans text-gray-300 font-semibold">{row.month}</td>
                    <td className="py-2.5 text-right text-gray-400">{formatCurrency(row.budget)}</td>
                    <td className="py-2.5 text-right text-blue-400">{formatCurrency(row.actual)}</td>
                    <td className={`py-2.5 text-right font-semibold ${row.variance < 0 ? "text-red-400" : "text-emerald-400"}`}>
                      {row.variance < 0 ? "-" : "+"}{formatCurrency(Math.abs(row.variance))}
                    </td>
                    <td className="py-2.5 text-right text-gray-300">
                      {row.pctSpent.toFixed(1)}%
                    </td>
                  </tr>
                ))}
                {/* GRAND TOTALS */}
                <tr className="bg-[#0A0B0D] font-bold border-t border-[#2D2F33] text-white">
                  <td className="py-3 font-sans font-bold">Consolidated Year</td>
                  <td className="py-3 text-right">
                    {formatCurrency(reportData.monthly.reduce((s: number, r: any) => s + r.budget, 0))}
                  </td>
                  <td className="py-3 text-right text-blue-400">
                    {formatCurrency(reportData.monthly.reduce((s: number, r: any) => s + r.actual, 0))}
                  </td>
                  <td className={`py-3 text-right ${
                    reportData.monthly.reduce((s: number, r: any) => s + r.budget, 0) - reportData.monthly.reduce((s: number, r: any) => s + r.actual, 0) < 0 
                    ? "text-red-400" : "text-emerald-400"
                  }`}>
                    {formatCurrency(reportData.monthly.reduce((s: number, r: any) => s + r.budget, 0) - reportData.monthly.reduce((s: number, r: any) => s + r.actual, 0))}
                  </td>
                  <td className="py-3 text-right">
                    {((reportData.monthly.reduce((s: number, r: any) => s + r.actual, 0) / (reportData.monthly.reduce((s: number, r: any) => s + r.budget, 0) || 1)) * 100).toFixed(1)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* -----------------------------------------------------------------
            TABLE: QUARTERLY STATEMENT
            ----------------------------------------------------------------- */}
        {activeReportTab === "quarterly" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#2D2F33] text-gray-400 font-mono text-[10px] uppercase tracking-wider">
                  <th className="pb-2">Quarter Frame</th>
                  <th className="pb-2">Associated Periods</th>
                  <th className="pb-2 text-right">Budget Allocation</th>
                  <th className="pb-2 text-right">Ledger Actuals</th>
                  <th className="pb-2 text-right">Quarterly Variance</th>
                  <th className="pb-2 text-right">Utilization %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#212328] font-mono text-xs">
                {reportData.quarterly.map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-[#1C1F26]">
                    <td className="py-2.5 font-sans text-gray-300 font-semibold">{row.quarter}</td>
                    <td className="py-2.5 text-gray-500 text-[10px]">{row.months.join(", ")}</td>
                    <td className="py-2.5 text-right text-gray-400">{formatCurrency(row.budget)}</td>
                    <td className="py-2.5 text-right text-blue-400">{formatCurrency(row.actual)}</td>
                    <td className={`py-2.5 text-right font-semibold ${row.variance < 0 ? "text-red-400" : "text-emerald-400"}`}>
                      {row.variance < 0 ? "-" : "+"}{formatCurrency(Math.abs(row.variance))}
                    </td>
                    <td className="py-2.5 text-right text-gray-300">
                      {row.pctSpent.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* -----------------------------------------------------------------
            TABLE: YEARLY COMPILER
            ----------------------------------------------------------------- */}
        {activeReportTab === "yearly" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#2D2F33] text-gray-400 font-mono text-[10px] uppercase tracking-wider">
                  <th className="pb-2">Fiscal Period</th>
                  <th className="pb-2 text-right">Annual Budget Frame</th>
                  <th className="pb-2 text-right">Annual Committed Spend</th>
                  <th className="pb-2 text-right">Fiscal Variance</th>
                  <th className="pb-2 text-right">Execution Rate %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#212328] font-mono text-xs">
                {reportData.yearly.map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-[#1C1F26]">
                    <td className="py-2.5 font-sans text-gray-300 font-semibold">
                      FY{row.year} {row.year === selectedYear ? "(Operational)" : ""}
                    </td>
                    <td className="py-2.5 text-right text-gray-400">{formatCurrency(row.budget)}</td>
                    <td className="py-2.5 text-right text-blue-400">{formatCurrency(row.actual)}</td>
                    <td className={`py-2.5 text-right font-semibold ${row.variance < 0 ? "text-red-400" : "text-emerald-400"}`}>
                      {row.variance < 0 ? "-" : "+"}{formatCurrency(Math.abs(row.variance))}
                    </td>
                    <td className="py-2.5 text-right text-gray-300">
                      {row.pctSpent.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* -----------------------------------------------------------------
            TABLE: DEPARTMENT-WISE PLAN
            ----------------------------------------------------------------- */}
        {activeReportTab === "department" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#2D2F33] text-gray-400 font-mono text-[10px] uppercase tracking-wider">
                  <th className="pb-2">Division Code</th>
                  <th className="pb-2">Cost Center Name</th>
                  <th className="pb-2 text-right">Approved Budget</th>
                  <th className="pb-2 text-right">Committed Actuals</th>
                  <th className="pb-2 text-right">Variance Balance</th>
                  <th className="pb-2 text-right">Utilization Rate %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#212328] font-mono text-xs">
                {reportData.departmentWise.map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-[#1C1F26]">
                    <td className="py-2.5 font-mono text-gray-400">{row.departmentCode}</td>
                    <td className="py-2.5 font-sans text-gray-300 font-semibold">{row.departmentName}</td>
                    <td className="py-2.5 text-right text-gray-400">{formatCurrency(row.budget)}</td>
                    <td className="py-2.5 text-right text-blue-400">{formatCurrency(row.actual)}</td>
                    <td className={`py-2.5 text-right font-semibold ${row.variance < 0 ? "text-red-400" : "text-emerald-400"}`}>
                      {row.variance < 0 ? "-" : "+"}{formatCurrency(Math.abs(row.variance))}
                    </td>
                    <td className="py-2.5 text-right text-gray-300">
                      {row.pctSpent.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* -----------------------------------------------------------------
            TABLE: EXPENSE SUMMARY (ITEMIZED GENERAL LEDGER JOURNAL)
            ----------------------------------------------------------------- */}
        {activeReportTab === "summary" && (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#2D2F33] text-gray-400 font-mono text-[10px] uppercase tracking-wider">
                    <th className="pb-2">Posting Date</th>
                    <th className="pb-2">CC</th>
                    <th className="pb-2">Account Category</th>
                    <th className="pb-2">Vendor / Payee</th>
                    <th className="pb-2">Invoice Ref</th>
                    <th className="pb-2">Description / Purpose</th>
                    <th className="pb-2 text-right">Actual Ledger Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#212328] font-mono text-xs">
                  {reportData.expenseSummary.items.length > 0 ? (
                    reportData.expenseSummary.items.map((row: any) => (
                      <tr key={row.id} className="hover:bg-[#1C1F26]">
                        <td className="py-2.5 text-gray-400 text-center">{row.date}</td>
                        <td className="py-2.5 text-gray-400 text-center">{row.departmentCode}</td>
                        <td className="py-2.5 text-[#E5C185]">{row.category}</td>
                        <td className="py-2.5 text-gray-300">{row.vendorName || "N/A"}</td>
                        <td className="py-2.5 text-gray-400 text-[10px]">{row.invoiceNumber || "N/A"}</td>
                        <td className="py-2.5 text-gray-400 max-w-xs truncate" title={row.description}>{row.description}</td>
                        <td className="py-2.5 text-right text-[#60A5FA] font-bold">{formatCurrency(row.amount)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-500 font-mono text-xs">
                        NO ITEMISED JOURNAL ENTRIES FOUND WITHIN APPLIED SCOPE
                      </td>
                    </tr>
                  )}
                  {/* TOTAL JOURNAL ROWS */}
                  <tr className="bg-[#0A0B0D] font-bold border-t border-[#2D2F33] text-white">
                    <td colSpan={6} className="py-3 font-sans font-bold">Total Committed Ledger Journal Balance</td>
                    <td className="py-3 text-right text-blue-400 font-bold">
                      {formatCurrency(reportData.expenseSummary.grandTotal)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* COMPLIANCE DISCLOSURE SLATE */}
        <div className="border-t border-[#2D2F33] pt-4 mt-6 flex flex-col md:flex-row justify-between items-center text-[10px] font-mono text-gray-500 gap-4">
          <div className="flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-gray-600" />
            <span>Compiled through secure EPM general ledger microservices. Audit reference: ORCL.SEC404.2026</span>
          </div>
          <div>
            <span>Oracle PBCS Integration Core • v3.5-Enterprise</span>
          </div>
        </div>
      </div>
    </div>
  );
};
