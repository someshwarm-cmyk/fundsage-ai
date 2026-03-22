import React, { useState, useEffect } from 'react';
import './FundDetails.css';

export default function FundDetails({ fund, apiBase }) {
  const [details,       setDetails]       = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    if (!fund?.scheme_code) return;
    setLoading(true);
    fetch(`${apiBase}/api/fund/${fund.scheme_code}/details`)
      .then(r => r.json())
      .then(d => { setDetails(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [fund?.scheme_code]);

  if (loading) return (
    <div className="fd-loading">
      <div className="fd-spinner" />
      <p>Fetching fund details...</p>
    </div>
  );
  if (!details) return <div className="fd-error">Could not load fund details.</div>;

  const SECTIONS = [
    { key: 'overview',   label: '📋 Overview'   },
    { key: 'returns',    label: '📈 Returns'     },
    { key: 'documents',  label: '📄 Documents'   },
    { key: 'tax',        label: '💸 Tax & Costs' },
    { key: 'guidelines', label: '📚 Guidelines'  },
  ];

  const erColor = (er) =>
    er < 0.5 ? '#2DCE89' : er < 1.0 ? '#F0A500' : '#F5365C';

  const fmtAum = (aum) => {
    if (!aum) return 'N/A';
    const cr = aum / 100;
    if (cr >= 10000) return `₹${(cr / 10000).toFixed(2)} Lakh Cr`;
    return `₹${cr.toFixed(0)} Cr`;
  };

  const ratingStars = (r) => {
    if (!r) return 'N/A';
    const n = Math.min(Number(r), 5);
    return '⭐'.repeat(n) + ` ${n}/5`;
  };

  return (
    <div className="fund-details">

      {/* ── Fund Header ── */}
      <div className="fd-header">
        <div className="fd-logo">{details.fund_house?.charAt(0) || 'F'}</div>
        <div className="fd-header-info">
          <h3>{details.scheme_name}</h3>
          <div className="fd-tags">
            <span className="fd-tag">{details.fund_house}</span>
            <span className="fd-tag">{details.scheme_category}</span>
            <span className="fd-tag">{details.scheme_type}</span>
            {details.expense_ratio != null && (
              <span className="fd-tag" style={{ color: erColor(details.expense_ratio), borderColor: erColor(details.expense_ratio) }}>
                TER: {details.expense_ratio}%
              </span>
            )}
          </div>
        </div>
        <div className="fd-nav-box">
          <span className="fd-nav-label">Latest NAV</span>
          <span className="fd-nav-val">₹{details.latest_nav?.toFixed(4)}</span>
          <span className="fd-nav-date">{details.nav_date}</span>
        </div>
      </div>

      {/* ── Section Tabs ── */}
      <div className="fd-tabs">
        {SECTIONS.map(s => (
          <button key={s.key} className={`fd-tab ${activeSection === s.key ? 'active' : ''}`}
            onClick={() => setActiveSection(s.key)}>{s.label}</button>
        ))}
      </div>

      {/* ── Overview ── */}
      {activeSection === 'overview' && (
        <div className="fd-section">

          {/* Fund Manager Card — highlighted */}
          {details.fund_manager && (
            <div className="fd-manager-card">
              <div className="fdm-icon">👤</div>
              <div className="fdm-info">
                <span className="fdm-label">Fund Manager</span>
                <span className="fdm-name">{details.fund_manager}</span>
              </div>
              {details.fund_rating && (
                <div className="fdm-rating">
                  <span className="fdm-rating-label">Rating</span>
                  <span className="fdm-rating-val">{ratingStars(details.fund_rating)}</span>
                </div>
              )}
            </div>
          )}

          {/* Investment Objective */}
          {details.investment_objective && (
            <div className="fd-objective-card">
              <div className="fdo-title">🎯 Investment Objective</div>
              <p className="fdo-text">{details.investment_objective}</p>
            </div>
          )}

          {/* Info Grid */}
          <div className="fd-info-grid">
            {[
              { label: 'Scheme Code',    value: details.scheme_code },
              { label: 'ISIN (Growth)',  value: details.isin_growth || 'N/A' },
              { label: 'ISIN (Div)',     value: details.isin_div    || 'N/A' },
              { label: 'Inception Date', value: details.inception_date || 'N/A' },
              { label: 'NAV Records',    value: `${details.total_nav_records?.toLocaleString()} days` },
              { label: 'Fund House',     value: details.fund_house },
              { label: 'Category',       value: details.scheme_category },
              { label: 'Type',           value: details.scheme_type },
            ].map(item => (
              <div key={item.label} className="fd-info-card">
                <span className="fdi-label">{item.label}</span>
                <span className="fdi-value">{item.value}</span>
              </div>
            ))}

            {/* AUM */}
            {details.aum && (
              <div className="fd-info-card" style={{ borderColor: 'rgba(0,180,216,0.3)' }}>
                <span className="fdi-label">💼 AUM (Fund Size)</span>
                <span className="fdi-value" style={{ color: '#00B4D8', fontSize: '18px' }}>
                  {fmtAum(details.aum)}
                </span>
              </div>
            )}

            {/* Expense Ratio */}
            {details.expense_ratio != null && (
              <div className="fd-info-card" style={{
                borderColor: erColor(details.expense_ratio),
                background: `${erColor(details.expense_ratio)}11`,
              }}>
                <span className="fdi-label">Expense Ratio (TER)</span>
                <span className="fdi-value" style={{ color: erColor(details.expense_ratio), fontSize: '18px' }}>
                  {details.expense_ratio}% p.a.
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'DM Sans, sans-serif' }}>
                  {details.expense_ratio < 0.5 ? 'Very low cost ✓'
                 : details.expense_ratio < 1.0 ? 'Moderate cost'
                 : 'High cost — consider alternatives'}
                </span>
              </div>
            )}
          </div>

          {/* AI Summary */}
          <div className="fd-ai-box">
            <div className="fd-ai-title">🤖 AI Recommendation Summary</div>
            <div className="fd-ai-metrics">
              <div className="fd-ai-metric">
                <span className="fdam-label">ML Score</span>
                <span className="fdam-value" style={{ color: '#F0A500' }}>
                  {fund.recommendation_score?.toFixed(0)}/100
                </span>
              </div>
              <div className="fd-ai-metric">
                <span className="fdam-label">Risk Score</span>
                <span className="fdam-value" style={{
                  color: fund.risk_score < 4 ? '#2DCE89' : fund.risk_score < 7 ? '#F0A500' : '#F5365C'
                }}>
                  {fund.risk_score?.toFixed(1)}/10
                </span>
              </div>
              <div className="fd-ai-metric">
                <span className="fdam-label">Confidence</span>
                <span className="fdam-value" style={{ color: '#00B4D8' }}>
                  {fund.confidence?.toFixed(0)}%
                </span>
              </div>
              <div className="fd-ai-metric">
                <span className="fdam-label">TER</span>
                <span className="fdam-value" style={{
                  color: fund.expense_ratio != null ? erColor(fund.expense_ratio) : '#8892B0',
                  fontSize: '14px'
                }}>
                  {fund.expense_ratio != null ? `${fund.expense_ratio}%` : 'N/A'}
                </span>
              </div>
            </div>
            <p className="fd-ai-explanation">{fund.explanation}</p>
          </div>
        </div>
      )}

      {/* ── Returns ── */}
      {activeSection === 'returns' && (
        <div className="fd-section">
          <div className="fd-returns-grid">
            {[
              { period: '1 Year',   val: fund.returns_1yr,  type: 'Absolute Return', desc: 'Total return over last 1 year' },
              { period: '3 Years',  val: fund.returns_3yr,  type: 'CAGR',            desc: 'Compounded Annual Growth Rate over 3 years' },
              { period: '5 Years',  val: fund.returns_5yr,  type: 'CAGR',            desc: 'Compounded Annual Growth Rate over 5 years' },
              { period: '10 Years', val: fund.returns_10yr, type: 'CAGR',            desc: 'Compounded Annual Growth Rate over 10 years' },
            ].map(r => (
              <div key={r.period} className="fd-return-card">
                <div className="fdrc-period">{r.period}</div>
                <div className="fdrc-value" style={{
                  color: r.val > 15 ? '#2DCE89' : r.val > 8 ? '#F0A500'
                       : r.val > 0  ? '#00B4D8' : r.val === 0 ? '#8892B0' : '#F5365C'
                }}>
                  {r.val === 0 ? 'N/A' : r.val > 0 ? `+${r.val}%` : `${r.val}%`}
                </div>
                <div className="fdrc-type">{r.type}</div>
                <div className="fdrc-desc">{r.desc}</div>
              </div>
            ))}
          </div>
          <div className="fd-returns-note">
            <span>ℹ</span>
            <p>Returns calculated from AMFI/MFAPI.in NAV data using exact calendar dates. Past performance is not indicative of future results.</p>
          </div>
          <div className="fd-benchmark-info">
            <div className="fdb-title">📊 How to read these returns</div>
            <div className="fdb-grid">
              {[
                { color: '#2DCE89', label: 'Above 15% — Excellent' },
                { color: '#F0A500', label: '8–15% — Good'          },
                { color: '#00B4D8', label: '0–8% — Average'        },
                { color: '#F5365C', label: 'Negative — Loss'       },
              ].map(item => (
                <div key={item.label} className="fdb-item">
                  <span className="fdb-color" style={{ background: item.color }} />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Documents ── */}
      {activeSection === 'documents' && (
        <div className="fd-section">
          <div className="fd-doc-intro">
            <span>📄</span>
            <p>Official fund documents published by AMFI. Always read the Scheme Information Document before investing.</p>
          </div>
          <div className="fd-doc-grid">
            {[
              { href: details.documents?.factsheet, icon: '📊', title: 'Fund Factsheet',                    desc: 'Monthly factsheet with portfolio, returns, and fund manager details', link: 'View on AMFI' },
              { href: details.documents?.sid,       icon: '📋', title: 'Scheme Information Document (SID)', desc: 'Legal document with investment objective, risks, fees, and terms',     link: 'View on AMFI' },
              { href: 'https://www.amfiindia.com/nav-history', icon: '📈', title: 'NAV History',             desc: 'Complete historical NAV data from AMFI for all dates since inception', link: 'View on AMFI' },
              { href: 'https://www.mfapi.in/',      icon: '🔌', title: 'MFAPI Data Source',                 desc: 'Live NAV data API used by FundSage AI to fetch fund information',       link: 'Visit MFAPI'  },
            ].map(doc => (
              <a key={doc.title} href={doc.href} target="_blank" rel="noreferrer" className="fd-doc-card">
                <div className="fdd-icon">{doc.icon}</div>
                <div className="fdd-title">{doc.title}</div>
                <div className="fdd-desc">{doc.desc}</div>
                <div className="fdd-link">{doc.link} →</div>
              </a>
            ))}
          </div>
          <div className="fd-isin-box">
            <div className="fd-isin-title">Fund Identifiers</div>
            <div className="fd-isin-grid">
              {[
                { label: 'Scheme Code (AMFI)',   value: details.scheme_code },
                { label: 'ISIN — Growth Plan',   value: details.isin_growth || 'N/A' },
                { label: 'ISIN — Dividend Plan', value: details.isin_div    || 'N/A' },
              ].map(item => (
                <div key={item.label} className="fd-isin-item">
                  <span className="fdi-label">{item.label}</span>
                  <span className="fdi-value mono">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Tax & Costs ── */}
      {activeSection === 'tax' && (
        <div className="fd-section">
          <div className="fd-tax-grid">
            <div className="fd-tax-card equity">
              <div className="fdt-icon">📊</div>
              <div className="fdt-title">Equity Fund Taxation</div>
              <div className="fdt-items">
                {[
                  { label: 'Short Term Capital Gain (STCG)', value: '20%',         cls: 'red',   note: 'If redeemed within 1 year'        },
                  { label: 'Long Term Capital Gain (LTCG)',  value: '12.5%',       cls: 'green', note: 'Above ₹1.25L gain, held 1+ year'  },
                  { label: 'LTCG Exemption',                 value: '₹1.25L/year', cls: 'teal',  note: 'First ₹1.25L gain is tax-free'   },
                ].map(t => (
                  <div key={t.label} className="fdt-item">
                    <span className="fdt-label">{t.label}</span>
                    <span className={`fdt-value ${t.cls}`}>{t.value}</span>
                    <span className="fdt-note">{t.note}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="fd-tax-card debt">
              <div className="fdt-icon">🏦</div>
              <div className="fdt-title">Debt Fund Taxation</div>
              <div className="fdt-items">
                {[
                  { label: 'Short Term Capital Gain', value: 'As per slab', cls: 'red',   note: 'If held less than 3 years'         },
                  { label: 'Long Term Capital Gain',  value: 'As per slab', cls: 'green', note: 'Indexation benefit removed (2023)'  },
                ].map(t => (
                  <div key={t.label} className="fdt-item">
                    <span className="fdt-label">{t.label}</span>
                    <span className={`fdt-value ${t.cls}`}>{t.value}</span>
                    <span className="fdt-note">{t.note}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="fd-costs-card">
            <div className="fdc-title">💰 Cost Structure</div>
            <div className="fdc-grid">
              {[
                { label: 'Minimum SIP Amount', value: `₹${details.guidelines?.min_sip?.toLocaleString()}/month`  },
                { label: 'Minimum Lumpsum',    value: `₹${details.guidelines?.min_lumpsum?.toLocaleString()}`     },
                { label: 'Exit Load',          value: details.guidelines?.exit_load                               },
                {
                  label: 'Expense Ratio (TER)',
                  value: details.expense_ratio != null ? `${details.expense_ratio}% p.a.` : '0.5%–2% (varies)',
                  color: details.expense_ratio != null ? erColor(details.expense_ratio) : undefined,
                },
                {
                  label: 'AUM (Fund Size)',
                  value: fmtAum(details.aum),
                  color: '#00B4D8',
                },
              ].map(c => (
                <div key={c.label} className="fdc-item">
                  <span className="fdc-label">{c.label}</span>
                  <span className="fdc-value" style={{ color: c.color || 'var(--teal)' }}>{c.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="fd-tax-note">
            ⚠️ Tax rules change periodically. Consult a CA or tax advisor for personalized tax planning.
          </div>
        </div>
      )}

      {/* ── Guidelines ── */}
      {activeSection === 'guidelines' && (
        <div className="fd-section">
          <div className="fd-guidelines">
            <div className="fdg-title">📚 How to Invest in This Fund</div>
            <div className="fdg-steps">
              {[
                { n: 1, icon: '🔍', title: 'Read the SID',         desc: 'Download and read the Scheme Information Document from AMFI. Understand the investment objective, risk factors, and exit load.' },
                { n: 2, icon: '📱', title: 'Choose a Platform',    desc: 'Invest via AMC website directly, or through Zerodha Coin, Groww, Paytm Money, or your bank app.' },
                { n: 3, icon: '✅', title: 'Complete KYC',         desc: 'Complete KYC with Aadhaar + PAN + bank account. One-time process, valid for all mutual funds.' },
                { n: 4, icon: '💰', title: 'Start SIP or Lumpsum', desc: 'SIP (monthly) is recommended for beginners. Start with ₹500–₹5,000/month. Increase as income grows.' },
                { n: 5, icon: '📊', title: 'Monitor Portfolio',    desc: "Check performance every 6 months. Don't panic during market falls. Stay invested for your horizon." },
                { n: 6, icon: '🔄', title: 'Review & Rebalance',   desc: 'Review asset allocation annually. Rebalance if equity/debt ratio shifts more than 5-10% from target.' },
              ].map(s => (
                <div key={s.n} className="fdg-step">
                  <div className="fdg-step-num">{s.n}</div>
                  <div className="fdg-step-icon">{s.icon}</div>
                  <div className="fdg-step-content">
                    <strong>{s.title}</strong>
                    <p>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="fdg-warning">
              <div className="fdgw-title">⚠️ Important Reminders</div>
              <ul>
                <li>Mutual fund investments are subject to market risks. Read all scheme documents carefully.</li>
                <li>Past performance is not indicative of future results.</li>
                <li>This tool is for educational purposes only. Not a SEBI-registered investment advisor.</li>
                <li>Consult a SEBI-registered financial advisor for personalized investment advice.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
