# IsaacPOS — Modern Grocery & Retail POS System

An enterprise-grade Point of Sale (POS) and Inventory Management workspace designed for Philippine retail standards, multi-role staff access, and high-readability touch checkout.

**Created by**: [iZaac03](https://github.com/iZaac03) (Isaac Daumar — Isaac Daumar Prime)

---

## Features
- **Touch-Friendly POS Register**: Fast barcode scanning (camera & hardware scanner), split payments (Cash, GCash, Maya, Card), and real-time VAT math.
- **Philippine BIR Compliance**: 12% VAT calculations, Senior Citizen & PWD discounts (RA 9994), and thermal receipts.
- **Role-Based Security**: Admin, Manager (PIN authentication), and Cashier roles with supervisor authorization for overrides and refunds.
- **Staff Management**: Admin controls to register, configure permissions, and terminate/reactivate cashiers and managers with automatic session invalidation.
- **Real-Time Inventory & Stock Alerts**: Low-stock warnings, purchase order creation, and stock movement audit ledgers.

---

## Tech Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite, Lucide Icons, Recharts
- **Backend**: Laravel 11, Sanctum API Tokens, MySQL
- **Tooling**: HTML5 QR/Barcode Scanner, JsBarcode
