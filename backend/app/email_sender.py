import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional
from app.config import settings


def send_real_email(
    to_email: str,
    subject: str,
    body_text: str,
    body_html: Optional[str] = None
) -> dict:
    """
    Send a real email via Gmail SMTP using app password authentication.
    Returns a dict with status and details.
    """
    sender = settings.GMAIL_SENDER
    password = settings.GMAIL_APP_PASSWORD

    if not sender or not password:
        return {
            "sent": False,
            "error": "Gmail credentials not configured (GMAIL_SENDER / GMAIL_APP_PASSWORD missing in .env)"
        }

    # Build MIME message
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"RazorFlow AI Collections <{sender}>"
    msg["To"] = to_email

    # Plain text part
    msg.attach(MIMEText(body_text, "plain", "utf-8"))

    # HTML part (if provided)
    if body_html:
        msg.attach(MIMEText(body_html, "html", "utf-8"))

    try:
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context, timeout=8.0) as server:
            server.login(sender, password)
            server.sendmail(sender, to_email, msg.as_string())
        print(f"[EmailSender] OK Real email sent -> {to_email} | Subject: {subject}")
        return {
            "sent": True,
            "to": to_email,
            "from": sender,
            "subject": subject
        }
    except smtplib.SMTPAuthenticationError as e:
        print(f"[EmailSender] FAIL Auth failed: {e}")
        return {"sent": False, "error": f"Gmail auth failed: {e}"}
    except Exception as e:
        print(f"[EmailSender] FAIL Send failed: {e}")
        return {"sent": False, "error": str(e)}


def build_html_email(
    customer: str,
    invoice_id: str,
    amount: str,
    due_date: str,
    tone: str,
    payment_link: str,
    body_text: str
) -> str:
    """Build a styled HTML email body for debt recovery."""
    tone_colors = {
        "FRIENDLY": "#10b981",
        "PROFESSIONAL": "#3b82f6",
        "URGENT": "#f59e0b",
        "LEGAL": "#ef4444",
    }
    accent = tone_colors.get(tone.upper(), "#6366f1")

    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Reminder — RazorFlow AI</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#18181b;padding:24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="color:#ffffff;font-size:18px;font-weight:600;letter-spacing:-0.3px;">RazorFlow</span>
                  </td>
                  <td align="right">
                    <span style="color:#a1a1aa;font-size:12px;font-weight:500;letter-spacing:0.5px;text-transform:uppercase;">Payment Notice</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 20px;font-size:14px;color:#27272a;line-height:1.6;white-space:pre-line;">{body_text}</p>

              <!-- Invoice Details Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border:1px solid #e4e4e7;border-radius:8px;margin:20px 0;">
                <tr>
                  <td style="padding:16px 20px;">
                    <table width="100%" cellpadding="5" cellspacing="0">
                      <tr>
                        <td style="font-size:12px;color:#71717a;">Invoice</td>
                        <td style="font-size:12px;color:#18181b;font-weight:600;text-align:right;">#{invoice_id}</td>
                      </tr>
                      <tr>
                        <td style="font-size:12px;color:#71717a;">Customer</td>
                        <td style="font-size:12px;color:#18181b;text-align:right;">{customer}</td>
                      </tr>
                      <tr>
                        <td style="font-size:12px;color:#71717a;">Amount</td>
                        <td style="font-size:14px;color:#18181b;font-weight:600;text-align:right;">{amount}</td>
                      </tr>
                      <tr>
                        <td style="font-size:12px;color:#71717a;">Due Date</td>
                        <td style="font-size:12px;color:#18181b;text-align:right;">{due_date}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 20px;">
                    <a href="{payment_link}" style="display:inline-block;background:#18181b;color:#ffffff;font-size:13px;font-weight:600;padding:12px 28px;border-radius:6px;text-decoration:none;">
                      Pay Online via Razorpay
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:11px;color:#71717a;text-align:center;">
                If you have already processed this payment, please disregard this notice.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#fafafa;border-top:1px solid #e4e4e7;padding:14px 32px;">
              <p style="margin:0;font-size:11px;color:#71717a;text-align:center;">
                RazorFlow Financial &middot; Accounts Department
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""
