[fund_sage_ai_readme.md](https://github.com/user-attachments/files/26312789/fund_sage_ai_readme.md)
# FundSage AI 🚀

**FundSage AI** is an intelligent mutual fund recommendation system that leverages **Machine Learning, Agentic AI, and Explainable AI (XAI)** to provide personalized, transparent, and data-driven investment insights.

🌐 **Live App:** https://fundsage-frontend.onrender.com/

---

## 📌 Overview

The growing number of mutual fund options makes it difficult for investors to make informed decisions. FundSage AI addresses this by:

- Providing **personalized recommendations** based on user profile
- Using **Explainable AI (SHAP)** for transparency
- Generating **AI-driven investment insights** using multi-agent systems

---

## 🎯 Key Features

- 🔍 Dynamic Mutual Fund Discovery (Live API-based)
- 🤖 Machine Learning-based Recommendation Engine (Random Forest)
- 📊 Explainable AI using SHAP (feature contribution analysis)
- 🧠 Agentic AI (Planner → Analyst → Explainer pipeline)
- 📈 Investment Simulator (SIP, Lumpsum, SWP)
- 📄 PDF Report Generation
- 📊 Interactive Dashboard with fund insights

---

## 🏗️ Tech Stack

### Frontend
- React.js
- Chart.js
- jsPDF

### Backend
- FastAPI (Python)
- Scikit-learn (Random Forest)
- SHAP (Explainability)
- Groq LLaMA3 API (Agentic AI)

### Data Sources
- MFAPI (Live NAV Data)
- Kuvera API (Fund details: TER, AUM, Manager)

---

## ⚙️ System Architecture

The system follows a **3-layer architecture**:

1. **Data Layer**
   - MFAPI for NAV data
   - Kuvera API for fund enrichment

2. **Application Layer**
   - FastAPI backend
   - ML model + SHAP explainability
   - Agentic AI pipeline

3. **Presentation Layer**
   - React frontend
   - Visualization dashboards

---

## 🧠 How It Works

1. User inputs:
   - Risk Appetite
   - Investment Horizon
   - Fund Type
   - Investment Amount

2. System performs:
   - Dynamic fund discovery
   - NAV processing & return calculation
   - Risk scoring (volatility-based)
   - ML prediction (Random Forest)
   - SHAP explanation generation
   - AI-based narrative generation

3. Output:
   - Ranked mutual fund recommendations
   - Explainable insights
   - Investment projections

---

## 📊 Machine Learning Model

- **Model:** Random Forest Regressor
- **Features:**
  - Returns (1Y, 3Y, 5Y, 10Y)
  - Risk score
  - Risk match score
  - Fund type match
  - Investment amount (log scale)

- **Explainability:**
  - SHAP TreeExplainer for feature contribution

---

## 🤖 Agentic AI Pipeline

- **Planner Agent** → Defines investment strategy
- **Analyst Agent** → Evaluates fund suitability
- **Explainer Agent** → Generates user-friendly insights

---

## 🚀 Deployment

- **Frontend:** Render (Static Site)
- **Backend:** Render (Web Service)
- **CI/CD:** GitHub Auto Deployment

---

## 📈 Future Enhancements

- Portfolio optimization
- Stock and ETF recommendations
- Mobile application
- Advanced risk profiling

---

## 📎 Project Links

- 🌐 Live App: https://fundsage-frontend.onrender.com/
- 💻 GitHub: https://github.com/someshwarm-cmyk/fundsage-ai

---

## 👨‍💻 Author

**Someshwar M**  
MSc Data Analytics  
CHRIST (Deemed to be University)

---

## ⭐ Acknowledgements

- MFAPI for open mutual fund data
- Kuvera API for fund metadata
- Groq for LLaMA3 API access
- Open-source community (FastAPI, React, SHAP, scikit-learn)

---

## 📢 Note

This project is developed for **academic purposes** and should not be considered financial advice.

