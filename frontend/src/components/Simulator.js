import React, { useState, useEffect, useRef } from 'react';
import './Simulator.css';

export default function Simulator({ fund, profile }) {
  const [mode,        setMode]        = useState(profile?.investment_type === 'swp' ? 'swp' : profile?.investment_type === 'lumpsum' ? 'lumpsum' : 'sip');
  const [amount,      setAmount]      = useState(profile?.investment_amount || 10000);
  const [amountInput, setAmountInput] = useState(String(profile?.investment_amount || 10000));
  const [years,       setYears]       = useState(profile?.time_horizon === 'short' ? 3 : profile?.time_horizon === 'long' ? 10 : 5);
  const [rate,        setRate]        = useState(fund?.returns_3yr > 0 ? fund.returns_3yr : fund?.returns_5yr > 0 ? fund.returns_5yr : 12);
  const [swpAmount,   setSwpAmount]   = useState(5000);
  const [swpInput,    setSwpInput]    = useState('5000');
  const [result,      setResult]      = useState(null);
  const [chartData,   setChartData]   = useState([]);

  const sipChartRef    = useRef(null);
  const sipCanvasRef   = useRef(null);
  const lumpChartRef   = useRef(null);
  const lumpCanvasRef  = useRef(null);
  const swpChartRef    = useRef(null);
  const swpCanvasRef   = useRef(null);

  // Sync amountInput when amount changes via slider/quick buttons
  useEffect(() => { setAmountInput(String(amount)); }, [amount]);
  useEffect(() => { setSwpInput(String(swpAmount)); }, [swpAmount]);

  // ── Calculations ──────────────────────────────────────────────────
  useEffect(() => {
    calculate();
  }, [mode, amount, years, rate, swpAmount]);

  const calculate = () => {
    if (mode === 'sip')     calcSIP();
    if (mode === 'lumpsum') calcLumpsum();
    if (mode === 'swp')     calcSWP();
  };

  const calcSIP = () => {
    const monthly     = amount;
    const monthlyRate = rate / 100 / 12;
    const months      = years * 12;
    const data        = [];
    let invested      = 0;
    let corpus        = 0;

    for (let m = 1; m <= months; m++) {
      corpus   = (corpus + monthly) * (1 + monthlyRate);
      invested = monthly * m;
      if (m % 12 === 0) {
        data.push({
          year:     m / 12,
          invested: Math.round(invested),
          corpus:   Math.round(corpus),
          returns:  Math.round(corpus - invested),
        });
      }
    }

    const totalInvested = monthly * months;
    const finalCorpus   = corpus;
    const wealthGained  = finalCorpus - totalInvested;
    const absReturn     = ((finalCorpus - totalInvested) / totalInvested) * 100;

    setResult({
      totalInvested: Math.round(totalInvested),
      finalCorpus:   Math.round(finalCorpus),
      wealthGained:  Math.round(wealthGained),
      absReturn:     absReturn.toFixed(1),
      xirr:          rate.toFixed(1),
    });
    setChartData(data);
  };

  const calcLumpsum = () => {
    const principal = amount;
    const data      = [];

    for (let y = 1; y <= years; y++) {
      const corpus  = principal * Math.pow(1 + rate / 100, y);
      const returns = corpus - principal;
      data.push({
        year:     y,
        invested: principal,
        corpus:   Math.round(corpus),
        returns:  Math.round(returns),
      });
    }

    const finalCorpus  = principal * Math.pow(1 + rate / 100, years);
    const wealthGained = finalCorpus - principal;
    const absReturn    = ((finalCorpus - principal) / principal) * 100;

    setResult({
      totalInvested: principal,
      finalCorpus:   Math.round(finalCorpus),
      wealthGained:  Math.round(wealthGained),
      absReturn:     absReturn.toFixed(1),
      xirr:          rate.toFixed(1),
    });
    setChartData(data);
  };

  const calcSWP = () => {
    const corpus      = amount;
    const monthlyRate = rate / 100 / 12;
    const withdrawal  = swpAmount;
    const data        = [];
    let   balance     = corpus;
    let   totalDrawn  = 0;

    for (let m = 1; m <= years * 12; m++) {
      balance    = balance * (1 + monthlyRate) - withdrawal;
      totalDrawn = withdrawal * m;
      if (m % 12 === 0) {
        data.push({
          year:      m / 12,
          balance:   Math.max(0, Math.round(balance)),
          withdrawn: Math.round(totalDrawn),
          corpus:    corpus,
        });
        if (balance <= 0) break;
      }
    }

    const maxMonths = Math.log(withdrawal / (withdrawal - corpus * monthlyRate)) / Math.log(1 + monthlyRate);
    const sustainYears = isNaN(maxMonths) || maxMonths < 0 ? '∞' : (maxMonths / 12).toFixed(1);

    setResult({
      initialCorpus:   corpus,
      monthlyWithdraw: withdrawal,
      totalWithdrawn:  Math.round(withdrawal * years * 12),
      finalBalance:    Math.max(0, Math.round(balance)),
      sustainYears,
      xirr:            rate.toFixed(1),
    });
    setChartData(data);
  };

  // ── Amount input handlers ──────────────────────────────────────────
  const amountMin = mode === 'sip' ? 500 : 10000;
  const amountMax = mode === 'sip' ? 100000 : 10000000;
  const amountStep = mode === 'sip' ? 500 : 10000;

  const handleAmountInput = (val) => {
    setAmountInput(val);
    const num = parseInt(val.replace(/,/g, ''), 10);
    if (!isNaN(num) && num >= amountMin && num <= amountMax) {
      setAmount(num);
    }
  };

  const handleAmountBlur = () => {
    const num = parseInt(amountInput.replace(/,/g, ''), 10);
    if (isNaN(num) || num < amountMin) {
      setAmount(amountMin);
      setAmountInput(String(amountMin));
    } else if (num > amountMax) {
      setAmount(amountMax);
      setAmountInput(String(amountMax));
    } else {
      setAmount(num);
      setAmountInput(String(num));
    }
  };

  const handleSwpInput = (val) => {
    setSwpInput(val);
    const num = parseInt(val.replace(/,/g, ''), 10);
    if (!isNaN(num) && num >= 1000 && num <= 100000) {
      setSwpAmount(num);
    }
  };

  const handleSwpBlur = () => {
    const num = parseInt(swpInput.replace(/,/g, ''), 10);
    if (isNaN(num) || num < 1000) {
      setSwpAmount(1000);
      setSwpInput('1000');
    } else if (num > 100000) {
      setSwpAmount(100000);
      setSwpInput('100000');
    } else {
      setSwpAmount(num);
      setSwpInput(String(num));
    }
  };

  // ── Draw Charts ───────────────────────────────────────────────────
  useEffect(() => {
    if (!chartData.length) return;
    if (mode === 'sip')     drawSIPChart();
    if (mode === 'lumpsum') drawLumpsumChart();
    if (mode === 'swp')     drawSWPChart();
  }, [chartData, mode]);

  const destroyChart = (ref) => {
    if (ref.current) { ref.current.destroy(); ref.current = null; }
  };

  const drawSIPChart = () => {
    destroyChart(sipChartRef);
    if (!sipCanvasRef.current) return;
    import('chart.js/auto').then(({ default: Chart }) => {
      if (!sipCanvasRef.current) return;
      destroyChart(sipChartRef);
      sipChartRef.current = new Chart(sipCanvasRef.current, {
        type: 'bar',
        data: {
          labels: chartData.map(d => `Yr ${d.year}`),
          datasets: [
            { label: 'Amount Invested', data: chartData.map(d => d.invested), backgroundColor: 'rgba(0,180,216,0.7)', borderColor: '#00B4D8', borderWidth: 1, borderRadius: 4 },
            { label: 'Wealth Gained',   data: chartData.map(d => d.returns),  backgroundColor: 'rgba(45,206,137,0.7)', borderColor: '#2DCE89', borderWidth: 1, borderRadius: 4 },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: '#8892B0', font: { size: 12 } } },
            tooltip: { backgroundColor: 'rgba(17,34,64,0.95)', borderColor: 'rgba(0,180,216,0.3)', borderWidth: 1,
              callbacks: { label: (item) => ` ${item.dataset.label}: ₹${Number(item.raw).toLocaleString('en-IN')}` } },
          },
          scales: {
            x: { stacked: true, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8892B0', font: { size: 11 } } },
            y: { stacked: true, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8892B0', font: { size: 11 }, callback: v => `₹${(v/100000).toFixed(0)}L` } },
          },
        },
      });
    });
  };

  const drawLumpsumChart = () => {
    destroyChart(lumpChartRef);
    if (!lumpCanvasRef.current) return;
    import('chart.js/auto').then(({ default: Chart }) => {
      if (!lumpCanvasRef.current) return;
      destroyChart(lumpChartRef);
      lumpChartRef.current = new Chart(lumpCanvasRef.current, {
        type: 'line',
        data: {
          labels: chartData.map(d => `Yr ${d.year}`),
          datasets: [
            { label: 'Investment Value', data: chartData.map(d => d.corpus),  borderColor: '#2DCE89', backgroundColor: 'rgba(45,206,137,0.1)', borderWidth: 2, fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: '#2DCE89' },
            { label: 'Amount Invested',  data: chartData.map(d => d.invested), borderColor: '#00B4D8', backgroundColor: 'transparent', borderWidth: 2, borderDash: [6, 3], tension: 0, pointRadius: 0 },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: '#8892B0', font: { size: 12 } } },
            tooltip: { backgroundColor: 'rgba(17,34,64,0.95)', borderColor: 'rgba(0,180,216,0.3)', borderWidth: 1,
              callbacks: { label: (item) => ` ${item.dataset.label}: ₹${Number(item.raw).toLocaleString('en-IN')}` } },
          },
          scales: {
            x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8892B0', font: { size: 11 } } },
            y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8892B0', font: { size: 11 }, callback: v => `₹${(v/100000).toFixed(0)}L` } },
          },
        },
      });
    });
  };

  const drawSWPChart = () => {
    destroyChart(swpChartRef);
    if (!swpCanvasRef.current) return;
    import('chart.js/auto').then(({ default: Chart }) => {
      if (!swpCanvasRef.current) return;
      destroyChart(swpChartRef);
      swpChartRef.current = new Chart(swpCanvasRef.current, {
        type: 'line',
        data: {
          labels: chartData.map(d => `Yr ${d.year}`),
          datasets: [
            { label: 'Remaining Corpus', data: chartData.map(d => d.balance),   borderColor: '#F0A500', backgroundColor: 'rgba(240,165,0,0.1)', borderWidth: 2, fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: '#F0A500' },
            { label: 'Total Withdrawn',  data: chartData.map(d => d.withdrawn),  borderColor: '#2DCE89', backgroundColor: 'transparent', borderWidth: 2, borderDash: [6, 3], tension: 0.4, pointRadius: 0 },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: '#8892B0', font: { size: 12 } } },
            tooltip: { backgroundColor: 'rgba(17,34,64,0.95)', borderColor: 'rgba(0,180,216,0.3)', borderWidth: 1,
              callbacks: { label: (item) => ` ${item.dataset.label}: ₹${Number(item.raw).toLocaleString('en-IN')}` } },
          },
          scales: {
            x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8892B0', font: { size: 11 } } },
            y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8892B0', font: { size: 11 }, callback: v => `₹${(v/100000).toFixed(0)}L` } },
          },
        },
      });
    });
  };

  const fmt = (n) => {
    if (n >= 10000000) return `₹${(n/10000000).toFixed(2)} Cr`;
    if (n >= 100000)   return `₹${(n/100000).toFixed(2)} L`;
    if (n >= 1000)     return `₹${(n/1000).toFixed(1)} K`;
    return `₹${n}`;
  };

  const fundRate = fund?.returns_3yr > 0 ? fund.returns_3yr :
                   fund?.returns_5yr > 0 ? fund.returns_5yr :
                   fund?.returns_1yr > 0 ? fund.returns_1yr : 12;

  return (
    <div className="simulator">

      {/* ── Header ── */}
      <div className="sim-header">
        <div>
          <h3>🧮 Investment Simulator</h3>
          <p>Calculate expected returns for <strong>{fund?.scheme_name}</strong></p>
        </div>
        <div className="sim-fund-rate">
          <span className="sfr-label">Fund Historical Rate</span>
          <span className="sfr-value">{fundRate.toFixed(1)}% p.a.</span>
        </div>
      </div>

      {/* ── Mode Tabs ── */}
      <div className="sim-modes">
        {[
          { key: 'sip',     icon: '🔄', label: 'SIP',     desc: 'Monthly investment' },
          { key: 'lumpsum', icon: '💰', label: 'Lumpsum', desc: 'One-time investment' },
          { key: 'swp',     icon: '💸', label: 'SWP',     desc: 'Monthly withdrawal' },
        ].map(m => (
          <button key={m.key} className={`sim-mode-btn ${mode === m.key ? 'active' : ''}`} onClick={() => setMode(m.key)}>
            <span className="smb-icon">{m.icon}</span>
            <span className="smb-label">{m.label}</span>
            <span className="smb-desc">{m.desc}</span>
          </button>
        ))}
      </div>

      <div className="sim-body">

        {/* ── Controls ── */}
        <div className="sim-controls">

          {/* ── Amount ── */}
          <div className="sim-control">
            <div className="sc-header">
              <label>{mode === 'sip' ? 'Monthly SIP Amount' : mode === 'swp' ? 'Initial Corpus' : 'Lumpsum Amount'}</label>
              <div className="sc-amount-input-wrap">
                <span className="sc-rupee">₹</span>
                <input
                  type="number"
                  className="sc-manual-input"
                  value={amountInput}
                  min={amountMin}
                  max={amountMax}
                  step={amountStep}
                  onChange={e => handleAmountInput(e.target.value)}
                  onBlur={handleAmountBlur}
                  onFocus={e => e.target.select()}
                />
              </div>
            </div>
            <input
              type="range"
              min={amountMin}
              max={amountMax}
              step={amountStep}
              value={amount}
              onChange={e => setAmount(Number(e.target.value))}
              className="sim-slider"
            />
            <div className="sc-labels">
              <span>{mode === 'sip' ? '₹500' : '₹10K'}</span>
              <span>{mode === 'sip' ? '₹1L' : '₹1Cr'}</span>
            </div>
            <div className="sc-quick">
              {(mode === 'sip'
                ? [1000, 3000, 5000, 10000, 25000, 50000]
                : [50000, 100000, 500000, 1000000, 5000000]
              ).map(v => (
                <button key={v} className={`sq-btn ${amount === v ? 'active' : ''}`} onClick={() => setAmount(v)}>{fmt(v)}</button>
              ))}
            </div>
          </div>

          {/* ── SWP Withdrawal Amount ── */}
          {mode === 'swp' && (
            <div className="sim-control">
              <div className="sc-header">
                <label>Monthly Withdrawal</label>
                <div className="sc-amount-input-wrap">
                  <span className="sc-rupee">₹</span>
                  <input
                    type="number"
                    className="sc-manual-input"
                    value={swpInput}
                    min={1000}
                    max={100000}
                    step={1000}
                    onChange={e => handleSwpInput(e.target.value)}
                    onBlur={handleSwpBlur}
                    onFocus={e => e.target.select()}
                  />
                </div>
              </div>
              <input
                type="range"
                min={1000}
                max={100000}
                step={1000}
                value={swpAmount}
                onChange={e => setSwpAmount(Number(e.target.value))}
                className="sim-slider"
              />
              <div className="sc-labels"><span>₹1K</span><span>₹1L</span></div>
              <div className="sc-quick">
                {[2000, 5000, 10000, 20000, 50000].map(v => (
                  <button key={v} className={`sq-btn ${swpAmount === v ? 'active' : ''}`} onClick={() => setSwpAmount(v)}>{fmt(v)}</button>
                ))}
              </div>
            </div>
          )}

          {/* ── Years ── */}
          <div className="sim-control">
            <div className="sc-header">
              <label>Investment Period</label>
              <span className="sc-val">{years} years</span>
            </div>
            <input
              type="range"
              min={1} max={30} step={1}
              value={years}
              onChange={e => setYears(Number(e.target.value))}
              className="sim-slider"
            />
            <div className="sc-labels"><span>1 yr</span><span>10 yr</span><span>20 yr</span><span>30 yr</span></div>
            <div className="sc-quick">
              {[1, 3, 5, 7, 10, 15, 20, 25, 30].map(v => (
                <button key={v} className={`sq-btn ${years === v ? 'active' : ''}`} onClick={() => setYears(v)}>{v}y</button>
              ))}
            </div>
          </div>

          {/* ── Rate ── */}
          <div className="sim-control">
            <div className="sc-header">
              <label>Expected Annual Return</label>
              <span className="sc-val" style={{ color: '#2DCE89' }}>{rate.toFixed(1)}% p.a.</span>
            </div>
            <input
              type="range"
              min={1} max={30} step={0.5}
              value={rate}
              onChange={e => setRate(Number(e.target.value))}
              className="sim-slider green"
            />
            <div className="sc-labels"><span>1%</span><span>8%</span><span>15%</span><span>30%</span></div>
            <div className="sc-quick">
              {[6, 8, 10, 12, 15, 18, 20].map(v => (
                <button key={v} className={`sq-btn ${rate === v ? 'active' : ''}`} onClick={() => setRate(v)}>{v}%</button>
              ))}
            </div>
            <div className="rate-hint">
              <span>📌</span>
              <span>Fund historical rate: <strong style={{ color: '#2DCE89' }}>{fundRate.toFixed(1)}%</strong> — auto-set from {fund?.returns_3yr > 0 ? '3yr' : '5yr'} CAGR</span>
            </div>
          </div>

        </div>

        {/* ── Results ── */}
        {result && (
          <div className="sim-results">

            {mode === 'sip' && (
              <div className="sim-result-cards">
                <div className="src-card invested">
                  <span className="src-icon">💰</span>
                  <span className="src-label">Total Invested</span>
                  <span className="src-value">{fmt(result.totalInvested)}</span>
                  <span className="src-sub">₹{amount.toLocaleString('en-IN')}/mo × {years*12} months</span>
                </div>
                <div className="src-card gains">
                  <span className="src-icon">📈</span>
                  <span className="src-label">Wealth Gained</span>
                  <span className="src-value" style={{ color: '#2DCE89' }}>{fmt(result.wealthGained)}</span>
                  <span className="src-sub">+{result.absReturn}% absolute return</span>
                </div>
                <div className="src-card corpus">
                  <span className="src-icon">🏆</span>
                  <span className="src-label">Final Corpus</span>
                  <span className="src-value" style={{ color: '#F0A500' }}>{fmt(result.finalCorpus)}</span>
                  <span className="src-sub">At {result.xirr}% p.a. CAGR</span>
                </div>
              </div>
            )}

            {mode === 'lumpsum' && (
              <div className="sim-result-cards">
                <div className="src-card invested">
                  <span className="src-icon">💰</span>
                  <span className="src-label">Amount Invested</span>
                  <span className="src-value">{fmt(result.totalInvested)}</span>
                  <span className="src-sub">One-time investment</span>
                </div>
                <div className="src-card gains">
                  <span className="src-icon">📈</span>
                  <span className="src-label">Wealth Gained</span>
                  <span className="src-value" style={{ color: '#2DCE89' }}>{fmt(result.wealthGained)}</span>
                  <span className="src-sub">+{result.absReturn}% absolute return</span>
                </div>
                <div className="src-card corpus">
                  <span className="src-icon">🏆</span>
                  <span className="src-label">Final Value</span>
                  <span className="src-value" style={{ color: '#F0A500' }}>{fmt(result.finalCorpus)}</span>
                  <span className="src-sub">After {years} years at {result.xirr}%</span>
                </div>
              </div>
            )}

            {mode === 'swp' && (
              <div className="sim-result-cards">
                <div className="src-card invested">
                  <span className="src-icon">🏦</span>
                  <span className="src-label">Initial Corpus</span>
                  <span className="src-value">{fmt(result.initialCorpus)}</span>
                  <span className="src-sub">Starting amount</span>
                </div>
                <div className="src-card gains">
                  <span className="src-icon">💸</span>
                  <span className="src-label">Total Withdrawn</span>
                  <span className="src-value" style={{ color: '#2DCE89' }}>{fmt(result.totalWithdrawn)}</span>
                  <span className="src-sub">₹{swpAmount.toLocaleString('en-IN')}/mo × {years*12} months</span>
                </div>
                <div className="src-card corpus">
                  <span className="src-icon">⏳</span>
                  <span className="src-label">Corpus Sustains</span>
                  <span className="src-value" style={{ color: result.sustainYears === '∞' ? '#2DCE89' : '#F0A500' }}>
                    {result.sustainYears === '∞' ? '∞ Forever' : `${result.sustainYears} yrs`}
                  </span>
                  <span className="src-sub">Remaining: {fmt(result.finalBalance)}</span>
                </div>
              </div>
            )}

            {/* Donut */}
            {mode !== 'swp' && result && (
              <div className="sim-donut-row">
                <div className="sim-donut">
                  <svg viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(0,180,216,0.2)" strokeWidth="12"/>
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#2DCE89" strokeWidth="12"
                      strokeDasharray={`${(result.wealthGained / result.finalCorpus) * 238} 238`}
                      strokeLinecap="round" transform="rotate(-90 50 50)"/>
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#00B4D8" strokeWidth="12"
                      strokeDasharray={`${(result.totalInvested / result.finalCorpus) * 238} 238`}
                      strokeDashoffset={`-${(result.wealthGained / result.finalCorpus) * 238}`}
                      strokeLinecap="round" transform="rotate(-90 50 50)"/>
                  </svg>
                  <div className="sim-donut-center">
                    <span>{((result.wealthGained / result.finalCorpus) * 100).toFixed(0)}%</span>
                    <small>gains</small>
                  </div>
                </div>
                <div className="sim-donut-legend">
                  <div className="sdl-item">
                    <span className="sdl-dot" style={{ background: '#00B4D8' }}/>
                    <span className="sdl-label">Invested</span>
                    <span className="sdl-val">{fmt(result.totalInvested)}</span>
                  </div>
                  <div className="sdl-item">
                    <span className="sdl-dot" style={{ background: '#2DCE89' }}/>
                    <span className="sdl-label">Returns</span>
                    <span className="sdl-val">{fmt(result.wealthGained)}</span>
                  </div>
                  <div className="sdl-item total">
                    <span className="sdl-dot" style={{ background: '#F0A500' }}/>
                    <span className="sdl-label">Total</span>
                    <span className="sdl-val">{fmt(result.finalCorpus)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Chart */}
            <div className="sim-chart-card">
              <div className="sim-chart-header">
                <h4>
                  {mode === 'sip'     ? '📊 SIP Growth — Invested vs Returns (Stacked)'  :
                   mode === 'lumpsum' ? '📈 Lumpsum Growth — Investment Value Over Time'  :
                   '📉 SWP — Corpus Balance vs Total Withdrawn'}
                </h4>
                <div className="sim-chart-note">
                  {mode === 'sip'     ? 'Blue = invested amount · Green = wealth gained'       :
                   mode === 'lumpsum' ? 'Green line = corpus value · Blue dashed = principal'  :
                   'Orange = remaining balance · Green dashed = total withdrawn'}
                </div>
              </div>
              <div className="sim-chart-container">
                {mode === 'sip'     && <canvas ref={sipCanvasRef}  key={`sip-${amount}-${years}-${rate}`}  />}
                {mode === 'lumpsum' && <canvas ref={lumpCanvasRef} key={`lump-${amount}-${years}-${rate}`} />}
                {mode === 'swp'     && <canvas ref={swpCanvasRef}  key={`swp-${amount}-${years}-${rate}-${swpAmount}`} />}
              </div>
            </div>

            {/* Year-wise Table */}
            <div className="sim-table-card">
              <h4>📋 Year-wise Breakdown</h4>
              <div className="sim-table-wrap">
                <table className="sim-table">
                  <thead>
                    <tr>
                      <th>Year</th>
                      {mode === 'swp' ? (
                        <><th>Corpus Balance</th><th>Total Withdrawn</th><th>Change</th></>
                      ) : (
                        <><th>Invested</th><th>Returns</th><th>Total Corpus</th><th>Gain %</th></>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.map((d, i) => (
                      <tr key={i}>
                        <td>Year {d.year}</td>
                        {mode === 'swp' ? (
                          <>
                            <td style={{ color: d.balance < amount * 0.5 ? '#F5365C' : '#F0A500' }}>{fmt(d.balance)}</td>
                            <td style={{ color: '#2DCE89' }}>{fmt(d.withdrawn)}</td>
                            <td style={{ color: '#8892B0' }}>{fmt(d.balance - (chartData[i-1]?.balance || amount))}</td>
                          </>
                        ) : (
                          <>
                            <td style={{ color: '#00B4D8' }}>{fmt(d.invested)}</td>
                            <td style={{ color: '#2DCE89' }}>+{fmt(d.returns)}</td>
                            <td style={{ color: '#F0A500', fontWeight: 700 }}>{fmt(d.corpus)}</td>
                            <td style={{ color: '#2DCE89' }}>+{((d.returns / d.invested) * 100).toFixed(1)}%</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="sim-disclaimer">
              ⚠️ This is a simulation based on historical returns of {rate}% p.a. Actual returns may vary.
              Mutual fund investments are subject to market risks. Past performance does not guarantee future results.
            </div>

          </div>
        )}
      </div>
    </div>
  );
}