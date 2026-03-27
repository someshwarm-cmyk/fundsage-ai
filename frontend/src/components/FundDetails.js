import React, { useState, useEffect } from 'react';
import './FundDetails.css';

export default function FundDetails({ fund, apiBase }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    if (!fund?.scheme_code) return;

    let isActive = true;
    setLoading(true);

    const fallback = {
      scheme_code: fund.scheme_code,
      scheme_name: fund.scheme_name,
      fund_house: fund.fund_house || '',
      scheme_type: fund.scheme_type || 'Open Ended Schemes',
      scheme_category: fund.scheme_category || '',
      isin_growth: fund.isin || '',
      isin_div: '',
      latest_nav: fund.nav,
      nav_date: fund.nav_date,
      total_nav_records: null,
      inception_date: null,
      expense_ratio: fund.expense_ratio,
      fund_manager: fund.fund_manager,
      aum: fund.aum,
      fund_rating: fund.fund_rating,
      investment_objective: fund.investment_objective || null,

      // ✅ ALWAYS PRESENT
      documents: {
        factsheet: 'https://www.amfiindia.com/research-information/fund-factsheet',
        sid: 'https://www.amfiindia.com/research-information/sid',
      },

      guidelines: {
        min_sip: 500,
        min_lumpsum: 1000,
        exit_load: '1% if redeemed within 1 year (varies)',
        tax_stcg: '20%',
        tax_ltcg: '10%',
      }
    };

    const url = `${apiBase}/api/fund/${fund.scheme_code}/details`;

    fetch(url)
      .then(r => {
        if (!r.ok) throw new Error('API error');
        return r.json();
      })
      .then(d => {
        if (isActive) {

          // ✅ MERGE FIX (IMPORTANT)
          const merged = {
            ...fallback,
            ...d,

            // ✅ FORCE CORRECT FUND (fix HDFC bug)
            scheme_name: fund.scheme_name,
            fund_house: fund.fund_house,
            scheme_category: fund.scheme_category,

            // ✅ Ensure sections never disappear
            documents: d.documents || fallback.documents,
            guidelines: d.guidelines || fallback.guidelines,
          };

          setDetails(merged);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isActive) {
          setDetails(fallback);
          setLoading(false);
        }
      });

    return () => {
      isActive = false;
    };

  }, [fund]); // ✅ FIXED

  if (loading) return (
    <div className="fd-loading">
      <div className="fd-spinner" />
      <p>Fetching fund details...</p>
    </div>
  );

  if (!details) return null;

  const SECTIONS = [
    { key: 'overview', label: '📋 Overview' },
    { key: 'returns', label: '📈 Returns' },
    { key: 'documents', label: '📄 Documents' },
    { key: 'tax', label: '💸 Tax & Costs' },
    { key: 'guidelines', label: '📚 Guidelines' },
  ];

  const erColor = (er) =>
    er < 0.5 ? '#2DCE89' : er < 1.0 ? '#F0A500' : '#F5365C';

  const fmtAum = (aum) => {
    if (!aum) return 'N/A';
    const cr = aum / 100;
    return `₹${cr.toFixed(0)} Cr`;
  };

  const ratingStars = (r) => {
    if (!r) return 'N/A';
    const n = Math.min(Number(r), 5);
    return '⭐'.repeat(n) + ` ${n}/5`;
  };

  return (
    <div className="fund-details">

      {/* HEADER */}
      <div className="fd-header">
        <div className="fd-logo">{details.fund_house?.charAt(0) || 'F'}</div>
        <div>
          <h3>{details.scheme_name}</h3>
          <p>{details.fund_house} · {details.scheme_category}</p>
        </div>
      </div>

      {/* TABS */}
      <div className="fd-tabs">
        {SECTIONS.map(s => (
          <button key={s.key}
            className={activeSection === s.key ? 'active' : ''}
            onClick={() => setActiveSection(s.key)}>
            {s.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {activeSection === 'overview' && (
        <div>
          <p><b>Fund Manager:</b> {details.fund_manager || 'N/A'}</p>
          <p><b>AUM:</b> {fmtAum(details.aum)}</p>
          <p><b>Expense Ratio:</b> {details.expense_ratio}%</p>
          <p>{details.investment_objective}</p>
        </div>
      )}

      {/* RETURNS */}
      {activeSection === 'returns' && (
        <div>
          <p>1Y: {fund.returns_1yr || 'N/A'}%</p>
          <p>3Y: {fund.returns_3yr || 'N/A'}%</p>
          <p>5Y: {fund.returns_5yr || 'N/A'}%</p>
        </div>
      )}

      {/* DOCUMENTS */}
      {activeSection === 'documents' && (
        <div>
          <a href={details.documents.factsheet} target="_blank">Factsheet</a><br />
          <a href={details.documents.sid} target="_blank">SID</a>
        </div>
      )}

      {/* TAX */}
      {activeSection === 'tax' && (
        <div>
          <p>STCG: {details.guidelines.tax_stcg}</p>
          <p>LTCG: {details.guidelines.tax_ltcg}</p>
        </div>
      )}

      {/* GUIDELINES */}
      {activeSection === 'guidelines' && (
        <div>
          <p>Min SIP: ₹{details.guidelines.min_sip}</p>
          <p>Min Lumpsum: ₹{details.guidelines.min_lumpsum}</p>
          <p>Exit Load: {details.guidelines.exit_load}</p>
        </div>
      )}

    </div>
  );
}