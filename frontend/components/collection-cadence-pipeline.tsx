"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, ShieldAlert, AlertTriangle, Clock, Mail, MessageSquare, Zap } from "lucide-react"
import { InvoiceRecord } from "@/components/invoices-table"

interface CollectionCadencePipelineProps {
  invoices?: InvoiceRecord[]
}

interface CadenceStageItem {
  id: string
  offset: string
  label: string
  channel: string
  client: string
  amount: string
  count: number
  skipped?: boolean
  escalated?: boolean
  empty?: boolean
}

export const CollectionCadencePipeline: React.FC<CollectionCadencePipelineProps> = ({ invoices = [] }) => {
  const [active, setActive] = useState(0)
  const [looping, setLooping] = useState(false)

  // Dynamically compute stages from real invoices
  const pending = invoices.filter(i => i.status !== "PAID")
  
  const formatINR = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val)
  }

  // Parse due days remaining / overdue
  const parseDueDays = (inv: InvoiceRecord): number => {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const due = new Date(inv.dueDate)
      due.setHours(0, 0, 0, 0)
      const diffTime = due.getTime() - today.getTime()
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    } catch {
      return 0
    }
  }

  // Group real invoices into 5 pipeline buckets
  const b1 = pending.filter(i => parseDueDays(i) > 2)
  const b2 = pending.filter(i => parseDueDays(i) >= 0 && parseDueDays(i) <= 2)
  const b3 = pending.filter(i => parseDueDays(i) >= -3 && parseDueDays(i) < 0)
  const b4 = pending.filter(i => parseDueDays(i) >= -14 && parseDueDays(i) < -3)
  const b5 = pending.filter(i => parseDueDays(i) < -14)

  const buildStage = (
    id: string,
    offset: string,
    label: string,
    channel: string,
    bucket: InvoiceRecord[]
  ): CadenceStageItem => {
    if (bucket.length === 0) {
      return {
        id,
        offset,
        label,
        channel,
        client: "No matching accounts",
        amount: "₹0",
        count: 0,
        empty: true
      }
    }
    const primary = bucket[0]
    const totalAmt = bucket.reduce((sum, i) => sum + i.amount, 0)
    const isSkipped = bucket.some(i => i.riskScore <= 0.20)
    const isEscalated = bucket.some(i => i.riskScore >= 0.70)

    const clientDisplay = bucket.length > 1 
      ? `${primary.customer} +${bucket.length - 1} more`
      : primary.customer

    return {
      id,
      offset,
      label,
      channel,
      client: clientDisplay,
      amount: formatINR(totalAmt),
      count: bucket.length,
      skipped: isSkipped,
      escalated: isEscalated,
      empty: false
    }
  }

  const stages: CadenceStageItem[] = [
    buildStage("01", "−3d", "Courtesy Nudge", "WhatsApp", b1),
    buildStage("02", "Due", "Statement & Link", "Email", b2),
    buildStage("03", "+3d", "Follow-up", "WhatsApp", b3),
    buildStage("04", "+7d", "Senior Escalation", "Email + SMS", b4),
    buildStage("05", "+15d", "Legal Recovery", "Courier / Legal", b5),
  ]

  useEffect(() => {
    if (!looping) return
    const t = setInterval(() => setActive(p => (p + 1) % stages.length), 2400)
    return () => clearInterval(t)
  }, [looping, stages.length])

  const cur = stages[active] || stages[0]
  const pct = active / (stages.length - 1)

  return (
    <div className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">

      {/* Title row */}
      <div className="flex items-center justify-between px-6 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-zinc-900 dark:text-white">Autonomous Collection Cadence</span>
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {pending.length} Active Receivables
          </span>
        </div>
        <button
          type="button"
          onClick={() => setLooping(p => !p)}
          className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Zap className={`w-3 h-3 ${looping ? "text-emerald-500" : ""}`} />
          {looping ? "Stepping…" : "Simulate Cadence"}
        </button>
      </div>

      {/* Track bar */}
      <div className="px-6 py-4">
        <div className="relative flex items-center justify-between">
          <div className="absolute left-0 right-0 h-0.5 bg-zinc-200 dark:bg-zinc-800" />
          <motion.div
            className="absolute left-0 h-0.5 bg-zinc-900 dark:bg-white origin-left"
            style={{ width: `${pct * 100}%` }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
          />

          {stages.map((s, i) => {
            const isDone = i < active
            const isCur  = i === active
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => { setActive(i); setLooping(false) }}
                className="relative z-10 flex flex-col items-center gap-1.5 focus:outline-none cursor-pointer group"
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                    isCur
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-black scale-110 shadow-md ring-2 ring-zinc-400 dark:ring-zinc-600"
                      : isDone
                      ? "bg-zinc-800 text-zinc-300 dark:bg-zinc-200 dark:text-zinc-800"
                      : "bg-zinc-100 dark:bg-zinc-900 text-zinc-400 border border-zinc-200 dark:border-zinc-800"
                  }`}
                >
                  {isDone ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : s.id}
                </div>
                <span className={`text-[10px] font-semibold transition-colors ${
                  isCur ? "text-zinc-900 dark:text-white" : "text-zinc-400 dark:text-zinc-600"
                }`}>
                  {s.offset}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Stage detail panel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={cur.id + cur.client}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="mx-6 mb-6 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-start sm:items-center gap-3">
            <div className={`p-2 rounded-lg ${cur.escalated ? "bg-red-500/10 text-red-500" : cur.skipped ? "bg-blue-500/10 text-blue-500" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"}`}>
              {cur.escalated ? <ShieldAlert className="w-4 h-4" /> : cur.skipped ? <Check className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-900 dark:text-white">{cur.label}</span>
                <span className="text-[10px] text-zinc-400">· {cur.channel}</span>
                {cur.skipped && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">
                    AI Smart-Skipped
                  </span>
                )}
                {cur.escalated && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-red-500/10 text-red-500 border border-red-500/20">
                    Fast-Track Escalation
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                Target: <span className="font-medium text-zinc-700 dark:text-zinc-300">{cur.client}</span>
                {cur.count > 0 && <span className="text-zinc-400"> ({cur.count} active)</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-200 dark:border-zinc-800">
            <div className="text-right">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Stage Volume</span>
              <span className="text-sm font-bold text-zinc-900 dark:text-white font-mono">{cur.amount}</span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

    </div>
  )
}

export default CollectionCadencePipeline
