import React from "react";
import { 
  LayoutDashboard, 
  FileSpreadsheet, 
  CheckSquare, 
  Receipt, 
  TrendingUp, 
  History, 
  FileText, 
  Settings, 
  LogOut,
  Building2,
  Shield,
  Activity,
  MessageSquare
} from "lucide-react";
import { User, UserRole } from "../types.js";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User | null;
  onLogout: () => void;
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
  collapsed,
  setCollapsed
}) => {
  if (!currentUser) return null;

  const menuItems = [
    { id: "dashboard", label: "Financial Dashboard", icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.FINANCE_MANAGER, UserRole.DEPARTMENT_MANAGER, UserRole.EMPLOYEE] },
    { id: "departments", label: "Department Directory", icon: Building2, roles: [UserRole.ADMIN, UserRole.FINANCE_MANAGER, UserRole.DEPARTMENT_MANAGER, UserRole.EMPLOYEE] },
    { id: "budget-form", label: "Planning Grid (Forms)", icon: FileSpreadsheet, roles: [UserRole.ADMIN, UserRole.FINANCE_MANAGER, UserRole.DEPARTMENT_MANAGER] },
    { id: "approvals", label: "Workflows & Approvals", icon: CheckSquare, roles: [UserRole.ADMIN, UserRole.FINANCE_MANAGER, UserRole.DEPARTMENT_MANAGER] },
    { id: "expenses", label: "Actual Expenses", icon: Receipt, roles: [UserRole.ADMIN, UserRole.FINANCE_MANAGER, UserRole.DEPARTMENT_MANAGER, UserRole.EMPLOYEE] },
    { id: "reports", label: "Variance & Reports", icon: FileText, roles: [UserRole.ADMIN, UserRole.FINANCE_MANAGER, UserRole.DEPARTMENT_MANAGER] },
    { id: "forecast", label: "Predictive Forecasting (AI)", icon: TrendingUp, roles: [UserRole.ADMIN, UserRole.FINANCE_MANAGER, UserRole.DEPARTMENT_MANAGER] },
    { id: "assistant", label: "AI Financial Assistant", icon: MessageSquare, roles: [UserRole.ADMIN, UserRole.FINANCE_MANAGER, UserRole.DEPARTMENT_MANAGER, UserRole.EMPLOYEE] },
    { id: "audit", label: "Compliance Audit Trail", icon: History, roles: [UserRole.ADMIN] },
  ];

  // Filter menu items by user role permissions
  const filteredItems = menuItems.filter(item => item.roles.includes(currentUser.role));

  return (
    <aside 
      id="app-sidebar"
      className={`bg-[#0A1D37] text-[#DCE4ED] flex flex-col h-screen transition-all duration-300 border-r border-[#1B365D] ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-[#1B365D] flex items-center gap-3 bg-[#071424]">
        <div className="w-8 h-8 rounded bg-gradient-to-tr from-[#C19A5B] to-[#E5C185] flex items-center justify-center font-bold text-[#0A1D37]">
          O
        </div>
        {!collapsed && (
          <div>
            <h1 className="text-sm font-semibold tracking-wide uppercase text-[#E5C185]">
              Oracle PBCS
            </h1>
            <p className="text-[10px] text-gray-400 font-mono tracking-wider">
              ENTERPRISE EPM CLOUD
            </p>
          </div>
        )}
      </div>

      {/* User Information */}
      {!collapsed && (
        <div className="p-4 border-b border-[#1B365D] bg-[#0C2445]/50">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Active Directory Profile</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="p-1 rounded bg-[#1B365D]">
              <Shield className="w-4 h-4 text-[#E5C185]" />
            </div>
            <div className="truncate">
              <h2 className="text-xs font-medium text-white truncate">{currentUser.name}</h2>
              <span className="inline-block mt-0.5 px-1.5 py-0.5 text-[9px] bg-[#C19A5B]/20 text-[#E5C185] rounded font-mono font-bold uppercase">
                {currentUser.role}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              id={`sidebar-tab-${item.id}`}
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs font-medium transition-all duration-150 ${
                isActive
                  ? "bg-[#C19A5B] text-[#0A1D37] shadow-lg font-semibold"
                  : "hover:bg-[#152F53] text-[#A5B4FC] hover:text-white"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#0A1D37]" : "text-[#E5C185]"}`} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer Status Indicators */}
      <div className="p-4 border-t border-[#1B365D] bg-[#071424] text-[10px]">
        {!collapsed ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="flex items-center gap-1">
                <Activity className="w-3 h-3 text-green-400 animate-pulse" />
                <span>Cloud Connected</span>
              </span>
              <span className="font-mono bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded font-bold uppercase">
                SECURE
              </span>
            </div>
            <div className="text-gray-500 font-mono text-[9px] leading-tight">
              Period: FY2026 M1-M12<br />
              Node IP: CLOUD-ORCL-APP
            </div>
            <button
              id="sidebar-btn-logout"
              onClick={onLogout}
              className="w-full mt-2 flex items-center justify-center gap-2 py-1.5 border border-red-500/20 hover:border-red-500/50 hover:bg-red-500/10 rounded text-red-400 text-xs transition-all duration-150"
            >
              <LogOut className="w-3 h-3" />
              <span>Log Out Portal</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 items-center">
            <Activity className="w-3 h-3 text-green-400" title="Connected" />
            <button 
              id="sidebar-btn-logout-collapsed"
              onClick={onLogout} 
              className="p-1 rounded border border-red-500/25 hover:bg-red-500/10 text-red-400"
              title="Log Out"
            >
              <LogOut className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
