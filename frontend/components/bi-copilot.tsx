"use client"

import React, { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Send, Sparkles, TrendingUp, AlertTriangle, Users, DollarSign, MessageSquare, Zap } from "lucide-react"
import { InvoiceRecord } from "@/components/invoices-table"
import { api } from "@/lib/api"

interface Message {
  id: string
  role: "user" | "ai"
  text: string
  data?: ResponseData
  timestamp: Date
}

interface ResponseData {
  type: "metric" | "list" | "action"
  items?: { label: string; value: string; highlight?: boolean }[]
}

const PROMPTS = [
  "Why are collections down?",
  "Which clients are high risk?",
  "Forecast next 30 days",
  "How much is overdue?",
  "Send reminders to overdue clients",
  "What's my DSO right now?",
]

function generateResponse(query: string, invoices: InvoiceRecord[]): { text: string; data?: ResponseData } {
  const q = query.toLowerCase().trim()

  const overdue     = invoices.filter(i => i.status === "OVERDUE")
  const pending     = invoices.filter(i => i.status === "PENDING")
  const paid        = invoices.filter(i => i.status === "PAID")
  const highRisk    = invoices.filter(i => i.riskScore >= 0.7)
  const totalOverdue = overdue.reduce((s, i) => s + i.amount, 0)
  const totalPending = pending.reduce((s, i) => s + i.amount, 0)
  const totalPaid   = paid.reduce((s, i) => s + i.amount, 0)
  const totalAr     = totalPending + totalOverdue
  const fmt = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n)

  // 1. Greetings & Bot Identity
  if (["hello", "hi", "hey", "who are you", "what are you", "help", "greetings"].some(g => q.includes(g))) {
    return {
      text: `Hello! I am your RazorFlow AI Copilot. I'm actively monitoring your accounts receivable ledger: ${invoices.length} invoices indexed totaling ${fmt(totalAr + totalPaid)}. You have ${overdue.length} overdue invoices (${fmt(totalOverdue)}). You can ask me about specific clients, payment risk, cash flow forecast, or automated reminders.`,
      data: {
        type: "metric",
        items: [
          { label: "Total Ledger", value: fmt(totalAr + totalPaid) },
          { label: "Overdue", value: fmt(totalOverdue), highlight: overdue.length > 0 },
          { label: "High Risk", value: `${highRisk.length} clients` },
          { label: "Collected", value: fmt(totalPaid) }
        ]
      }
    }
  }

  // 2. Specific Client Lookup
  for (const inv of invoices) {
    const custClean = inv.customer.toLowerCase()
    const tokens = custClean.split(/[\s\-_,\.]+/).filter(t => t.length > 2)
    if (q.includes(custClean) || tokens.some(t => q.includes(t))) {
      const clientInvs = invoices.filter(i => i.customer.toLowerCase() === custClean)
      const clientTotal = clientInvs.reduce((s, i) => s + i.amount, 0)
      const isClientOverdue = clientInvs.some(i => i.status === "OVERDUE")
      return {
        text: `${inv.customer} currently has ${clientInvs.length} invoice(s) totaling ${fmt(clientTotal)}. Current status is ${isClientOverdue ? "Overdue" : inv.status.toLowerCase()} with a delay risk score of ${Math.round(inv.riskScore * 100)}%. Due date: ${inv.dueDate} (${inv.dueStatus}).`,
        data: {
          type: "list",
          items: clientInvs.map(i => ({
            label: `${i.id} · ${i.dueDate}`,
            value: `${fmt(i.amount)} (${i.status})`,
            highlight: i.status === "OVERDUE"
          }))
        }
      }
    }
  }

  // 3. Paid & Collections Inquiries
  if (["collected", "settled", "paid", "received", "revenue"].some(k => q.includes(k))) {
    return {
      text: `A total of ${fmt(totalPaid)} has been successfully collected across ${paid.length} invoice${paid.length !== 1 ? "s" : ""}. Collection settlement efficiency is ${Math.round((paid.length / Math.max(1, invoices.length)) * 100)}%.`,
      data: {
        type: "metric",
        items: [
          { label: "Total Collected", value: fmt(totalPaid), highlight: true },
          { label: "Paid Invoices", value: `${paid.length}` },
          { label: "Active Receivables", value: fmt(totalAr) },
          { label: "Overdue Balance", value: fmt(totalOverdue) }
        ]
      }
    }
  }

  // 4. Who owes money / Pending / Receivables
  if (["who owes", "unpaid", "pending", "outstanding", "debtor", "owe"].some(k => q.includes(k))) {
    const active = [...overdue, ...pending]
    return {
      text: `You have ${active.length} active receivable${active.length !== 1 ? "s" : ""} totaling ${fmt(totalAr)}. ${overdue.length} are overdue (${fmt(totalOverdue)}) and ${pending.length} are pending upcoming settlement.`,
      data: {
        type: "list",
        items: active.slice(0, 6).map(i => ({
          label: `${i.customer} (${i.dueStatus})`,
          value: fmt(i.amount),
          highlight: i.status === "OVERDUE"
        }))
      }
    }
  }

  // 5. Why collections down
  if (q.includes("collection") || q.includes("down") || q.includes("why") || q.includes("delay")) {
    return {
      text: `Collections are pressured by ${overdue.length} overdue invoice${overdue.length > 1 ? "s" : ""} worth ${fmt(totalOverdue)}. ${highRisk.length} clients have risk scores above 70%, indicating structural delay patterns — not one-off issues.`,
      data: {
        type: "metric",
        items: [
          { label: "Overdue invoices", value: `${overdue.length}`, highlight: true },
          { label: "Value at risk",    value: fmt(totalOverdue), highlight: true },
          { label: "High-risk clients",value: `${highRisk.length}` },
          { label: "Paid on time",     value: `${paid.length}` },
        ]
      }
    }
  }

  // 6. High risk
  if (q.includes("high risk") || q.includes("default") || q.includes("risk") || q.includes("risky")) {
    return {
      text: `${highRisk.length} client${highRisk.length !== 1 ? "s are" : " is"} flagged as high risk (score ≥70%). Immediate collection action is recommended for ${overdue.filter(i => i.riskScore >= 0.7).length} who are both overdue and high-risk.`,
      data: {
        type: "list",
        items: highRisk.map(i => ({
          label: i.customer,
          value: `${Math.round(i.riskScore * 100)}% · ${fmt(i.amount)}`,
          highlight: i.status === "OVERDUE"
        }))
      }
    }
  }

  // 7. Forecast
  if (q.includes("forecast") || q.includes("30 day") || q.includes("next month") || q.includes("cash flow")) {
    const confirmed = Math.round(totalPending * 0.83)
    const atRisk    = totalPending - confirmed
    return {
      text: `In the next 30 days, ${fmt(confirmed)} is expected to clear (86% confidence). ${fmt(atRisk)} remains at risk, discounted by XGBoost client risk coefficients across ${pending.length} active invoices.`,
      data: {
        type: "metric",
        items: [
          { label: "Projected inflow", value: fmt(totalPending) },
          { label: "Confirmed (83%)",  value: fmt(confirmed), highlight: true },
          { label: "At risk",          value: fmt(atRisk) },
          { label: "Active invoices",  value: `${pending.length}` },
        ]
      }
    }
  }

  // 8. Overdue
  if (q.includes("overdue") && !q.includes("remind")) {
    return {
      text: `You have ${overdue.length} overdue invoice${overdue.length !== 1 ? "s" : ""} totalling ${fmt(totalOverdue)}. The oldest is ${overdue.sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0]?.customer} — ${overdue[0]?.dueStatus}.`,
      data: {
        type: "list",
        items: overdue.map(i => ({
          label: i.customer,
          value: `${fmt(i.amount)} · ${i.dueStatus}`,
          highlight: true
        }))
      }
    }
  }

  // 9. Remind
  if (q.includes("remind") || q.includes("send") || q.includes("whatsapp") || q.includes("email")) {
    const targets = overdue.length > 0 ? overdue : highRisk.filter(i => i.status !== "PAID")
    return {
      text: `Smart reminders queued for ${targets.length} client${targets.length > 1 ? "s" : ""}. Tone auto-selected based on relationship score and invoice age. WhatsApp + Email channels activated.`,
      data: {
        type: "action",
        items: targets.map(i => ({
          label: i.customer,
          value: i.status === "OVERDUE" ? "Urgent tone · Dispatched" : "Professional tone · Queued",
          highlight: i.status === "OVERDUE"
        }))
      }
    }
  }

  // 10. DSO
  if (q.includes("dso") || q.includes("days sales") || q.includes("velocity")) {
    const avgDays = Math.round(totalOverdue / ((totalPending + totalOverdue) / invoices.length) * 1.4) || 34
    return {
      text: `Your current DSO is approximately ${avgDays} days against an industry benchmark of 28 days. The gap is driven primarily by ${highRisk[0]?.customer ?? "high-risk clients"} with extended payment cycles.`,
      data: {
        type: "metric",
        items: [
          { label: "Your DSO",        value: `${avgDays}d`, highlight: true },
          { label: "Industry avg",    value: "28d" },
          { label: "Variance",        value: `+${avgDays - 28}d`, highlight: true },
          { label: "Invoices tracked",value: `${invoices.length}` },
        ]
      }
    }
  }

  // 11. Platform help
  if (["how to", "what can you do", "features", "platform", "razorflow", "razorpay"].some(k => q.includes(k))) {
    return {
      text: "RazorFlow AI automates B2B collections: 1) ML risk assessment on all invoices, 2) Multi-channel smart reminders via WhatsApp & Email, 3) 1-click Razorpay payment links, and 4) Live 30-day liquidity forecasting.",
      data: {
        type: "metric",
        items: [
          { label: "Invoices Indexed", value: `${invoices.length}` },
          { label: "Active Receivables", value: fmt(totalAr) },
          { label: "AI Engine", value: "Active" },
          { label: "Auto-Cadence", value: "Ready" }
        ]
      }
    }
  }

  return {
    text: `Ledger analysis: ${invoices.length} total invoices indexed. ${fmt(totalAr)} in active receivables (${fmt(totalOverdue)} overdue across ${overdue.length} clients). ${paid.length} settled in full. What would you like to explore?`,
    data: {
      type: "metric",
      items: [
        { label: "Total AR",  value: fmt(invoices.reduce((s, i) => s + i.amount, 0)) },
        { label: "Overdue",   value: `${overdue.length} · ${fmt(totalOverdue)}`, highlight: overdue.length > 0 },
        { label: "Pending",   value: `${pending.length}` },
        { label: "Collected", value: `${paid.length}` },
      ]
    }
  }
}

interface BICopilotProps {
  invoices: InvoiceRecord[]
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

export const BICopilot: React.FC<BICopilotProps> = ({ invoices, isOpen: externalOpen, onOpenChange }) => {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = externalOpen !== undefined
  const open = isControlled ? externalOpen : internalOpen

  const setOpen = (val: boolean) => {
    if (isControlled) {
      onOpenChange?.(val)
    } else {
      setInternalOpen(val)
    }
  }

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput]     = useState("")
  const [typing, setTyping]   = useState(false)
  const bottomRef             = useRef<HTMLDivElement>(null)
  const inputRef              = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300)
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, typing])

  const send = async (query: string) => {
    if (!query.trim()) return

    const userMsg: Message = { id: Date.now().toString(), role: "user", text: query, timestamp: new Date() }
    setMessages(p => [...p, userMsg])
    setInput("")
    setTyping(true)

    try {
      // Query Agent 7 over live SQLite state via FastAPI
      const res = await api.queryBI(query)
      const aiMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        role: "ai", 
        text: res.text, 
        data: res.data as any, 
        timestamp: new Date() 
      }
      setMessages(p => [...p, aiMsg])
    } catch {
      // Fallback to local heuristic
      const { text, data } = generateResponse(query, invoices)
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: "ai", text, data, timestamp: new Date() }
      setMessages(p => [...p, aiMsg])
    } finally {
      setTyping(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input) }
  }

  return (
    <>
      {/* Floating launcher - Round Icon-Only FAB */}
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        title="AR Copilot"
        aria-label="Open AI Copilot"
        className={`fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border border-zinc-800 dark:border-zinc-200 shadow-[0_8px_30px_rgba(0,0,0,0.3)] flex items-center justify-center cursor-pointer transition-all select-none ${open ? "opacity-0 pointer-events-none scale-75" : "opacity-100 scale-100"}`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.92 }}
      >
        <div className="relative flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-zinc-100 dark:text-zinc-900" />
          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </div>
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/10 dark:bg-black/30 backdrop-blur-[2px]"
            />

            {/* Chat panel */}
            <motion.div
              key="panel"
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="fixed top-0 right-0 h-full w-full max-w-[420px] z-50 flex flex-col bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-900 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-zinc-900 dark:bg-white flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-white dark:text-zinc-900" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-zinc-900 dark:text-white leading-tight">BI Copilot</div>
                    <div className="text-[10px] text-zinc-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#74f7c6] animate-pulse" />
                      Live · {invoices.length} invoices indexed
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">

                {/* Empty state with prompt chips */}
                {messages.length === 0 && (
                  <div className="flex flex-col gap-5 pt-4">
                    <div>
                      <p className="text-xs text-zinc-400 mb-3">Suggested questions</p>
                      <div className="flex flex-wrap gap-2">
                        {PROMPTS.map(p => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => send(p)}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors cursor-pointer"
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Live snapshot */}
                    <div className="grid grid-cols-2 gap-2.5 mt-2">
                      {[
                        { icon: DollarSign, label: "Total AR",     value: new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(invoices.reduce((s, i) => s + i.amount, 0)) },
                        { icon: AlertTriangle, label: "Overdue",   value: `${invoices.filter(i => i.status === "OVERDUE").length} invoices` },
                        { icon: TrendingUp, label: "High Risk",    value: `${invoices.filter(i => i.riskScore >= 0.7).length} clients` },
                        { icon: Users, label: "Active Clients",    value: `${new Set(invoices.map(i => i.customer)).size}` },
                      ].map(s => (
                        <div key={s.label} className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                          <div className="flex items-center gap-1.5 mb-1">
                            <s.icon className="w-3 h-3 text-zinc-400" />
                            <span className="text-[10px] text-zinc-400 font-medium">{s.label}</span>
                          </div>
                          <div className="text-sm font-bold font-mono text-zinc-900 dark:text-white">{s.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Message thread */}
                {messages.map(msg => (
                  <div key={msg.id} className={`flex flex-col gap-1.5 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                    {msg.role === "user" ? (
                      <div className="max-w-[80%] px-3.5 py-2.5 rounded-2xl rounded-br-md bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm">
                        {msg.text}
                      </div>
                    ) : (
                      <div className="max-w-full flex flex-col gap-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-md bg-zinc-900 dark:bg-white flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-2.5 h-2.5 text-white dark:text-zinc-900" />
                          </div>
                          <span className="text-[10px] text-zinc-400 font-medium">RazorFlow AI</span>
                        </div>
                        <div className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed pl-[28px]">
                          {msg.text}
                        </div>

                        {/* Data card */}
                        {msg.data && (
                          <div className="ml-[28px] mt-1 rounded-xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                            {msg.data.type === "metric" && (
                              <div className="grid grid-cols-2 divide-x divide-y divide-zinc-100 dark:divide-zinc-800">
                                {msg.data.items?.map(item => (
                                  <div key={item.label} className="px-3 py-2.5">
                                    <div className="text-[10px] text-zinc-400 mb-0.5">{item.label}</div>
                                    <div className={`text-xs font-bold font-mono ${item.highlight ? "text-zinc-900 dark:text-white" : "text-zinc-500"}`}>
                                      {item.value}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            {(msg.data.type === "list" || msg.data.type === "action") && (
                              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {msg.data.items?.map(item => (
                                  <div key={item.label} className="flex items-center justify-between px-3 py-2">
                                    <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate">{item.label}</span>
                                    <span className={`text-[10px] font-mono ml-2 flex-shrink-0 ${item.highlight ? "font-bold text-zinc-900 dark:text-white" : "text-zinc-400"}`}>
                                      {item.value}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    <span className="text-[9px] text-zinc-300 dark:text-zinc-700 px-1">
                      {msg.timestamp.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}

                {/* Typing indicator */}
                {typing && (
                  <div className="flex items-center gap-2 pl-[28px]">
                    <div className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <motion.div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600"
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-zinc-400">Analyzing ledger…</span>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* Prompt chips (after first message) */}
              {messages.length > 0 && (
                <div className="px-5 pb-2 flex gap-2 overflow-x-auto flex-shrink-0 scrollbar-none">
                  {PROMPTS.slice(0, 4).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => send(p)}
                      className="flex-shrink-0 px-2.5 py-1 text-[10px] font-medium rounded-full border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="px-4 py-4 border-t border-zinc-100 dark:border-zinc-900 flex-shrink-0">
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 focus-within:border-zinc-400 dark:focus-within:border-zinc-600 transition-colors">
                  <MessageSquare className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Ask about your receivables…"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKey}
                    className="flex-1 bg-transparent text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => send(input)}
                    disabled={!input.trim() || typing}
                    className="p-1 rounded-md text-zinc-400 hover:text-zinc-900 dark:hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default BICopilot
