# FoodRush - Online Food Booking Platform

FoodRush is a complete end-to-end full-stack online food booking application, supporting real-time order tracking, comprehensive dashboards, and distinct role-based functionality for Customers, Restaurant Admins, Delivery Agents, and Superadmins.

---

## 1. How to Start

The project consists of a Python FastAPI backend and a React (TypeScript) frontend. You can run both locally:

### Database Setup
Ensure you have PostgreSQL running locally on port `5432` with a database created (default expects credentials `postgres:password`). 

### Running the Backend
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Activate your virtual environment (or create one):
   ```bash
   # Windows
   venv\Scripts\activate
   ```
3. Install requirements (if not already installed):
   ```bash
   pip install -r requirements.txt
   ```
4. Run the SQL Migrations to set up your database schema:
   ```bash
   python migrate.py
   ```
5. Start the FastAPI development server:
   ```bash
   python -m uvicorn app.main:app --reload
   ```
   *Note: On startup, the `seed.py` file will automatically populate the database with mock restaurants, items, and a default `superadmin@foodrush.com` account if it's the first run.*

### Running the Frontend
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the React development server:
   ```bash
   npm run dev
   ```
4. The application will be available at `http://localhost:3000`.

---

## 2. Packages Used & Their Purpose

### Backend Packages (`backend/requirements.txt`)
- **FastAPI**: The core web framework used to build the high-performance REST APIs.
- **uvicorn[standard]**: The ASGI web server implementation used to serve the FastAPI application.
- **psycopg2-binary**: The PostgreSQL database adapter for Python, used to execute raw SQL queries securely.
- **pydantic & pydantic-settings**: Used for data validation, typing, and serializing JSON payloads for API requests/responses.
- **PyJWT**: Used to generate and decode JSON Web Tokens (JWT) for secure user authentication.
- **bcrypt**: Used to securely hash user passwords before storing them in the database, and verify them on login.
- **python-multipart**: Required by FastAPI to handle form data processing.
- **python-dotenv**: Used to load environment variables from a `.env` file (like DB credentials and JWT secrets).
- **httpx**: Used for making asynchronous HTTP requests if needed by the backend.

### Frontend Packages (`frontend/package.json`)
- **react / react-dom**: The core UI library used to build the interactive, component-based frontend.
- **react-router-dom**: Used for declarative routing, allowing navigation between pages (e.g., Home, Dashboard, Cart) without refreshing the page.
- **lucide-react**: A beautiful, clean SVG icon library used across the application for visual elements.
- **typescript**: Ensures type safety across the React application, heavily reducing runtime errors.
- **@testing-library/***: A suite of tools to test the DOM and simulate user interactions (default with Create React App).

---

## 3. Role-Based Workflows

The platform is strictly isolated into four distinct roles, ensuring every user type gets a tailored experience:

### 👤 Customer
- **Workflow:** Customers can freely browse restaurants and menus without logging in. To place an order, they are prompted to sign up or log in. 
- **Features:** 
  - Add items to a floating cart.
  - Proceed to checkout and provide a delivery address.
  - Track their order in real-time through an interactive timeline (Placed ➔ Confirmed ➔ Preparing ➔ Ready for Pickup ➔ On the Way ➔ Delivered).

### 👨‍🍳 Restaurant Admin
- **Workflow:** A restaurant admin signs up via the "Restaurant Partner" role. Upon their first login, they are placed in a "Waiting" state until a Superadmin officially creates and assigns a restaurant to their account.
- **Features:**
  - **Isolated Dashboard:** They have an exclusive dashboard (`/dashboard`) that *only* shows data for their specific restaurant.
  - **Order Management:** They can accept incoming orders and push them through the pipeline (`CONFIRMED`, `PREPARING`, `READY_FOR_PICKUP`).
  - **Menu Management:** They can add, edit, or delete items on their restaurant's menu, and instantly toggle item availability.

### 🛵 Delivery Agent
- **Workflow:** A user signs up as a Delivery Agent and instantly gains access to the Delivery Hub. No superadmin approval is required to start accepting deliveries.
- **Features:**
  - **Agent Dashboard:** They are redirected to a customized `/agent-dashboard`.
  - **Broadcast Pool:** They can view all orders across the platform that are marked as `READY_FOR_PICKUP`.
  - **Active Deliveries:** They can "Accept" an order from the pool, physically pick it up (marking it `OUT_FOR_DELIVERY`), and eventually mark it as `DELIVERED`.
  - **Delivery History:** A tab dedicated to viewing their successfully completed past deliveries.

### 👑 Superadmin
- **Workflow:** The ultimate overseer of the platform. The superadmin account is seeded by default (`superadmin@foodrush.com`).
- **Features:**
  - **Global View:** They have access to a platform-wide Dashboard showing aggregated statistics, revenue, and active orders across *all* restaurants.
  - **Partner Management:** They are responsible for onboarding new Restaurant Admins. The superadmin uses the **Manage Partners** tab to find unassigned restaurant partners, input the restaurant details (Name, Cuisine, Address), and officially link the restaurant to that partner.
