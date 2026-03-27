from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import json
import asyncio

from db import models, database, auth
from core import ahp_saw, ml_predictor
from services import gemini_service

# Initialize DB
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Cloud Composition Platform API")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic Schemas

class UserCreate(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class RankingRequest(BaseModel):
    Cost: float
    Latency: float
    Throughput: float
    Reliability: float
    SecurityScore: float
    Sustainability: float
    
class DeploymentRequest(BaseModel):
    provider_name: str
    mode: str = "cli" # "cli", "docker", "iac"
    github_url: Optional[str] = None
    
class BotRequest(BaseModel):
    text: str

class WeightPredictionRequest(BaseModel):
    workload: str

class CostForecastRequest(BaseModel):
    growth_percent: float

class ExecutiveSummaryRequest(BaseModel):
    p1: dict
    p2: dict
    p3: dict

class ReportSaveRequest(BaseModel):
    input_weights: dict
    top_provider_chosen: str

class ReverseSolverRequest(BaseModel):
    provider_name: str
    max_cost: float

class HybridCompositionRequest(BaseModel):
    Cost: float
    Latency: float
    Throughput: float
    Reliability: float
    SecurityScore: float
    Sustainability: float

class DebugDeploymentRequest(BaseModel):
    error_msg: str
    initial_guide: str

class HybridDeploymentRequest(BaseModel):
    frontend_provider: str
    database_provider: str
    github_url: Optional[str] = None

class CompareProvidersRequest(BaseModel):
    provider_1: str
    provider_2: str

# Endpoints

@app.get("/providers")
def get_providers():
    return {"providers": list(ahp_saw.PROVIDERS_BASE.keys())}
    
@app.post("/compare-providers")
def compare_providers(req: CompareProvidersRequest):
    p1 = req.provider_1
    p2 = req.provider_2
    
    p1_data = ahp_saw.PROVIDERS_BASE.get(p1, {})
    p2_data = ahp_saw.PROVIDERS_BASE.get(p2, {})
    
    if not p1_data or not p2_data:
        raise HTTPException(status_code=404, detail="One or both providers not found.")
        
    opinion = gemini_service.generate_compare_opinion(p1, p1_data, p2, p2_data)
    
    return {
        "provider_1": {"name": p1, "metrics": p1_data},
        "provider_2": {"name": p2, "metrics": p2_data},
        "opinion": opinion
    }

@app.post("/auth/signup")
def create_user(user: UserCreate, db: Session = Depends(database.get_db)):
    db_user = auth.get_user(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(email=user.email, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"msg": "User created successfully"}

@app.post("/auth/login", response_model=Token)
def login(user: UserCreate, db: Session = Depends(database.get_db)):
    db_user = auth.get_user(db, email=user.email)
    if not db_user or not auth.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = auth.create_access_token(data={"sub": db_user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/calculate-ranking")
def get_ranking(req: RankingRequest, db: Session = Depends(database.get_db)):
    # Convert request dict to weights
    weights = req.model_dump()
    rankings = ahp_saw.process_ranking(weights)
    return {"rankings": rankings}

@app.post("/generate-deployment")
def get_deployment_instructions(req: DeploymentRequest):
    if req.mode == "iac":
        ans = gemini_service.generate_iac_deployment(req.provider_name, req.github_url)
    elif req.mode == "docker":
        ans = gemini_service.generate_docker_deployment(req.provider_name, "React/Python", req.github_url)
    else:
        ans = gemini_service.generate_cli_deployment(req.provider_name, "React/Python", req.github_url)
    return {"markdown": ans}

@app.post("/predict-weights")
def predict_ahp_weights(req: WeightPredictionRequest):
    ans = gemini_service.predict_weights(req.workload)
    # the LLM should return json string. Try to parse it, fallback if fail
    try:
        # cleanup markdown blocks if gemini returned them
        clean_ans = ans.strip().replace("```json", "").replace("```", "")
        weights = json.loads(clean_ans)
        return weights
    except:
        return {"Cost": 5, "Latency": 5, "Throughput": 5, "Reliability": 5, "SecurityScore": 5, "Sustainability": 5}

@app.post("/forecast-cost")
def forecast_cost(req: CostForecastRequest):
    multipliers = ml_predictor.forecast_cost_multiplier(req.growth_percent)
    return {"multipliers": multipliers}

@app.post("/ask-bot")
def ask_gemini_bot(req: BotRequest):
    ans = gemini_service.answer_context_bot(req.text)
    return {"answer": ans}

@app.post("/executive-summary")
def get_executive_summary(req: ExecutiveSummaryRequest):
    ans = gemini_service.explain_provider_tradeoffs(req.p1, req.p2, req.p3)
    return {"summary": ans}

@app.post("/reverse-solver")
def run_reverse_solver(req: ReverseSolverRequest):
    result = ahp_saw.reverse_seek_provider(req.provider_name, req.max_cost)
    return result

@app.post("/hybrid-composition")
def get_hybrid_composition(req: HybridCompositionRequest):
    weights = req.model_dump()
    result = ahp_saw.process_hybrid_ranking(weights)
    return result

@app.post("/debug-deployment")
def get_debug_patch(req: DebugDeploymentRequest):
    ans = gemini_service.debug_deployment(req.error_msg, req.initial_guide)
    return {"patch": ans}

@app.post("/generate-hybrid-deployment")
def get_hybrid_deployment(req: HybridDeploymentRequest):
    ans = gemini_service.generate_hybrid_terraform(req.frontend_provider, req.database_provider, req.github_url)
    return {"markdown": ans}

@app.post("/reports/save")
def save_report(req: ReportSaveRequest, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    record = models.History(
        user_id=current_user.id,
        input_weights=json.dumps(req.input_weights),
        top_provider_chosen=req.top_provider_chosen,
        action_taken="Saved Strategy Report"
    )
    db.add(record)
    db.commit()
    return {"status": "success"}

@app.get("/reports")
def get_reports(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    reports = db.query(models.History).filter(models.History.user_id == current_user.id).order_by(models.History.timestamp.desc()).all()
    return {"reports": reports}

@app.websocket("/ws/stream")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    # Initial default weights until client sends something
    current_weights = {"Cost": 5, "Latency": 5, "Throughput": 5, "Reliability": 5, "SecurityScore": 5, "Sustainability": 5}
    
    # Background task to continuously send data
    async def data_sender():
        while True:
            try:
                # Calculate real rankings using current streaming data simulator
                rankings = ahp_saw.process_ranking(current_weights)
                await websocket.send_json({"rankings": rankings})
                await asyncio.sleep(2.5)
            except Exception as e:
                break

    sender_task = asyncio.create_task(data_sender())

    try:
        while True:
            # Wait for client to send new weights
            data = await websocket.receive_json()
            if data:
                current_weights = data
    except WebSocketDisconnect:
        sender_task.cancel()
    except Exception:
        sender_task.cancel()

@app.get("/")
def read_root():
    return {"status": "ok"}
