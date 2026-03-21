import React, { useState } from 'react';
import './InputForm.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const FUND_TYPE_INFO = {
  equity: { icon: '📊', label: 'Equity',  desc: 'High growth potential',    detail: 'Invest in stocks. Best for long-term wealth creation. High risk, high reward.' },
  debt:   { icon: '🏦', label: 'Debt',    desc: 'Stable fixed income',      detail: 'Invest in bonds/securities. Low risk, steady returns. Good for short-medium term.' },
  hybrid: { icon: '🔀', label: 'Hybrid',  desc: 'Mix of equity & debt',     detail: 'Balanced approach. Moderate risk and return. Good for medium-term goals.' },
  gold:   { icon: '🥇', label: 'Gold',    desc: 'Hedge against inflation',   detail: 'Invest in gold digitally. Acts as hedge. Good diversification tool.' },
  index:  { icon: '📉', label: 'Index',   desc: 'Track market indices',      detail: 'Mirror Nifty/Sensex. Low cost, passive investing. Great for beginners.' },
  others: { icon: '🌐', label: 'Others',  desc: 'Sectoral & thematic funds', detail: 'Technology, pharma, infrastructure funds. High risk, sector-specific.' },
};

const INVEST_TYPE_INFO = {
  lumpsum: { icon: '💰', label: 'Lumpsum', desc: 'One-time investment',           detail: 'Invest entire amount at once. Good when markets are low.' },
  sip:     { icon: '🔄', label: 'SIP',     desc: 'Monthly fixed investment',      detail: 'Invest fixed amount every month. Best for salaried. Averages market risk.' },
  swp:     { icon: '💸', label: 'SWP',     desc: 'Monthly withdrawal plan',       detail: 'Withdraw fixed amount regularly from corpus. Best for retirees.' },
  both:    { icon: '⚡', label: 'Both',    desc: 'Lumpsum + SIP combined',        detail: 'Start with lumpsum then continue with monthly SIP contributions.' },
};

export default function InputForm({ onSubmit, loading }) {
  const [profile, setProfile] = useState({
    risk_appetite:       'medium',
    time_horizon:        'medium',
    fund_type:           'equity',
    investment_type:     'sip',
    investment_amount:   10000,
    num_recommendations: 5,
  });
  const [hoveredFund,   setHoveredFund]   = useState(null);
  const [hoveredInvest, setHoveredInvest] = useState(null);

  const set = (key, val) => setProfile(p => ({ ...p, [key]: val }));

  const formatAmount = (val) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000)   return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000)     return `₹${(val / 1000).toFixed(0)}K`;
    return `₹${val}`;
  };

  const riskConfig = {
    low:    { icon: '🛡️', label: 'Low',    desc: 'Capital safety first',    color: '#2DCE89', tip: 'Best for: Debt funds, FDs, Liquid funds. Suitable if you cannot afford losses.' },
    medium: { icon: '⚖️', label: 'Medium', desc: 'Balanced growth & safety', color: '#F0A500', tip: 'Best for: Hybrid funds, Large-cap equity. Suitable for most investors.' },
    high:   { icon: '🚀', label: 'High',   desc: 'Maximum growth potential', color: '#F5365C', tip: 'Best for: Mid/small-cap, sectoral funds. Suitable if you have 7+ year horizon.' },
  };

  const horizonConfig = {
    short:  { icon: '⚡', label: 'Short',  desc: '< 3 years',  tip: 'Best for: Debt, liquid, money market funds. Goal: Emergency fund, vacation, gadget.' },
    medium: { icon: '📈', label: 'Medium', desc: '3–7 years',  tip: 'Best for: Hybrid, large-cap equity. Goal: Car, home down payment, child education.' },
    long:   { icon: '🏆', label: 'Long',   desc: '7+ years',   tip: 'Best for: Equity, index funds. Goal: Retirement, wealth creation, child marriage.' },
  };

  return (
    <div className="input-form">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div className="form-hero">
        <div className="hero-icon">◈</div>
        <h1 className="hero-title">FundSage <span>AI</span></h1>
        <p className="hero-sub">Your intelligent mutual fund advisor — powered by Agentic AI, Random Forest & SHAP Explainability</p>
        <div className="hero-pills">
          <span>🤖 3-Agent AI Pipeline</span>
          <span>🌲 Random Forest Model</span>
          <span>🔍 SHAP Explainability</span>
          <span>📡 Live AMFI Data</span>
        </div>
      </div>

      {/* ── Risk Appetite ─────────────────────────────────────────────── */}
      <div className="form-section">
        <div className="section-header">
          <label className="form-label">Risk Appetite</label>
          <span className="section-hint">How much loss can you tolerate?</span>
        </div>
        <div className="option-group three-col">
          {Object.entries(riskConfig).map(([key, cfg]) => (
            <button
              key={key}
              className={`option-btn risk-btn risk-${key} ${profile.risk_appetite === key ? 'active' : ''}`}
              onClick={() => set('risk_appetite', key)}
            >
              <span className="opt-icon">{cfg.icon}</span>
              <span className="opt-label">{cfg.label}</span>
              <span className="opt-desc">{cfg.desc}</span>
              <span className="opt-tip">{cfg.tip}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Time Horizon ──────────────────────────────────────────────── */}
      <div className="form-section">
        <div className="section-header">
          <label className="form-label">Investment Horizon</label>
          <span className="section-hint">How long will you stay invested?</span>
        </div>
        <div className="option-group three-col">
          {Object.entries(horizonConfig).map(([key, cfg]) => (
            <button
              key={key}
              className={`option-btn horizon-btn ${profile.time_horizon === key ? 'active' : ''}`}
              onClick={() => set('time_horizon', key)}
            >
              <span className="opt-icon">{cfg.icon}</span>
              <span className="opt-label">{cfg.label}</span>
              <span className="opt-desc">{cfg.desc}</span>
              <span className="opt-tip">{cfg.tip}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Fund Type ─────────────────────────────────────────────────── */}
      <div className="form-section">
        <div className="section-header">
          <label className="form-label">Fund Type</label>
          <span className="section-hint">What kind of fund do you want?</span>
        </div>
        <div className="option-group six-col">
          {Object.entries(FUND_TYPE_INFO).map(([key, cfg]) => (
            <button
              key={key}
              className={`option-btn fund-btn ${profile.fund_type === key ? 'active' : ''}`}
              onClick={() => set('fund_type', key)}
              onMouseEnter={() => setHoveredFund(key)}
              onMouseLeave={() => setHoveredFund(null)}
            >
              <span className="opt-icon">{cfg.icon}</span>
              <span className="opt-label">{cfg.label}</span>
              <span className="opt-desc">{cfg.desc}</span>
            </button>
          ))}
        </div>
        {hoveredFund && (
          <div className="info-banner">
            <span className="info-icon">{FUND_TYPE_INFO[hoveredFund].icon}</span>
            <div>
              <strong>{FUND_TYPE_INFO[hoveredFund].label} Fund</strong>
              <p>{FUND_TYPE_INFO[hoveredFund].detail}</p>
            </div>
          </div>
        )}
        {!hoveredFund && profile.fund_type && (
          <div className="info-banner selected">
            <span className="info-icon">{FUND_TYPE_INFO[profile.fund_type]?.icon}</span>
            <div>
              <strong>{FUND_TYPE_INFO[profile.fund_type]?.label} Fund Selected</strong>
              <p>{FUND_TYPE_INFO[profile.fund_type]?.detail}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Investment Type ───────────────────────────────────────────── */}
      <div className="form-section">
        <div className="section-header">
          <label className="form-label">Investment Type</label>
          <span className="section-hint">How do you want to invest?</span>
        </div>
        <div className="option-group four-col">
          {Object.entries(INVEST_TYPE_INFO).map(([key, cfg]) => (
            <button
              key={key}
              className={`option-btn invest-btn ${profile.investment_type === key ? 'active' : ''}`}
              onClick={() => set('investment_type', key)}
              onMouseEnter={() => setHoveredInvest(key)}
              onMouseLeave={() => setHoveredInvest(null)}
            >
              <span className="opt-icon">{cfg.icon}</span>
              <span className="opt-label">{cfg.label}</span>
              <span className="opt-desc">{cfg.desc}</span>
            </button>
          ))}
        </div>
        {(hoveredInvest || profile.investment_type) && (
          <div className="info-banner">
            <span className="info-icon">
              {INVEST_TYPE_INFO[hoveredInvest || profile.investment_type]?.icon}
            </span>
            <div>
              <strong>{INVEST_TYPE_INFO[hoveredInvest || profile.investment_type]?.label}</strong>
              <p>{INVEST_TYPE_INFO[hoveredInvest || profile.investment_type]?.detail}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Investment Amount ─────────────────────────────────────────── */}
      <div className="form-section">
        <div className="section-header">
          <label className="form-label">
            {profile.investment_type === 'swp'     ? 'Corpus Amount' :
             profile.investment_type === 'sip'     ? 'Monthly SIP Amount' :
             profile.investment_type === 'lumpsum' ? 'Lumpsum Amount' :
             'Investment Amount'}
          </label>
          <span className="amount-display">{formatAmount(profile.investment_amount)}</span>
        </div>
        <input
          type="range"
          min="500"
          max="10000000"
          step="500"
          value={profile.investment_amount}
          onChange={e => set('investment_amount', Number(e.target.value))}
          className="amount-slider"
        />
        <div className="slider-labels">
          <span>₹500</span>
          <span>₹5K</span>
          <span>₹50K</span>
          <span>₹5L</span>
          <span>₹1Cr</span>
        </div>
        <div className="amount-quickset">
          {[1000, 5000, 10000, 25000, 50000, 100000].map(amt => (
            <button
              key={amt}
              className={`quick-btn ${profile.investment_amount === amt ? 'active' : ''}`}
              onClick={() => set('investment_amount', amt)}
            >
              {formatAmount(amt)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Number of Recommendations ─────────────────────────────────── */}
      <div className="form-section">
        <div className="section-header">
          <label className="form-label">Number of Recommendations</label>
          <span className="amount-display">{profile.num_recommendations} funds</span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          step="1"
          value={profile.num_recommendations}
          onChange={e => set('num_recommendations', Number(e.target.value))}
          className="amount-slider"
        />
        <div className="slider-labels num-labels">
          {[1,2,3,4,5,6,7,8,9,10].map(n => (
            <span key={n} className={profile.num_recommendations === n ? 'active-tick' : ''}>{n}</span>
          ))}
        </div>
        <p className="num-hint">
          {profile.num_recommendations <= 3 ? '✦ Focused — top picks only' :
           profile.num_recommendations <= 6 ? '✦ Balanced — good variety' :
           '✦ Comprehensive — full comparison'}
        </p>
      </div>

      {/* ── Profile Summary ───────────────────────────────────────────── */}
      <div className="profile-summary">
        <div className="ps-title">Your Investment Profile</div>
        <div className="ps-grid">
          <div className="ps-item">
            <span className="ps-label">Risk</span>
            <span className="ps-value" style={{ color: riskConfig[profile.risk_appetite]?.color }}>
              {riskConfig[profile.risk_appetite]?.icon} {profile.risk_appetite}
            </span>
          </div>
          <div className="ps-item">
            <span className="ps-label">Horizon</span>
            <span className="ps-value">{horizonConfig[profile.time_horizon]?.icon} {profile.time_horizon} term</span>
          </div>
          <div className="ps-item">
            <span className="ps-label">Fund</span>
            <span className="ps-value">{FUND_TYPE_INFO[profile.fund_type]?.icon} {profile.fund_type}</span>
          </div>
          <div className="ps-item">
            <span className="ps-label">Type</span>
            <span className="ps-value">{INVEST_TYPE_INFO[profile.investment_type]?.icon} {profile.investment_type}</span>
          </div>
          <div className="ps-item">
            <span className="ps-label">Amount</span>
            <span className="ps-value">💰 {formatAmount(profile.investment_amount)}</span>
          </div>
          <div className="ps-item">
            <span className="ps-label">Funds</span>
            <span className="ps-value">📋 {profile.num_recommendations}</span>
          </div>
        </div>
      </div>

      {/* ── Submit ────────────────────────────────────────────────────── */}
      <button
        className={`submit-btn ${loading ? 'loading' : ''}`}
        onClick={() => !loading && onSubmit(profile)}
        disabled={loading}
      >
        {loading ? (
          <><span className="spinner" /> Analysing {profile.num_recommendations} funds with AI...</>
        ) : (
          <>◈ Get {profile.num_recommendations} AI Recommendations</>
        )}
      </button>

      <p className="form-disclaimer">
        ⚠️ For educational purposes only. Not financial advice. Consult a SEBI-registered advisor.
      </p>
    </div>
  );
}