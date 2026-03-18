import React, { useState } from 'react';
import './InputForm.css';

const INVESTMENT_TYPE_INFO = {
  lumpsum: "One-time investment of the full amount",
  sip:     "Systematic Investment Plan — fixed monthly investment",
  swp:     "Systematic Withdrawal Plan — regular withdrawal from corpus",
  both:    "Combination of Lumpsum and SIP",
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

  const set = (key, val) => setProfile(p => ({ ...p, [key]: val }));

  const handleSubmit = () => {
    if (!loading) onSubmit(profile);
  };

  const formatAmount = (val) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000)   return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000)     return `₹${(val / 1000).toFixed(0)}K`;
    return `₹${val}`;
  };

  return (
    <div className="input-form">

      {/* Header */}
      <div className="form-header">
        <div className="form-logo">
          <span className="logo-icon">◈</span>
          <span className="logo-text">FundSage <span className="logo-ai">AI</span></span>
        </div>
        <p className="form-tagline">
          Agentic AI · Random Forest · SHAP Explainability
        </p>
      </div>

      {/* ── Risk Appetite ───────────────────────────────────────────── */}
      <div className="form-section">
        <label className="form-label">Risk Appetite</label>
        <div className="option-group">
          {["low", "medium", "high"].map(opt => (
            <button
              key={opt}
              className={`option-btn risk-${opt} ${profile.risk_appetite === opt ? 'active' : ''}`}
              onClick={() => set('risk_appetite', opt)}
            >
              <span className="opt-icon">
                {opt === 'low' ? '🛡️' : opt === 'medium' ? '⚖️' : '🚀'}
              </span>
              <span className="opt-label">{opt.charAt(0).toUpperCase() + opt.slice(1)}</span>
              <span className="opt-desc">
                {opt === 'low'    ? 'Capital safety'  :
                 opt === 'medium' ? 'Balanced growth' : 'High returns'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Time Horizon ────────────────────────────────────────────── */}
      <div className="form-section">
        <label className="form-label">Investment Horizon</label>
        <div className="option-group">
          {[
            { val: 'short',  label: 'Short',  desc: '< 3 years',  icon: '⚡' },
            { val: 'medium', label: 'Medium', desc: '3–7 years',  icon: '📈' },
            { val: 'long',   label: 'Long',   desc: '7+ years',   icon: '🏆' },
          ].map(({ val, label, desc, icon }) => (
            <button
              key={val}
              className={`option-btn ${profile.time_horizon === val ? 'active' : ''}`}
              onClick={() => set('time_horizon', val)}
            >
              <span className="opt-icon">{icon}</span>
              <span className="opt-label">{label}</span>
              <span className="opt-desc">{desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Fund Type ───────────────────────────────────────────────── */}
      <div className="form-section">
        <label className="form-label">Fund Type</label>
        <div className="option-group">
          {[
            { val: 'equity', label: 'Equity',  desc: 'High growth',     icon: '📊' },
            { val: 'debt',   label: 'Debt',    desc: 'Stable income',   icon: '🏦' },
            { val: 'hybrid', label: 'Hybrid',  desc: 'Mix of both',     icon: '🔀' },
            { val: 'index',  label: 'Index',   desc: 'Market tracking', icon: '📉' },
          ].map(({ val, label, desc, icon }) => (
            <button
              key={val}
              className={`option-btn ${profile.fund_type === val ? 'active' : ''}`}
              onClick={() => set('fund_type', val)}
            >
              <span className="opt-icon">{icon}</span>
              <span className="opt-label">{label}</span>
              <span className="opt-desc">{desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Investment Type ─────────────────────────────────────────── */}
      <div className="form-section">
        <label className="form-label">Investment Type</label>
        <div className="option-group invest-group">
          {[
            { val: 'lumpsum', label: 'Lumpsum', icon: '💰' },
            { val: 'sip',     label: 'SIP',     icon: '🔄' },
            { val: 'swp',     label: 'SWP',     icon: '💸' },
            { val: 'both',    label: 'Both',    icon: '⚡' },
          ].map(({ val, label, icon }) => (
            <button
              key={val}
              className={`option-btn invest-btn ${profile.investment_type === val ? 'active' : ''}`}
              onClick={() => set('investment_type', val)}
              title={INVESTMENT_TYPE_INFO[val]}
            >
              <span className="opt-icon">{icon}</span>
              <span className="opt-label">{label}</span>
              <span className="opt-desc invest-desc">
                {INVESTMENT_TYPE_INFO[val]}
              </span>
            </button>
          ))}
        </div>
        {/* SWP info banner */}
        {profile.investment_type === 'swp' && (
          <div className="swp-info">
            <span>💡</span>
            <span>
              SWP allows you to withdraw a fixed amount regularly from your
              invested corpus. Best suited for retirees or those needing
              regular income from investments.
            </span>
          </div>
        )}
      </div>

      {/* ── Investment Amount ───────────────────────────────────────── */}
      <div className="form-section">
        <label className="form-label">
          {profile.investment_type === 'swp'
            ? 'Corpus Amount'
            : profile.investment_type === 'sip'
            ? 'Monthly SIP Amount'
            : 'Investment Amount'}
          <span className="amount-display">{formatAmount(profile.investment_amount)}</span>
        </label>
        <input
          type="range"
          min="1000"
          max="10000000"
          step="1000"
          value={profile.investment_amount}
          onChange={e => set('investment_amount', Number(e.target.value))}
          className="amount-slider"
        />
        <div className="slider-labels">
          <span>₹1K</span>
          <span>₹10K</span>
          <span>₹1L</span>
          <span>₹10L</span>
          <span>₹1Cr</span>
        </div>
      </div>

      {/* ── Number of Recommendations ───────────────────────────────── */}
      <div className="form-section">
        <label className="form-label">
          Number of Fund Recommendations
          <span className="amount-display">{profile.num_recommendations} funds</span>
        </label>
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
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
            <span
              key={n}
              className={profile.num_recommendations === n ? 'active-tick' : ''}
            >
              {n}
            </span>
          ))}
        </div>
        <p className="num-hint">
          {profile.num_recommendations <= 3
            ? '✦ Focused — best picks only'
            : profile.num_recommendations <= 6
            ? '✦ Balanced — good variety'
            : '✦ Comprehensive — full comparison'}
        </p>
      </div>

      {/* ── Submit ──────────────────────────────────────────────────── */}
      <button
        className={`submit-btn ${loading ? 'loading' : ''}`}
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <>
            <span className="spinner" />
            Analysing {profile.num_recommendations} funds with AI...
          </>
        ) : (
          <>
            ◈ Get {profile.num_recommendations} AI Recommendations
          </>
        )}
      </button>

    </div>
  );
}