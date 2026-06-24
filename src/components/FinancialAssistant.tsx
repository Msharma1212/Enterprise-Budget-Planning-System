import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  Send, 
  Trash2, 
  Loader2, 
  HelpCircle, 
  ArrowUpRight, 
  MessageSquare, 
  TrendingUp, 
  FileText, 
  AlertTriangle,
  Bot,
  User,
  CheckCircle2,
  PieChart
} from "lucide-react";
import { User as UserType } from "../types.js";

interface Message {
  role: "user" | "model";
  text: string;
  timestamp: string;
}

interface FinancialAssistantProps {
  currentUser: UserType | null;
  triggerAlert: (type: "success" | "error" | "info" | "warning", message: string) => void;
}

export const FinancialAssistant: React.FC<FinancialAssistantProps> = ({
  currentUser,
  triggerAlert
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load chat history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("orcl_financial_assistant_chat");
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved chat history", e);
      }
    } else {
      // Set default welcome message
      setMessages([
        {
          role: "model",
          text: `### Welcome to Oracle PBCS Financial Assistant! 🤖

Hello **${currentUser?.name || "User"}**, I am your real-time EPM ledger analytics assistant. I have compiled and structured the company's active budgets, actual transactions, and organization units.

How can I assist you with your planning grid, audits, or forecasts today? You can ask me customized questions or select one of the high-priority analytical tasks below.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [currentUser]);

  // Save chat history to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("orcl_financial_assistant_chat", JSON.stringify(messages));
    }
  }, [messages]);

  // Auto scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      role: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/financial-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: textToSend,
          history: messages.map(m => ({ role: m.role, text: m.text }))
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned code ${response.status}`);
      }

      const data = await response.json();
      
      const modelMsg: Message = {
        role: "model",
        text: data.text || "I was unable to process that analysis. Please verify your data registers.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, modelMsg]);
    } catch (err: any) {
      console.error(err);
      triggerAlert("error", "Failed to connect to EPM Assistant microservice.");
      
      setMessages(prev => [...prev, {
        role: "model",
        text: `⚠️ **Microservice Connection Error**\n\nI was unable to reach the analytical backend. This can happen if the network is busy or the dev server is refreshing. Please try again in a moment.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    if (window.confirm("Are you sure you want to clear your analytical chat history?")) {
      localStorage.removeItem("orcl_financial_assistant_chat");
      setMessages([
        {
          role: "model",
          text: `### Conversational Ledger Cleared 🧹

Let's begin a fresh session. Ask me any details about our budgets, actual transactions, or predictive trends!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      triggerAlert("info", "Analytical chat history has been reset.");
    }
  };

  const quickPrompts = [
    {
      title: "Budget Exceedances",
      prompt: "Which department exceeded budget?",
      description: "Audits live expenses vs approved departmental limits.",
      icon: AlertTriangle,
      color: "text-amber-400 bg-amber-400/10 border-amber-500/20"
    },
    {
      title: "Monthly Summary",
      prompt: "Generate monthly summary.",
      description: "Structures expenses and volumes across calendar months.",
      icon: FileText,
      color: "text-sky-400 bg-sky-400/10 border-sky-500/20"
    },
    {
      title: "Next Quarter Forecast",
      prompt: "Predict next quarter.",
      description: "Uses exponential run-rate modeling to forecast future spend.",
      icon: TrendingUp,
      color: "text-emerald-400 bg-emerald-400/10 border-emerald-500/20"
    },
    {
      title: "Variance Analysis",
      prompt: "Explain budget variance.",
      description: "Calculates approved budget reconciliations by department.",
      icon: PieChart,
      color: "text-purple-400 bg-purple-400/10 border-purple-500/20"
    }
  ];

  // Elegant helper to render custom simple markdown (especially tables, bold, lists, and headers)
  const renderStyledText = (rawText: string) => {
    const lines = rawText.split("\n");
    let inTable = false;
    let tableHeaders: string[] = [];
    let tableRows: string[][] = [];

    const elements: React.ReactNode[] = [];

    const parseLineFormatting = (text: string, key: string) => {
      // Replace **bold**
      // Replace `code`
      let parts: React.ReactNode[] = [text];
      
      // Basic bold parse
      if (text.includes("**")) {
        const boldRegex = /\*\*(.*?)\*\*/g;
        let match;
        const tempParts: React.ReactNode[] = [];
        let lastIndex = 0;
        while ((match = boldRegex.exec(text)) !== null) {
          const before = text.substring(lastIndex, match.index);
          const boldText = match[1];
          if (before) tempParts.push(before);
          tempParts.push(<strong key={`b-${match.index}`} className="font-semibold text-white">{boldText}</strong>);
          lastIndex = boldRegex.lastIndex;
        }
        if (lastIndex < text.length) {
          tempParts.push(text.substring(lastIndex));
        }
        parts = tempParts;
      }

      // Basic inline code parse
      const finalParts: React.ReactNode[] = [];
      parts.forEach((part, idx) => {
        if (typeof part === "string") {
          if (part.includes("`")) {
            const codeParts = part.split("`");
            codeParts.forEach((cp, cIdx) => {
              if (cIdx % 2 === 1) {
                finalParts.push(
                  <code key={`code-${idx}-${cIdx}`} className="bg-[#1C1F26] text-[#E5C185] px-1.5 py-0.5 rounded font-mono text-[11px] border border-[#2D2F33]">
                    {cp}
                  </code>
                );
              } else if (cp) {
                finalParts.push(cp);
              }
            });
          } else {
            finalParts.push(part);
          }
        } else {
          finalParts.push(part);
        }
      });

      return finalParts.length > 0 ? finalParts : text;
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      // Check table end
      if (inTable && (!trimmed.startsWith("|") || trimmed.includes("---|"))) {
        if (!trimmed.startsWith("|")) {
          // Render accumulated table
          elements.push(
            <div key={`table-wrapper-${index}`} className="overflow-x-auto my-4 border border-[#2D2F33] rounded">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#16181D] border-b border-[#2D2F33]">
                    {tableHeaders.map((header, hIdx) => (
                      <th key={`th-${hIdx}`} className="p-3 font-semibold text-gray-300 font-mono text-[11px] uppercase tracking-wider">
                        {header.trim()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2D2F33] bg-[#0A0B0D]">
                  {tableRows.map((row, rIdx) => (
                    <tr key={`tr-${rIdx}`} className="hover:bg-[#16181D]/40 transition-colors">
                      {row.map((cell, cIdx) => (
                        <td key={`td-${rIdx}-${cIdx}`} className="p-3 text-gray-300">
                          {parseLineFormatting(cell.trim(), `cell-${rIdx}-${cIdx}`)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
          inTable = false;
          tableHeaders = [];
          tableRows = [];
        } else {
          // Ignore table formatting helper lines
          return;
        }
      }

      // Check table row
      if (trimmed.startsWith("|")) {
        const parts = trimmed.split("|").slice(1, -1);
        if (!inTable) {
          inTable = true;
          tableHeaders = parts;
        } else {
          // Ignore separator lines like |---|---|
          if (trimmed.includes("---")) {
            return;
          }
          tableRows.push(parts);
        }
        return;
      }

      // Headers
      if (trimmed.startsWith("###")) {
        elements.push(
          <h4 key={`h3-${index}`} className="text-xs font-bold text-[#E5C185] uppercase tracking-wider font-mono mt-5 mb-2.5 flex items-center gap-1.5">
            <span className="w-1 h-3 bg-[#C19A5B] rounded-full inline-block"></span>
            {parseLineFormatting(trimmed.substring(3).trim(), `h3-${index}`)}
          </h4>
        );
        return;
      }
      if (trimmed.startsWith("##")) {
        elements.push(
          <h3 key={`h2-${index}`} className="text-sm font-bold text-white uppercase tracking-wider font-mono mt-6 mb-3 flex items-center gap-2 border-b border-[#2D2F33] pb-2">
            {parseLineFormatting(trimmed.substring(2).trim(), `h2-${index}`)}
          </h3>
        );
        return;
      }
      if (trimmed.startsWith("#")) {
        elements.push(
          <h2 key={`h1-${index}`} className="text-base font-bold text-white font-mono mt-6 mb-4 pb-2 border-b border-[#2D2F33]">
            {parseLineFormatting(trimmed.substring(1).trim(), `h1-${index}`)}
          </h2>
        );
        return;
      }

      // Lists
      if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
        elements.push(
          <div key={`li-${index}`} className="flex items-start gap-2 pl-4 text-xs text-gray-300 my-1.5 leading-relaxed">
            <span className="text-[#C19A5B] mt-1 shrink-0">•</span>
            <span className="flex-1">
              {parseLineFormatting(trimmed.substring(1).trim(), `li-text-${index}`)}
            </span>
          </div>
        );
        return;
      }

      if (/^\d+\./.test(trimmed)) {
        const match = trimmed.match(/^(\d+)\.(.*)/);
        if (match) {
          elements.push(
            <div key={`li-num-${index}`} className="flex items-start gap-2 pl-4 text-xs text-gray-300 my-1.5 leading-relaxed">
              <span className="font-mono text-[#E5C185] font-bold text-[11px] shrink-0">{match[1]}.</span>
              <span className="flex-1">
                {parseLineFormatting(match[2].trim(), `li-num-text-${index}`)}
              </span>
            </div>
          );
          return;
        }
      }

      // Empty spacing
      if (!trimmed) {
        elements.push(<div key={`space-${index}`} className="h-2"></div>);
        return;
      }

      // General paragraph
      elements.push(
        <p key={`p-${index}`} className="text-xs text-gray-300 leading-relaxed my-2">
          {parseLineFormatting(trimmed, `p-text-${index}`)}
        </p>
      );
    });

    // Final clean up if text ended inside table
    if (inTable && tableHeaders.length > 0) {
      elements.push(
        <div key="table-wrapper-final" className="overflow-x-auto my-4 border border-[#2D2F33] rounded">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#16181D] border-b border-[#2D2F33]">
                {tableHeaders.map((header, hIdx) => (
                  <th key={`th-f-${hIdx}`} className="p-3 font-semibold text-gray-300 font-mono text-[11px] uppercase tracking-wider">
                    {header.trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2D2F33] bg-[#0A0B0D]">
              {tableRows.map((row, rIdx) => (
                <tr key={`tr-f-${rIdx}`} className="hover:bg-[#16181D]/40 transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={`td-f-${rIdx}-${cIdx}`} className="p-3 text-gray- cell">
                      {parseLineFormatting(cell.trim(), `cell-f-${rIdx}-${cIdx}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return elements;
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
      
      {/* Sidebar: System Info & Quick Action Cards */}
      <div className="xl:col-span-1 space-y-4">
        
        {/* Assistant status info */}
        <div className="bg-[#16181D] border border-[#2D2F33] rounded p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Directory Ledger Secured
            </h4>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed mb-4">
            Authorized as <span className="text-white font-semibold font-mono">{currentUser?.username}</span> ({currentUser?.role}). 
            Database changes synchronize on transaction commit.
          </p>
          <div className="pt-3 border-t border-[#2D2F33] flex justify-between items-center text-[10px] font-mono text-gray-500">
            <span>Server Protocol:</span>
            <span className="text-gray-300">HTTP REST + AI v3.5</span>
          </div>
        </div>

        {/* Quick analytics actions */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-[#8E9299] uppercase tracking-wider font-mono pl-1">
            Quick Analytical Tasks
          </h4>
          
          <div className="grid grid-cols-1 gap-2.5">
            {quickPrompts.map((card, i) => {
              const IconComp = card.icon;
              return (
                <button
                  key={i}
                  id={`ai-quick-${card.title.toLowerCase().replace(/\s+/g, "-")}`}
                  onClick={() => handleSend(card.prompt)}
                  disabled={loading}
                  className="w-full text-left bg-[#16181D]/80 border border-[#2D2F33] hover:border-slate-500 hover:bg-[#16181D] p-3.5 rounded transition-all duration-150 group disabled:opacity-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded border ${card.color}`}>
                        <IconComp className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-white group-hover:text-[#E5C185] transition-colors">
                        {card.title}
                      </span>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-white transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
                    {card.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
        
      </div>

      {/* Main Panel: Interactive Chat Console */}
      <div className="xl:col-span-3 flex flex-col bg-[#16181D] border border-[#2D2F33] rounded h-[680px]">
        
        {/* Chat Console Header */}
        <div className="flex justify-between items-center border-b border-[#2D2F33] px-5 py-4 bg-[#111216]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded bg-gradient-to-tr from-[#C19A5B] to-[#E5C185] flex items-center justify-center font-bold shadow-md">
              <Bot className="w-5 h-5 text-[#0A1D37]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  EPM Financial Advisory Assistant
                </h3>
                <span className="px-1.5 py-0.2 bg-[#C19A5B]/10 text-[#E5C185] border border-[#C19A5B]/20 rounded text-[9px] font-mono">
                  ACTIVE LEDGER
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">
                On-demand audits, variance, summaries, and forecasting.
              </p>
            </div>
          </div>
          
          <button
            id="clear-ai-assistant-chat"
            onClick={clearChat}
            className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-red-400 transition-colors px-2 py-1.5 rounded hover:bg-red-500/10"
            title="Reset conversation logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Assistant</span>
          </button>
        </div>

        {/* Chat Messages Frame */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#0D0E12]/40 scrollbar-thin scrollbar-thumb-slate-800">
          {messages.map((msg, index) => {
            const isModel = msg.role === "model";
            return (
              <div
                key={index}
                className={`flex gap-3 max-w-[90%] sm:max-w-[85%] ${
                  isModel ? "mr-auto" : "ml-auto flex-row-reverse"
                }`}
              >
                {/* Bubble Icon */}
                <div className={`w-7.5 h-7.5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 shadow border ${
                  isModel 
                    ? "bg-[#1C1F26] text-[#E5C185] border-[#2D2F33]" 
                    : "bg-[#C19A5B] text-[#0A1D37] border-transparent"
                }`}>
                  {isModel ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                {/* Message Body */}
                <div className="space-y-1">
                  <div className={`px-4 py-3 rounded-lg text-xs leading-relaxed ${
                    isModel 
                      ? "bg-[#16181D] text-gray-200 border border-[#2D2F33] rounded-tl-none" 
                      : "bg-[#1E293B] text-white border border-[#3B4252] rounded-tr-none"
                  }`}>
                    {isModel ? renderStyledText(msg.text) : <p className="whitespace-pre-wrap">{msg.text}</p>}
                  </div>
                  <span className={`block text-[9px] font-mono text-gray-500 ${isModel ? "text-left" : "text-right"}`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Typing Loading State */}
          {loading && (
            <div className="flex gap-3 max-w-[80%] mr-auto">
              <div className="w-7.5 h-7.5 rounded-full bg-[#1C1F26] text-[#E5C185] border border-[#2D2F33] flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="bg-[#16181D] border border-[#2D2F33] px-4 py-3.5 rounded-lg rounded-tl-none flex items-center gap-2.5">
                  <Loader2 className="w-4 h-4 text-[#E5C185] animate-spin" />
                  <span className="text-xs text-gray-400 font-mono italic">
                    Analyzing active general ledger dataset...
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Control Frame */}
        <form
          id="ai-assistant-input-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="p-4 border-t border-[#2D2F33] bg-[#111216]"
        >
          <div className="flex gap-2">
            <input
              id="ai-assistant-chat-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              placeholder="Query corporate budgets, exceeding expenditures, variances, or quarter trends..."
              className="flex-1 bg-[#0A0B0D] border border-[#2D2F33] focus:border-[#C19A5B] rounded text-xs text-white px-3.5 py-2.5 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              id="ai-assistant-send-btn"
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-[#C19A5B] hover:bg-[#E5C185] disabled:bg-[#1E293B] text-[#0A1D37] disabled:text-gray-500 border border-transparent font-bold text-xs px-4 py-2.5 rounded transition-all duration-150 flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Analyze</span>
            </button>
          </div>
          <div className="flex justify-between items-center text-[10px] text-gray-500 mt-2 font-mono px-0.5">
            <span>Press Enter to analyze. Context sync: Live.</span>
            <span>Oracle Cloud Platform AI Integration</span>
          </div>
        </form>

      </div>
      
    </div>
  );
};
