from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import pandas as pd
import numpy as np
import joblib
import os

app = FastAPI(
    title="Bhumitra Litigation & Delay Risk Microservice",
    description="ML service predicting land acquisition delay & litigation probability under RFCTLARR Act 2013",
    version="1.0.0"
)

# Load trained model
MODEL_PATH = "risk_model.joblib"
model = None

@app.on_event("startup")
def load_ml_model():
    global model
    if not os.path.exists(MODEL_PATH):
        print("Generating dataset and training model on startup...")
        os.system("python generate_dataset.py && python train_model.py")
    
    if os.path.exists(MODEL_PATH):
        model = joblib.load(MODEL_PATH)
        print("✅ ML Model loaded successfully.")
    else:
        print("⚠️ Warning: Model file not found.")

class RiskRequest(BaseModel):
    project_id: str
    multi_crop_irrigated_flag: int = Field(0, description="1 if multi-crop irrigated land, else 0")
    consent_percentage_collected: float = Field(70.0, description="SIA public consultation consent % collected")
    valuation_gap_pct: float = Field(15.0, description="Gap % between circle rate and market demand")
    is_landbank_parcel: int = Field(0, description="1 if government land bank parcel, else 0")
    sla_overrun_flag: int = Field(0, description="1 if SIA stage SLA deadline breached, else 0")
    district_code: Optional[str] = Field("WB-HGH", description="District code")

class FeatureImportance(BaseModel):
    feature: str
    importance: float

class RiskResponse(BaseModel):
    project_id: str
    risk_score: float
    risk_tier: str
    top_contributing_factors: List[FeatureImportance]

@app.get("/health")
def health_check():
    return {
        "status": "online",
        "service": "bhumitra-ml-risk-engine",
        "model_loaded": model is not None
    }

@app.post("/predict-risk", response_model=RiskResponse)
def predict_risk(request: RiskRequest):
    try:
        feature_cols = [
            'multi_crop_irrigated_flag',
            'consent_percentage_collected',
            'valuation_gap_pct',
            'is_landbank_parcel',
            'sla_overrun_flag'
        ]

        input_data = pd.DataFrame([{
            'multi_crop_irrigated_flag': request.multi_crop_irrigated_flag,
            'consent_percentage_collected': request.consent_percentage_collected,
            'valuation_gap_pct': request.valuation_gap_pct,
            'is_landbank_parcel': request.is_landbank_parcel,
            'sla_overrun_flag': request.sla_overrun_flag
        }])[feature_cols]

        if model is not None:
            raw_prob = float(model.predict_proba(input_data)[0, 1])
            importances = model.feature_importances_
        else:
            # Rule-based calculation fallback if model failed to load
            raw_prob = 0.25
            if request.multi_crop_irrigated_flag == 1: raw_prob += 0.35
            if request.consent_percentage_collected < 70: raw_prob += 0.25
            if request.sla_overrun_flag == 1: raw_prob += 0.20
            importances = [0.35, 0.25, 0.15, 0.10, 0.15]

        risk_score = round(min(99.0, max(1.0, raw_prob * 100.0)), 2)

        if risk_score > 65.0:
            risk_tier = "high"
        elif risk_score > 35.0:
            risk_tier = "medium"
        else:
            risk_tier = "low"

        factors = []
        for col, imp in zip(feature_cols, importances):
            factors.append({"feature": col, "importance": round(float(imp), 4)})
        
        # Sort factors by highest importance
        factors = sorted(factors, key=lambda x: x["importance"], reverse=True)

        return RiskResponse(
            project_id=request.project_id,
            risk_score=risk_score,
            risk_tier=risk_tier,
            top_contributing_factors=factors
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Risk prediction error: {str(e)}")
