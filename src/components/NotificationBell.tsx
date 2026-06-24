import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { 
  Bell, 
  Check, 
  CheckCheck, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  AlertOctagon, 
  Receipt, 
  Clock
} from "lucide-react";
import { User, Notification, UserRole } from "../types.js";

interface NotificationBellProps {
  currentUser: User | null;
  setActiveTab: (tab: string) => void;
  triggerAlert: (type: "success" | "warning" | "error", text: string) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  currentUser,
  setActiveTab,
  triggerAlert
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!currentUser) return;
    try {
      const token = localStorage.getItem("orcl_pbcs_token");
      const res = await axios.get("/api/v1/notifications", {
        headers: { 
          Authorization: `Bearer ${token}`,
          "X-User-Username": currentUser.username
        }
      });
      if (res.data && res.data.success) {
        setNotifications(res.data.notifications);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll for notifications every 10 seconds for real-time responsiveness
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent triggering click event on the item
    try {
      const token = localStorage.getItem("orcl_pbcs_token");
      const res = await axios.post(`/api/v1/notifications/${id}/read`, {}, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "X-User-Username": currentUser?.username || ""
        }
      });
      if (res.data && res.data.success) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      }
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem("orcl_pbcs_token");
      const res = await axios.post("/api/v1/notifications/read-all", {}, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "X-User-Username": currentUser?.username || ""
        }
      });
      if (res.data && res.data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        triggerAlert("success", "All EPM notifications marked as read.");
      }
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const handleNotificationClick = async (notif: Notification) => {
    // Mark as read
    if (!notif.isRead) {
      try {
        const token = localStorage.getItem("orcl_pbcs_token");
        await axios.post(`/api/v1/notifications/${notif.id}/read`, {}, {
          headers: { 
            Authorization: `Bearer ${token}`,
            "X-User-Username": currentUser?.username || ""
          }
        });
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
      } catch (err) {
        console.error("Failed to mark as read inside item click", err);
      }
    }

    // Toggle dropdown closed
    setIsOpen(false);

    // Route tab based on notification type
    if (notif.type === "budget_submitted" || notif.type === "budget_approved" || notif.type === "budget_rejected") {
      if (currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.FINANCE_MANAGER) {
        setActiveTab("approvals");
      } else {
        setActiveTab("budget-form");
      }
    } else if (notif.type === "expense_added" || notif.type === "budget_exceeded") {
      setActiveTab("expenses");
    }
  };

  const getNotifIcon = (type: Notification["type"]) => {
    switch (type) {
      case "budget_submitted":
        return <FileText className="w-4 h-4 text-amber-400 shrink-0" />;
      case "budget_approved":
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
      case "budget_rejected":
        return <XCircle className="w-4 h-4 text-rose-500 shrink-0" />;
      case "budget_exceeded":
        return <AlertOctagon className="w-4 h-4 text-red-500 shrink-0" />;
      case "expense_added":
        return <Receipt className="w-4 h-4 text-[#60A5FA] shrink-0" />;
      default:
        return <Bell className="w-4 h-4 text-gray-400 shrink-0" />;
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " " + date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (e) {
      return "Just now";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* BELL TRIGGER BUTTON */}
      <button
        id="notification-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded bg-[#212328] border border-[#2D2F33] hover:bg-[#2D2F33] text-[#E1E1E1] relative transition-all focus:outline-none"
        title="Oracle EPM Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span 
            id="notification-unread-badge" 
            className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-[9px] font-mono font-bold text-white rounded-full flex items-center justify-center animate-pulse"
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* DROPDOWN MENU */}
      {isOpen && (
        <div 
          id="notification-dropdown"
          className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#16181D] border border-[#2D2F33] rounded shadow-2xl z-50 overflow-hidden flex flex-col max-h-[480px] animate-fade-in"
        >
          {/* Header */}
          <div className="p-4 border-b border-[#2D2F33] flex justify-between items-center bg-[#1F2128]">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-white uppercase tracking-wider font-bold">
                EPM Alerts ledger
              </span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-red-950 text-red-400 border border-red-900 rounded text-[9px] font-mono uppercase font-bold">
                  {unreadCount} pending
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                id="mark-all-read-btn"
                onClick={handleMarkAllAsRead}
                className="text-[10px] text-[#3B82F6] hover:text-[#2563EB] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3 h-3" />
                <span>Dismiss All</span>
              </button>
            )}
          </div>

          {/* List items */}
          <div className="overflow-y-auto divide-y divide-[#212328] flex-1 max-h-[350px]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 flex flex-col items-center gap-2">
                <Bell className="w-8 h-8 opacity-20" />
                <p className="text-xs font-mono">No notifications in directory ledger.</p>
                <p className="text-[10px] text-gray-600">All audit-compliant events are fully settled.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 flex gap-3 transition-colors duration-150 cursor-pointer hover:bg-[#1E2127] relative ${
                    !notif.isRead ? "bg-[#1B212D]/60 border-l-2 border-[#3B82F6]" : ""
                  }`}
                >
                  {/* Status Indicator Icon */}
                  {getNotifIcon(notif.type)}

                  {/* Body Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className={`text-xs font-semibold truncate ${!notif.isRead ? "text-white" : "text-gray-300"}`}>
                        {notif.title}
                      </h4>
                      <span className="text-[9px] text-gray-500 font-mono flex items-center gap-1 shrink-0 whitespace-nowrap">
                        <Clock className="w-2.5 h-2.5" />
                        {formatTime(notif.createdAt)}
                      </span>
                    </div>
                    <p className={`text-[11px] mt-1 leading-relaxed ${!notif.isRead ? "text-gray-200" : "text-gray-400"}`}>
                      {notif.message}
                    </p>
                  </div>

                  {/* Mark single as read button if unread */}
                  {!notif.isRead && (
                    <button
                      onClick={(e) => handleMarkAsRead(notif.id, e)}
                      className="self-center p-1 hover:bg-[#2D2F33] text-gray-400 hover:text-[#3B82F6] rounded"
                      title="Dismiss alert"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-[#2D2F33] text-center bg-[#1F2128]">
            <span className="text-[9px] text-gray-500 font-mono uppercase tracking-wider">
              Secure Corporate SOX-Audit compliance ledger
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
