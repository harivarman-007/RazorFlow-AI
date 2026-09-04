"use client"

import React, { useState } from "react"
import { Search, Printer, Plus, Send, CreditCard } from "lucide-react"

export interface InvoiceRecord {
  id: string
  customer: string
  customerEmail?: string
  customerPhone?: string
  industry: string
  amount: number
  issueDate: string
  dueDate: string
  dueStatus: string
  status: "PENDING" | "PAID" | "OVERDUE"
  riskScore: number
  riskCategory: "Low Risk" | "Medium Risk" | "High Risk"
  items: { name: string; price: number; qty: number }[]
}

export const initialInvoices: InvoiceRecord[] = []

export interface InvoicesTableProps {
  invoices?: InvoiceRecord[]
  onSelectInvoice?: (invoice: InvoiceRecord) => void
  onRemindInvoice?: (invoice: InvoiceRecord) => void
  onPayInvoice?: (invoice: InvoiceRecord) => void
  onCreateInvoice?: () => void
}

type Filter = "ALL" | "PENDING" | "HIGH_RISK" | "OVERDUE"

export const InvoicesTable: React.FC<InvoicesTableProps> = ({
  invoices = initialInvoices,
  onSelectInvoice,
  onRemindInvoice,
  onPayInvoice,
  onCreateInvoice
}) => {
  const [filter, setFilter] = useState<Filter>("ALL")
  const [searchQuery, setSearchQuery] = useState("")

  const fmt = (val: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val)

  const filtered = invoices.filter(inv => {
    if (filter === "PENDING"   && inv.status !== "PENDING") return false
    if (filter === "OVERDUE"   && inv.status !== "OVERDUE") return false
    if (filter === "HIGH_RISK" && inv.riskScore < 0.7)      return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      return inv.id.toLowerCase().includes(q) || inv.customer.toLowerCase().includes(q)
    }
    return true
  })

  const tabs: { label: string; value: Filter }[] = [
    { label: "All",       value: "ALL"       },
    { label: "Pending",   value: "PENDING"   },
    { label: "High Risk", value: "HIGH_RISK" },
    { label: "Overdue",   value: "OVERDUE"   },
  ]

  // Status: just a small dot + plain text, fully monochrome
  const statusDot = (s: InvoiceRecord["status"]) => {
    if (s === "PAID")    return <span className="w-1.5 h-1.5 rounded-full bg-zinc-900 dark:bg-white inline-block" />
    if (s === "OVERDUE") return <span className="w-1.5 h-1.5 rounded-full bg-zinc-900 dark:bg-white inline-block" />
    return                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600 inline-block" />
  }

  const statusText = (s: InvoiceRecord["status"]) => {
    if (s === "PAID")    return "Paid"
    if (s === "OVERDUE") return "Overdue"
    return "Pending"
  }

  // Risk: plain percentage number, color only at high threshold to draw eye
  const riskText = (inv: InvoiceRecord) => {
    const pct = Math.round(inv.riskScore * 100)
    const isHigh = inv.riskScore >= 0.7
    return (
      <span className={`font-mono tabular-nums text-xs ${isHigh ? "font-bold text-zinc-900 dark:text-white" : "text-zinc-400 dark:text-zinc-500"}`}>
        {pct}%
      </span>
    )
  }

  return (
    <div className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">

      {/* Toolbar */}
      <div className="flex items-center gap-4 px-5 py-3 border-b border-zinc-100 dark:border-zinc-900">
        {/* Tabs */}
        <div className="flex items-center gap-1">
          {tabs.map(t => {
            const count = t.value === "ALL"
              ? invoices.length
              : t.value === "PENDING"   ? invoices.filter(i => i.status === "PENDING").length
              : t.value === "OVERDUE"   ? invoices.filter(i => i.status === "OVERDUE").length
              : invoices.filter(i => i.riskScore >= 0.7).length

            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setFilter(t.value)}
                className={`px-3 py-1 rounded-md text-xs transition-colors cursor-pointer
                  ${filter === t.value
                    ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold"
                    : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 font-medium"
                  }`}
              >
                {t.label} <span className="opacity-50 ml-0.5">{count}</span>
              </button>
            )
          })}
        </div>

        <div className="flex-1" />

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs w-44 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white placeholder:text-zinc-300 dark:placeholder:text-zinc-700 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors"
          />
        </div>

        {/* Create */}
        <button
          type="button"
          onClick={onCreateInvoice}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          New Invoice
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">

          {/* Head */}
          <thead>
            <tr>
              {[
                { label: "Invoice",  cls: "w-36" },
                { label: "Client",   cls: "" },
                { label: "Amount",   cls: "w-32" },
                { label: "Due",      cls: "w-36" },
                { label: "Status",   cls: "w-24" },
                { label: "Risk",     cls: "w-16" },
                { label: "",         cls: "w-32" },
              ].map((h, i) => (
                <th key={i} className={`py-2 px-5 text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-600 border-b border-zinc-100 dark:border-zinc-900 ${h.cls}`}>
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {filtered.map((inv, i) => (
              <tr
                key={inv.id ? `${inv.id}-${i}` : `inv-row-${i}`}
                onClick={() => onSelectInvoice?.(inv)}
                className={`group cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors ${i < filtered.length - 1 ? "border-b border-zinc-100 dark:border-zinc-900" : ""}`}
              >
                {/* ID */}
                <td className="py-3.5 px-5">
                  <span className="font-mono text-[11px] text-zinc-400 dark:text-zinc-500 tracking-tight">
                    {inv.id}
                  </span>
                </td>

                {/* Client */}
                <td className="py-3.5 px-5">
                  <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-tight">{inv.customer}</div>
                  <div className="text-[11px] text-zinc-400 dark:text-zinc-600 mt-0.5">{inv.industry}</div>
                </td>

                {/* Amount */}
                <td className="py-3.5 px-5">
                  <span className="font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100">{fmt(inv.amount)}</span>
                </td>

                {/* Due */}
                <td className="py-3.5 px-5">
                  <div className="text-xs text-zinc-700 dark:text-zinc-300">{inv.dueDate}</div>
                  <div className={`text-[11px] mt-0.5 ${inv.status === "OVERDUE" ? "text-zinc-900 dark:text-white font-semibold" : "text-zinc-400 dark:text-zinc-600"}`}>
                    {inv.dueStatus}
                  </div>
                </td>

                {/* Status */}
                <td className="py-3.5 px-5">
                  <span className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                    {statusDot(inv.status)}
                    {statusText(inv.status)}
                  </span>
                </td>

                {/* Risk */}
                <td className="py-3.5 px-5">
                  {riskText(inv)}
                </td>

                {/* Actions — hidden until hover */}
                <td className="py-3.5 px-5">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {inv.status !== "PAID" && (
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); onRemindInvoice?.(inv) }}
                        className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                      >
                        <Send className="w-3 h-3" />
                        Remind
                      </button>
                    )}
                    {inv.status !== "PAID" && (
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); onPayInvoice?.(inv) }}
                        className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-md bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors cursor-pointer"
                      >
                        <CreditCard className="w-3 h-3" />
                        Pay
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); onSelectInvoice?.(inv) }}
                      className="p-1 rounded-md text-zinc-300 dark:text-zinc-600 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-center">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">No invoices in ledger</p>
            <p className="text-xs text-zinc-500 max-w-sm">
              Your accounts receivable table is currently empty. Click below to add your first fresh invoice.
            </p>
            <button
              type="button"
              onClick={onCreateInvoice}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Invoice
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-2.5 border-t border-zinc-100 dark:border-zinc-900">
        <span className="text-[11px] text-zinc-400">{filtered.length} invoices</span>
        <span className="font-mono text-[11px] font-semibold text-zinc-700 dark:text-zinc-400">
          {fmt(filtered.reduce((s, i) => s + i.amount, 0))}
        </span>
      </div>

    </div>
  )
}

export default InvoicesTable
