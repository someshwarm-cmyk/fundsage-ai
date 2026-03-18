import React from 'react';
import './FundCard.css';

export default function FundCard({ fund, rank, isSelected, onClick }) {
  const getRankBadge = (r) => {
    if (r === 1) return { label: '🥇 TOP PICK', cls: 'gold' };
    if (r === 2) return { label: '🥈 Runner Up', cls: 'silver' };
    if (r === 3) return { label: '🥉 Strong Pick', cls: 'bronze' };
    return { label: `#${r}`, cls: 'normal' };
  };

  const badge = getRankBadge(rank);
  const returnColor = (val) => {
    if (val > 15) return '#2DCE89';
    if (val > 8) return '#F0A500';
    if (val > 0) return '#00B4D8';
    return '#F5365C';
  };

  return (
    <div className={`fund-card ${isSelected ? 'selected' : ''}`} onClick={onClick}>
      <div className="fund-card-top">
        <div>
          <span className={`rank-badge rank-${badge.cls}`}>{badge.label}</span>
          <h4>{fund.scheme_name}</h4>
        </div>
        <div className="score-circle">
          <svg viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3"/>
            <circle
              cx="20" cy="20" r="16" fill="none"
              stroke={fund.recommendation_score > 70 ? '#2DCE89' : '#F0A500'}
              strokeWidth="3"
              strokeDasharray={`${(fund.recommendation_score / 100) * 100} 100`}
              strokeLinecap="round"
              transform="rotate(-90 20 20)"
            />
          </svg>
          <span>{fund.recommendation_score?.toFixed(0)}</span>
        </div>
      </div>

      <div className="returns-row">
        {[
          { label: '1yr', value: fund.returns_1yr },
          { label: '3yr', value: fund.returns_3yr },
          { label: '5yr', value: fund.returns_5yr },
          { label: '10yr', value: fund.returns_10yr },
        ].map((r) => (
          <div key={r.label} className="return-cell">
            <div className="return-label">{r.label}</div>
            <div className="return-value" style={{ color: returnColor(r.value) }}>
              {r.value > 0 ? `+${r.value}%` : r.value === 0 ? 'N/A' : `${r.value}%`}
            </div>
          </div>
        ))}
      </div>

      <div className="fund-card-meta">
        <div className="meta-item">
          <span className="meta-label">Risk</span>
          <div className="risk-bar">
            <div className="risk-fill" style={{
              width: `${(fund.risk_score / 10) * 100}%`,
              background: fund.risk_score < 4 ? '#2DCE89' : fund.risk_score < 7 ? '#F0A500' : '#F5365C'
            }}/>
          </div>
          <span className="meta-val">{fund.risk_score?.toFixed(1)}/10</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">AI Confidence</span>
          <span className="meta-val confidence">{fund.confidence?.toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
}