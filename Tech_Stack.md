# CloudWise Technology Stack

This document breaks down the technologies used in the **CloudWise** project, categorized by their architectural role.

## 1. Frontend Technologies (User Interface)

*   **React.js (SPA)**: The core library used to build the interactive Single Page Application. It handles dynamic state changes (like weight adjustments and live rankings) without reloading the page.
*   **Vite**: The build tool and development server used to bundle your React application. Vite provides extremely fast Hot Module Replacement (HMR) and optimized production builds.
*   **React Router DOM**: Manages client-side navigation between different views (e.g., Dashboard, Login, History) ensuring a seamless user experience.
*   **Axios**: The HTTP client used to perform asynchronous API requests (GET, POST) to your FastAPI backend and automatically attach your JWT Authorization headers.
*   **Charting Libraries (Recharts/Chart.js)**: Utilized within the components to visually render complex AHP-SAW ranking outputs via radar and bar charts.

## 2. Backend Technologies (Server & Business Logic)

*   **FastAPI**: A high-performance Python web framework used to expose all REST APIs. It was chosen for its async support, rapid execution speed, and automatic Swagger/OpenAPI documentation.
*   **Uvicorn (ASGI)**: The Asynchronous Server Gateway Interface running underneath FastAPI. It handles the raw incoming network socket connections.
*   **Pydantic**: Integrated closely with FastAPI to validate incoming JSON payloads (e.g., `RankingRequest`, `DeploymentRequest`). It ensures type safety before any logic is processed.
*   **Custom Python Algorithms**:
    *   **AHP (Analytic Hierarchy Process)**: Normalizes and structures human criteria preferences (Cost vs. Latency vs. Throughput).
    *   **SAW (Simple Additive Weighting)**: Computes the actual normalized mathematical scores against live cloud metrics.
    *   **ML Predictor**: A module intended for forecasting and stochastic simulations of cloud costs behavior.

## 3. Database & Storage Layer

*   **SQLite (`cloud_platform.db`)**: A lightweight, disk-based relational database. Used primarily for transactional data—such as creating user credentials and securely logging their past platform activities and calculated histories.
*   **SQLAlchemy (ORM)**: The Object-Relational Mapper that forms the bridge between Python logic (`models.py`) and SQLite, allowing you to run queries via Python methods instead of string SQL queries.
*   **Static CSV / NumPy**: Real-time cloud metrics and fallback baselines (`providersdata.csv`) are ingested locally rather than using a rigid relational database, keeping the mathematical operations fast.

## 4. Authentication & Security

*   **JWT (JSON Web Tokens)**: Used for stateless API authentication. Once a user logs in, the backend issues a signed JWT which the React frontend stores and sends on subsequent protected requests.
*   **Passlib / Bcrypt**: Cryptographic libraries used to securely hash and salt user passwords in the backend before storing them in the SQLite database.

## 5. AI & Large Language Model (LLM) Integration

*   **Google Gemini AI API**: The driving force behind the platform's orchestration capabilities. It is tightly integrated into the backend `gemini_service.py` to:
    *   Understand user chat context inside the `ContextBot`.
    *   Compare two cloud providers intelligently based on RAW mathematical data.
    *   Dynamically generate configuration instructions and **IaC** (Infrastructure as Code) like Terraform or Dockerfiles based on a user's GitHub URL and their chosen winning provider.

## 6. Cloud & DevOps (Deployment Architecture)

*   **Amazon Web Services (AWS EC2)**: The remote Ubuntu Linux virtual server hosting the entire application stack.
*   **Nginx**: Replaces Vite's development server in production. It safely serves compiled HTML/JS/CSS assets to browsers on Port 80 and simultaneously acts as a **Reverse Proxy**, securely forwarding `/api/` traffic to the running Uvicorn server on Port 8000.
*   **Bash Scripting**: Heavy usage of local `.sh` scripts (e.g., `deploy-aws.sh`, `ShowData.sh`) designed to automate server setup, data clearing, and deployment pipelines.
