# FinAI Intelligence 💳🤖
### AI-Powered Personal Finance Management System

An intelligent, full-stack personal finance management web application featuring interactive dashboards, transaction tracking, dynamic chart analytics, and an in-browser Natural Language AI Assistant to help users optimize budgets and monitor financial health.

---

## 🌟 Key Features

- **📊 Comprehensive Financial Dashboard**
  - Real-time calculation of **Total Income**, **Total Expenses**, and **Net Balance**.
  - Dynamic **Savings Rate (%)** and automated **Financial Health Score** (0–100 scale with categorized ratings from Critical to Excellent).
  - Categorized breakdown of spending with intuitive visual badges and percentage indicators.
  - Recent transaction history with fast delete and review capabilities.

- **💸 Transaction Manager**
  - Log income and expense transactions with date, category, amount, and custom descriptions.
  - Category tagging (Food, Housing, Utilities, Transport, Entertainment, Shopping, Salary, Freelance, Investments, etc.).
  - Instant client-side state synchronisation with backend persistence.

- **📈 Visual Analytics & Charts**
  - **Expense by Category Doughnut Chart**: Visually inspect which sectors take the biggest share of your spending.
  - **Monthly Income vs. Expense Bar Chart**: Compare inflow and outflow trends over time.
  - Fully powered by **Chart.js** and **react-chartjs-2**.

- **🧠 Conversational AI Financial Assistant**
  - Ask financial questions in plain English (*"What is my balance?"*, *"Can I afford a ₹5,000 watch?"*, *"Where am I spending the most?"*, *"How can I save more?"*).
  - Context-aware natural language processing that parses your live balance and categories to deliver actionable budgeting tips.
  - One-click prompt suggestions and continuous interactive dialogue.

- **🔐 User Authentication & Protected Home Access**
  - Secure login gating ensures the home dashboard, transactions, charts, and AI assistant are visible **only when the user is logged in**.
  - Built-in **Sign In** and **Create Account** forms with sleek styling, password visibility toggles, and session persistence (`localStorage`).
  - **One-Click Quick Demo Login** button preconfigured with demo credentials for instant evaluation.
  - Header profile widget showing avatar initials, full name, email, and instant **Log Out** button.

- **🛡️ Resilient Dual-Mode Architecture**
  - **Full-Stack Mode**: Connects to the Spring Boot REST API (`/api/auth/*` and `/api/transactions`) backed by an H2 database.
  - **Local/Demo Mode**: If the backend is offline, the frontend automatically switches to the client-side engine with local authentication and sample data so the app remains fully functional without crashing.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite 8, Lucide React, Chart.js, React-Chartjs-2, Axios |
| **Backend** | Java 17+, Spring Boot 3.2.3, Spring Web, Spring Data JPA |
| **Database** | H2 In-Memory Database (zero manual configuration required) |
| **Styling** | Custom Vanilla CSS (Modern dark mode, glassmorphism, responsive grid) |
| **Build Tools** | Apache Maven 3.8+ (Backend), npm / Vite (Frontend) |

---

## 📋 Prerequisites

Before running the application, make sure the following are installed on your machine:

1. **Java Development Kit (JDK 17 or higher)**
   - Verify with:
     ```bash
     java -version
     ```
2. **Apache Maven (3.8 or higher)**
   - Verify with:
     ```bash
     mvn -version
     ```
3. **Node.js (v18 or higher, v20+ recommended) & npm**
   - Verify with:
     ```bash
     node -v
     npm -v
     ```

---

## 🚀 How to Run the Project

You can run the full stack (recommended) or launch the frontend independently.

### Option 1: Full-Stack Mode (Backend + Frontend)

#### Step 1: Start the Spring Boot Backend
Open a terminal in the project root directory and navigate to the `backend` folder:

```bash
cd backend
mvn spring-boot:run
```

- The backend will build and start up on **`http://localhost:8081`**.
- H2 in-memory database will be initialized automatically.
- To access the **H2 Web Console**, open [http://localhost:8081/h2-console](http://localhost:8081/h2-console) in your browser:
  - **JDBC URL:** `jdbc:h2:mem:financedb`
  - **User Name:** `sa`
  - **Password:** *(leave blank)*

#### Step 2: Start the React Frontend
Open a **second** terminal, navigate to the `frontend` folder, install dependencies (if not already installed), and launch the Vite dev server:

```bash
cd frontend
npm install
npm run dev
```

- The frontend will start on **`http://localhost:5173`**.
- Open your browser and navigate to **[http://localhost:5173](http://localhost:5173)**.
- The header will display a green indicator: **`Spring Boot Active`**.

---

### Option 2: Standalone Frontend Mode (Quick Demo)

If you only want to explore the UI and AI assistant features without starting the Java backend:

```bash
cd frontend
npm install
npm run dev
```

- Navigate to **`http://localhost:5173`**.
- The app will automatically detect that the backend is offline and switch to **`Local Engine Active`** mode with sample mock transactions.
- You can freely add transactions, test charts, and converse with the AI assistant.

---

## 📁 Project Structure

```text
ai-finance-system/
├── backend/
│   ├── pom.xml                               # Maven project dependencies & build configuration
│   └── src/
│       ├── main/
│       │   ├── java/com/finance/
│       │   │   ├── FinanceApplication.java   # Spring Boot Main Entrypoint (seeds demo user)
│       │   │   ├── controller/
│       │   │   │   ├── AuthController.java   # Auth endpoints (/api/auth/login, /api/auth/register)
│       │   │   │   └── TransactionController.java  # REST API endpoints (/api/transactions)
│       │   │   ├── model/
│       │   │   │   ├── User.java             # JPA User Entity
│       │   │   │   └── Transaction.java      # JPA Transaction Entity
│       │   │   └── repository/
│       │   │       ├── UserRepository.java   # Spring Data JPA User Repository
│       │   │       └── TransactionRepository.java # Spring Data JPA Transaction Repository
│       │   └── resources/
│       │       └── application.properties    # Server port (8081), H2 DB configs
│       └── test/                             # Unit and integration tests
│
├── frontend/
│   ├── index.html                            # HTML root template
│   ├── package.json                          # NPM dependencies & scripts
│   ├── vite.config.js                        # Vite configuration
│   └── src/
│       ├── main.jsx                          # React application entrypoint
│       ├── App.jsx                           # Primary layout, auth gating & state sync
│       ├── App.css                           # Glassmorphic, dark-mode design system & auth styling
│       ├── components/
│       │   ├── Login.jsx                     # Authentication component (Sign In, Sign Up, Quick Demo)
│       │   ├── Dashboard.jsx                 # Summary metrics, health score & overview
│       │   ├── TransactionManager.jsx        # Transaction form, filterable lists & delete
│       │   ├── Analytics.jsx                 # Chart.js visualizations (Donut & Bar charts)
│       │   └── AiInsights.jsx                # Interactive AI chat interface
│       └── utils/
│           └── aiEngine.js                   # Client-side NLP parser & reasoning algorithms
│
└── README.md                                 # Project documentation & run guide
```

---

## 📡 REST API Reference

The backend exposes the following REST endpoints on `http://localhost:8081`:

### Authentication Endpoints

#### 1. User Login
- **Method:** `POST`
- **Endpoint:** `/api/auth/login`
- **Request Body:**
```json
{
  "email": "alex@finai.io",
  "password": "password123"
}
```
- **Response:** `200 OK` (returns user profile: `{ "id": 1, "name": "Alex Morgan", "email": "alex@finai.io" }`)

#### 2. User Registration
- **Method:** `POST`
- **Endpoint:** `/api/auth/register`
- **Request Body:**
```json
{
  "name": "Alex Morgan",
  "email": "alex@finai.io",
  "password": "password123"
}
```
- **Response:** `201 Created`

---

### Transaction Endpoints

#### 1. Retrieve all transactions
- **Method:** `GET`
- **Endpoint:** `/api/transactions`
- **Response:** `200 OK`
```json
[
  {
    "id": 1,
    "description": "Monthly Tech Salary",
    "amount": 65000.0,
    "category": "Salary",
    "type": "income",
    "date": "2026-10-01"
  }
]
```

#### 2. Create a new transaction
- **Method:** `POST`
- **Endpoint:** `/api/transactions`
- **Request Body:**
```json
{
  "description": "Grocery Supermarket",
  "amount": 3400.0,
  "category": "Food",
  "type": "expense",
  "date": "2026-10-25"
}
```
- **Response:** `200 OK` (returns created transaction with generated `id`)

#### 3. Delete a transaction
- **Method:** `DELETE`
- **Endpoint:** `/api/transactions/{id}`
- **Response:** `200 OK` (or `404 Not Found`)

---

## ⚙️ Ports and Configuration

| Service | Default Port | Configuration Location |
| :--- | :--- | :--- |
| **Backend (Spring Boot)** | `8081` | `backend/src/main/resources/application.properties` |
| **Frontend (Vite Dev Server)** | `5173` | `frontend/vite.config.js` |
| **H2 Database Console** | `8081/h2-console` | `backend/src/main/resources/application.properties` |

> **Note on CORS:** `TransactionController.java` allows origins from `http://localhost:5173`. If you change the Vite frontend port, update the `@CrossOrigin(origins = "http://localhost:PORT")` annotation in `TransactionController.java`.

---

## ❓ Troubleshooting & FAQs

1. **Port 8081 is already in use:**
   - Change `server.port=8081` to another port (e.g., `server.port=8082`) in `backend/src/main/resources/application.properties`.
   - Update `API_URL` in `frontend/src/App.jsx` to match the new port.

2. **Frontend cannot reach backend:**
   - Confirm that the Spring Boot application is running and accessible at `http://localhost:8081/api/transactions`.
   - Even if unreachable, the frontend automatically falls back to **Local Engine Active** mode with demo data so you can continue testing.

3. **H2 In-Memory Database resets on restart:**
   - H2 is configured as an in-memory database (`jdbc:h2:mem:financedb`). Transactions created during a backend session will reset when the backend process restarts. Click **"Populate Demo Data"** in the UI to instantly seed sample records.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
