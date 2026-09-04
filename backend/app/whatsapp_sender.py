import os
import urllib.parse
import httpx
from typing import Dict, Any
from app.config import settings

async def send_real_whatsapp(
    to_phone: str,
    message: str
) -> Dict[str, Any]:
    """
    Send real WhatsApp message autonomously from the backend.
    
    Providers in priority order:
    1. Green API (Authorized cloud gateway connected to your WhatsApp)
    2. Twilio WhatsApp API
    3. CallMeBot API
    4. Direct wa.me fallback
    """
    # Clean phone number: remove +, spaces, dashes
    clean_phone = "".join(c for c in to_phone if c.isdigit())
    encoded_text = urllib.parse.quote(message)
    direct_link = f"https://wa.me/{clean_phone}?text={encoded_text}"
    
    # Credentials from settings / env
    green_id = settings.GREEN_API_INSTANCE_ID or os.getenv("GREEN_API_INSTANCE_ID", "")
    green_token = settings.GREEN_API_TOKEN or os.getenv("GREEN_API_TOKEN", "")
    twilio_sid = os.getenv("TWILIO_ACCOUNT_SID", "")
    twilio_token = os.getenv("TWILIO_AUTH_TOKEN", "")
    twilio_wa_number = os.getenv("TWILIO_WHATSAPP_NUMBER", "whatsapp:+14155238886")
    callmebot_key = os.getenv("CALLMEBOT_API_KEY", "")

    # 1. Primary: Green API (Direct WhatsApp push)
    if green_id and green_token:
        try:
            url = f"https://api.green-api.com/waInstance{green_id}/sendMessage/{green_token}"
            chat_id = f"{clean_phone}@c.us"
            payload = {
                "chatId": chat_id,
                "message": message
            }
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    msg_id = data.get("idMessage", "")
                    print(f"[WhatsAppSender] OK Real WhatsApp sent via Green API -> +{clean_phone} (id: {msg_id})")
                    return {
                        "sent": True,
                        "provider": "Green API",
                        "messageId": msg_id,
                        "to": f"+{clean_phone}",
                        "directLink": direct_link
                    }
                else:
                    print(f"[WhatsAppSender] Green API error: {resp.status_code} {resp.text}")
        except Exception as e:
            print(f"[WhatsAppSender] Green API exception: {e}")

    # 2. Secondary: Twilio
    if twilio_sid and twilio_token:
        try:
            import base64
            auth_header = base64.b64encode(f"{twilio_sid}:{twilio_token}".encode()).decode()
            url = f"https://api.twilio.com/2010-04-01/Accounts/{twilio_sid}/Messages.json"
            data = {
                "From": twilio_wa_number,
                "To": f"whatsapp:+{clean_phone}",
                "Body": message
            }
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(
                    url,
                    data=data,
                    headers={"Authorization": f"Basic {auth_header}"}
                )
                if resp.status_code in [200, 201]:
                    print(f"[WhatsAppSender] OK Real WhatsApp sent via Twilio -> +{clean_phone}")
                    return {
                        "sent": True,
                        "provider": "Twilio",
                        "to": f"+{clean_phone}",
                        "directLink": direct_link
                    }
                else:
                    print(f"[WhatsAppSender] Twilio error: {resp.status_code} {resp.text}")
        except Exception as e:
            print(f"[WhatsAppSender] Twilio error: {e}")

    # 3. Tertiary: CallMeBot
    if callmebot_key:
        try:
            url = f"https://api.callmebot.com/whatsapp.php?phone={clean_phone}&text={encoded_text}&apikey={callmebot_key}"
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(url)
                if resp.status_code == 200:
                    print(f"[WhatsAppSender] OK Real WhatsApp sent via CallMeBot -> {clean_phone}")
                    return {
                        "sent": True,
                        "provider": "CallMeBot",
                        "to": clean_phone,
                        "directLink": direct_link
                    }
        except Exception as e:
            print(f"[WhatsAppSender] CallMeBot error: {e}")

    # 4. Fallback link
    return {
        "sent": False,
        "provider": "None (Direct Link)",
        "to": clean_phone,
        "directLink": direct_link,
        "message": "Direct link ready for dispatch."
    }
