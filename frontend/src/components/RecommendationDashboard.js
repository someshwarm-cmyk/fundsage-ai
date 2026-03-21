import React, { useState, useEffect } from 'react';
import FundCard from './FundCard';
import HistoryChart from './HistoryChart';
import XAIPanel from './XAIPanel';
import FundDetails from './FundDetails';
import Simulator from './Simulator';
import { generateReport } from './ReportGenerator';
import './RecommendationDashboard.css';

export default function RecommendationDashboard({ data, profile, onReset, apiBase }) {
  const [selectedFund,   setSelectedFund]   = useState(null);
  const [historyData,    setHistoryData]    = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [downloading,    setDownloading]    = useState(false);
  const [activeTab,      setActiveTab]      = useState('overview');

  const { recommendations } = data;
  const topFund = selectedFund || recommendations[0];

  const fetchHistory = async (fund) => {
    setLoadingHistory(true);
    setSelectedFund(fund);
    try {
      const resp = await fetch(`${apiBase}/api/fund/${fund.scheme_code}/history`);
      if (resp.ok) setHistoryData(await resp.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (recommendations.length > 0) fetchHistory(recommendations[0]);
  }, []);

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      try { generateReport(recommendations, profile); }
      catch (e) { console.error(e); }
      finally { setDownloading(false); }
    }, 300);
  };

  const riskColor    = { low: '#2DCE89', medium: '#F0A500', high: '#F5365C' };
  const horizonLabel = { short: '< 3 years', medium: '3–7 years', long: '7+ years' };

  const TABS = [
    { key: 'overview',   label: '📊 Overview'   },
    { key: 'details',    label: '📋 Fund Details' },
    { key: 'xai',        label: '🔍 XAI Analysis' },
    { key: 'simulator',  label: '🧮 Simulator'   },
  ];

  return (
    <div className="dashboard">

      {/* ── Profile Bar ── */}
      <div className="profile-bar">
        <div className="profile-tags">
          <div className="profile-tag">
            <span style={{ color: riskColor[profile.risk_appetite] }}>●</span>
            {profile.risk_appetite} risk
          </div>
          <div className="profile-tag">⏱ {horizonLabel[profile.time_horizon]}</div>
          <div className="profile-tag">📁 {profile.fund_type}</div>
          <div className="profile-tag">💰 ₹{Number(profile.investment_amount).toLocaleString('en-IN')}</div>
          <div className="profile-tag">📋 {recommendations.length} funds</div>
        </div>
        <div className="bar-actions">
          <button className="download-btn" onClick={handleDownload} disabled={downloading}>
            {downloading ? '⏳ Generating...' : '📥 PDF Report'}
          </button>
          <button className="reset-btn" onClick={onReset}>← New Search</button>
        </div>
      </div>

      {/* ── Title ── */}
      <div className="dashboard-title">
        <h2>AI Recommendations</h2>
        <p>Top {recommendations.length} {profile.fund_type} funds · Random Forest + SHAP · 3-Agent AI</p>
      </div>

      {/* ── Returns Table ── */}
      <div className="returns-table-card">
        <div className="rt-header">
          <h3>📊 Historical Returns Comparison</h3>
          <span className="rt-note">Source: AMFI/MFAPI.in · Returns as of {new Date().toLocaleDateString('en-IN')} · CAGR %</span>
        </div>
        <div className="returns-table-wrap">
          <table className="returns-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Fund Name</th>
                <th>1 Year</th>
                <th>3 Year</th>
                <th>5 Year</th>
                <th>10 Year</th>
                <th>Risk</th>
                <th>AI Score</th>
              </tr>
            </thead>
            <tbody>
              {recommendations.map((fund, i) => (
                <tr
                  key={fund.scheme_code}
                  className={topFund?.scheme_code === fund.scheme_code ? 'active-row' : ''}
                  onClick={() => { fetchHistory(fund); setActiveTab('overview'); }}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <span className={`rank-pill rank-${i+1}`}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}
                    </span>
                  </td>
                  <td className="fund-name-cell">{fund.scheme_name}</td>
                  <td className="ret-cell" style={{ color: retColor(fund.returns_1yr) }}>
                    {fund.returns_1yr > 0 ? `+${fund.returns_1yr}%` : fund.returns_1yr === 0 ? 'N/A' : `${fund.returns_1yr}%`}
                  </td>
                  <td className="ret-cell" style={{ color: retColor(fund.returns_3yr) }}>
                    {fund.returns_3yr > 0 ? `+${fund.returns_3yr}%` : fund.returns_3yr === 0 ? 'N/A' : `${fund.returns_3yr}%`}
                  </td>
                  <td className="ret-cell" style={{ color: retColor(fund.returns_5yr) }}>
                    {fund.returns_5yr > 0 ? `+${fund.returns_5yr}%` : fund.returns_5yr === 0 ? 'N/A' : `${fund.returns_5yr}%`}
                  </td>
                  <td className="ret-cell" style={{ color: retColor(fund.returns_10yr) }}>
                    {fund.returns_10yr > 0 ? `+${fund.returns_10yr}%` : fund.returns_10yr === 0 ? 'N/A' : `${fund.returns_10yr}%`}
                  </td>
                  <td>
                    <div className="risk-mini">
                      <div className="risk-mini-bar">
                        <div style={{
                          width: `${(fund.risk_score/10)*100}%`,
                          background: fund.risk_score < 4 ? '#2DCE89' : fund.risk_score < 7 ? '#F0A500' : '#F5365C',
                          height: '100%', borderRadius: '2px'
                        }}/>
                      </div>
                      <span>{fund.risk_score?.toFixed(1)}</span>
                    </div>
                  </td>
                  <td>
                    <span className="score-pill" style={{
                      background: fund.recommendation_score >= 70 ? 'rgba(45,206,137,0.15)' : 'rgba(240,165,0,0.15)',
                      color: fund.recommendation_score >= 70 ? '#2DCE89' : '#F0A500',
                    }}>
                      {fund.recommendation_score?.toFixed(0)}/100
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Fund Cards Row ── */}
      <div className="fund-cards-row">
        {recommendations.map((fund, i) => (
          <FundCard
            key={fund.scheme_code}
            fund={fund}
            rank={i + 1}
            isSelected={topFund?.scheme_code === fund.scheme_code}
            onClick={() => { fetchHistory(fund); setActiveTab('overview'); }}
          />
        ))}
      </div>

      {/* ── Detail Section ── */}
      {topFund && (
        <div className="detail-section">
          <div className="detail-fund-header">
            <div>
              <h3>{topFund.scheme_name}</h3>
              <span className="detail-fund-meta">
                {topFund.fund_house} · {topFund.scheme_category} · NAV ₹{topFund.nav?.toFixed(2)} ({topFund.nav_date})
              </span>
            </div>
            <div className="detail-score">
              <span className="ds-label">AI Score</span>
              <span className="ds-value">{topFund.recommendation_score?.toFixed(0)}/100</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="detail-tabs">
            {TABS.map(t => (
              <button
                key={t.key}
                className={`detail-tab ${activeTab === t.key ? 'active' : ''}`}
                onClick={() => setActiveTab(t.key)}
              >{t.label}</button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="detail-tab-content">

            {activeTab === 'overview' && (
              <div className="overview-grid">
                <div className="overview-left">
                  {loadingHistory
                    ? <div className="chart-loading">Loading chart...</div>
                    : <HistoryChart historyData={historyData} fund={topFund} />
                  }
                </div>
                <div className="overview-right">
                  <div className="ai-explanation-card">
                    <div className="aec-header">
                      <span>🤖</span>
                      <div>
                        <strong>AI Agent Explanation</strong>
                        <span className="aec-model">Random Forest + Groq LLaMA3</span>
                      </div>
                    </div>
                    <p>{topFund.explanation}</p>
                  </div>
                  <div className="quick-metrics">
                    {[
                      { label: '1Y Return',    value: topFund.returns_1yr  === 0 ? 'N/A' : `+${topFund.returns_1yr}%`,  color: retColor(topFund.returns_1yr) },
                      { label: '3Y CAGR',      value: topFund.returns_3yr  === 0 ? 'N/A' : `+${topFund.returns_3yr}%`,  color: retColor(topFund.returns_3yr) },
                      { label: '5Y CAGR',      value: topFund.returns_5yr  === 0 ? 'N/A' : `+${topFund.returns_5yr}%`,  color: retColor(topFund.returns_5yr) },
                      { label: '10Y CAGR',     value: topFund.returns_10yr === 0 ? 'N/A' : `+${topFund.returns_10yr}%`, color: retColor(topFund.returns_10yr) },
                      { label: 'Risk Score',   value: `${topFund.risk_score?.toFixed(1)}/10`,                            color: topFund.risk_score < 4 ? '#2DCE89' : topFund.risk_score < 7 ? '#F0A500' : '#F5365C' },
                      { label: 'Confidence',   value: `${topFund.confidence?.toFixed(0)}%`,                              color: '#00B4D8' },
                    ].map(m => (
                      <div key={m.label} className="qm-item">
                        <span className="qm-label">{m.label}</span>
                        <span className="qm-value" style={{ color: m.color }}>{m.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'details' && (
              <FundDetails fund={topFund} apiBase={apiBase} />
            )}

            {activeTab === 'xai' && (
              <XAIPanel fund={topFund} profile={profile} />
            )}

            {activeTab === 'simulator' && (
              <Simulator fund={topFund} profile={profile} />
            )}

          </div>
        </div>
      )}
    </div>
  );
}

function retColor(val) {
  if (!val || val === 0) return '#8892B0';
  if (val > 15) return '#2DCE89';
  if (val > 8)  return '#F0A500';
  if (val > 0)  return '#00B4D8';
  return '#F5365C';
}