import os
import json
import re
from typing import Dict, Any, Optional
import httpx
from app.config import settings

class ReminderAgent:
    """Agent 3: Autonomous Tone-Adaptive Multi-Channel Recovery Engine powered by Google Gemini."""

    @classmethod
    def recommend_tone(cls, risk_score: float, is_overdue: bool) -> str:
        """Select optimal psychological tone based on debtor risk profile."""
        if risk_score >= 0.70 or is_overdue:
            return "URGENT"
        elif risk_score >= 0.35:
            return "PROFESSIONAL"
        return "FRIENDLY"

    @classmethod
    async def generate_copy(
        cls,
        invoice_id: str,
        customer: str,
        amount: float,
        due_date: str,
        risk_score: float,
        tone: Optional[str] = None,
        customer_phone: Optional[str] = None,
        customer_email: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Generate tailored WhatsApp, Email, and SMS reminders with Razorpay UPI links.
        Uses live Google Gemini 2.5 Flash if GEMINI_API_KEY is present, with heuristic fallback.
        """
        is_overdue = "overdue" in invoice_id.lower() or risk_score >= 0.70
        recommended_tone = cls.recommend_tone(risk_score, is_overdue)
        selected_tone = (tone or recommended_tone).upper()

        fmt_amount = f"₹{int(amount):,}"
        payment_link = f"https://rzp.io/i/{invoice_id.lower().replace('-', '')}"
        clean_phone = (customer_phone or "+919876543210").strip()
        clean_email = (customer_email or f"billing@{customer.lower().replace(' ', '')}.com").strip()

        # 1. Attempt Live Gemini LLM Generation
        gemini_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")
        if gemini_key:
            try:
                ai_result = await cls._generate_with_gemini(
                    api_key=gemini_key,
                    invoice_id=invoice_id,
                    customer=customer,
                    amount=fmt_amount,
                    due_date=due_date,
                    risk_score=risk_score,
                    tone=selected_tone,
                    payment_link=payment_link,
                    customer_phone=clean_phone,
                    customer_email=clean_email,
                )
                if ai_result:
                    return {
                        "tone": selected_tone,
                        "recommendedTone": recommended_tone,
                        "channels": ["WhatsApp", "Email", "SMS"],
                        "whatsappMessage": ai_result["whatsappMessage"],
                        "emailSubject": ai_result["emailSubject"],
                        "emailBody": ai_result["emailBody"],
                        "smsMessage": ai_result["smsMessage"],
                        "paymentLink": payment_link,
                        "customerPhone": clean_phone,
                        "customerEmail": clean_email,
                        "poweredBy": "Google Gemini 2.5 Flash",
                        "aiReasoning": ai_result.get("aiReasoning", f"Calibrated for {selected_tone} tone given {int(risk_score * 100)}% risk score.")
                    }
            except Exception as err:
                print(f"[ReminderAgent] Gemini API call error: {err}. Using heuristic fallback.")

        # 2. Heuristic Rule-Based Fallback
        fallback = cls._generate_heuristic_copy(
            invoice_id=invoice_id,
            customer=customer,
            fmt_amount=fmt_amount,
            due_date=due_date,
            selected_tone=selected_tone,
            payment_link=payment_link
        )
        fallback.update({
            "tone": selected_tone,
            "recommendedTone": recommended_tone,
            "channels": ["WhatsApp", "Email", "SMS"],
            "paymentLink": payment_link,
            "customerPhone": clean_phone,
            "customerEmail": clean_email,
            "poweredBy": "Heuristic Rule Engine (Fallback)",
            "aiReasoning": f"Rule-based deterministic copy generated for {selected_tone} tier ({int(risk_score * 100)}% risk)."
        })
        return fallback

    @classmethod
    async def _generate_with_gemini(
        cls,
        api_key: str,
        invoice_id: str,
        customer: str,
        amount: str,
        due_date: str,
        risk_score: float,
        tone: str,
        payment_link: str,
        customer_phone: str,
        customer_email: str,
    ) -> Optional[Dict[str, Any]]:
        """Call Google Gemini 2.5 Flash API with JSON response instruction."""
        endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"

        prompt = f"""
You are the autonomous Accounts Receivable Debt Recovery AI for RazorFlow AI.
Generate persuasive, tone-calibrated debt collection copy across 3 channels for this enterprise debtor.

DEBTOR DETAILS:
- Customer / Company Name: {customer}
- Recipient Contact: Phone: {customer_phone} | Email: {customer_email}
- Invoice ID: {invoice_id}
- Outstanding Amount: {amount}
- Due Date: {due_date}
- Delinquency Risk Score: {risk_score:.2f} (0.00 = low risk, 1.00 = extreme risk)
- Target Tone: {tone} (FRIENDLY, PROFESSIONAL, URGENT, or LEGAL)
- Instant Settlement Razorpay Link: {payment_link}

INSTRUCTIONS:
1. "whatsappMessage": Format for WhatsApp. Professional business tone, no emojis, bold key items with *asterisks*, specify the company and amount, and provide the payment link. Keep concise.
2. "emailSubject": Formal subject line matching the {tone} tone.
3. "emailBody": Well-structured professional email body with formal salutation, payment details, payment link, and formal sign-off.
4. "smsMessage": Concise SMS under 160 characters containing invoice ID, amount, and payment link.
5. "aiReasoning": 1 concise sentence explaining the collection strategy.

Return ONLY a valid raw JSON object with these exact keys:
{{
  "whatsappMessage": "...",
  "emailSubject": "...",
  "emailBody": "...",
  "smsMessage": "...",
  "aiReasoning": "..."
}}
Do NOT wrap in markdown backticks. Return valid JSON only.
"""

        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.4,
                "responseMimeType": "application/json"
            }
        }

        async with httpx.AsyncClient(timeout=25.0) as client:
            resp = await client.post(endpoint, json=payload)
            if resp.status_code != 200:
                print(f"[ReminderAgent] Gemini HTTP {resp.status_code}: {resp.text[:300]}")
                return None

            data = resp.json()
            candidates = data.get("candidates", [])
            if not candidates:
                return None

            raw_text = candidates[0]["content"]["parts"][0]["text"].strip()
            clean_json = re.sub(r"^```json\s*", "", raw_text)
            clean_json = re.sub(r"\s*```$", "", clean_json).strip()

            parsed = json.loads(clean_json)
            return parsed

    @classmethod
    def _generate_heuristic_copy(
        cls,
        invoice_id: str,
        customer: str,
        fmt_amount: str,
        due_date: str,
        selected_tone: str,
        payment_link: str
    ) -> Dict[str, Any]:
        """Fallback deterministic copy generator without emojis or informal language."""
        if selected_tone == "FRIENDLY":
            subject = f"Payment Reminder: Invoice {invoice_id} for {customer}"
            wa = (
                f"Hello {customer},\n\n"
                f"This is a reminder that invoice *{invoice_id}* ({fmt_amount}) is due on {due_date}.\n\n"
                f"You can settle online via Razorpay: {payment_link}\n\n"
                f"Thank you."
            )
            email_body = (
                f"Dear Accounts Team at {customer},\n\n"
                f"This is a reminder regarding invoice {invoice_id} ({fmt_amount}) due on {due_date}.\n\n"
                f"Payment can be completed via our secure portal:\n{payment_link}\n\n"
                f"Sincerely,\nFinance & Accounts"
            )
            sms = f"Reminder: Invoice {invoice_id} ({fmt_amount}) due {due_date}. Settle here: {payment_link}"

        elif selected_tone == "PROFESSIONAL":
            subject = f"Payment Due Notice: Invoice {invoice_id} ({fmt_amount}) - {customer}"
            wa = (
                f"Dear {customer} Accounts Team,\n\n"
                f"Invoice *{invoice_id}* for *{fmt_amount}* is scheduled for payment by *{due_date}*.\n\n"
                f"Direct payment gateway: {payment_link}\n\n"
                f"Thank you for your prompt attention."
            )
            email_body = (
                f"Dear {customer} Accounts Payable,\n\n"
                f"Please be advised that payment for invoice {invoice_id} ({fmt_amount}) is due by {due_date}.\n\n"
                f"Invoice: {invoice_id}\n"
                f"Amount: {fmt_amount}\n"
                f"Due Date: {due_date}\n\n"
                f"Payment Link: {payment_link}\n\n"
                f"Regards,\nAccounts Receivable Team"
            )
            sms = f"Payment notice: Invoice {invoice_id} ({fmt_amount}) due {due_date}. Pay via Razorpay: {payment_link}"

        elif selected_tone == "LEGAL":
            subject = f"DEMAND NOTICE: Overdue Invoice {invoice_id} - {customer}"
            wa = (
                f"DEMAND NOTICE: {invoice_id}\n\n"
                f"To {customer} Management:\n"
                f"Your balance of {fmt_amount} is severely overdue. Please complete settlement immediately.\n\n"
                f"Direct Clearance Link: {payment_link}"
            )
            email_body = (
                f"FORMAL NOTICE OF DEFAULT\n\n"
                f"To: Management & Finance, {customer}\n"
                f"RE: Outstanding Balance for Invoice {invoice_id} ({fmt_amount})\n\n"
                f"This serves as formal notice that invoice {invoice_id} is past due. "
                f"Please remit payment immediately via the link below:\n\n"
                f"{payment_link}\n\n"
                f"Accounts & Collections Department"
            )
            sms = f"FORMAL NOTICE: Invoice {invoice_id} ({fmt_amount}) is overdue. Settle: {payment_link}"

        else:  # URGENT
            subject = f"URGENT: Overdue Balance for Invoice {invoice_id} ({fmt_amount})"
            wa = (
                f"URGENT PAYMENT NOTICE: {customer}\n\n"
                f"Invoice *{invoice_id}* for *{fmt_amount}* is now overdue.\n\n"
                f"Please process payment today to avoid service hold: {payment_link}"
            )
            email_body = (
                f"URGENT ATTENTION REQUIRED\n\n"
                f"Dear {customer} Finance,\n\n"
                f"Invoice {invoice_id} for {fmt_amount} is currently past due. "
                f"Please complete settlement to maintain active account status:\n\n"
                f"{payment_link}\n\n"
                f"Collections Department"
            )
            sms = f"URGENT: Invoice {invoice_id} ({fmt_amount}) is overdue. Pay now: {payment_link}"

        return {
            "whatsappMessage": wa,
            "emailSubject": subject,
            "emailBody": email_body,
            "smsMessage": sms
        }
