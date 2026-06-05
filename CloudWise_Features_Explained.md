# CloudWise: Platform Features Deep-Dive

This document provides a detailed breakdown of every major feature within the CloudWise project. For each feature, we explore **Why** it exists, **How** it was built, and provide a clear **Example Use Case**.

---

## 1. Multi-Cloud Provider Ranking Engine (AHP & SAW)

### Why we implemented it:
The core problem CloudWise solves is helping users confidently choose a cloud provider (AWS, Azure, GCP, etc.) based on their specific workload needs, rather than guessing. A banking app prioritizes "Security" and "Reliability", whereas a startup might prioritize "Cost".

### How we implemented it:
We used two mathematical algorithms located in `backend/core/ahp_saw.py`:
1.  **AHP (Analytic Hierarchy Process)**: Takes the sliders the user adjusts on the frontend (1-10 scale for Cost, Latency, Throughput, etc.) and normalizes them into percentage-based weights.
2.  **SAW (Simple Additive Weighting)**: Pulls static metrics from `providersdata.csv`. It identifies "Benefit criteria" (where higher is better, like line throughput) and "Cost criteria" (where lower is better, like latency), normalizes the metrics across all 13 providers, and multiplies them by the AHP weights to generate a final score for every provider.

### Example Use Case:
A user is deploying a video streaming service. They set `Throughput = 10` and `Latency = 10`, keeping `Cost = 3`. The React frontend sends this JSON payload to the `/calculate-ranking` FastAPI endpoint. The engine runs the AHP-SAW math, and returns a sorted list showing that **Google Cloud** and **AWS** mathematically yield the best performance for those specific criteria.

---

## 2. Gemini-Powered Deployment Generator

### Why we implemented it:
Once a user discovers *which* cloud provider is best, they often don't know *how* to deploy their code to it. Cloud platforms have completely different commands, CLIs, and configuration files.

### How we implemented it:
Integrated in `backend/services/gemini_service.py`, we utilize the **Google Gemini AI API**. The user inputs their GitHub repository URL and selects their preferred deployment mode (Docker, CLI, or Infrastructure-as-Code/Terraform). FastAPI sends a carefully crafted prompt (including the chosen provider and mode) to Gemini. Gemini processes the constraints and streams back a perfectly tailored Markdown step-by-step guide and bash/terraform scripts.

### Example Use Case:
The user's AHP ranking says **DigitalOcean** is cheapest. They input their GitHub URL and click "Generate Docker Deployment". The AI pulls context that it's a DigitalOcean target, and generates a formatted Markdown guide instructing the user how to configure a `Dockerfile` and run `doctl apps create --spec config.yaml` directly from their repo.

---

## 3. Context-Aware AI Chatbot (ContextBot)

### Why we implemented it:
Users frequently have nuanced, specific questions about cloud hosting that a static dashboard cannot answer. (e.g., "What is the difference between AWS EC2 and AWS Fargate?"). We needed an interactive way to support developers.

### How we implemented it:
A React component (`ContextBot.jsx`) provides a floating chat interface. When messages are sent, they hit the `/ask-bot` backend endpoint. This uses the Gemini AI model, but we prepend system instructions to act as a "Cloud Architecture Expert". 

### Example Use Case:
A user looks at the dashboard and sees "Alibaba Cloud". They don't know much about it, so they open the ContextBot and type: *"Is Alibaba Cloud safe for European data compliance?"* The bot processes the request via Gemini and instantly replies with an explanation of Alibaba's GDPR compliance regions in Frankfurt.

---

## 4. Cost Forecasting & ML Prediction

### Why we implemented it:
Cloud costs rarely stay static. If a startup grows by 50% in users, their cloud bill doesn't always grow linearly by 50%—it scales differently based on egress bandwidth, database IOPS, and storage scaling. 

### How we implemented it:
Located in `backend/core/ml_predictor.py`, this feature uses a predictive mathematical model. The user provides a "growth percentage" payload. The API parses this and estimates the multiplicative impact on future cloud invoices.

### Example Use Case:
A user is forecasting next year's budget. They use the platform to predict what happens if their traffic increases by 200%. The API calculates that due to economies of scale (or bandwidth penalties), the cost multiplier will be `2.4x`, helping them secure the right budget.

---

## 5. User Authentication & History Tracking

### Why we implemented it:
To make the platform a persistent workspace. Users need to save their historical architectures, track how decisions were made, and revisit past deployment protocols.

### How we implemented it:
We implemented **JWT (JSON Web Tokens)** in `backend/db/auth.py` and used **SQLite** with **SQLAlchemy**. When a user logs in, they receive a JWT. Whenever they click "Save Strategy Report", the React UI sends a request header `Authorization: Bearer <token>`. FastAPI intercepts this, verifies the digital signature, extracts the User ID, and saves the AHP weights and chosen provider to the `History` SQLite table.

### Example Use Case:
A DevOps engineer experiments with 5 different cost algorithms over a week. On Friday, they log into the system, navigate to the `/reports` route, and view a historical table of all 5 runs. They realize the third run generated the perfect AWS configuration and retrieve those saved weights.

---

## 6. Full-Stack Automated Testing (Serenity BDD)

### Why we implemented it:
As the project grows, changing a backend API could break the frontend. We needed a reliable safety net to ensure that core user workflows (like viewing the providers list and loading the homepage) never regress during deployment.

### How we implemented it:
We scaffolded a dedicated `system-tests/` directory running **Serenity/JS**, **WebdriverIO** (Selenium), and **Cucumber**. 
- **Backend APIs** are tested natively via REST HTTP calls (asserting JSON shapes).
- **React UI** is tested via headless Chrome, simulating human clicks and checking the DOM (e.g., verifying `<title>CloudWise</title>`).
- It generates a rich HTML report (`target/site/serenity/index.html`) summarizing test health.

### Example Use Case:
You modify the `main.py` code to add a new API route. Before deploying to your AWS EC2 server, you locally run `npm run test`. Selenium launches a silent Chrome browser, navigates to the React app, verifies it didn't crash, hits the API, and outputs a 100% passing green HTML dashboard, giving you total confidence to push your code.
