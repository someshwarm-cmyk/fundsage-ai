import React, { useState } from 'react';
import './XAIPanel.css';

export default function XAIPanel({ fund, profile }) {
  const [expanded, setExpanded] = useState(true);

  const shap = fund.shap_features || {};
  const shapEntries = Object.entries(shap).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
  const maxVal = Math.max(...shapEntries.map(([_, v]) => Math.abs(v)), 0.001);

  const featureLabels = {
    '1yr_return':      '1-Year Return Performance',
    '3yr_return':      '3-Year Return Performance',
    '5yr_return':      '5-Year Return Performance',
    '10yr_return':     '10-Year Return Performance',
    'risk_alignment':  'Risk Profile Alignment',
    'fund_type_match': 'Fund Type Match',
    'investment_type': 'Investment Type Bonus',
  };

  const featureIcons = {
    '1yr_return':      '📈',
    '3yr_return':      '📊',
    '5yr_return':      '📉',
    '10yr_return':     '🏆',
    'risk_alignment':  '🛡️',
    'fund_type_match': '🎯',
    'investment_type': '💰',
  };

  const riskLabel = {
    low:    { text: 'Conservative', color: '#2DCE89', desc: 'Prioritises capital safety' },
    medium: { text: 'Balanced',     color: '#F0A500', desc: 'Balances growth and safety' },
    high:   { text: 'Aggressive',   color: '#F5365C', desc: 'Maximises growth potential' },
  };

  const r = riskLabel[profile.risk_appetite] || riskLabel.medium;

  return (
    <div className="xai-panel">
      <div className="xai-header" onClick={() => setExpanded(!expanded)}>
        <div className="xai-title">
          <span className="xai-icon">🔍</span>
          <div>
            <h4>Explainable AI Analysis</h4>
            <p>Why this fund was recommended for you</p>
          </div>
        </div>
        <button className="xai-toggle">{expanded ? '▲' : '▼'}</button>
      </div>

      {expanded && (
        <div className="xai-body">

          {/* AI Explanation */}
          <div className="ai-explanation">
            <div className="explanation-label">🤖 AI Agent Explanation</div>
            <p>{fund.explanation || 'AI explanation unavailable'}</p>
          </div>

          {/* Profile Match */}
          <div className="profile-match">
            <div className="match-header">Investor Profile Match</div>
            <div className="match-grid">
              <div className="match-item">
                <div className="match-label">Risk Profile</div>
                <div className="match-badge" style={{ color: r.color, borderColor: r.color }}>
                  {r.text}
                </div>
                <div className="match-desc">{r.desc}</div>
              </div>
              <div className="match-item">
                <div className="match-label">Time Horizon</div>
                <div className="match-badge" style={{ color: '#00B4D8', borderColor: '#00B4D8' }}>
                  {profile.time_horizon} term
                </div>
                <div className="match-desc">Optimal holding period</div>
              </div>
              <div className="match-item">
                <div className="match-label">Fund Match</div>
                <div className="match-badge" style={{ color: '#2DCE89', borderColor: '#2DCE89' }}>
                  {profile.fund_type}
                </div>
                <div className="match-desc">Your preferred category</div>
              </div>
            </div>
          </div>

          {/* SHAP Feature Importance */}
          <div className="shap-section">
            <div className="shap-header">
              <span>📊 Feature Importance (SHAP Values)</span>
              <span className="shap-sub">How much each factor contributed</span>
            </div>
            <div className="shap-bars">
              {shapEntries.map(([feature, value]) => (
                <div key={feature} className="shap-row">
                  <div className="shap-feature">
                    <span className="shap-icon">{featureIcons[feature] || '•'}</span>
                    <span>{featureLabels[feature] || feature}</span>
                  </div>
                  <div className="shap-bar-wrapper">
                    <div className="shap-bar" style={{
                      width: `${(Math.abs(value) / maxVal) * 100}%`,
                      background: value > 0
                        ? 'linear-gradient(90deg, #2DCE89, #00B4D8)'
                        : 'linear-gradient(90deg, #F5365C, #F0A500)',
                    }}/>
                  </div>
                  <div className="shap-value" style={{ color: value > 0 ? '#2DCE89' : '#F5365C' }}>
                    {value > 0 ? '+' : ''}{value.toFixed(3)}
                  </div>
                </div>
              ))}
            </div>
            <div className="shap-legend">
              <span style={{ color: '#2DCE89' }}>■ Positive contribution</span>
              <span style={{ color: '#F5365C' }}>■ Negative contribution</span>
            </div>
          </div>

          {/* Risk Metrics */}
          <div className="risk-metrics">
            <div className="metric-title">Risk Metrics</div>
            <div className="metrics-row">
              {[
                { label: 'Volatility Score',      value: `${fund.risk_score?.toFixed(2)}/10`,           pct: (fund.risk_score / 10) * 100,       color: fund.risk_score < 4 ? '#2DCE89' : fund.risk_score < 7 ? '#F0A500' : '#F5365C' },
                { label: 'AI Confidence',         value: `${fund.confidence?.toFixed(0)}%`,             pct: fund.confidence,                    color: '#00B4D8' },
                { label: 'Recommendation Score',  value: `${fund.recommendation_score?.toFixed(0)}/100`, pct: fund.recommendation_score,          color: '#F0A500' },
              ].map((m) => (
                <div key={m.label} className="metric">
                  <div className="metric-label">{m.label}</div>
                  <div className="metric-value" style={{ color: m.color }}>{m.value}</div>
                  <div className="metric-bar">
                    <div style={{ width: `${m.pct}%`, background: m.color, height: '100%', borderRadius: '2px' }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="xai-disclaimer">
            ⚠️ This is an educational AI recommendation. Please consult a SEBI-registered financial advisor before investing.
          </div>
        </div>
      )}
    </div>
  );
}