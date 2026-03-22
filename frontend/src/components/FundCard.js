import React from 'react';
import './FundCard.css';

export default function FundCard({ fund, rank, isSelected, onClick }) {
  const badge = rank === 1 ? { label: '🥇 Top Pick',    cls: 'gold'   }
              : rank === 2 ? { label: '🥈 Runner Up',   cls: 'silver' }
              : rank === 3 ? { label: '🥉 Strong Pick', cls: 'bronze' }
              :              { label: `#${rank}`,        cls: 'normal' };

  const retColor = (v) =>
    v > 15 ? '#2DCE89' : v > 8 ? '#F0A500' : v > 0 ? '#00B4D8' : v === 0 ? '#8892B0' : '#F5365C';

  const erColor = (er) =>
    er < 0.5 ? '#2DCE89' : er < 1.0 ? '#F0A500' : '#F5365C';

  const fmtAum = (aum) => {
    if (!aum) return null;
    // Kuvera AUM is in crores * 100 (i.e. lakhs)
    const cr = aum / 100;
    if (cr >= 10000) return `₹${(cr / 10000).toFixed(1)}L Cr`;
    return `₹${cr.toFixed(0)} Cr`;
  };

  const ratingStars = (r) => {
    if (!r) return null;
    return '⭐'.repeat(Math.min(Number(r), 5));
  };

  return (
    <div className={`fund-card ${isSelected ? 'selected' : ''}`} onClick={onClick}>

      {/* Top row — rank badge + AI score */}
      <div className="fc-top">
        <span className={`rank-badge rank-${badge.cls}`}>{badge.label}</span>
        <span className="fc-score">{fund.recommendation_score?.toFixed(0)}</span>
      </div>

      {/* Fund name */}
      <h4 className="fc-name">{fund.scheme_name}</h4>
      <p className="fc-house">{fund.fund_house || fund.scheme_category || ''}</p>

      {/* Returns grid */}
      <div className="fc-returns">
        {[
          { label: '1Y',  val: fund.returns_1yr  },
          { label: '3Y',  val: fund.returns_3yr  },
          { label: '5Y',  val: fund.returns_5yr  },
          { label: '10Y', val: fund.returns_10yr },
        ].map(r => (
          <div key={r.label} className="fc-ret">
            <span className="fc-ret-label">{r.label}</span>
            <span className="fc-ret-val" style={{ color: retColor(r.val) }}>
              {r.val > 0 ? `+${r.val}%` : r.val === 0 ? 'N/A' : `${r.val}%`}
            </span>
          </div>
        ))}
      </div>

      {/* Risk bar */}
      <div className="fc-risk">
        <div className="fc-risk-bar">
          <div style={{
            width: `${(fund.risk_score / 10) * 100}%`,
            background: fund.risk_score < 4 ? '#2DCE89' : fund.risk_score < 7 ? '#F0A500' : '#F5365C',
            height: '100%', borderRadius: '2px',
          }}/>
        </div>
        <span className="fc-risk-label">Risk {fund.risk_score?.toFixed(1)}/10</span>
      </div>

      {/* Fund Manager */}
      {fund.fund_manager && (
        <div className="fc-manager">
          <span className="fc-manager-icon">👤</span>
          <span className="fc-manager-name">{fund.fund_manager}</span>
        </div>
      )}

      {/* AUM + Rating row */}
      {(fund.aum || fund.fund_rating) && (
        <div className="fc-meta-row">
          {fund.aum && (
            <div className="fc-aum">
              💼 <span>{fmtAum(fund.aum)}</span>
            </div>
          )}
          {fund.fund_rating && (
            <div className="fc-rating">
              {ratingStars(fund.fund_rating)}
            </div>
          )}
        </div>
      )}

      {/* NAV + Expense Ratio footer */}
      <div className="fc-footer">
        <div className="fc-nav">
          NAV ₹{fund.nav?.toFixed(2)}
          {fund.nav_date && <span className="fc-navdate"> · {fund.nav_date}</span>}
        </div>
        {fund.expense_ratio != null && (
          <div className="fc-er">
            TER: <span style={{ color: erColor(fund.expense_ratio), fontWeight: 700 }}>
              {fund.expense_ratio}%
            </span>
          </div>
        )}
      </div>

    </div>
  );
}