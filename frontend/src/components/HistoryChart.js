import React, { useState, useEffect, useRef } from 'react';
import './HistoryChart.css';

const PERIODS = [
  { key: '1yr',  label: '1 Year'  },
  { key: '3yr',  label: '3 Years' },
  { key: '5yr',  label: '5 Years' },
  { key: '10yr', label: '10 Years'},
];

export default function HistoryChart({ historyData, fund }) {
  const canvasRef     = useRef(null);
  const chartRef      = useRef(null);
  const [activePeriod, setActivePeriod]   = useState('1yr');
  const [returnSummary, setReturnSummary] = useState({});

  // Calculate CAGR for all periods
  useEffect(() => {
    if (!historyData) return;
    const summary = {};
    PERIODS.forEach(({ key }) => {
      const data  = historyData.history?.[key] || [];
      const years = key === '1yr' ? 1 : key === '3yr' ? 3 : key === '5yr' ? 5 : 10;
      if (data.length >= 2) {
        const latest = data[0]?.nav;
        const oldest = data[data.length - 1]?.nav;
        if (oldest && latest) {
          summary[key] = (((latest / oldest) ** (1 / years)) - 1) * 100;
        } else { summary[key] = null; }
      } else { summary[key] = null; }
    });
    setReturnSummary(summary);
  }, [historyData]);

  // Draw chart — destroy old one first
  useEffect(() => {
    if (!historyData || !canvasRef.current) return;

    const rawData = historyData.history?.[activePeriod] || [];
    if (rawData.length === 0) return;

    // ── Destroy existing chart before creating new one ──
    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    const step      = Math.max(1, Math.floor(rawData.length / 100));
    const sampled   = rawData.filter((_, i) => i % step === 0).reverse();
    const labels    = sampled.map(d => d.date);
    const navValues = sampled.map(d => d.nav);

    const isPositive = navValues[navValues.length - 1] > navValues[0];
    const lineColor  = isPositive ? '#2DCE89' : '#F5365C';
    const fillColor  = isPositive ? 'rgba(45,206,137,0.1)' : 'rgba(245,54,92,0.1)';

    import('chart.js/auto').then(({ default: Chart }) => {
      // Double-check canvas is still mounted and chart not already created
      if (!canvasRef.current) return;
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }

      chartRef.current = new Chart(canvasRef.current, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'NAV (₹)',
            data: navValues,
            borderColor: lineColor,
            backgroundColor: fillColor,
            borderWidth: 2,
            fill: true,
            tension: 0.3,
            pointRadius: 0,
            pointHoverRadius: 4,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              mode: 'index', intersect: false,
              backgroundColor: 'rgba(17,34,64,0.95)',
              borderColor: 'rgba(0,180,216,0.3)', borderWidth: 1,
              titleColor: '#8892B0', bodyColor: '#E8F0FE',
              callbacks: {
                title: (items) => items[0]?.label || '',
                label: (item)  => `  NAV: ₹${Number(item.raw).toFixed(2)}`,
              },
            },
          },
          scales: {
            x: {
              grid: { color: 'rgba(255,255,255,0.04)' },
              ticks: { color: '#8892B0', maxTicksLimit: 6, font: { size: 11 } },
            },
            y: {
              grid: { color: 'rgba(255,255,255,0.04)' },
              ticks: { color: '#8892B0', font: { size: 11 }, callback: v => `₹${v}` },
            },
          },
          interaction: { mode: 'index', intersect: false },
        },
      });
    });

    // Cleanup on unmount or before next effect
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [historyData, activePeriod]);

  const returnColor = (val) => {
    if (val == null) return '#8892B0';
    if (val > 15) return '#2DCE89';
    if (val > 8)  return '#F0A500';
    if (val > 0)  return '#00B4D8';
    return '#F5365C';
  };

  return (
    <div className="chart-card">
      <div className="chart-header">
        <h4>Historical NAV Performance</h4>
        <div className="period-tabs">
          {PERIODS.map(({ key, label }) => (
            <button
              key={key}
              className={`period-tab ${activePeriod === key ? 'active' : ''}`}
              onClick={() => setActivePeriod(key)}
            >{label}</button>
          ))}
        </div>
      </div>

      <div className="return-summary">
        {PERIODS.map(({ key, label }) => (
          <div key={key} className={`ret-item ${activePeriod === key ? 'active' : ''}`}>
            <span className="ret-period">{label}</span>
            <span className="ret-cagr" style={{ color: returnColor(returnSummary[key]) }}>
              {returnSummary[key] != null
                ? `${returnSummary[key] > 0 ? '+' : ''}${returnSummary[key].toFixed(2)}% CAGR`
                : 'N/A'}
            </span>
          </div>
        ))}
      </div>

      <div className="chart-container">
        {historyData
          ? <canvas ref={canvasRef} />
          : <div className="chart-placeholder">Select a fund to view history</div>
        }
      </div>
    </div>
  );
}