from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import httpx
import asyncio
import json
import os
from groq import Groq
import numpy as np
from datetime import datetime, timedelta
from dotenv import load_dotenv
import re
import shap
from sklearn.ensemble import RandomForestRegressor
import warnings
warnings.filterwarnings("ignore")

load_dotenv()

app = FastAPI(title="Mutual Fund Advisor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

# ─── Data Models ──────────────────────────────────────────────────────────────
class UserProfile(BaseModel):
    risk_appetite:       str
    time_horizon:        str
    fund_type:           str
    investment_type:     str
    investment_amount:   Optional[float] = 10000
    num_recommendations: Optional[int]   = 5
# ─── Fund Pool ────────────────────────────────────────────────────────────────
FUND_POOL = {
    "equity": [
        {"code": "120503", "name": "Axis Bluechip Fund"},
        {"code": "112090", "name": "ICICI Prudential Bluechip Fund"},
        {"code": "100356", "name": "Nippon India Large Cap Fund"},
        {"code": "120716", "name": "Kotak Bluechip Fund"},
        {"code": "119598", "name": "Mirae Asset Large Cap Fund"},
    ],
    "debt": [
    {"code": "119533", "name": "HDFC Short Term Debt Fund"},
    {"code": "119801", "name": "SBI Short Term Debt Fund"},
    {"code": "119271", "name": "Kotak Bond Short Term Fund"},
    {"code": "120834", "name": "ICICI Prudential Short Term Fund"},
    {"code": "118989", "name": "Nippon India Short Term Fund"},
    ],
    "hybrid": [
        {"code": "118701", "name": "HDFC Balanced Advantage Fund"},
        {"code": "120505", "name": "Axis Equity Hybrid Fund"},
        {"code": "119026", "name": "ICICI Prudential Equity and Debt Fund"},
        {"code": "119597", "name": "Mirae Asset Hybrid Equity Fund"},
        {"code": "119093", "name": "Kotak Equity Hybrid Fund"},
    ],
    "index": [
        {"code": "120587", "name": "UTI Nifty 50 Index Fund"},
        {"code": "120594", "name": "HDFC Index Fund Nifty 50 Plan"},
        {"code": "120589", "name": "ICICI Prudential Nifty 50 Index Fund"},
        {"code": "120592", "name": "SBI Nifty Index Fund"},
        {"code": "120596", "name": "Nippon India Index Fund Nifty 50"},
    ],
}

# ─── Category Keywords ────────────────────────────────────────────────────────
CATEGORY_KEYWORDS = {
    "debt":   ["debt", "bond", "short term", "duration", "income", "liquid", "gilt", "banking", "credit", "corporate"],
    "equity": ["equity", "bluechip", "large cap", "largecap", "midcap", "flexi"],
    "hybrid": ["hybrid", "balanced", "advantage", "asset allocation"],
    "index":  ["index", "nifty", "sensex", "bse"],
}
# ─── Return Limits (sanity check per category) ───────────────────────────────
RETURN_LIMITS = {
    "debt":   12,
    "equity": 35,
    "hybrid": 25,
    "index":  30,
}

# ─── Feature Names ────────────────────────────────────────────────────────────
FEATURE_NAMES = [
    "returns_1yr",
    "returns_3yr",
    "returns_5yr",
    "returns_10yr",
    "risk_score",
    "risk_appetite_num",
    "time_horizon_num",
    "risk_match_score",
    "fund_type_match",
    "investment_amount_log",
]

# ─── Global Model Variables ───────────────────────────────────────────────────
rf_model      = None
rf_explainer  = None

# ─── Training Data Generator ─────────────────────────────────────────────────
def generate_training_data():
    """
    Generates synthetic training samples combining:
    - Domain knowledge (fund category return ranges)
    - Investor profile variations (risk, horizon, amount)
    - Both matched and mismatched fund-profile pairs
    """
    np.random.seed(42)
    X, y = [], []

    risk_map    = {"low": 1, "medium": 2, "high": 3}
    horizon_map = {"short": 1, "medium": 2, "long": 3}
    risk_target = {"low": 2.5, "medium": 5.0, "high": 8.0}

    # All combinations of investor profiles
    profiles = [
        {"risk": "low",    "horizon": "short",  "fund_type": "debt",   "amount": 5000},
        {"risk": "low",    "horizon": "medium", "fund_type": "debt",   "amount": 10000},
        {"risk": "low",    "horizon": "long",   "fund_type": "hybrid", "amount": 15000},
        {"risk": "medium", "horizon": "short",  "fund_type": "hybrid", "amount": 25000},
        {"risk": "medium", "horizon": "medium", "fund_type": "equity", "amount": 10000},
        {"risk": "medium", "horizon": "long",   "fund_type": "equity", "amount": 20000},
        {"risk": "medium", "horizon": "long",   "fund_type": "index",  "amount": 10000},
        {"risk": "high",   "horizon": "medium", "fund_type": "equity", "amount": 50000},
        {"risk": "high",   "horizon": "long",   "fund_type": "equity", "amount": 100000},
        {"risk": "low",    "horizon": "long",   "fund_type": "index",  "amount": 5000},
    ]

    # Realistic return ranges per fund type (Indian MF market)
    return_ranges = {
        "equity": {"1yr": (5, 25),  "3yr": (10, 25), "5yr": (10, 20), "10yr": (12, 18), "risk": (5, 9)},
        "debt":   {"1yr": (5, 9),   "3yr": (6, 10),  "5yr": (6, 9),   "10yr": (7, 10),  "risk": (1, 4)},
        "hybrid": {"1yr": (6, 18),  "3yr": (8, 18),  "5yr": (8, 16),  "10yr": (10, 15), "risk": (3, 6)},
        "index":  {"1yr": (5, 22),  "3yr": (10, 22), "5yr": (10, 18), "10yr": (11, 16), "risk": (4, 8)},
    }

    for p in profiles:
        rng        = return_ranges[p["fund_type"]]
        target_r   = risk_target[p["risk"]]
        amt_log    = np.log10(max(1, p["amount"]))

        # ── 200 matched fund samples (correct fund type for profile) ──────
        for _ in range(200):
            r1   = np.random.uniform(*rng["1yr"])
            r3   = np.random.uniform(*rng["3yr"])
            r5   = np.random.uniform(*rng["5yr"])
            r10  = np.random.uniform(*rng["10yr"])
            risk = np.random.uniform(*rng["risk"])

            risk_match = max(0.0, 10.0 - abs(risk - target_r) * 2)
            ft_match   = 1.0

            feat = [
                r1, r3, r5, r10,
                risk,
                risk_map[p["risk"]],
                horizon_map[p["horizon"]],
                risk_match,
                ft_match,
                amt_log,
            ]

            # Score calculation based on horizon (domain knowledge)
            if p["horizon"] == "short":
                score = r1 * 2.0 + risk_match * 3.0 + ft_match * 10.0
            elif p["horizon"] == "medium":
                score = r3 * 1.5 + r5 * 1.0 + risk_match * 3.0 + ft_match * 10.0
            else:
                score = r10 * 1.5 + r5 * 1.0 + risk_match * 2.5 + ft_match * 10.0

            score += np.random.normal(0, 2)
            score  = float(np.clip(score, 0, 100))

            X.append(feat)
            y.append(score)

        # ── 50 mismatched fund samples (wrong fund type) — low scores ──────
        wrong_type = "equity" if p["fund_type"] == "debt" else "debt"
        wrng       = return_ranges[wrong_type]

        for _ in range(50):
            r1   = np.random.uniform(*wrng["1yr"])
            r3   = np.random.uniform(*wrng["3yr"])
            r5   = np.random.uniform(*wrng["5yr"])
            r10  = np.random.uniform(*wrng["10yr"])
            risk = np.random.uniform(*wrng["risk"])

            risk_match = max(0.0, 10.0 - abs(risk - target_r) * 2)
            ft_match   = 0.0

            feat = [
                r1, r3, r5, r10,
                risk,
                risk_map[p["risk"]],
                horizon_map[p["horizon"]],
                risk_match,
                ft_match,
                amt_log,
            ]

            score = risk_match * 1.5 + np.random.normal(0, 3)
            score = float(np.clip(score, 0, 100))

            X.append(feat)
            y.append(score)

    return np.array(X, dtype=np.float64), np.array(y, dtype=np.float64)

# ─── Train Random Forest Model ────────────────────────────────────────────────
def train_model():
    global rf_model, rf_explainer
    print("=" * 50)
    print("Training Random Forest Regressor...")
    X, y = generate_training_data()

    rf_model = RandomForestRegressor(
        n_estimators=200,
        max_depth=8,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1,
    )
    rf_model.fit(X, y)

    # SHAP TreeExplainer — exact values for Random Forest
    rf_explainer = shap.TreeExplainer(rf_model)

    print(f"Model trained on {len(X)} samples")
    print(f"Features: {FEATURE_NAMES}")
    print(f"Feature importances:")
    for name, imp in zip(FEATURE_NAMES, rf_model.feature_importances_):
        print(f"  {name:30s}: {imp:.4f}")
    print("=" * 50)

# Train model at startup
train_model()

# ─── Build Feature Vector ─────────────────────────────────────────────────────
def build_feature_vector(fund: dict, profile: UserProfile) -> np.ndarray:
    risk_map    = {"low": 1, "medium": 2, "high": 3}
    horizon_map = {"short": 1, "medium": 2, "long": 3}
    risk_target = {"low": 2.5, "medium": 5.0, "high": 8.0}

    risk_score  = float(fund.get("risk_score", 5.0))
    target      = risk_target.get(profile.risk_appetite, 5.0)
    risk_match  = max(0.0, 10.0 - abs(risk_score - target) * 2.0)
    ft_match    = 1.0 if profile.fund_type.lower() in fund.get("fund_type", "").lower() else 0.0
    amt_log     = np.log10(max(1.0, float(profile.investment_amount or 10000)))

    return np.array([[
        float(fund.get("returns_1yr",  0) or 0),
        float(fund.get("returns_3yr",  0) or 0),
        float(fund.get("returns_5yr",  0) or 0),
        float(fund.get("returns_10yr", 0) or 0),
        risk_score,
        float(risk_map.get(profile.risk_appetite, 2)),
        float(horizon_map.get(profile.time_horizon, 2)),
        risk_match,
        ft_match,
        amt_log,
    ]], dtype=np.float64)

# ─── ML Predict + Real SHAP Values ───────────────────────────────────────────
def model_predict_and_explain(fund: dict, profile: UserProfile) -> tuple:
    """
    Returns:
      score      — Random Forest predicted suitability (0-100)
      confidence — based on valid return data count
      shap_dict  — real SHAP values (TreeExplainer) per feature
      base_value — SHAP expected value
    """
    X          = build_feature_vector(fund, profile)
    raw_score  = float(rf_model.predict(X)[0])
    score      = round(float(np.clip(raw_score, 0, 100)), 2)

    # Real SHAP values from TreeExplainer
    shap_values = rf_explainer.shap_values(X)   # shape: (1, n_features)

    # expected_value can be array or scalar depending on shap version
    ev = rf_explainer.expected_value
    if hasattr(ev, '__len__'):
        base_value = float(ev[0])
    else:
        base_value = float(ev)

    # shap_values shape varies by version — handle both
    if hasattr(shap_values, 'values'):
        sv = shap_values.values[0]       # new shap Explanation object
    elif isinstance(shap_values, list):
        sv = shap_values[0][0]           # old shap list format
    else:
        sv = shap_values[0]              # numpy array format

    shap_dict = {
        name: round(float(val), 4)
        for name, val in zip(FEATURE_NAMES, sv)
    }
    # Data confidence
    valid = sum(
        1 for k in ["returns_1yr", "returns_3yr", "returns_5yr", "returns_10yr"]
        if fund.get(k, 0) != 0
    )
    confidence = round((valid / 4.0) * 100.0, 2)

    return score, confidence, shap_dict, base_value

# ─── NAV Data Fetcher ─────────────────────────────────────────────────────────
async def fetch_nav_data(scheme_code: str) -> dict:
    url = f"https://api.mfapi.in/mf/{scheme_code}"
    try:
        async with httpx.AsyncClient(timeout=15.0) as c:
            resp = await c.get(url)
            if resp.status_code == 200:
                return resp.json()
    except Exception:
        pass
    return None

# ─── NAV Lookup Builder ───────────────────────────────────────────────────────
def build_nav_lookup(nav_data: list) -> dict:
    lookup = {}
    for entry in nav_data:
        try:
            lookup[entry["date"]] = float(entry["nav"])
        except Exception:
            continue
    return lookup

def get_nav_on_date(nav_lookup: dict, target_date: datetime) -> Optional[float]:
    """Look for NAV on target date, fall back up to 5 days for holidays."""
    for delta in range(6):
        check    = target_date - timedelta(days=delta)
        date_str = check.strftime("%d-%m-%Y")
        if date_str in nav_lookup:
            return nav_lookup[date_str]
    return None

# ─── Exact Return Calculator ──────────────────────────────────────────────────
def calculate_exact_return(nav_data: list, years: int, fund_type: str) -> float:
    if not nav_data or len(nav_data) < 10:
        return 0.0

    lookup     = build_nav_lookup(nav_data)
    today      = datetime.now()
    latest_nav = get_nav_on_date(lookup, today)
    if not latest_nav:
        return 0.0

    try:
        target_date = today.replace(year=today.year - years)
    except ValueError:
        target_date = today.replace(year=today.year - years, day=28)

    old_nav = get_nav_on_date(lookup, target_date)
    if not old_nav:
        return 0.0

    if years == 1:
        cagr = ((latest_nav - old_nav) / old_nav) * 100
    else:
        cagr = ((latest_nav / old_nav) ** (1.0 / years) - 1) * 100

    max_ret = RETURN_LIMITS.get(fund_type, 35) * 1.5
    if abs(cagr) > max_ret:
        return 0.0

    return round(cagr, 2)

# ─── Risk Score ───────────────────────────────────────────────────────────────
def calculate_risk_score(nav_data: list) -> float:
    if not nav_data or len(nav_data) < 30:
        return 5.0

    navs = []
    for entry in nav_data[:252]:
        try:
            navs.append(float(entry["nav"]))
        except Exception:
            continue

    if len(navs) < 10:
        return 5.0

    daily_returns = [
        (navs[i] - navs[i+1]) / navs[i+1]
        for i in range(len(navs) - 1)
        if navs[i+1] != 0
    ]

    if not daily_returns:
        return 5.0

    volatility = float(np.std(daily_returns)) * (252 ** 0.5) * 100
    return round(min(10.0, max(0.0, volatility / 3.0)), 2)

# ─── Agentic AI: 3-Agent Pipeline ────────────────────────────────────────────
def run_agentic_recommendation(profile: UserProfile, funds_data: list) -> str:

    fund_summaries = [
        {
            "name":     f["scheme_name"],
            "1yr":      f["returns_1yr"],
            "3yr":      f["returns_3yr"],
            "5yr":      f["returns_5yr"],
            "10yr":     f["returns_10yr"],
            "risk":     f["risk_score"],
            "ml_score": f["recommendation_score"],
            "top_shap": sorted(
                f["shap_features"].items(),
                key=lambda x: abs(x[1]),
                reverse=True
            )[:3],
        }
        for f in funds_data
    ]

    # ── Agent 1: Planner ──────────────────────────────────────────────────────
    try:
        planner = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a financial planning agent. "
                        "Output pure JSON only with keys: "
                        "priority_metric, risk_tolerance_score (1-10), "
                        "recommended_focus. No markdown, no explanation."
                    )
                },
                {
                    "role": "user",
                    "content": (
                        f"Investor: risk={profile.risk_appetite}, "
                        f"horizon={profile.time_horizon}, "
                        f"fund_type={profile.fund_type}, "
                        f"investment={profile.investment_type}, "
                        f"amount=Rs.{profile.investment_amount}"
                    )
                }
            ],
            max_tokens=200,
            temperature=0.2,
        )
        raw      = planner.choices[0].message.content
        match    = re.search(r'\{.*?\}', raw, re.DOTALL)
        strategy = json.loads(match.group()) if match else {}
    except Exception:
        strategy = {"priority_metric": "returns", "risk_tolerance_score": 5}

    # ── Agent 2: Analyst ──────────────────────────────────────────────────────
    try:
        analyst = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a fund analysis agent. "
                        "Output a pure JSON array only. "
                        "Each item: {name: string, rationale: string}. "
                        "No markdown, no extra text."
                    )
                },
                {
                    "role": "user",
                    "content": (
                        f"Strategy: {json.dumps(strategy)}\n"
                        f"Funds with ML scores and SHAP features: "
                        f"{json.dumps(fund_summaries)}\n"
                        f"Rank by suitability."
                    )
                }
            ],
            max_tokens=500,
            temperature=0.2,
        )
        raw    = analyst.choices[0].message.content
        match  = re.search(r'\[.*?\]', raw, re.DOTALL)
        ranked = json.loads(match.group()) if match else []
    except Exception:
        ranked = []

    # ── Agent 3: Explainer ────────────────────────────────────────────────────
    try:
        explainer_agent = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a financial explainer agent. "
                        "Write a 2-sentence personalised explanation for each fund. "
                        "Mention the Random Forest ML model score, "
                        "top SHAP features that drove the recommendation, "
                        "specific return % values, and how it matches investor profile. "
                        "Output pure JSON only — fund names as keys, "
                        "explanation strings as values. No markdown."
                    )
                },
                {
                    "role": "user",
                    "content": (
                        f"Investor: risk={profile.risk_appetite}, "
                        f"horizon={profile.time_horizon} term, "
                        f"fund_type={profile.fund_type}, "
                        f"amount=Rs.{profile.investment_amount}\n\n"
                        f"Fund ML analysis: {json.dumps(fund_summaries)}\n"
                        f"Analyst notes: {json.dumps(ranked)}"
                    )
                }
            ],
            max_tokens=1000,
            temperature=0.4,
        )
        return explainer_agent.choices[0].message.content
    except Exception:
        return "{}"

# ─── API Routes ───────────────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {"message": "Mutual Fund Advisor API — Random Forest + SHAP TreeExplainer"}

@app.get("/api/fund-types")
async def get_fund_types():
    return {
        "risk_appetite":   ["low", "medium", "high"],
        "time_horizon":    ["short", "medium", "long"],
        "fund_type":       ["equity", "debt", "hybrid", "index"],
        "investment_type": ["lumpsum", "sip", "swp", "both"],
    }

@app.get("/api/model-info")
async def get_model_info():
    """Expose ML model details to frontend"""
    if rf_model is None:
        raise HTTPException(status_code=503, detail="Model not ready")
    return {
        "model_type":       "Random Forest Regressor",
        "n_estimators":     rf_model.n_estimators,
        "max_depth":        rf_model.max_depth,
        "n_features":       len(FEATURE_NAMES),
        "feature_names":    FEATURE_NAMES,
        "training_samples": 2500,
        "explainer_type":   "SHAP TreeExplainer",
        "feature_importances": {
            name: round(float(imp), 4)
            for name, imp in zip(FEATURE_NAMES, rf_model.feature_importances_)
        },
    }

@app.post("/api/recommend")
async def recommend_funds(profile: UserProfile):

    fund_list = FUND_POOL.get(profile.fund_type.lower(), FUND_POOL["equity"])

    async def process_fund(info: dict):
        data = await fetch_nav_data(info["code"])
        if not data:
            return None

        # Validate fund category matches user selection
        fund_name_actual = data.get("meta", {}).get("scheme_name", "").lower()
        keywords = CATEGORY_KEYWORDS.get(profile.fund_type.lower(), [])
        if keywords and not any(k in fund_name_actual for k in keywords):
            print(f"Skipping {info['name']} — mismatch: {fund_name_actual}")
            return None

        history = data.get("data", [])
        if not history or len(history) < 10:
            return None

        fund_type = profile.fund_type.lower()

        fund = {
            "scheme_code":  info["code"],
            "scheme_name":  info["name"],
            "fund_type":    profile.fund_type,
            "nav":          float(history[0]["nav"]),
            "returns_1yr":  calculate_exact_return(history, 1,  fund_type),
            "returns_3yr":  calculate_exact_return(history, 3,  fund_type),
            "returns_5yr":  calculate_exact_return(history, 5,  fund_type),
            "returns_10yr": calculate_exact_return(history, 10, fund_type),
            "risk_score":   calculate_risk_score(history),
        }

        # ── Random Forest Predict + Real SHAP ────────────────────────────────
        score, confidence, shap_dict, base_val = model_predict_and_explain(fund, profile)
        fund["recommendation_score"] = score
        fund["confidence"]           = confidence
        fund["shap_features"]        = shap_dict
        fund["shap_base_value"]      = round(base_val, 4)
        fund["model_type"]           = "Random Forest + SHAP TreeExplainer"

        return fund

    results     = await asyncio.gather(*[process_fund(f) for f in fund_list])
    valid_funds = sorted(
        [f for f in results if f is not None],
        key=lambda x: x["recommendation_score"],
        reverse=True
    )

    if not valid_funds:
        raise HTTPException(
            status_code=503,
            detail="Could not fetch fund data. Please try again."
        )

    num = min(max(int(profile.num_recommendations or 5), 1), 10)
    top_funds = valid_funds[:num]

    # Run Agentic AI pipeline with SHAP context
    try:
        ai_raw = run_agentic_recommendation(profile, top_funds)
        match  = re.search(r'\{.*\}', ai_raw, re.DOTALL)
        ai_explanations = json.loads(match.group()) if match else {}
    except Exception as e:
        print(f"AI pipeline error: {e}")
        ai_explanations = {}

    # Attach AI explanations to each fund
    for fund in top_funds:
        explanation = None

        for key, val in ai_explanations.items():
            fund_words = set(fund["scheme_name"].lower().split())
            key_words  = set(key.lower().split())
            if any(len(w) > 3 for w in fund_words & key_words):
                explanation = val
                break

        # Fallback — build from SHAP + returns data
        if not explanation:
            top_shap = sorted(
                fund["shap_features"].items(),
                key=lambda x: abs(x[1]),
                reverse=True
            )[:2]
            shap_desc = " and ".join(
                f"{k.replace('_', ' ')} ({'+' if v >= 0 else ''}{v:.3f})"
                for k, v in top_shap
            )
            r1  = fund["returns_1yr"]
            r3  = fund["returns_3yr"]
            r5  = fund["returns_5yr"]
            explanation = (
                f"The Random Forest model scored this {fund['fund_type']} fund "
                f"{fund['recommendation_score']:.0f}/100 — "
                f"top SHAP drivers: {shap_desc}. "
                f"Returns: "
                f"{'N/A' if r1 == 0 else f'{r1}%'} (1yr), "
                f"{'N/A' if r3 == 0 else f'{r3}%'} (3yr), "
                f"{'N/A' if r5 == 0 else f'{r5}%'} (5yr), "
                f"risk score {fund['risk_score']}/10."
            )

        fund["explanation"] = explanation

    return {
        "recommendations": top_funds,
        "profile":         profile.dict(),
        "generated_at":    datetime.now().isoformat(),
        "model_info": {
            "type":      "Random Forest Regressor",
            "explainer": "SHAP TreeExplainer",
            "features":  FEATURE_NAMES,
        }
    }

@app.get("/api/fund/{scheme_code}/history")
async def get_fund_history(scheme_code: str):
    data = await fetch_nav_data(scheme_code)
    if not data:
        raise HTTPException(status_code=404, detail="Fund not found")
    history = data.get("data", [])
    return {
        "scheme_code": scheme_code,
        "scheme_name": data.get("meta", {}).get("scheme_name", ""),
        "history": {
            "1yr":  [{"date": d["date"], "nav": float(d["nav"])} for d in history[:365]  if d.get("nav")],
            "3yr":  [{"date": d["date"], "nav": float(d["nav"])} for d in history[:1095] if d.get("nav")],
            "5yr":  [{"date": d["date"], "nav": float(d["nav"])} for d in history[:1825] if d.get("nav")],
            "10yr": [{"date": d["date"], "nav": float(d["nav"])} for d in history[:3650] if d.get("nav")],
        }
    }

@app.get("/api/search")
async def search_funds(q: str = ""):
    url = f"https://api.mfapi.in/mf/search?q={q}"
    try:
        async with httpx.AsyncClient(timeout=10.0) as c:
            resp = await c.get(url)
            if resp.status_code == 200:
                return resp.json()[:20]
    except Exception:
        pass
    return []