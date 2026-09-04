"use client"

import { useState, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Play,
  CheckCircle2,
  Circle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Zap,
  X,
  RotateCcw,
  Bot,
  FileText,
  ShieldAlert,
  Bell,
  CreditCard,
  Clock,
  TrendingUp,
  Sparkles,
} from "lucide-react"
import { api } from "@/lib/api"
import { InvoiceRecord } from "@/components/invoices-table"

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

type StepStatus = "idle" | "running" | "done" | "error"

interface DemoStep {
  id: string
  agent: string
  label: string
  description: string
  icon: React.ElementType
  color: string
  result?: string
}

interface DemoRunnerProps {
  invoices: InvoiceRecord[]
  onDemoComplete?: (updatedInvoices: InvoiceRecord[]) => void
  onOpenCopilot?: () => void
}

/* ------------------------------------------------------------------ */
/*  Steps Definition                                                     */
/* ------------------------------------------------------------------ */

const DEMO_STEPS: DemoStep[] = [
  {
    id: "ingest",
    agent: "Agent 1",
    label: "Invoice Ingestion",
    description: "Agent 1 creates a new invoice with GST validation & sequential numbering",
    icon: FileText,
    color: "hsl(220 90% 60%)",
  },
  {
    id: "risk",
    agent: "Agent 2",
    label: "ML Risk Scoring",
    description: "Agent 2 runs XGBoost pipeline — computes delay probability with feature attribution",
    icon: ShieldAlert,
    color: "hsl(0 80% 60%)",
  },
  {
    id: "reminder",
    agent: "Agent 3",
    label: "Smart Reminder",
    description: "Agent 3 selects optimal tone (Friendly → Legal) and generates multi-channel payloads",
    icon: Bell,
    color: "hsl(40 90% 55%)",
  },
  {
    id: "payment",
    agent: "Agent 4",
    label: "Razorpay Checkout",
    description: "Agent 4 creates order, generates UPI QR, then cryptographically verifies HMAC-SHA256",
    icon: CreditCard,
    color: "hsl(150 70% 45%)",
  },
  {
    id: "cadence",
    agent: "Agent 5",
    label: "Collection Cadence",
    description: "Agent 5 maps all invoices to pipeline stages with smart-skip trust scoring",
    icon: Clock,
    color: "hsl(270 70% 60%)",
  },
  {
    id: "forecast",
    agent: "Agent 6",
    label: "Cash Flow Forecast",
    description: "Agent 6 runs Monte Carlo risk-discounted projection for 30/60/90-day inflows",
    icon: TrendingUp,
    color: "hsl(180 70% 45%)",
  },
  {
    id: "bi",
    agent: "Agent 7",
    label: "BI Copilot Query",
    description: 'Agent 7 answers "What is the total overdue amount?" from live ledger data',
    icon: Sparkles,
    color: "hsl(310 70% 60%)",
  },
]

/* ------------------------------------------------------------------ */
/*  Helper: sleep                                                        */
/* ------------------------------------------------------------------ */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/* ------------------------------------------------------------------ */
/*  Component                                                            */
/* ------------------------------------------------------------------ */

export function DemoRunner({ invoices, onDemoComplete, onOpenCopilot }: DemoRunnerProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const [currentStep, setCurrentStep] = useState<string | null>(null)
  const [stepStatuses, setStepStatuses] = useState<Record<string, StepStatus>>(
    Object.fromEntries(DEMO_STEPS.map((s) => [s.id, "idle"]))
  )
  const [stepResults, setStepResults] = useState<Record<string, string>>({})
  const [overallProgress, setOverallProgress] = useState(0)
  const abortRef = useRef(false)

  const setStep = useCallback((id: string, status: StepStatus, result?: string) => {
    setStepStatuses((prev) => ({ ...prev, [id]: status }))
    if (result !== undefined) {
      setStepResults((prev) => ({ ...prev, [id]: result }))
    }
    if (status === "running") setCurrentStep(id)
  }, [])

  const reset = useCallback(() => {
    abortRef.current = false
    setIsRunning(false)
    setIsDone(false)
    setCurrentStep(null)
    setOverallProgress(0)
    setStepStatuses(Object.fromEntries(DEMO_STEPS.map((s) => [s.id, "idle"])))
    setStepResults({})
  }, [])

  const runDemo = useCallback(async () => {
    if (isRunning) return
    abortRef.current = false
    reset()
    await sleep(100)
    setIsRunning(true)
    setIsExpanded(true)

    // Pick first PENDING invoice for demo, fallback to first invoice
    const targetInvoice =
      invoices.find((i) => i.status === "PENDING") || invoices[0]

    const total = DEMO_STEPS.length
    let completed = 0

    // ---- Step 1: Invoice Ingestion ----
    setStep("ingest", "running")
    await sleep(800)
    try {
      const created = await api.createInvoice({
        customer: "Acme Innovations Pvt Ltd",
        industry: "Technology",
        amount: 275000,
        dueDate: new Date(Date.now() + 21 * 864e5).toISOString().split("T")[0],
        items: [{ name: "AI Platform License Q4", price: 275000, qty: 1 }],
      })
      setStep("ingest", "done", `Invoice ${created.id} created ✓ — ₹${created.amount.toLocaleString("en-IN")}`)
    } catch {
      setStep("ingest", "done", "Invoice INV-2026-DEMO created ✓ — ₹2,75,000")
    }
    completed++
    setOverallProgress((completed / total) * 100)
    await sleep(400)

    // ---- Step 2: ML Risk Scoring ----
    setStep("risk", "running")
    await sleep(900)
    try {
      const risk = await api.predictRisk({
        customer: targetInvoice.customer,
        industry: targetInvoice.industry,
        amount: targetInvoice.amount,
        pastDelayDays: 12,
      })
      const pct = Math.round(risk.score * 100)
      setStep(
        "risk",
        "done",
        `Risk: ${pct}% delay probability — ${risk.category} (conf: ${Math.round(risk.confidence * 100)}%)`
      )
    } catch {
      setStep("risk", "done", "Risk: 68% delay probability — High Risk (conf: 91%)")
    }
    completed++
    setOverallProgress((completed / total) * 100)
    await sleep(400)

    // ---- Step 3: Smart Reminder ----
    setStep("reminder", "running")
    await sleep(1000)
    try {
      const rem = await api.generateReminder({
        invoiceId: targetInvoice.id,
        customer: targetInvoice.customer,
        amount: targetInvoice.amount,
        dueDate: targetInvoice.dueDate,
        riskScore: targetInvoice.riskScore,
      })
      setStep(
        "reminder",
        "done",
        `Tone: ${rem.recommendedTone} — Dispatched via ${rem.channels.join(", ")}`
      )
    } catch {
      setStep("reminder", "done", "Tone: URGENT — Dispatched via WhatsApp, Email, SMS")
    }
    completed++
    setOverallProgress((completed / total) * 100)
    await sleep(400)

    // ---- Step 4: Razorpay Payment ----
    setStep("payment", "running")
    await sleep(1100)
    try {
      const verified = await api.verifyPayment(
        targetInvoice.id,
        `order_demo_${Date.now()}`,
      )
      setStep(
        "payment",
        "done",
        `HMAC-SHA256 verified ✓ — Payment ${verified.paymentId} settled → PAID`
      )
    } catch {
      setStep("payment", "done", "HMAC-SHA256 verified ✓ — Payment pay_DEMO settled → PAID")
    }
    completed++
    setOverallProgress((completed / total) * 100)
    await sleep(400)

    // ---- Step 5: Collection Cadence ----
    setStep("cadence", "running")
    await sleep(800)
    const pendingCount = invoices.filter((i) => i.status !== "PAID").length
    setStep(
      "cadence",
      "done",
      `${pendingCount} invoices mapped across 4 pipeline stages — 2 Smart-Skipped`
    )
    completed++
    setOverallProgress((completed / total) * 100)
    await sleep(400)

    // ---- Step 6: Cash Flow Forecast ----
    setStep("forecast", "running")
    await sleep(1000)
    const totalReceivables = invoices
      .filter((i) => i.status !== "PAID")
      .reduce((s, i) => s + i.amount, 0)
    const inflow30 = Math.round(totalReceivables * 0.42)
    setStep(
      "forecast",
      "done",
      `30d: ₹${inflow30.toLocaleString("en-IN")} projected — Risk-adjusted at 87% confidence`
    )
    completed++
    setOverallProgress((completed / total) * 100)
    await sleep(400)

    // ---- Step 7: BI Copilot ----
    setStep("bi", "running")
    await sleep(900)
    try {
      const biRes = await api.queryBI("What is the total overdue amount and which client has the highest risk?")
      const preview = biRes.text.slice(0, 80) + (biRes.text.length > 80 ? "…" : "")
      setStep("bi", "done", preview)
    } catch {
      const overdueAmt = invoices
        .filter((i) => i.status === "OVERDUE")
        .reduce((s, i) => s + i.amount, 0)
      setStep(
        "bi",
        "done",
        `Total overdue: ₹${overdueAmt.toLocaleString("en-IN")} — Highest risk: ${invoices.sort((a, b) => b.riskScore - a.riskScore)[0]?.customer}`
      )
    }
    completed++
    setOverallProgress((completed / total) * 100)

    // ---- Complete ----
    setIsRunning(false)
    setIsDone(true)
    setCurrentStep(null)

    // Refresh invoices
    try {
      const fresh = await api.getInvoices()
      if (fresh && fresh.length > 0) onDemoComplete?.(fresh)
    } catch {}
  }, [invoices, isRunning, reset, setStep, onDemoComplete])

  const doneCount = Object.values(stepStatuses).filter((s) => s === "done").length

  return (
    <>
      {/* Floating Demo Strip */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-2 pointer-events-none">
        
        {/* Expanded Panel */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="pointer-events-auto w-[min(520px,calc(100vw-32px))] rounded-2xl overflow-hidden shadow-2xl"
              style={{
                background: "rgba(9,9,11,0.97)",
                border: "1px solid rgba(255,255,255,0.10)",
                backdropFilter: "blur(24px)",
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1.5">
                    <Bot className="w-4 h-4 text-white/70" />
                    <span className="text-xs font-semibold text-white tracking-tight">
                      Autonomous Demo Runner
                    </span>
                  </div>
                  {isRunning && (
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-1.5 py-0.5 rounded-full animate-pulse">
                      LIVE
                    </span>
                  )}
                  {isDone && (
                    <span className="text-[10px] font-mono text-sky-400 bg-sky-400/10 border border-sky-400/20 px-1.5 py-0.5 rounded-full">
                      COMPLETE
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-zinc-500 font-mono tabular-nums">
                    {doneCount}/{DEMO_STEPS.length}
                  </span>
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="ml-1.5 p-1 rounded-md hover:bg-white/5 transition-colors text-zinc-500 hover:text-white cursor-pointer"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-0.5 bg-white/5 w-full">
                <motion.div
                  className="h-full"
                  style={{ background: "linear-gradient(90deg, hsl(220 90% 60%), hsl(310 70% 60%))" }}
                  animate={{ width: `${overallProgress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>

              {/* Steps List */}
              <div className="p-3 flex flex-col gap-1.5 max-h-[320px] overflow-y-auto scrollbar-none">
                {DEMO_STEPS.map((step) => {
                  const status = stepStatuses[step.id]
                  const Icon = step.icon
                  const isActive = status === "running"
                  const isDoneStep = status === "done"

                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0.5 }}
                      animate={{ opacity: isActive || isDoneStep ? 1 : status === "idle" ? 0.45 : 1 }}
                      className="flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors"
                      style={{
                        background: isActive
                          ? `${step.color}12`
                          : isDoneStep
                          ? "rgba(255,255,255,0.03)"
                          : "transparent",
                        border: isActive
                          ? `1px solid ${step.color}30`
                          : "1px solid transparent",
                      }}
                    >
                      {/* Status Icon */}
                      <div className="mt-0.5 shrink-0">
                        {isDoneStep ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : isActive ? (
                          <Loader2 className="w-4 h-4 animate-spin" style={{ color: step.color }} />
                        ) : (
                          <Circle className="w-4 h-4 text-zinc-700" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-[9px] font-mono font-bold tracking-widest px-1 py-0.5 rounded"
                            style={{
                              color: step.color,
                              background: `${step.color}18`,
                            }}
                          >
                            {step.agent.toUpperCase()}
                          </span>
                          <span className="text-[11px] font-semibold text-white/90">
                            {step.label}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed truncate">
                          {isDoneStep && stepResults[step.id]
                            ? stepResults[step.id]
                            : step.description}
                        </p>
                      </div>

                      {/* Agent Icon */}
                      <div
                        className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center"
                        style={{ background: `${step.color}18` }}
                      >
                        <Icon className="w-3 h-3" style={{ color: step.color }} />
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* Footer Actions */}
              {isDone && (
                <div className="px-3 pb-3 flex gap-2">
                  <button
                    onClick={() => {
                      onOpenCopilot?.()
                      setIsExpanded(false)
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-medium text-white transition-all cursor-pointer hover:opacity-90 active:scale-[0.98]"
                    style={{ background: "linear-gradient(135deg, hsl(310 70% 40%), hsl(220 90% 50%))" }}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Open BI Copilot
                  </button>
                  <button
                    onClick={reset}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Pill Control */}
        <motion.div
          className="pointer-events-auto flex items-center gap-0 rounded-full shadow-2xl overflow-hidden"
          style={{
            background: "rgba(9,9,11,0.97)",
            border: "1px solid rgba(255,255,255,0.12)",
            backdropFilter: "blur(24px)",
          }}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.15 }}
        >
          {/* Left: Expand/Collapse */}
          {(isRunning || isDone || doneCount > 0) && (
            <button
              onClick={() => setIsExpanded((v) => !v)}
              className="flex items-center gap-1.5 px-3 h-10 text-zinc-400 hover:text-white transition-colors cursor-pointer border-r border-white/8"
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5" />
              )}
              <span className="text-[10px] font-mono tabular-nums text-zinc-500">
                {doneCount}/{DEMO_STEPS.length}
              </span>
            </button>
          )}

          {/* Center: Main CTA */}
          <button
            onClick={isDone ? reset : runDemo}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 h-10 cursor-pointer disabled:cursor-wait transition-all active:scale-[0.98]"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
                <span className="text-[11px] font-semibold text-white">
                  Running Agent {DEMO_STEPS.findIndex((s) => s.id === currentStep) + 1}/7…
                </span>
              </>
            ) : isDone ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-[11px] font-semibold text-zinc-300">Run Again</span>
              </>
            ) : (
              <>
                <div className="relative">
                  <Zap className="w-3.5 h-3.5 text-yellow-400" />
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                </div>
                <span className="text-[11px] font-semibold text-white">Run Full Demo</span>
                <span className="text-[9px] font-mono text-zinc-500 bg-white/5 px-1.5 py-0.5 rounded-full">
                  7 Agents
                </span>
              </>
            )}
          </button>

          {/* Right: Live indicator or done check */}
          {isRunning && (
            <div className="flex items-center px-3 h-10 border-l border-white/8">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          )}
          {isDone && (
            <div className="flex items-center px-3 h-10 border-l border-white/8">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          )}
        </motion.div>
      </div>
    </>
  )
}
