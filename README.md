# Smart Cam Staff Attendance Management System

An advanced, AI-powered Facial Recognition Attendance System designed for managing staff attendance with high accuracy and speed. It features a modern, responsive frontend dashboard built with Next.js and a robust Python FastAPI backend leveraging state-of-the-art face recognition models.

---

## 🌟 Features

*   **Real-Time Face Recognition:** Automatically detects and recognizes faces using the `InsightFace` AI model, logging attendance seamlessly.
*   **Prevent Duplicates:** Smart duplicate detection prevents staff from marking attendance multiple times on the same day.
*   **Staff Directory & Registration:** Admins can easily register new staff members using a webcam, storing their facial biometric embeddings securely in the database.
*   **Comprehensive Dashboard:** Live analytics showing total staff, present/absent counts, attendance rates, and weekly trends using interactive charts.
*   **Detailed Reports:** View historical attendance logs, filter by date or name, and instantly export data to CSV for payroll or HR purposes.
*   **Modern UI/UX:** Premium glassmorphism design built with Tailwind CSS, offering smooth animations and an intuitive user experience.

---

## 🏗️ Technology Stack

**Frontend:**
*   [Next.js 14](https://nextjs.org/) (React Framework)
*   [Tailwind CSS](https://tailwindcss.com/) (Styling)
*   [Recharts](https://recharts.org/) (Data Visualization)
*   [Lucide React](https://lucide.dev/) (Icons)

**Backend:**
*   [FastAPI](https://fastapi.tiangolo.com/) (High-performance web framework)
*   [Python 3](https://www.python.org/)
*   [InsightFace](https://github.com/deepinsight/insightface) & ONNX Runtime (AI Facial Recognition)
*   [SQLAlchemy](https://www.sqlalchemy.org/) (Database ORM)
*   [MySQL](https://www.mysql.com/) (Relational Database)

---

## 🚀 Getting Started

### Prerequisites
Make sure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (v18 or higher)
*   [Python](https://www.python.org/downloads/) (3.10 or higher)
*   [MySQL Server](https://dev.mysql.com/downloads/mysql/)

### 1. Database Setup
1. Open your MySQL shell and create the database:
   ```sql
   CREATE DATABASE attendance_db;
   ```

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd smart-cam/backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # Windows:
   .\venv\Scripts\activate
   # Linux/Mac:
   source venv/bin/activate
   ```
3. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file in the `backend` folder and configure your database credentials:
   ```env
   DATABASE_URL="mysql+pymysql://root:YOUR_PASSWORD@localhost:3306/attendance_db"
   CONFIDENCE_THRESHOLD="0.80"
   HOST="0.0.0.0"
   PORT=8000
   DEBUG="true"
   SECRET_KEY="your-secret-key"
   ```
5. Start the backend server:
   ```bash
   python app.py
   ```
   *Note: On the first run, SQLAlchemy will automatically build the necessary database tables.*

### 3. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the Node dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:3011`.

---

## 🛡️ License

This project is licensed under the MIT License. See the `LICENSE` file in the backend directory for details.
