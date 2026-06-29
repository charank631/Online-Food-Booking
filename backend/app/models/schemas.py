"""
All Pydantic v2 request/response schemas for the FoodRush API.
"""
from __future__ import annotations
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field
from enum import Enum


# ════════════════════════ ENUMS ════════════════════════
class UserRole(str, Enum):
    customer          = "customer"
    restaurant_admin  = "restaurant_admin"
    delivery_agent    = "delivery_agent"
    superadmin        = "superadmin"

class OrderStatus(str, Enum):
    PLACED            = "PLACED"
    CONFIRMED         = "CONFIRMED"
    PREPARING         = "PREPARING"
    READY_FOR_PICKUP  = "READY_FOR_PICKUP"
    OUT_FOR_DELIVERY  = "OUT_FOR_DELIVERY"
    DELIVERED         = "DELIVERED"
    CANCELLED         = "CANCELLED"

class PaymentMethod(str, Enum):
    CARD   = "CARD"
    UPI    = "UPI"
    CASH   = "CASH"
    WALLET = "WALLET"

class PaymentStatus(str, Enum):
    PENDING  = "PENDING"
    PAID     = "PAID"
    FAILED   = "FAILED"
    REFUNDED = "REFUNDED"


# ════════════════════════ AUTH ════════════════════════
class RegisterRequest(BaseModel):
    name:     str          = Field(..., min_length=2, max_length=100)
    email:    EmailStr
    phone:    Optional[str] = None
    password: str          = Field(..., min_length=6)
    role:     UserRole     = UserRole.customer
    address:  Optional[str] = None

class LoginRequest(BaseModel):
    email:    EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    user:         "UserResponse"

class UserResponse(BaseModel):
    id:         str
    name:       str
    email:      str
    phone:      Optional[str]
    role:       UserRole
    address:    Optional[str]
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


# ════════════════════════ RESTAURANTS ════════════════════════
class RestaurantCreate(BaseModel):
    name:      str = Field(..., min_length=2, max_length=150)
    cuisine:   str
    address:   str
    phone:     Optional[str] = None
    image_url: Optional[str] = None

class AdminRestaurantCreate(RestaurantCreate):
    owner_id: str

class RestaurantUpdate(BaseModel):
    name:      Optional[str] = None
    cuisine:   Optional[str] = None
    address:   Optional[str] = None
    phone:     Optional[str] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None

class RestaurantResponse(BaseModel):
    id:         str
    owner_id:   Optional[str]
    name:       str
    cuisine:    str
    address:    str
    phone:      Optional[str]
    image_url:  Optional[str]
    rating:     float
    is_active:  bool
    created_at: Optional[datetime]


# ════════════════════════ MENU ════════════════════════
class MenuItemCreate(BaseModel):
    name:         str   = Field(..., min_length=2, max_length=150)
    description:  Optional[str] = None
    category:     str
    price:        float = Field(..., gt=0)
    is_veg:       bool  = True
    is_available: bool  = True
    image_url:    Optional[str] = None

class MenuItemUpdate(BaseModel):
    name:         Optional[str]   = None
    description:  Optional[str]   = None
    category:     Optional[str]   = None
    price:        Optional[float] = Field(None, gt=0)
    is_veg:       Optional[bool]  = None
    is_available: Optional[bool]  = None
    image_url:    Optional[str]   = None

class MenuItemResponse(BaseModel):
    id:            str
    restaurant_id: str
    name:          str
    description:   Optional[str]
    category:      str
    price:         float
    is_veg:        bool
    is_available:  bool
    image_url:     Optional[str]
    created_at:    Optional[datetime]


# ════════════════════════ ORDERS ════════════════════════
class OrderItemRequest(BaseModel):
    menu_item_id: str
    quantity:     int = Field(..., ge=1)

class OrderCreate(BaseModel):
    restaurant_id:    str
    items:            List[OrderItemRequest] = Field(..., min_length=1)
    delivery_address: str
    special_notes:    Optional[str] = None
    payment_method:   PaymentMethod = PaymentMethod.CARD

class OrderItemResponse(BaseModel):
    id:           str
    menu_item_id: Optional[str]
    name:         str
    quantity:     int
    unit_price:   float
    subtotal:     float

class PaymentResponse(BaseModel):
    id:             str
    amount:         float
    method:         PaymentMethod
    status:         PaymentStatus
    transaction_id: Optional[str]
    paid_at:        Optional[datetime]

class OrderResponse(BaseModel):
    id:                str
    customer_id:       str
    restaurant_id:     str
    delivery_agent_id: Optional[str]
    status:            OrderStatus
    total_amount:      float
    delivery_address:  str
    special_notes:     Optional[str]
    created_at:        Optional[datetime]
    updated_at:        Optional[datetime]
    items:             List[OrderItemResponse] = []
    payment:           Optional[PaymentResponse] = None

class OrderStatusUpdate(BaseModel):
    status: OrderStatus

class AssignAgentRequest(BaseModel):
    delivery_agent_id: str


# ════════════════════════ PAYMENT ════════════════════════
class PaymentInitRequest(BaseModel):
    order_id: str
    method:   PaymentMethod


# ════════════════════════ DASHBOARD ════════════════════════
class DashboardStats(BaseModel):
    total_orders:    int
    total_revenue:   float
    pending_orders:  int
    delivered_orders: int
    total_customers: int
    recent_orders:   List[OrderResponse] = []
