# CloudWise UML Diagrams

This document contains several architectural and UML diagrams that describe the structural and behavioral design of the CloudWise platform. These diagrams are written in [Mermaid.js](https://mermaid.js.org/) format, which can be rendered directly by GitHub natively, or viewed in IDEs via Markdown preview extensions.

## 1. System Architecture Diagram

This diagram displays the high-level architecture of your full-stack application and its deployment on AWS EC2.

```mermaid
graph TD
    User([User / Browser])
    
    subgraph "AWS EC2 Instance (Ubuntu)"
        Nginx["Nginx Reverse Proxy\n(Port 80)"]
        
        subgraph "Frontend"
            ReactApp["React Application\n(Static Assets served by Nginx)"]
        end
        
        subgraph "Backend"
            FastAPI["FastAPI App\n(Uvicorn on Port 8000)"]
            SQLite[(SQLite Database\ncloud_platform.db)]
        end
    end
    
    subgraph "External Services"
        GeminiAPI["Google Gemini API"]
        CloudProviders["Cloud Providers CSV Data"]
    end
    
    User <-->|HTTP/HTTPS| Nginx
    Nginx -->|Serves| ReactApp
    Nginx <-->|Proxies /api| FastAPI
    
    FastAPI <-->|SQLAlchemy/ORM| SQLite
    FastAPI <-->|Reads Data| CloudProviders
    FastAPI <-->|AI Processing| GeminiAPI
```

---

## 1.b Detailed System Architecture Diagram

This expanded diagram details the internal components, module interactions, and network boundaries of the tech stack when deployed on AWS EC2.

```mermaid
graph TD
    classDef aws fill:#FF9900,stroke:#232F3E,stroke-width:2px,color:black
    classDef ext fill:#111,stroke:#333,stroke-width:2px,color:white
    classDef front fill:#61DAFB,stroke:#333,stroke-width:2px,color:black
    classDef back fill:#009688,stroke:#333,stroke-width:2px,color:white
    classDef data fill:#336791,stroke:#333,stroke-width:2px,color:white

    User(User Client / Browser) ::: ext
    GeminiAPI[Google Gemini API] ::: ext

    subgraph "AWS EC2 Instance (Ubuntu)"
        Nginx[Nginx Web Server\nReverse Proxy] ::: aws

        subgraph "Frontend (React Single Page App)"
            UI[React Components] ::: front
            State[React State & Context] ::: front
            APIClient[Axios API Client\nAuth Bearer] ::: front
            
            UI --> State --> APIClient
        end

        subgraph "Backend (FastAPI Application)"
            Uvicorn[Uvicorn ASGI Server\nPort: 8000] ::: back
            Main[main.py - Web Router] ::: back
            
            subgraph "Business Logic Modules"
                AHP[ahp_saw.py\nDecision Engine] ::: back
                ML[ml_predictor.py\nForecasting] ::: back
                Services[gemini_service.py\nAI Operations] ::: back
            end
            
            subgraph "Security & ORM"
                Auth[auth.py - JWT Auth] ::: back
                ORM[SQLAlchemy DB Session] ::: back
            end

            Uvicorn --> Main
            Main --> Auth
            Main --> AHP
            Main --> ML
            Main --> Services
            Auth --> ORM
        end

        subgraph "Persistent Storage"
            SQLite[(SQLite Database\ncloud_platform.db)] ::: data
            CSV[(Static Data Source\nprovidersdata.csv)] ::: data
        end
    end

    User -->|HTTP/HTTPS Request| Nginx
    Nginx -->|Serves compiled JS/CSS static assets| UI
    Nginx -->|Proxies /api endpoints| Uvicorn
    APIClient -->|JSON Payload| Nginx
    
    ORM <-->|Read / Write Histories & Users| SQLite
    AHP -->|Read Metrics| CSV
    Services <-->|External SDK Call| GeminiAPI
```

---

## 2. Entity Relationship Diagram (ERD)

Based on your SQLAlchemy models (`db/models.py`), this diagram outlines the schema and relationships of the local database.

```mermaid
erDiagram
    USERS {
        int id PK
        string email UK
        string hashed_password
    }
    
    HISTORY {
        int id PK
        int user_id FK
        datetime timestamp
        string input_weights
        string top_provider_chosen
        string action_taken
    }
    
    USERS ||--o{ HISTORY : "has many"
```

---

## 3. Sequence Diagram (User Login & Workflow)

This sequence diagram illustrates a typical user session, from authenticating to utilizing the core comparison tool.

```mermaid
sequenceDiagram
    actor User
    participant React UI
    participant FastAPI Auth Engine
    participant FastAPI Logic
    participant SQLite DB
    participant Gemini API

    User->>React UI: Enters Email & Password
    React UI->>FastAPI Auth Engine: POST /api/auth/login
    FastAPI Auth Engine->>SQLite DB: Verify Credentials
    SQLite DB-->>FastAPI Auth Engine: Return User Record
    FastAPI Auth Engine-->>React UI: Returns JWT Token
    
    User->>React UI: Adjusts Weights & Requests Comparison
    React UI->>FastAPI Logic: POST /api/compare (with JWT)
    FastAPI Logic->>SQLite DB: Validate JWT Token
    SQLite DB-->>FastAPI Logic: Valid!
    
    FastAPI Logic->>Gemini API: Request AI orchestration analysis
    Gemini API-->>FastAPI Logic: Return Provider Recommendations
    
    FastAPI Logic->>SQLite DB: Save activity to History table
    FastAPI Logic-->>React UI: Return Comparison Results
    React UI-->>User: Display Interactive Charts & Dashboard
```

---

## 4. React Component Hierarchy

This diagram maps out how the React UI components construct the frontend application.

```mermaid
graph TD
    App[App Component / Router]
    
    App --> Auth[AuthPage]
    App --> Dashboard[Dashboard Main Layout]
    
    Dashboard --> Sidebar[Sidebar Navigation]
    Dashboard --> Compare[Compare Engine Dashboard]
    Dashboard --> History[History Page]
    
    Compare --> Inputs[Weight Inputs & Requirements]
    Compare --> Charts[Provider Comparison Charts]
    Compare --> Bot[ContextBot Assistant]
    
    History --> List[Past Recommendations List]
```

---

## 5. Class Diagram (Backend Models)

This diagram visualizes the Pydantic schemas and SQLAlchemy models used in the FastAPI backend.

```mermaid
classDiagram
    class User {
        +Integer id
        +String email
        +String hashed_password
        +List~History~ histories
    }
    class History {
        +Integer id
        +Integer user_id
        +DateTime timestamp
        +String input_weights
        +String top_provider_chosen
        +String action_taken
    }
    class RankingRequest {
        +Float Cost
        +Float Latency
        +Float Throughput
        +Float Reliability
        +Float SecurityScore
        +Float Sustainability
    }
    class DeploymentRequest {
        +String provider_name
        +String mode
        +String github_url
    }
    
    User "1" *-- "many" History : contains
    RankingRequest ..> History : configures
```

---

## 6. Activity Diagram (AHP-SAW Ranking Engine)

This diagram outlines the step-by-step logic when a user requests a provider comparison using the AHP & SAW algorithms.

```mermaid
stateDiagram-v2
    [*] --> ReceiveWeights
    ReceiveWeights --> NormalizeWeights : compute_ahp_weights()
    NormalizeWeights --> FetchProviderData : simulate_real_time_data()
    FetchProviderData --> ApplySAW : apply_saw()
    
    state ApplySAW {
        [*] --> CreateMatrix
        CreateMatrix --> NormalizeMatrix : Cost vs Benefit Criteria
        NormalizeMatrix --> MultiplyWeights
        MultiplyWeights --> CalculateScores
        CalculateScores --> [*]
    }
    
    ApplySAW --> SortResults
    SortResults --> ReturnTop10
    ReturnTop10 --> [*]
```

---

## 7. Component Diagram (Backend Architecture)

This diagram illustrates how the FastAPI backend modules interact with each other.

```mermaid
graph TD
    API[main.py - API Router]
    
    subgraph "Core Logic Layer"
        AHP[core/ahp_saw.py]
        ML[core/ml_predictor.py]
    end
    
    subgraph "Services Layer"
        Gemini[services/gemini_service.py]
    end
    
    subgraph "Database Layer"
        DB[db/database.py]
        Models[db/models.py]
        Auth[db/auth.py]
    end
    
    API --> Auth
    API --> DB
    API --> AHP
    API --> ML
    API --> Gemini
    
    Auth --> Models
    DB --> Models
    AHP --> CSV[(providersdata.csv)]
```

---

## 8. State Diagram (Deployment Mode Flow)

This diagram demonstrates the different states of the Deployment generation process within the backend.

```mermaid
stateDiagram-v2
    [*] --> RequestReceived : POST /generate-deployment
    RequestReceived --> CheckMode
    
    state CheckMode {
        [*] --> IsIAC
        [*] --> IsDocker
        [*] --> IsCLI
    }
    
    CheckMode --> GenerateTerraform : mode == "iac"
    CheckMode --> GenerateDockerfile : mode == "docker"
    CheckMode --> GenerateBash : mode == "cli"
    
    GenerateTerraform --> CallGeminiAPI
    GenerateDockerfile --> CallGeminiAPI
    GenerateBash --> CallGeminiAPI
    
    CallGeminiAPI --> ReturnMarkdown
    ReturnMarkdown --> [*]
```
