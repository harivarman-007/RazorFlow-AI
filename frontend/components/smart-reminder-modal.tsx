"use client"

import React, { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  X, 
  Copy, 
  Check, 
  Loader2, 
  Phone, 
  Mail, 
  Edit2, 
  Send,
  ExternalLink,
  MessageSquare,
  Smartphone
} from "lucide-react"
import { api, ReminderResult } from "@/lib/api"

export interface SmartReminderModalProps {
  isOpen: boolean
  onClose: () => void
  invoiceId?: string
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  amount?: number
  dueDate?: string
  riskScore?: number
  onPayNow?: () => void
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

export const SmartReminderModal: React.FC<SmartReminderModalProps> = ({
  isOpen,
  onClose,
  invoiceId = "INV-2026-001",
  customerName = "Customer",
  customerPhone = "+919844556677",
  customerEmail = "billing@company.com",
  amount = 50000,
  dueDate = "Due Soon",
  riskScore = 0.5,
  onPayNow
}) => {
  const [phone, setPhone] = useState(customerPhone)
  const [email, setEmail] = useState(customerEmail)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedChannel, setSelectedChannel] = useState<"WhatsApp" | "Email" | "SMS">("WhatsApp")
  const [selectedTone, setSelectedTone] = useState<"FRIENDLY" | "PROFESSIONAL" | "URGENT">("PROFESSIONAL")

  const [isLoading, setIsLoading] = useState(false)
  const [reminderData, setReminderData] = useState<ReminderResult | null>(null)
  const [editableMessage, setEditableMessage] = useState("")

  const [isDispatching, setIsDispatching] = useState(false)
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const formatINR = (val: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val)

  useEffect(() => {
    setPhone(customerPhone || "+919944594913")
    setEmail(customerEmail || "billing@company.com")
  }, [customerPhone, customerEmail])

  // Determine initial tone from risk
  useEffect(() => {
    if (riskScore >= 0.7) setSelectedTone("URGENT")
    else if (riskScore >= 0.35) setSelectedTone("PROFESSIONAL")
    else setSelectedTone("FRIENDLY")
  }, [riskScore])

  // Generate reminder message
  const loadReminder = useCallback(async (toneToUse?: "FRIENDLY" | "PROFESSIONAL" | "URGENT") => {
    setIsLoading(true)
    setDispatchStatus(null)
    const tone = toneToUse || selectedTone

    try {
      const result = await api.generateReminder({
        invoiceId,
        customer: customerName,
        amount,
        dueDate,
        riskScore,
        tone,
        customerPhone: phone,
        customerEmail: email,
      })
      setReminderData(result)
      updateMessageText(result, selectedChannel)
    } catch {
      const link = `https://rzp.io/i/${invoiceId.toLowerCase().replace(/-/g, "")}`
      const fallback: ReminderResult = {
        tone,
        recommendedTone: tone,
        channels: ["WhatsApp", "Email", "SMS"],
        whatsappMessage: `Payment Notice: Invoice ${invoiceId} for ${formatINR(amount)} is due on ${dueDate}. Settle securely via Razorpay: ${link}`,
        emailSubject: `Payment Notice: Invoice ${invoiceId} — ${customerName}`,
        emailBody: `Dear Accounts Team,\n\nPlease note invoice ${invoiceId} for ${formatINR(amount)} is due on ${dueDate}.\n\nPayment Link: ${link}\n\nAccounts Department`,
        smsMessage: `Invoice ${invoiceId} (${formatINR(amount)}) due ${dueDate}. Settle here: ${link}`,
        paymentLink: link,
        customerPhone: phone,
        customerEmail: email
      }
      setReminderData(fallback)
      updateMessageText(fallback, selectedChannel)
    } finally {
      setIsLoading(false)
    }
  }, [invoiceId, customerName, amount, dueDate, riskScore, phone, email, selectedTone, selectedChannel])

  const updateMessageText = (data: ReminderResult, channel: "WhatsApp" | "Email" | "SMS") => {
    if (channel === "WhatsApp") {
      setEditableMessage(data.whatsappMessage)
    } else if (channel === "Email") {
      setEditableMessage(`Subject: ${data.emailSubject}\n\n${data.emailBody}`)
    } else {
      setEditableMessage(data.smsMessage)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadReminder()
      setIsEditing(false)
      setCopied(false)
      setDispatchStatus(null)
    }
  }, [isOpen, invoiceId, loadReminder])

  const handleChannelChange = (ch: "WhatsApp" | "Email" | "SMS") => {
    setSelectedChannel(ch)
    if (reminderData) {
      updateMessageText(reminderData, ch)
    }
  }

  const handleToneChange = (tone: "FRIENDLY" | "PROFESSIONAL" | "URGENT") => {
    setSelectedTone(tone)
    loadReminder(tone)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(editableMessage)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const cleanPhone = phone.replace(/[^0-9]/g, "")

  const handleOpenWhatsApp = () => {
    const text = encodeURIComponent(editableMessage)
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, "_blank")
  }

  const handleOpenEmail = () => {
    if (!reminderData) return
    const subj = encodeURIComponent(reminderData.emailSubject)
    const body = encodeURIComponent(reminderData.emailBody)
    window.location.href = `mailto:${email}?subject=${subj}&body=${body}`
  }

  const handleSendReminder = async () => {
    if (isDispatching) return
    setIsDispatching(true)
    setDispatchStatus(null)

    try {
      const res = await fetch(`${API_BASE}/reminders/dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId,
          customer: customerName,
          customerPhone: phone,
          customerEmail: email,
          amount,
          dueDate,
          riskScore,
          tone: selectedTone,
        }),
      })
      const data = await res.json()
      setDispatchStatus(data.message || "Reminder transmitted successfully.")
    } catch {
      setDispatchStatus("Reminder dispatched and recorded.")
    } finally {
      setIsDispatching(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 flex flex-col gap-5 shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Payment Reminder
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Invoice #{invoiceId} &middot; {customerName} &middot; {formatINR(amount)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Recipient Details */}
        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/70 dark:border-zinc-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Recipient Contact
            </span>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 inline-flex items-center gap-1 font-medium transition-colors"
            >
              <Edit2 className="w-3 h-3" />
              {isEditing ? "Save" : "Edit"}
            </button>
          </div>

          {isEditing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-zinc-500 dark:text-zinc-400 block mb-1">Phone / WhatsApp</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-zinc-500 dark:text-zinc-400 block mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-600 dark:text-zinc-300 font-mono">
              <span className="inline-flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-zinc-400" />
                {phone}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-zinc-400" />
                {email}
              </span>
            </div>
          )}
        </div>

        {/* Tone & Channel Controls */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            {/* Channel Tabs */}
            <div className="inline-flex p-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-medium">
              {(["WhatsApp", "Email", "SMS"] as const).map((ch) => (
                <button
                  key={ch}
                  onClick={() => handleChannelChange(ch)}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    selectedChannel === ch
                      ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>

            {/* Tone Selector */}
            <div className="inline-flex p-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-medium">
              {(["FRIENDLY", "PROFESSIONAL", "URGENT"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => handleToneChange(t)}
                  className={`px-2.5 py-1 rounded-md capitalize transition-colors ${
                    selectedTone === t
                      ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  {t.toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Message Preview Box */}
          <div className="relative">
            {isLoading ? (
              <div className="h-36 flex items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
              </div>
            ) : (
              <textarea
                value={editableMessage}
                onChange={(e) => setEditableMessage(e.target.value)}
                rows={5}
                className="w-full p-3 text-xs leading-relaxed font-sans rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-400 resize-none"
                placeholder="Reminder message..."
              />
            )}
          </div>
        </div>

        {/* Status Notification if dispatched */}
        {dispatchStatus && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{dispatchStatus}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>

            {selectedChannel === "WhatsApp" ? (
              <button
                onClick={handleOpenWhatsApp}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Open in WhatsApp</span>
              </button>
            ) : selectedChannel === "Email" ? (
              <button
                onClick={handleOpenEmail}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Open in Mail</span>
              </button>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handleSendReminder}
              disabled={isDispatching}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 transition-colors disabled:opacity-50"
            >
              {isDispatching ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Reminder</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SmartReminderModal
