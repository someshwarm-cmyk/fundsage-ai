from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
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

app = FastAPI(title="FundSage AI API")

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

# ─── Dynamic Search Queries (15 per type for guaranteed 10 results) ───────────
FUND_SEARCH_QUERIES = {
    "equity": [
        "Axis Bluechip Direct Growth",
        "ICICI Prudential Bluechip Direct Growth",
        "Mirae Asset Large Cap Direct Growth",
        "Kotak Bluechip Direct Growth",
        "SBI Bluechip Direct Growth",
        "Nippon India Large Cap Direct Growth",
        "HDFC Top 100 Direct Growth",
        "Canara Robeco Bluechip Direct Growth",
        "Axis Midcap Direct Growth",
        "Kotak Emerging Equity Direct Growth",
        "HDFC Midcap Opportunities Direct Growth",
        "DSP Midcap Direct Growth",
        "SBI Magnum Midcap Direct Growth",
        "Nippon India Growth Direct Growth",
        "Tata Large Cap Direct Growth",
    ],
    "debt": [
        "HDFC Short Term Debt Direct Growth",
        "SBI Short Term Debt Direct Growth",
        "Kotak Bond Short Term Direct Growth",
        "ICICI Prudential Short Term Direct Growth",
        "ICICI Prudential Gilt Direct Growth",
        "Aditya Birla Short Term Direct Growth",
        "Axis Banking PSU Debt Direct Growth",
        "Nippon India Short Term Direct Growth",
        "Kotak Corporate Bond Direct Growth",
        "UTI Corporate Bond Direct Growth",
        "HDFC Banking PSU Debt Direct Growth",
        "SBI Magnum Gilt Direct Growth",
        "Nippon India Gilt Securities Direct Growth",
        "DSP Bond Direct Growth",
        "Tata Short Term Bond Direct Growth",
    ],
    "hybrid": [
        "HDFC Balanced Advantage Direct Growth",
        "ICICI Prudential Equity Debt Direct Growth",
        "SBI Equity Hybrid Direct Growth",
        "Canara Robeco Equity Hybrid Direct Growth",
        "Nippon India Balanced Advantage Direct Growth",
        "Kotak Balanced Advantage Direct Growth",
        "Edelweiss Balanced Advantage Direct Growth",
        "Tata Balanced Advantage Direct Growth",
        "Axis Aggressive Hybrid Direct Growth",
        "Mirae Asset Hybrid Equity Direct Growth",
        "DSP Equity Bond Direct Growth",
        "Franklin Equity Hybrid Direct Growth",
        "Sundaram Equity Hybrid Direct Growth",
        "Baroda Aggressive Hybrid Direct Growth",
        "UTI Hybrid Equity Direct Growth",
    ],
    "gold": [
        "SBI Gold Fund Direct Growth",
        "Nippon India Gold Savings Direct Growth",
        "Axis Gold Fund Direct Growth",
        "Kotak Gold Fund Direct Growth",
        "Quantum Gold Savings Direct Growth",
        "Aditya Birla Sun Life Gold Direct Growth",
        "DSP World Gold Direct Growth",
        "Invesco India Gold ETF Direct Growth",
        "Mirae Asset Gold ETF Direct Growth",
        "Canara Robeco Gold Savings Direct Growth",
        "Edelweiss Gold Silver ETF Direct Growth",
        "LIC MF Gold ETF Direct Growth",
        "HDFC Gold Fund Direct Growth",
        "UTI Gold ETF FoF Direct Growth",
        "IDBI Gold Fund Direct Growth",
    ],
    "index": [
        "UTI Nifty 50 Index Direct Growth",
        "HDFC Index Nifty 50 Direct Growth",
        "ICICI Prudential Nifty 50 Index Direct Growth",
        "SBI Nifty Index Direct Growth",
        "Nippon India Nifty 50 Index Direct Growth",
        "Axis Nifty 100 Index Direct Growth",
        "Kotak Nifty 50 Index Direct Growth",
        "Motilal Oswal Nifty 50 Index Direct Growth",
        "DSP Nifty 50 Index Direct Growth",
        "Tata Nifty 50 Index Direct Growth",
        "Canara Robeco Nifty 50 Index Direct Growth",
        "Mirae Asset Nifty 50 ETF Direct Growth",
        "Aditya Birla Nifty 50 Index Direct Growth",
        "Franklin Nifty 50 Index Direct Growth",
        "Edelweiss Nifty 50 Index Direct Growth",
    ],
    "others": [
        "SBI Small Cap Direct Growth",
        "HDFC Small Cap Direct Growth",
        "Nippon India Small Cap Direct Growth",
        "DSP Small Cap Direct Growth",
        "Tata Digital India Direct Growth",
        "ICICI Prudential Technology Direct Growth",
        "Nippon India Pharma Direct Growth",
        "Kotak Infrastructure Direct Growth",
        "Mirae Asset Healthcare Direct Growth",
        "Axis Small Cap Direct Growth",
        "Franklin India Smaller Companies Direct Growth",
        "Quant Small Cap Direct Growth",
        "ICICI Prudential Infrastructure Direct Growth",
        "Nippon India Banking Direct Growth",
        "Tata India Consumer Direct Growth",
    ],
}

# ─── Category validation keywords ─────────────────────────────────────────────
CATEGORY_KEYWORDS = {
    "equity": ["equity", "bluechip", "blue chip", "large cap", "largecap",
               "midcap", "mid cap", "flexi", "small cap", "multi cap",
               "focused", "opportunities", "top 100", "emerging", "elss",
               "tax saver", "growth fund", "value", "contra", "dividend yield"],
    "debt":   ["debt", "bond", "short term", "duration", "income", "liquid",
               "gilt", "banking", "credit", "corporate", "psu", "dynamic",
               "overnight", "money market", "arbitrage", "fixed maturity"],
    "hybrid": ["hybrid", "balanced", "advantage", "asset allocation",
               "equity & debt", "equity and debt", "aggressive",
               "multi asset", "equity hybrid", "balanced advantage"],
    "gold":   ["gold", "silver", "precious", "commodity", "world gold", "mining"],
    "index":  ["index", "nifty", "sensex", "bse", "etf", "passive", "equal weight"],
    "others": ["technology", "pharma", "infrastructure", "healthcare",
               "consumption", "sectoral", "thematic", "small cap",
               "smallcap", "digital", "innovation", "banking"],
}

RETURN_LIMITS = {
    "debt":   12,
    "equity": 45,
    "hybrid": 30,
    "gold":   35,
    "index":  35,
    "others": 60,
}

FEATURE_NAMES = [
    "returns_1yr", "returns_3yr", "returns_5yr", "returns_10yr",
    "risk_score", "risk_appetite_num", "time_horizon_num",
    "risk_match_score", "fund_type_match", "investment_amount_log",
]

rf_model     = None
rf_explainer = None

# ─── Training Data ────────────────────────────────────────────────────────────
def generate_training_data():
    np.random.seed(42)
    X, y = [], []
    risk_map    = {"low": 1, "medium": 2, "high": 3}
    horizon_map = {"short": 1, "medium": 2, "long": 3}
    risk_target = {"low": 2.5, "medium": 5.0, "high": 8.0}
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
        {"risk": "low",    "horizon": "long",   "fund_type": "gold",   "amount": 5000},
        {"risk": "medium", "horizon": "medium", "fund_type": "gold",   "amount": 10000},
        {"risk": "high",   "horizon": "long",   "fund_type": "others", "amount": 50000},
    ]
    return_ranges = {
        "equity": {"1yr": (5,35),  "3yr": (10,30), "5yr": (10,25), "10yr": (12,20), "risk": (5,9)},
        "debt":   {"1yr": (5,9),   "3yr": (6,10),  "5yr": (6,9),   "10yr": (7,10),  "risk": (1,4)},
        "hybrid": {"1yr": (6,22),  "3yr": (8,20),  "5yr": (8,18),  "10yr": (10,16), "risk": (3,7)},
        "gold":   {"1yr": (5,25),  "3yr": (8,18),  "5yr": (8,16),  "10yr": (9,14),  "risk": (3,6)},
        "index":  {"1yr": (5,30),  "3yr": (10,25), "5yr": (10,20), "10yr": (11,17), "risk": (4,8)},
        "others": {"1yr": (5,40),  "3yr": (10,35), "5yr": (10,28), "10yr": (12,22), "risk": (6,10)},
    }
    for p in profiles:
        rng      = return_ranges.get(p["fund_type"], return_ranges["equity"])
        target_r = risk_target[p["risk"]]
        amt_log  = np.log10(max(1, p["amount"]))
        for _ in range(200):
            r1   = np.random.uniform(*rng["1yr"])
            r3   = np.random.uniform(*rng["3yr"])
            r5   = np.random.uniform(*rng["5yr"])
            r10  = np.random.uniform(*rng["10yr"])
            risk = np.random.uniform(*rng["risk"])
            risk_match = max(0.0, 10.0 - abs(risk - target_r) * 2)
            feat = [r1, r3, r5, r10, risk, risk_map[p["risk"]], horizon_map[p["horizon"]], risk_match, 1.0, amt_log]
            if p["horizon"] == "short":
                score = r1 * 2.0 + risk_match * 3.0 + 10.0
            elif p["horizon"] == "medium":
                score = r3 * 1.5 + r5 * 1.0 + risk_match * 3.0 + 10.0
            else:
                score = r10 * 1.5 + r5 * 1.0 + risk_match * 2.5 + 10.0
            score += np.random.normal(0, 2)
            X.append(feat)
            y.append(float(np.clip(score, 0, 100)))
        wrong_type = "debt" if p["fund_type"] == "equity" else "equity"
        wrng = return_ranges[wrong_type]
        for _ in range(50):
            r1   = np.random.uniform(*wrng["1yr"])
            r3   = np.random.uniform(*wrng["3yr"])
            r5   = np.random.uniform(*wrng["5yr"])
            r10  = np.random.uniform(*wrng["10yr"])
            risk = np.random.uniform(*wrng["risk"])
            risk_match = max(0.0, 10.0 - abs(risk - target_r) * 2)
            feat = [r1, r3, r5, r10, risk, risk_map[p["risk"]], horizon_map[p["horizon"]], risk_match, 0.0, amt_log]
            score = risk_match * 1.5 + np.random.normal(0, 3)
            X.append(feat)
            y.append(float(np.clip(score, 0, 100)))
    return np.array(X, dtype=np.float64), np.array(y, dtype=np.float64)

def train_model():
    global rf_model, rf_explainer
    print("=" * 50)
    print("Training Random Forest Regressor...")
    X, y = generate_training_data()
    rf_model = RandomForestRegressor(
        n_estimators=200, max_depth=8,
        min_samples_split=5, min_samples_leaf=2,
        random_state=42, n_jobs=-1
    )
    rf_model.fit(X, y)
    rf_explainer = shap.TreeExplainer(rf_model)
    print(f"Model trained on {len(X)} samples")
    print("=" * 50)

train_model()

# ─── Feature Vector + SHAP ────────────────────────────────────────────────────
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
        risk_match, ft_match, amt_log,
    ]], dtype=np.float64)

def model_predict_and_explain(fund: dict, profile: UserProfile) -> tuple:
    X           = build_feature_vector(fund, profile)
    raw_score   = float(rf_model.predict(X)[0])
    score       = round(float(np.clip(raw_score, 0, 100)), 2)
    shap_values = rf_explainer.shap_values(X)
    ev          = rf_explainer.expected_value
    base_value  = float(ev[0]) if hasattr(ev, '__len__') else float(ev)
    if hasattr(shap_values, 'values'):
        sv = shap_values.values[0]
    elif isinstance(shap_values, list):
        sv = shap_values[0][0]
    else:
        sv = shap_values[0]
    shap_dict  = {name: round(float(val), 4) for name, val in zip(FEATURE_NAMES, sv)}
    valid      = sum(1 for k in ["returns_1yr","returns_3yr","returns_5yr","returns_10yr"] if fund.get(k,0) != 0)
    confidence = round((valid / 4.0) * 100.0, 2)
    return score, confidence, shap_dict, base_value


# ─── Fallback Scheme Codes (used when MFAPI search is down) ──────────────────
FALLBACK_CODES = {
    "equity": [
        ("120505", "Axis Midcap Fund - Direct Plan - Growth"),
        ("119598", "Axis Bluechip Fund - Direct Plan - Growth"),
        ("118989", "Mirae Asset Large Cap Fund - Direct Plan - Growth"),
        ("120716", "Parag Parikh Flexi Cap Fund - Direct Plan - Growth"),
        ("125494", "Canara Robeco Bluechip Equity Fund - Direct Plan - Growth"),
        ("120503", "Axis Small Cap Fund - Direct Plan - Growth"),
        ("118701", "SBI Bluechip Fund - Direct Plan - Growth"),
        ("119775", "HDFC Top 100 Fund - Direct Plan - Growth"),
        ("120828", "Kotak Emerging Equity Fund - Direct Plan - Growth"),
        ("118255", "Nippon India Large Cap Fund - Direct Plan - Growth"),
        ("119270", "DSP Midcap Fund - Direct Plan - Growth"),
        ("120507", "Axis Long Term Equity Fund - Direct Plan - Growth"),
        ("118550", "Franklin India Bluechip Fund - Direct Plan - Growth"),
        ("120206", "Mirae Asset Emerging Bluechip Fund - Direct Plan - Growth"),
        ("119093", "HDFC Mid-Cap Opportunities Fund - Direct Plan - Growth"),
    ],
    "debt": [
        ("119016", "HDFC Short Term Debt Fund - Direct Plan - Growth"),
        ("119237", "Aditya Birla SL Corporate Bond Fund - Direct Plan - Growth"),
        ("120594", "Axis Short Term Fund - Direct Plan - Growth"),
        ("118477", "ICICI Pru Short Term Fund - Direct Plan - Growth"),
        ("119364", "Kotak Bond Short Term Fund - Direct Plan - Growth"),
        ("118825", "SBI Short Term Debt Fund - Direct Plan - Growth"),
        ("120831", "Nippon India Short Term Fund - Direct Plan - Growth"),
        ("118632", "IDFC Bond Fund Short Term - Direct Plan - Growth"),
        ("120832", "Nippon India Low Duration Fund - Direct Plan - Growth"),
        ("119261", "Franklin India STIP - Direct Plan - Growth"),
    ],
    "hybrid": [
        ("118834", "SBI Equity Hybrid Fund - Direct Plan - Growth"),
        ("119247", "HDFC Hybrid Equity Fund - Direct Plan - Growth"),
        ("120716", "Canara Robeco Equity Hybrid Fund - Direct Plan - Growth"),
        ("118989", "ICICI Pru Equity and Debt Fund - Direct Plan - Growth"),
        ("119598", "Kotak Equity Hybrid Fund - Direct Plan - Growth"),
        ("120594", "Axis Equity Hybrid Fund - Direct Plan - Growth"),
        ("118701", "Mirae Asset Hybrid Equity Fund - Direct Plan - Growth"),
        ("119270", "DSP Equity and Bond Fund - Direct Plan - Growth"),
        ("118477", "Aditya Birla SL Equity Hybrid 95 - Direct Plan - Growth"),
        ("118255", "Franklin India Equity Hybrid Fund - Direct Plan - Growth"),
    ],
    "gold": [
        ("119788", "SBI Gold Fund - Direct Plan - Growth"),
        ("120473", "Axis Gold Fund - Direct Plan - Growth"),
        ("118663", "Nippon India Gold Savings Fund - Direct Plan - Growth"),
        ("119761", "HDFC Gold Fund - Direct Plan - Growth"),
        ("119177", "Kotak Gold Fund - Direct Plan - Growth"),
        ("118632", "ICICI Pru Regular Gold Savings Fund - Direct Plan - Growth"),
        ("119016", "Aditya Birla SL Gold Fund - Direct Plan - Growth"),
        ("119364", "Invesco India Gold Fund - Direct Plan - Growth"),
        ("118825", "DSP World Gold Fund - Direct Plan - Growth"),
        ("120831", "Quantum Gold Savings Fund - Direct Plan - Growth"),
    ],
    "index": [
        ("120716", "Axis Nifty 50 Index Fund - Direct Plan - Growth"),
        ("118989", "HDFC Index Fund Nifty 50 Plan - Direct Plan - Growth"),
        ("119598", "SBI Nifty Index Fund - Direct Plan - Growth"),
        ("120505", "ICICI Pru Nifty 50 Index Fund - Direct Plan - Growth"),
        ("118701", "UTI Nifty 50 Index Fund - Direct Plan - Growth"),
        ("119270", "Nippon India Index Fund Nifty 50 - Direct Plan - Growth"),
        ("120473", "Motilal Oswal Nifty 50 Index Fund - Direct Plan - Growth"),
        ("119761", "Kotak Nifty 50 Index Fund - Direct Plan - Growth"),
        ("119788", "Mirae Asset Nifty 50 ETF FoF - Direct Plan - Growth"),
        ("118255", "DSP Nifty 50 Index Fund - Direct Plan - Growth"),
    ],
    "others": [
        ("118989", "SBI Technology Opportunities Fund - Direct Plan - Growth"),
        ("119598", "Nippon India Pharma Fund - Direct Plan - Growth"),
        ("120505", "ICICI Pru Infrastructure Fund - Direct Plan - Growth"),
        ("118701", "Franklin India Technology Fund - Direct Plan - Growth"),
        ("120716", "Mirae Asset Healthcare Fund - Direct Plan - Growth"),
        ("119270", "DSP Healthcare Fund - Direct Plan - Growth"),
        ("118477", "Aditya Birla SL Digital India Fund - Direct Plan - Growth"),
        ("120473", "Tata Digital India Fund - Direct Plan - Growth"),
        ("119761", "ICICI Pru Banking and Financial Services - Direct Plan - Growth"),
        ("119016", "SBI Banking and Financial Services Fund - Direct Plan - Growth"),
    ],
}

# ─── MFAPI Helpers ────────────────────────────────────────────────────────────
async def search_funds_by_query(query: str) -> list:
    url = f"https://api.mfapi.in/mf/search?q={query.replace(' ', '+')}"
    try:
        async with httpx.AsyncClient(timeout=8.0) as c:
            resp = await c.get(url)
            if resp.status_code == 200:
                data = resp.text.strip()
                if not data or data == "null":
                    return []
                results = resp.json()
                if not isinstance(results, list):
                    return []
                filtered = [
                    r for r in results
                    if not any(x in r.get("schemeName", "").lower()
                               for x in ["idcw", "dividend", "weekly", "monthly idcw",
                                         "quarterly idcw", "bonus", "segregated",
                                         "deactivated", "payout", "annual idcw"])
                ]
                return filtered[:2]
    except Exception:
        pass
    return []

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

# ─── Kuvera API — fund manager, AUM, rating, expense ratio ───────────────────
async def fetch_kuvera_data(isin: str) -> dict:
    """Fetch full fund details from Kuvera via mf.captnemo.in — follows redirect."""
    if not isin:
        return {}
    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as c:
            resp = await c.get(f"https://mf.captnemo.in/kuvera/{isin.strip()}")
            if resp.status_code == 200:
                data = resp.json()
                if isinstance(data, list) and len(data) > 0:
                    data = data[0]
                return {
                    "expense_ratio":        round(float(data["expense_ratio"]), 2) if data.get("expense_ratio") else None,
                    "fund_manager":         data.get("fund_manager") or None,
                    "aum":                  round(float(data["aum"]), 2) if data.get("aum") else None,
                    "fund_rating":          data.get("fund_rating") or None,
                    "investment_objective": data.get("investment_objective") or None,
                    "category":             data.get("category") or None,
                }
    except Exception:
        pass
    return {}

# ─── NAV helpers ──────────────────────────────────────────────────────────────
def build_nav_lookup(nav_data: list) -> dict:
    lookup = {}
    for entry in nav_data:
        try:
            lookup[entry["date"]] = float(entry["nav"])
        except Exception:
            continue
    return lookup

def get_nav_on_date(lookup: dict, target_date: datetime) -> Optional[float]:
    for delta in range(6):
        d = (target_date - timedelta(days=delta)).strftime("%d-%m-%Y")
        if d in lookup:
            return lookup[d]
    return None

def get_returns_from_history(nav_data: list, fund_type: str) -> dict:
    if not nav_data or len(nav_data) < 10:
        return {"1yr": 0, "3yr": 0, "5yr": 0, "10yr": 0}
    lookup     = build_nav_lookup(nav_data)
    today      = datetime.now()
    latest_nav = get_nav_on_date(lookup, today)
    if not latest_nav:
        return {"1yr": 0, "3yr": 0, "5yr": 0, "10yr": 0}
    results = {}
    max_ret = RETURN_LIMITS.get(fund_type, 35)
    for years, key in [(1, "1yr"), (3, "3yr"), (5, "5yr"), (10, "10yr")]:
        try:
            target_date = today.replace(year=today.year - years)
        except ValueError:
            target_date = today.replace(year=today.year - years, day=28)
        old_nav = get_nav_on_date(lookup, target_date)
        if not old_nav:
            results[key] = 0
            continue
        ret = ((latest_nav - old_nav) / old_nav) * 100 if years == 1 \
              else ((latest_nav / old_nav) ** (1.0 / years) - 1) * 100
        results[key] = round(ret, 2) if abs(ret) <= max_ret * 1.5 else 0
    return results

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
        for i in range(len(navs)-1) if navs[i+1] != 0
    ]
    if not daily_returns:
        return 5.0
    return round(min(10.0, max(0.0, float(np.std(daily_returns)) * (252**0.5) * 100 / 3.0)), 2)

# ─── Dynamic Fund Discovery ───────────────────────────────────────────────────
async def get_fund_list_dynamic(fund_type: str, num_needed: int) -> list:
    queries  = FUND_SEARCH_QUERIES.get(fund_type.lower(), FUND_SEARCH_QUERIES["equity"])
    keywords = CATEGORY_KEYWORDS.get(fund_type.lower(), [])
    search_tasks = [search_funds_by_query(q) for q in queries]
    all_results  = await asyncio.gather(*search_tasks)
    seen_codes = set()
    fund_list  = []
    for results in all_results:
        for r in results:
            code       = str(r["schemeCode"])
            name       = r["schemeName"]
            name_lower = name.lower()
            if code in seen_codes:
                continue
            if keywords and not any(k in name_lower for k in keywords):
                continue
            seen_codes.add(code)
            fund_list.append({"code": code, "name": name})
            if len(fund_list) >= num_needed + 5:
                break
        if len(fund_list) >= num_needed + 5:
            break
    print(f"Dynamic search: found {len(fund_list)} valid {fund_type} funds for {num_needed} requested")

    # ---- FALLBACK LOGIC ----
    if len(fund_list) == 0:
        print("⚠️ MFAPI search failed — using fallback scheme codes")
        fallback = FALLBACK_CODES.get(fund_type.lower(), [])
        for code, name in fallback[:num_needed+5]:
            fund_list.append({"code": code, "name": name})

    return fund_list

# ─── Agentic AI ───────────────────────────────────────────────────────────────
def run_agentic_recommendation(profile: UserProfile, funds_data: list) -> str:
    fund_summaries = [
        {
            "name":          f["scheme_name"],
            "1yr":           f["returns_1yr"],
            "3yr":           f["returns_3yr"],
            "5yr":           f["returns_5yr"],
            "10yr":          f["returns_10yr"],
            "risk":          f["risk_score"],
            "expense_ratio": f.get("expense_ratio"),
            "ml_score":      f["recommendation_score"],
            "top_shap":      sorted(
                f["shap_features"].items(),
                key=lambda x: abs(x[1]), reverse=True
            )[:3],
        }
        for f in funds_data
    ]

    # Agent 1: Planner
    try:
        planner = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[
                {"role": "system", "content": (
                    "You are a financial planning agent. "
                    "Output pure JSON only with keys: priority_metric, "
                    "risk_tolerance_score (1-10), recommended_focus, investment_strategy. "
                    "No markdown."
                )},
                {"role": "user", "content": (
                    f"Investor: risk={profile.risk_appetite}, "
                    f"horizon={profile.time_horizon}, fund_type={profile.fund_type}, "
                    f"investment={profile.investment_type}, amount=Rs.{profile.investment_amount}"
                )},
            ],
            max_tokens=250, temperature=0.2,
        )
        raw      = planner.choices[0].message.content
        match    = re.search(r'\{.*?\}', raw, re.DOTALL)
        strategy = json.loads(match.group()) if match else {}
    except Exception:
        strategy = {"priority_metric": "returns", "risk_tolerance_score": 5}

    # Agent 2: Analyst
    try:
        analyst = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[
                {"role": "system", "content": (
                    "You are a fund analysis agent. "
                    "Output a pure JSON array only. "
                    "Each item: {name: string, rationale: string, suitability_score: number}. "
                    "Consider expense ratio — lower is better. No markdown."
                )},
                {"role": "user", "content": (
                    f"Strategy: {json.dumps(strategy)}\n"
                    f"Funds: {json.dumps(fund_summaries)}\n"
                    f"Rank by suitability."
                )},
            ],
            max_tokens=800, temperature=0.2,
        )
        raw    = analyst.choices[0].message.content
        match  = re.search(r'\[.*?\]', raw, re.DOTALL)
        ranked = json.loads(match.group()) if match else []
    except Exception:
        ranked = []

    # Agent 3: Explainer
    try:
        explainer_agent = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[
                {"role": "system", "content": (
                    "You are a financial explainer for beginner investors. "
                    "Write 2-3 sentence personalised explanation per fund. "
                    "Mention ML score, top SHAP drivers, returns, risk score, "
                    "and expense ratio if available. "
                    "Output pure JSON — fund names as keys, explanations as values. No markdown."
                )},
                {"role": "user", "content": (
                    f"Investor: risk={profile.risk_appetite}, "
                    f"horizon={profile.time_horizon} term, "
                    f"fund_type={profile.fund_type}, amount=Rs.{profile.investment_amount}\n\n"
                    f"Funds: {json.dumps(fund_summaries)}\n"
                    f"Analyst notes: {json.dumps(ranked)}"
                )},
            ],
            max_tokens=1500, temperature=0.4,
        )
        return explainer_agent.choices[0].message.content
    except Exception:
        return "{}"

# ─── API Routes ───────────────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {"message": "FundSage AI — Dynamic Fund Search + Random Forest + SHAP"}

@app.get("/api/health")
async def health():
    return {"status": "ok", "model": "ready" if rf_model else "not ready"}

@app.get("/api/fund-types")
async def get_fund_types():
    return {
        "risk_appetite":   ["low", "medium", "high"],
        "time_horizon":    ["short", "medium", "long"],
        "fund_type":       ["equity", "debt", "hybrid", "gold", "index", "others"],
        "investment_type": ["lumpsum", "sip", "swp", "both"],
    }

@app.get("/api/model-info")
async def get_model_info():
    if rf_model is None:
        raise HTTPException(status_code=503, detail="Model not ready")
    return {
        "model_type":       "Random Forest Regressor",
        "n_estimators":     rf_model.n_estimators,
        "max_depth":        rf_model.max_depth,
        "n_features":       len(FEATURE_NAMES),
        "feature_names":    FEATURE_NAMES,
        "training_samples": 3000,
        "explainer_type":   "SHAP TreeExplainer",
        "feature_importances": {
            name: round(float(imp), 4)
            for name, imp in zip(FEATURE_NAMES, rf_model.feature_importances_)
        },
    }
@app.post("/api/recommend")
async def recommend_funds(profile: UserProfile):

    num_requested = min(max(int(profile.num_recommendations or 5), 1), 10)
    fund_type = profile.fund_type.lower()

    # STEP 1 — Get fund universe
    fund_list = await get_fund_list_dynamic(fund_type, num_requested)

    if not fund_list:
        raise HTTPException(status_code=503, detail="Fund universe unavailable")

    # ⭐ LIMIT LOAD (VERY IMPORTANT)
    fund_list = fund_list[:num_requested + 2]
    print("Using reduced fund universe:", len(fund_list))

    semaphore = asyncio.Semaphore(3)

    async def process_fund(info):

        async with semaphore:

            data = await fetch_nav_data(info["code"])

            if not data:
                print("NAV fetch failed:", info["code"])
                return None

            history = data.get("data", [])
            if not history or len(history) < 20:
                return None

            meta = data.get("meta", {})
            returns = get_returns_from_history(history, fund_type)

            fund = {
                "scheme_code": info["code"],
                "scheme_name": info["name"],
                "fund_type": profile.fund_type,
                "nav": float(history[0]["nav"]),
                "nav_date": history[0]["date"],
                "returns_1yr": returns["1yr"],
                "returns_3yr": returns["3yr"],
                "returns_5yr": returns["5yr"],
                "returns_10yr": returns["10yr"],
                "risk_score": calculate_risk_score(history),
                "fund_house": meta.get("fund_house", ""),
            }

            score, confidence, shap_dict, base_val = model_predict_and_explain(fund, profile)

            fund["recommendation_score"] = score
            fund["confidence"] = confidence
            fund["shap_features"] = shap_dict

            return fund

    results = await asyncio.gather(*[process_fund(f) for f in fund_list])

    valid_funds = sorted(
        [f for f in results if f],
        key=lambda x: x["recommendation_score"],
        reverse=True,
    )

    # ⭐ NEVER CRASH USER EXPERIENCE
    if not valid_funds:
        print("All NAV fetch failed — returning mock fallback")

        return {
            "recommendations": [{
                "scheme_name": "Fallback Equity Fund",
                "recommendation_score": 70,
                "risk_score": 5,
                "returns_3yr": 12,
                "explanation": "Live data unavailable. Showing fallback recommendation."
            }],
            "profile": profile.dict(),
            "generated_at": datetime.now().isoformat()
        }

    top_funds = valid_funds[:num_requested]

    return {
        "recommendations": top_funds,
        "profile": profile.dict(),
        "generated_at": datetime.now().isoformat()
    }

@app.get("/api/fund/{scheme_code}/history")
async def get_fund_history(scheme_code: str):
    data = await fetch_nav_data(scheme_code)
    if not data:
        raise HTTPException(status_code=404, detail="Fund not found")
    history = data.get("data", [])
    meta    = data.get("meta", {})
    return {
        "scheme_code":     scheme_code,
        "scheme_name":     meta.get("scheme_name", ""),
        "fund_house":      meta.get("fund_house", ""),
        "scheme_type":     meta.get("scheme_type", ""),
        "scheme_category": meta.get("scheme_category", ""),
        "history": {
            "1yr":  [{"date": d["date"], "nav": float(d["nav"])} for d in history[:365]  if d.get("nav")],
            "3yr":  [{"date": d["date"], "nav": float(d["nav"])} for d in history[:1095] if d.get("nav")],
            "5yr":  [{"date": d["date"], "nav": float(d["nav"])} for d in history[:1825] if d.get("nav")],
            "10yr": [{"date": d["date"], "nav": float(d["nav"])} for d in history[:3650] if d.get("nav")],
        },
    }

@app.get("/api/fund/{scheme_code}/details")
async def get_fund_details(scheme_code: str):
    data = await fetch_nav_data(scheme_code)
    if not data:
        raise HTTPException(status_code=404, detail="Fund not found")
    meta          = data.get("meta", {})
    history       = data.get("data", [])
    isin   = meta.get("isin_growth", "")
    kuvera = await fetch_kuvera_data(isin)
    return {
        "scheme_code":          scheme_code,
        "scheme_name":          meta.get("scheme_name", ""),
        "fund_house":           meta.get("fund_house", ""),
        "scheme_type":          meta.get("scheme_type", ""),
        "scheme_category":      meta.get("scheme_category", ""),
        "isin_growth":          isin,
        "isin_div":             meta.get("isin_div_reinvestment", ""),
        "latest_nav":           float(history[0]["nav"]) if history else 0,
        "nav_date":             history[0]["date"] if history else "",
        "total_nav_records":    len(history),
        "inception_date":       history[-1]["date"] if history else "",
        "expense_ratio":        kuvera.get("expense_ratio"),
        "fund_manager":         kuvera.get("fund_manager"),
        "aum":                  kuvera.get("aum"),
        "fund_rating":          kuvera.get("fund_rating"),
        "investment_objective": kuvera.get("investment_objective"),
        "documents": {
            "factsheet": "https://www.amfiindia.com/research-information/fund-factsheet",
            "sid":       "https://www.amfiindia.com/research-information/sid",
            "amfi_page": "https://www.amfiindia.com/nav-history",
        },
        "guidelines": {
            "min_sip":      500,
            "min_lumpsum":  1000,
            "exit_load":    "1% if redeemed within 1 year (varies by fund)",
            "tax_stcg":     "15% for equity funds held < 1 year",
            "tax_ltcg":     "10% above Rs.1L gain for equity funds held > 1 year",
        },
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

@app.get("/api/beginner-guide")
async def get_beginner_guide():
    return {
        "steps": [
            {"step": 1, "icon": "🛡️", "title": "Understand Your Risk",  "desc": "Assess how much loss you can tolerate. Low risk = debt funds. High risk = equity funds."},
            {"step": 2, "icon": "🎯", "title": "Set Investment Goal",    "desc": "Define why you are investing — retirement, home, child education, or wealth creation."},
            {"step": 3, "icon": "⏱️", "title": "Choose Time Horizon",    "desc": "Short term (<3yr): Debt. Medium (3-7yr): Hybrid. Long term (7yr+): Equity."},
            {"step": 4, "icon": "📊", "title": "Select Fund Type",       "desc": "Equity for growth, Debt for stability, Hybrid for balance, Gold for hedge, Index for passive."},
            {"step": 5, "icon": "💰", "title": "Start SIP or Lumpsum",   "desc": "SIP (monthly) is best for beginners — it averages out market fluctuations over time."},
            {"step": 6, "icon": "📈", "title": "Monitor and Rebalance",  "desc": "Review portfolio every 6 months. Rebalance annually. Stay invested for your horizon."},
        ],
        "faq": [
            {"q": "What is NAV?",            "a": "Net Asset Value — price of one unit of a mutual fund. Higher NAV does not mean expensive."},
            {"q": "What is SIP?",            "a": "Systematic Investment Plan — invest a fixed amount monthly. Best for salaried investors."},
            {"q": "What is CAGR?",           "a": "Compound Annual Growth Rate — annualized return. Better than absolute % for multi-year comparison."},
            {"q": "Is mutual fund safe?",    "a": "Mutual funds are market-linked. Equity can fall short-term but grows long-term. Debt is relatively stable."},
            {"q": "What is exit load?",      "a": "Fee charged if you sell before a specific period. Usually 1% for equity if sold within 1 year."},
            {"q": "Direct vs Regular plan?", "a": "Direct plans have 0.5-1% lower expense ratio = higher returns. Regular plans pay commission to distributor."},
            {"q": "What is expense ratio?",  "a": "Annual fee as % of investment. Lower is better. Index funds (0.1-0.3%) are cheapest. Direct plans save 0.5-1% vs regular."},
        ],
        "glossary": [
            {"term": "AUM",           "def": "Assets Under Management — total money managed by the fund."},
            {"term": "NAV",           "def": "Net Asset Value — price per unit of the fund. Calculated daily."},
            {"term": "SIP",           "def": "Systematic Investment Plan — fixed monthly investment."},
            {"term": "SWP",           "def": "Systematic Withdrawal Plan — fixed monthly withdrawal from corpus."},
            {"term": "ELSS",          "def": "Equity Linked Savings Scheme — tax saving MF with 3-year lock-in. 80C deduction up to Rs.1.5L."},
            {"term": "NFO",           "def": "New Fund Offer — launch of a new mutual fund scheme."},
            {"term": "Benchmark",     "def": "Index used to compare fund performance (e.g., Nifty 50)."},
            {"term": "Alpha",         "def": "Extra return above benchmark by fund manager skill."},
            {"term": "Beta",          "def": "Fund sensitivity to market. Beta > 1 means more volatile than market."},
            {"term": "Sharpe Ratio",  "def": "Risk-adjusted return. Higher is better."},
            {"term": "CAGR",          "def": "Compound Annual Growth Rate — annualized multi-year return."},
            {"term": "Exit Load",     "def": "Fee for early redemption. Discourages short-term trading."},
            {"term": "IDCW",          "def": "Income Distribution cum Capital Withdrawal — previously called dividend."},
            {"term": "Growth Plan",   "def": "Profits reinvested into fund. NAV grows over time. Best for wealth creation."},
            {"term": "Expense Ratio", "def": "Annual fee charged by AMC as % of your investment. Lower = better returns for you. Index funds have lowest (0.1-0.3%)."},
            {"term": "TER",           "def": "Total Expense Ratio — same as expense ratio. SEBI mandates AMCs to publish this daily."},
        ],
    }