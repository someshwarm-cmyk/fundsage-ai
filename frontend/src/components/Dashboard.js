import React from 'react';
import './Dashboard.css';

export default function Dashboard({ user, onGetStarted, onLogout }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  const stats = [
    { icon: '🏦', label: 'Fund Categories', value: '6', sub: 'Equity, Debt, Hybrid, Gold, Index, Others' },
    { icon: '🤖', label: 'AI Agents', value: '3', sub: 'Planner → Analyst → Explainer' },
    { icon: '🌲', label: 'Training Samples', value: '3,000', sub: 'Synthetic investor-fund profiles' },
    { icon: '📊', label: 'ML Features', value: '10', sub: 'Returns, Risk, Profile match' },
  ];

  const quickActions = [
    { icon: '💼', label: 'Equity Funds', desc: 'High growth potential', color: '#2DCE89', type: 'equity' },
    { icon: '🏦', label: 'Debt Funds', desc: 'Stable fixed income', color: '#00B4D8', type: 'debt' },
    { icon: '⚖️', label: 'Hybrid Funds', desc: 'Balanced equity & debt', color: '#F0A500', type: 'hybrid' },
    { icon: '🥇', label: 'Gold Funds', desc: 'Hedge against inflation', color: '#FFD700', type: 'gold' },
    { icon: '📈', label: 'Index Funds', desc: 'Track market indices', color: '#A855F7', type: 'index' },
    { icon: '🏭', label: 'Sectoral Funds', desc: 'Thematic investments', color: '#F5365C', type: 'others' },
  ];

  return (
    <div className="dashboard-page">

      {/* Welcome Banner */}
      <div className="db-welcome">
        <div className="db-welcome-left">
          <img src={user.picture} alt={user.name} className="db-avatar" referrerPolicy="no-referrer" />
          <div>
            <h2>{greeting}, <span>{user.name.split(' ')[0]}!</span></h2>
            <p>{user.email}</p>
            <p className="db-subtitle">Ready to find your perfect mutual fund?</p>
          </div>
        </div>
        <div className="db-welcome-right">
          <button className="db-start-btn" onClick={onGetStarted}>
            ◈ Get AI Recommendations
          </button>
          <button className="db-logout-btn" onClick={onLogout}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="db-stats">
        {stats.map(s => (
          <div key={s.label} className="db-stat-card">
            <span className="db-stat-icon">{s.icon}</span>
            <div className="db-stat-value">{s.value}</div>
            <div className="db-stat-label">{s.label}</div>
            <div className="db-stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* How it Works */}
      <div className="db-section">
        <h3 className="db-section-title">🔄 How FundSage AI Works</h3>
        <div className="db-pipeline">
          {[
            { step: '1', icon: '👤', label: 'Your Profile', desc: 'Risk appetite, horizon, amount' },
            { step: '2', icon: '🔍', label: 'Fund Discovery', desc: '15 queries × MFAPI.in' },
            { step: '3', icon: '📊', label: 'NAV Fetching', desc: 'Live data, parallel async' },
            { step: '4', icon: '🌲', label: 'ML Scoring', desc: 'Random Forest [0-100]' },
            { step: '5', icon: '💡', label: 'SHAP XAI', desc: 'Exact feature attribution' },
            { step: '6', icon: '🤖', label: 'AI Narration', desc: '3-agent LLaMA3 pipeline' },
            { step: '7', icon: '📋', label: 'Results', desc: 'Dashboard + PDF report' },
          ].map((s, i, arr) => (
            <React.Fragment key={s.step}>
              <div className="db-pipe-step">
                <div className="db-pipe-icon">{s.icon}</div>
                <div className="db-pipe-num">{s.step}</div>
                <div className="db-pipe-label">{s.label}</div>
                <div className="db-pipe-desc">{s.desc}</div>
              </div>
              {i < arr.length - 1 && <div className="db-pipe-arrow">→</div>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Quick Start by Fund Type */}
      <div className="db-section">
        <h3 className="db-section-title">⚡ Quick Start by Fund Type</h3>
        <div className="db-quick-grid">
          {quickActions.map(a => (
            <div key={a.type} className="db-quick-card" onClick={onGetStarted}
              style={{ borderColor: `${a.color}33` }}>
              <span className="db-quick-icon" style={{ color: a.color }}>{a.icon}</span>
              <strong>{a.label}</strong>
              <p>{a.desc}</p>
              <span className="db-quick-cta" style={{ color: a.color }}>Explore →</span>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="db-disclaimer">
        ⚠️ FundSage AI is for educational purposes only. Not SEBI-registered investment advice.
        Data sourced from AMFI/MFAPI.in · Powered by Random Forest + SHAP + Groq LLaMA3
      </div>
    </div>
  );
}
