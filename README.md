# SmartMart - Supermarket & Grocery Web Application

A full-stack supermarket and grocery management web application featuring customer shopping, online checkout, live order tracking, and an administrative management dashboard.

## Project Structure

```
smartmart/
│
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI REST endpoints (v1)
│   │   ├── models/       # SQLAlchemy database models
│   │   ├── schemas/      # Pydantic data validation models
│   │   ├── services/     # Business logic & checkout transactions
│   │   ├── core/         # Database engine, security, JWT, config
│   │   └── main.py       # FastAPI application entrypoint
│   │
│   ├── tests/            # Pytest test suite
│   ├── requirements.txt  # Python package dependencies
│   ├── .env              # Local environment variables
│   └── .env.example      # Example environment configuration
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/     # Auth, guards, interceptors, models, services
│   │   │   ├── shared/   # Reusable UI components (navbar, logo)
│   │   │   ├── auth/     # Login & registration
│   │   │   ├── customer/ # Catalog, product details, cart, checkout, orders
│   │   │   └── admin/    # Dashboard, products, categories, orders, reports
│   │   ├── assets/       # Brand icons and vector assets
│   │   └── styles/       # Global SCSS stylesheet and theme variables
│   │
│   ├── public/           # Static web assets
│   ├── package.json      # NPM dependencies & scripts
│   └── angular.json      # Angular CLI workspace configuration
│
├── README.md
└── .gitignore
```

## Tech Stack

- **Backend**: Python 3.12+, FastAPI, SQLAlchemy, PostgreSQL / SQLite fallback, Pydantic v2
- **Frontend**: Angular 19+ (Standalone Components), TypeScript, Angular Material, SCSS

## Getting Started

### Backend Setup

1. Open a terminal in the `backend/` directory:
   ```bash
   cd backend
   ```
2. Activate the virtual environment:
   ```bash
   .\venv\Scripts\activate   # Windows
   # or source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure `.env` with your PostgreSQL database credentials.
5. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

### Frontend Setup

1. Open a terminal in the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Angular development server:
   ```bash
   npm start
   # or ng serve
   ```
4. Access the web application at `http://localhost:4200/`.

## Key Features

- **Customer Storefront**: Browse categories, search products, add to wishlist, cart management, checkout with simulated payments.
- **My Orders & Receipts**: Itemized order receipts with product thumbnails and pricing breakdowns.
- **Live Order Tracking**: Visual progress flow for supermarket fulfillment from confirmation to delivery/pickup.
- **Admin Portal**: Inventory management, product/category catalog management, and order status workflow controls.
