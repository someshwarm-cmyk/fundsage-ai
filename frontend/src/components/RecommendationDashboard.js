import React, { useState, useEffect } from 'react';
import FundCard from './FundCard';
import HistoryChart from './HistoryChart';
import XAIPanel from './XAIPanel';
import { generateReport } from './ReportGenerator';
import './RecommendationDashboard.css';

export default function RecommendationDashboard({ data, profile, onReset }) {
  const [selectedFund,    setSelectedFund]    = useState(null);
  const [historyData,     setHistoryData]     = useState(null);
  const [loadingHistory,  setLoadingHistory]  = useState(false);
  const [downloading,     setDownloading]     = useState(false);

  const { recommendations } = data;
  const topFund = selectedFund || recommendations[0];

  const fetchHistory = async (fund) => {
    setLoadingHistory(true);
    setSelectedFund(fund);
    try {
      const resp = await fetch(`http://localhost:8000/api/fund/${fund.scheme_code}/history`);
      if (resp.ok) {
        const hData = await resp.json();
        setHistoryData(hData);
      }
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
      try {
        generateReport(recommendations, profile);
      } catch (e) {
        console.error('PDF generation failed:', e);
      } finally {
        setDownloading(false);
      }
    }, 300);
  };

  const riskColor    = { low: '#2DCE89', medium: '#F0A500', high: '#F5365C' };
  const horizonLabel = { short: '< 3 years', medium: '3–7 years', long: '7+ years' };

  return (
    <div className="dashboard">

      {/* Profile Bar */}
      <div className="profile-bar">
        <div className="profile-tag">
          <span style={{ color: riskColor[profile.risk_appetite] }}>● </span>
          {profile.risk_appetite} risk
        </div>
        <div className="profile-tag">
          ⏱ {horizonLabel[profile.time_horizon]}
        </div>
        <div className="profile-tag">
          📁 {profile.fund_type} funds
        </div>
        <div className="profile-tag">
          💰 ₹{Number(profile.investment_amount).toLocaleString('en-IN')}
        </div>

        <div className="bar-actions">
          <button
            className="download-btn"
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? '⏳ Generating...' : '📥 Download PDF Report'}
          </button>
          <button className="reset-btn" onClick={onReset}>
            ← New Search
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="dashboard-title">
        <h2>AI Recommendations</h2>
        <p>Top {recommendations.length} funds selected by 3-agent AI system</p>
      </div>

      {/* Main Grid */}
      <div className="dashboard-grid">

        {/* Left Column — Fund Cards */}
        <div className="funds-column">
          <h3 className="col-title">Recommended Funds</h3>
          {recommendations.map((fund, i) => (
            <FundCard
              key={fund.scheme_code}
              fund={fund}
              rank={i + 1}
              isSelected={topFund?.scheme_code === fund.scheme_code}
              onClick={() => fetchHistory(fund)}
            />
          ))}
        </div>

        {/* Right Column — Chart + XAI */}
        <div className="detail-column">
          {topFund && (
            <>
              <div className="detail-header">
                <h3>{topFund.scheme_name}</h3>
                <span className="nav-current">
                  ₹ {topFund.nav?.toFixed(2)} NAV
                </span>
              </div>

              {loadingHistory
                ? <div className="chart-loading">Loading chart data...</div>
                : <HistoryChart historyData={historyData} fund={topFund} />
              }

              <XAIPanel fund={topFund} profile={profile} />
            </>
          )}
        </div>

      </div>
    </div>
  );
}