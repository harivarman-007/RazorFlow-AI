"use client"

import React, { useState, useMemo } from "react"
import { 
  X, 
  Plus, 
  Trash2, 
  Calendar, 
  Building2,
  Phone,
  Mail
} from "lucide-react"

export interface CreateInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onInvoiceCreated: (invoiceData: any) => void
}

export const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({
  isOpen,
  onClose,
  onInvoiceCreated
}) => {
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("+919944594913")
  const [customerEmail, setCustomerEmail] = useState("harivarman1234@gmail.com")
  const [industry, setIndustry] = useState("Technology")
  const [creditTerms, setCreditTerms] = useState<number>(15)
  const [items, setItems] = useState([
    { name: "Consulting & Software Services", price: 50000, qty: 1 }
  ])

  // Subtotal & GST
  const subtotal = useMemo(() => {
    return items.reduce((acc, it) => acc + (it.price * (it.qty || 1)), 0)
  }, [items])

  const tax = subtotal * 0.18 // 18% GST
  const grandTotal = subtotal + tax

  // Calculated risk score heuristic
  const calculatedRiskScore = useMemo(() => {
    if (creditTerms > 15) return 0.65
    return 0.25
  }, [creditTerms])

  const riskCategory = calculatedRiskScore >= 0.7 ? "High Risk" : calculatedRiskScore >= 0.3 ? "Medium Risk" : "Low Risk"

  const handleAddItem = () => {
    setItems([...items, { name: "Additional Service / Item", price: 10000, qty: 1 }])
  }

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return
    setItems(items.filter((_, idx) => idx !== index))
  }

  const handleUpdateItem = (index: number, field: "name" | "price" | "qty", value: any) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    setItems(updated)
  }

  const handleGenerateInvoice = () => {
    const finalCustomer = customerName.trim() || "Acme Enterprises"
    const today = new Date()
    const due = new Date(today)
    due.setDate(due.getDate() + creditTerms)

    const issueDateStr = today.toISOString().split("T")[0]
    const dueDateStr = due.toISOString().split("T")[0]

    const newInvoice = {
      id: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      customer: finalCustomer,
      customerPhone: customerPhone.trim() || "+919944594913",
      customerEmail: customerEmail.trim() || "billing@company.com",
      industry: industry || "Technology",
      amount: Math.round(grandTotal),
      issueDate: issueDateStr,
      dueDate: dueDateStr,
      dueStatus: `Due in ${creditTerms} days`,
      status: "PENDING",
      riskScore: calculatedRiskScore,
      riskCategory,
      items: items.map(it => ({
        name: it.name,
        description: it.name,
        quantity: it.qty || 1,
        qty: it.qty || 1,
        rate: it.price,
        price: it.price,
        amount: it.price * (it.qty || 1)
      }))
    }
    onInvoiceCreated(newInvoice)
    onClose()
  }

  const formatINR = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 flex flex-col gap-5 shadow-xl overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Create Invoice
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Enter customer details and billable line items.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Client Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
              Client / Company Name
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Apex Logix Corp or Harivarman Enterprises"
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1 flex items-center gap-1">
              <Phone className="w-3 h-3 text-zinc-400" />
              WhatsApp / Phone
            </label>
            <input
              type="text"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="+919944594913"
              className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1 flex items-center gap-1">
              <Mail className="w-3 h-3 text-zinc-400" />
              Billing Email
            </label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="harivarman1234@gmail.com"
              className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
              Industry
            </label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            >
              <option value="Technology">Technology & SaaS</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Retail & E-commerce">Retail & E-Commerce</option>
              <option value="Logistics">Logistics & Supply Chain</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Fintech">Fintech</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
              Payment Terms
            </label>
            <select
              value={creditTerms}
              onChange={(e) => setCreditTerms(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            >
              <option value={7}>Net 7 Days</option>
              <option value={15}>Net 15 Days (Standard)</option>
              <option value={30}>Net 30 Days</option>
            </select>
          </div>
        </div>

        {/* Line Items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Line Items
            </span>
            <button
              type="button"
              onClick={handleAddItem}
              className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 inline-flex items-center gap-1 font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Item
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {items.map((it, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={it.name}
                  onChange={(e) => handleUpdateItem(idx, "name", e.target.value)}
                  placeholder="Item description"
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
                <input
                  type="number"
                  value={it.price}
                  onChange={(e) => handleUpdateItem(idx, "price", Number(e.target.value))}
                  placeholder="Price"
                  className="w-24 px-3 py-1.5 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
                <input
                  type="number"
                  min="1"
                  value={it.qty}
                  onChange={(e) => handleUpdateItem(idx, "qty", Number(e.target.value))}
                  placeholder="Qty"
                  className="w-14 px-2 py-1.5 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 text-center"
                />
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="p-1.5 rounded-md text-zinc-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Total Calculation */}
        <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/40 flex items-center justify-between text-xs">
          <div className="flex flex-col gap-0.5 text-zinc-500">
            <span>Subtotal: {formatINR(subtotal)}</span>
            <span>GST (18%): {formatINR(tax)}</span>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-zinc-400 block uppercase font-medium">Total Amount</span>
            <span className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-mono">
              {formatINR(grandTotal)}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleGenerateInvoice}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 transition-colors"
          >
            Create Invoice
          </button>
        </div>
      </div>
    </div>
  )
}

export default CreateInvoiceModal
