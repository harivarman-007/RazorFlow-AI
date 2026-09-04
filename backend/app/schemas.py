from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field, ConfigDict, model_validator

class InvoiceItem(BaseModel):
    """Flexible item schema accepting frontend field aliases."""
    description: Optional[str] = None
    name: Optional[str] = None
    quantity: Optional[int] = None
    qty: Optional[int] = None
    rate: Optional[float] = None
    price: Optional[float] = None
    amount: Optional[float] = None

    @model_validator(mode="after")
    def normalize_fields(self) -> "InvoiceItem":
        # Normalize name -> description
        if not self.description and self.name:
            self.description = self.name
        if not self.description:
            self.description = "Service Item"
        # Normalize qty -> quantity
        if not self.quantity and self.qty:
            self.quantity = self.qty
        if not self.quantity:
            self.quantity = 1
        # Normalize price -> rate
        if not self.rate and self.price:
            self.rate = self.price
        if not self.rate:
            self.rate = self.amount or 0.0
        # Ensure amount exists
        if not self.amount:
            self.amount = self.rate * (self.quantity or 1)
        return self

class InvoiceCreate(BaseModel):
    customer: str = Field(..., min_length=2, max_length=255)
    customerEmail: Optional[str] = None
    customerPhone: Optional[str] = None
    industry: str = Field(default="Technology", max_length=128)
    amount: float = Field(..., gt=0)
    dueDate: str
    issueDate: Optional[str] = None
    items: List[InvoiceItem] = Field(default_factory=list)

class InvoiceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    customer: str
    customerEmail: Optional[str] = Field(default=None, alias="customer_email")
    customerPhone: Optional[str] = Field(default=None, alias="customer_phone")
    industry: str
    amount: float
    issueDate: str = Field(alias="issue_date")
    dueDate: str = Field(alias="due_date")
    status: str
    dueStatus: str = Field(alias="due_status")
    riskScore: float = Field(alias="risk_score")
    riskCategory: str = Field(alias="risk_category")
    items: List[Dict[str, Any]] = Field(default_factory=list)

class RiskPredictionRequest(BaseModel):
    customer: str
    industry: str
    amount: float
    dueDate: Optional[str] = None
    pastDelayDays: Optional[int] = 0

class RiskPredictionResponse(BaseModel):
    score: float
    category: str
    confidence: float
    factors: List[str]

class ReminderGenerateRequest(BaseModel):
    invoiceId: str
    customer: str
    customerPhone: Optional[str] = None
    customerEmail: Optional[str] = None
    amount: float
    dueDate: str
    riskScore: float
    tone: Optional[str] = None  # "FRIENDLY", "PROFESSIONAL", "URGENT", "LEGAL"

class ReminderGenerateResponse(BaseModel):
    tone: str
    recommendedTone: str
    channels: List[str]
    whatsappMessage: str
    emailSubject: str
    emailBody: str
    smsMessage: str
    paymentLink: str
    customerPhone: Optional[str] = None
    customerEmail: Optional[str] = None
    poweredBy: Optional[str] = "Gemini 2.5 Flash"
    aiReasoning: Optional[str] = None

class CreateOrderRequest(BaseModel):
    invoiceId: str
    amount: float
    customerName: str

class CreateOrderResponse(BaseModel):
    orderId: str
    amount: float
    currency: str
    keyId: str
    upiIntent: str
    qrPayload: str

class VerifyPaymentRequest(BaseModel):
    invoiceId: str
    orderId: str
    paymentId: str
    signature: str

class VerifyPaymentResponse(BaseModel):
    success: bool
    invoiceId: str
    paymentId: str
    status: str
    message: str
    paidAt: str

class BIQueryRequest(BaseModel):
    query: str

class BIQueryResponse(BaseModel):
    text: str
    data: Optional[Dict[str, Any]] = None
    timestamp: str

class CadenceStage(BaseModel):
    id: str
    label: str
    days: str
    action: str
    channel: str
    invoices: List[Dict[str, Any]]

class ForecastMetrics(BaseModel):
    totalReceivables: float
    inflow30Days: float
    inflow60Days: float
    inflow90Days: float
    atRiskAmount: float
    confidenceScore: float
    breakdown: List[Dict[str, Any]]
