import React, { useState, useEffect } from 'react';
import './BeginnerGuide.css';

export default function BeginnerGuide({ apiBase }) {
  const [guide,       setGuide]       = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [activeTab,   setActiveTab]   = useState('steps');
  const [openFaq,     setOpenFaq]     = useState(null);
  const [searchTerm,  setSearchTerm]  = useState('');

  useEffect(() => {
    fetch(`${apiBase}/api/beginner-guide`)
      .then(r => r.json())
      .then(d => { setGuide(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="bg-loading">
      <div className="bg-spinner" />
      <p>Loading guide...</p>
    </div>
  );

  if (!guide) return (
    <div className="bg-error">Could not load beginner guide.</div>
  );

  const TABS = [
    { key: 'steps',    label: '🚶 Getting Started' },
    { key: 'faq',      label: '❓ FAQ'              },
    { key: 'glossary', label: '📖 Glossary'         },
    { key: 'compare',  label: '⚖️ Fund Comparison'  },
    { key: 'tips',     label: '💡 Pro Tips'         },
  ];

  const filteredGlossary = guide.glossary?.filter(g =>
    g.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.def.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const FUND_COMPARISON = [
    {
      type: 'Equity',
      icon: '📊',
      risk: 'High',
      riskColor: '#F5365C',
      returns: '12–18% CAGR',
      horizon: '5+ years',
      taxStcg: '15%',
      taxLtcg: '10% (>₹1L)',
      bestFor: 'Wealth creation, retirement',
      minSip: '₹500',
      examples: 'Bluechip, Midcap, Flexi Cap',
      beginner: true,
    },
    {
      type: 'Debt',
      icon: '🏦',
      risk: 'Low',
      riskColor: '#2DCE89',
      returns: '6–9% CAGR',
      horizon: '1–3 years',
      taxStcg: 'As per slab',
      taxLtcg: 'As per slab',
      bestFor: 'Stability, emergency fund',
      minSip: '₹500',
      examples: 'Short Term, Liquid, Gilt',
      beginner: true,
    },
    {
      type: 'Hybrid',
      icon: '🔀',
      risk: 'Medium',
      riskColor: '#F0A500',
      returns: '9–13% CAGR',
      horizon: '3–5 years',
      taxStcg: '15% (equity portion)',
      taxLtcg: '10% (equity portion)',
      bestFor: 'Balanced growth, first-time investors',
      minSip: '₹500',
      examples: 'Balanced Advantage, Equity Hybrid',
      beginner: true,
    },
    {
      type: 'Index',
      icon: '📉',
      risk: 'Medium-High',
      riskColor: '#F0A500',
      returns: '11–16% CAGR',
      horizon: '5+ years',
      taxStcg: '15%',
      taxLtcg: '10% (>₹1L)',
      bestFor: 'Passive investors, low-cost investing',
      minSip: '₹500',
      examples: 'Nifty 50, Sensex, Nifty Next 50',
      beginner: true,
    },
    {
      type: 'Gold',
      icon: '🥇',
      risk: 'Medium',
      riskColor: '#F0A500',
      returns: '8–12% CAGR',
      horizon: '3–7 years',
      taxStcg: 'As per slab',
      taxLtcg: '20% with indexation',
      bestFor: 'Inflation hedge, diversification',
      minSip: '₹500',
      examples: 'Gold ETF, Gold Savings Fund',
      beginner: false,
    },
    {
      type: 'Sectoral',
      icon: '🌐',
      risk: 'Very High',
      riskColor: '#F5365C',
      returns: 'Varies widely',
      horizon: '5–7 years',
      taxStcg: '15%',
      taxLtcg: '10% (>₹1L)',
      bestFor: 'High-risk investors, sector bets',
      minSip: '₹500',
      examples: 'Tech, Pharma, Infrastructure',
      beginner: false,
    },
  ];

  const PRO_TIPS = [
    { icon: '🎯', title: 'Start Early, Invest Regularly',    tip: 'Even ₹500/month SIP started at age 22 can become ₹5 Cr by retirement. Time in market beats timing the market.' },
    { icon: '📊', title: 'Diversify Across Fund Types',      tip: 'Don\'t put all money in one fund type. Mix equity + debt + gold based on your risk profile for better stability.' },
    { icon: '🔄', title: 'Increase SIP with Income',         tip: 'Increase SIP amount by 10% every year (Step-Up SIP). This dramatically increases corpus over 10+ years.' },
    { icon: '😴', title: 'Don\'t Check Daily',               tip: 'Market volatility is normal. Checking NAV daily causes panic decisions. Review only every 6 months.' },
    { icon: '💡', title: 'Choose Direct Plans',              tip: 'Direct plans have 0.5–1% lower expense ratio than regular plans. This compounds to lakhs of rupees over 10+ years.' },
    { icon: '🚫', title: 'Avoid NFOs Blindly',              tip: 'New Fund Offers (NFOs) are not necessarily better. Prefer funds with 5+ year track record over new launches.' },
    { icon: '📋', title: 'Read the SID Before Investing',    tip: 'Always read the Scheme Information Document. Understand exit load, expense ratio, and investment objective.' },
    { icon: '🏦', title: 'Keep 6 Months Emergency Fund',     tip: 'Before investing in equity, keep 6 months of expenses in liquid/debt fund. Don\'t invest money you may need soon.' },
    { icon: '📱', title: 'Use Direct AMFI/MFCentral',        tip: 'Invest directly via AMC websites or MFCentral.in to avoid distributor commissions. Use Aadhaar-based eKYC.' },
    { icon: '🎓', title: 'ELSS for Tax Saving',             tip: 'ELSS funds give up to ₹1.5L tax deduction under Section 80C with only 3-year lock-in. Best tax-saving option.' },
  ];

  return (
    <div className="beginner-guide">

      {/* ── Hero ── */}
      <div className="bg-hero">
        <div className="bgh-left">
          <h1>📚 Mutual Fund Guide</h1>
          <p>Everything a beginner needs to know before investing in mutual funds</p>
          <div className="bgh-stats">
            <div className="bghs-item">
              <span className="bghs-val">6</span>
              <span className="bghs-label">Steps to Start</span>
            </div>
            <div className="bghs-item">
              <span className="bghs-val">{guide.faq?.length}</span>
              <span className="bghs-label">FAQs Answered</span>
            </div>
            <div className="bghs-item">
              <span className="bghs-val">{guide.glossary?.length}</span>
              <span className="bghs-label">Terms Explained</span>
            </div>
            <div className="bghs-item">
              <span className="bghs-val">10</span>
              <span className="bghs-label">Pro Tips</span>
            </div>
          </div>
        </div>
        <div className="bgh-right">
          <div className="bgh-alert">
            <span>⚠️</span>
            <div>
              <strong>Important Disclaimer</strong>
              <p>This guide is for educational purposes only. It does not constitute financial advice. Please consult a SEBI-registered financial advisor for personalized investment guidance.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="bg-tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`bg-tab ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >{t.label}</button>
        ))}
      </div>

      {/* ── Getting Started Steps ── */}
      {activeTab === 'steps' && (
        <div className="bg-section">
          <div className="bg-steps-intro">
            <h2>🚶 Your 6-Step Journey to Mutual Fund Investing</h2>
            <p>Follow these steps in order to start investing safely and smartly</p>
          </div>
          <div className="bg-steps">
            {guide.steps?.map((step, i) => (
              <div key={step.step} className="bg-step">
                <div className="bgs-num">{step.step}</div>
                <div className="bgs-icon">{step.icon}</div>
                <div className="bgs-content">
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                </div>
                {i < guide.steps.length - 1 && <div className="bgs-arrow">→</div>}
              </div>
            ))}
          </div>

          {/* Investment Journey Timeline */}
          <div className="bg-timeline">
            <h3>📅 Typical Investment Journey</h3>
            <div className="bgt-items">
              {[
                { time: 'Day 1',    icon: '🔍', label: 'Research & KYC',         desc: 'Complete KYC once using PAN + Aadhaar. Takes 10–15 minutes online.' },
                { time: 'Week 1',   icon: '📋', label: 'Choose Your Funds',       desc: 'Use FundSage AI to get personalised recommendations based on your profile.' },
                { time: 'Month 1',  icon: '💰', label: 'Start SIP',              desc: 'Set up auto-debit SIP. Start small — even ₹500 is a great beginning.' },
                { time: 'Month 6',  icon: '📊', label: 'First Review',           desc: 'Check if fund is performing close to benchmark. Don\'t panic if NAV is down.' },
                { time: 'Year 1',   icon: '🔄', label: 'Increase SIP',           desc: 'Increase SIP by 10% with salary hike. Add new fund if needed for diversification.' },
                { time: 'Year 3+',  icon: '🏆', label: 'Portfolio Rebalancing',  desc: 'Rebalance equity/debt ratio. Consider adding international or sectoral funds.' },
              ].map(t => (
                <div key={t.time} className="bgt-item">
                  <div className="bgti-time">{t.time}</div>
                  <div className="bgti-dot" />
                  <div className="bgti-content">
                    <span className="bgti-icon">{t.icon}</span>
                    <strong>{t.label}</strong>
                    <p>{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Platforms */}
          <div className="bg-platforms">
            <h3>📱 Where to Invest</h3>
            <div className="bgp-grid">
              {[
                { name: 'MFCentral',    url: 'https://www.mfcentral.com',    icon: '🏛️', type: 'Official AMFI Portal',   desc: 'Invest directly — no commission, lowest cost' },
                { name: 'Zerodha Coin', url: 'https://coin.zerodha.com',     icon: '🔵', type: 'Discount Broker',        desc: 'Clean UI, direct plans, zero commission' },
                { name: 'Groww',        url: 'https://groww.in',             icon: '🌱', type: 'Fintech Platform',       desc: 'Beginner-friendly, good for first-time investors' },
                { name: 'Paytm Money',  url: 'https://www.paytmmoney.com',   icon: '💙', type: 'Fintech Platform',       desc: 'Easy SIP setup, good mobile app' },
                { name: 'AMC Direct',   url: 'https://www.amfiindia.com',    icon: '🏦', type: 'Fund House Website',     desc: 'Invest directly at the source — no intermediary' },
              ].map(p => (
                <a key={p.name} href={p.url} target="_blank" rel="noreferrer" className="bgp-card">
                  <span className="bgp-icon">{p.icon}</span>
                  <div className="bgp-info">
                    <strong>{p.name}</strong>
                    <span className="bgp-type">{p.type}</span>
                    <span className="bgp-desc">{p.desc}</span>
                  </div>
                  <span className="bgp-arrow">→</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── FAQ ── */}
      {activeTab === 'faq' && (
        <div className="bg-section">
          <h2>❓ Frequently Asked Questions</h2>
          <div className="bg-faq">
            {guide.faq?.map((item, i) => (
              <div
                key={i}
                className={`bg-faq-item ${openFaq === i ? 'open' : ''}`}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <div className="bfq-question">
                  <span className="bfq-q">Q</span>
                  <span>{item.q}</span>
                  <span className="bfq-toggle">{openFaq === i ? '▲' : '▼'}</span>
                </div>
                {openFaq === i && (
                  <div className="bfq-answer">
                    <span className="bfq-a">A</span>
                    <p>{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Extra FAQs */}
          <div className="bg-faq">
            {[
              { q: 'How much should a beginner invest in mutual funds?',         a: 'Start with what you can afford to set aside each month. Even ₹500/month SIP is a good start. The key is consistency, not amount. Increase as your income grows. Never invest money you might need in the next 6 months.' },
              { q: 'What is the difference between direct and regular plans?',    a: 'Direct plans are bought directly from the fund house with no distributor commission — expense ratio is 0.5–1% lower. Regular plans go through distributors/agents who earn commission. Over 10 years, direct plans can generate significantly higher returns due to compounding.' },
              { q: 'Can I lose all my money in a mutual fund?',                  a: 'It is extremely unlikely to lose ALL money in a diversified mutual fund. However, you can lose a portion, especially in equity funds during market crashes. Debt funds are much more stable. Diversification across fund types reduces risk significantly.' },
              { q: 'How is SIP better than lumpsum for beginners?',              a: 'SIP averages out your purchase cost — you buy more units when prices are low and fewer when prices are high (called Rupee Cost Averaging). This removes the need to "time the market" and is psychologically easier as you invest a small fixed amount each month.' },
              { q: 'What is KYC and is it mandatory?',                           a: 'KYC (Know Your Customer) is a one-time identity verification required for all mutual fund investments. You need PAN card + Aadhaar + bank account. Once done, it is valid for all mutual funds. You can complete it online via eKYC in 10 minutes.' },
            ].map((item, i) => (
              <div
                key={`extra-${i}`}
                className={`bg-faq-item ${openFaq === `extra-${i}` ? 'open' : ''}`}
                onClick={() => setOpenFaq(openFaq === `extra-${i}` ? null : `extra-${i}`)}
              >
                <div className="bfq-question">
                  <span className="bfq-q">Q</span>
                  <span>{item.q}</span>
                  <span className="bfq-toggle">{openFaq === `extra-${i}` ? '▲' : '▼'}</span>
                </div>
                {openFaq === `extra-${i}` && (
                  <div className="bfq-answer">
                    <span className="bfq-a">A</span>
                    <p>{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Glossary ── */}
      {activeTab === 'glossary' && (
        <div className="bg-section">
          <h2>📖 Mutual Fund Glossary</h2>
          <div className="bg-search">
            <span>🔍</span>
            <input
              type="text"
              placeholder="Search terms..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-search-input"
            />
          </div>
          <div className="bg-glossary">
            {filteredGlossary?.map((item, i) => (
              <div key={i} className="bgl-item">
                <div className="bgl-term">{item.term}</div>
                <div className="bgl-def">{item.def}</div>
              </div>
            ))}
            {/* Extra glossary terms */}
            {[
              { term: 'SIP',          def: 'Systematic Investment Plan — invest fixed amount monthly. Best for regular income earners.' },
              { term: 'SWP',          def: 'Systematic Withdrawal Plan — withdraw fixed amount monthly from corpus. Good for retirees.' },
              { term: 'STP',          def: 'Systematic Transfer Plan — transfer money from one fund to another at regular intervals.' },
              { term: 'CAGR',         def: 'Compound Annual Growth Rate — annual growth rate over multiple years. Used for multi-year return comparison.' },
              { term: 'XIRR',         def: 'Extended Internal Rate of Return — returns calculation for SIP investments accounting for different investment dates.' },
              { term: 'Exit Load',    def: 'Fee charged for early redemption. Usually 1% for equity if redeemed within 1 year of purchase.' },
              { term: 'Expense Ratio',def: 'Annual fee charged by fund house for managing the fund. Deducted from NAV daily. Lower is better.' },
              { term: 'TER',          def: 'Total Expense Ratio — all-inclusive annual fee. SEBI limits: 2.25% for equity, 2% for debt.' },
              { term: 'Direct Plan',  def: 'Fund plan bought directly from AMC with no distributor. Lower expense ratio = higher returns.' },
              { term: 'Regular Plan', def: 'Fund plan bought via distributor/agent. Higher expense ratio due to distributor commission.' },
              { term: 'Growth Plan',  def: 'Returns are reinvested and reflected in rising NAV. Best for long-term wealth creation.' },
              { term: 'IDCW',         def: 'Income Distribution cum Capital Withdrawal — formerly "dividend". Distributes income periodically.' },
              { term: 'AMC',          def: 'Asset Management Company — the fund house that manages your mutual fund (e.g., HDFC AMC, SBI MF).' },
              { term: 'Folio',        def: 'Unique account number assigned to each investor-AMC combination. Like a bank account for mutual funds.' },
              { term: 'Lock-in',      def: 'Period during which you cannot redeem units. ELSS has 3-year lock-in; most funds have none.' },
              { term: 'Indexation',   def: 'Adjusting purchase price for inflation to reduce tax liability on long-term debt fund gains.' },
            ].filter(g =>
              !searchTerm ||
              g.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
              g.def.toLowerCase().includes(searchTerm.toLowerCase())
            ).map((item, i) => (
              <div key={`extra-${i}`} className="bgl-item">
                <div className="bgl-term">{item.term}</div>
                <div className="bgl-def">{item.def}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Fund Comparison ── */}
      {activeTab === 'compare' && (
        <div className="bg-section">
          <h2>⚖️ Fund Type Comparison</h2>
          <p className="bg-compare-intro">Compare all major mutual fund types to find what suits your profile</p>
          <div className="bg-compare-table-wrap">
            <table className="bg-compare-table">
              <thead>
                <tr>
                  <th>Fund Type</th>
                  <th>Risk</th>
                  <th>Expected Returns</th>
                  <th>Ideal Horizon</th>
                  <th>STCG Tax</th>
                  <th>LTCG Tax</th>
                  <th>Best For</th>
                  <th>Beginner?</th>
                </tr>
              </thead>
              <tbody>
                {FUND_COMPARISON.map(f => (
                  <tr key={f.type}>
                    <td>
                      <div className="bct-type">
                        <span>{f.icon}</span>
                        <strong>{f.type}</strong>
                      </div>
                    </td>
                    <td><span className="bct-risk" style={{ color: f.riskColor }}>{f.risk}</span></td>
                    <td style={{ color: '#2DCE89', fontWeight: 600 }}>{f.returns}</td>
                    <td style={{ color: '#00B4D8' }}>{f.horizon}</td>
                    <td style={{ color: '#F5365C', fontSize: '12px' }}>{f.taxStcg}</td>
                    <td style={{ color: '#F0A500', fontSize: '12px' }}>{f.taxLtcg}</td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{f.bestFor}</td>
                    <td>{f.beginner ? '✅ Yes' : '⚠️ Advanced'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* SIP vs Lumpsum */}
          <div className="bg-vs-card">
            <h3>🔄 SIP vs Lumpsum — Which is Better?</h3>
            <div className="bgv-grid">
              <div className="bgv-item sip">
                <div className="bgv-header">
                  <span>🔄</span>
                  <strong>SIP (Recommended for beginners)</strong>
                </div>
                <ul>
                  <li>✅ Invest fixed amount monthly</li>
                  <li>✅ Rupee cost averaging reduces risk</li>
                  <li>✅ No need to time the market</li>
                  <li>✅ Builds investment discipline</li>
                  <li>✅ Start with as low as ₹500/month</li>
                  <li>⚠️ Lower returns if market always goes up</li>
                </ul>
              </div>
              <div className="bgv-item lumpsum">
                <div className="bgv-header">
                  <span>💰</span>
                  <strong>Lumpsum (For experienced investors)</strong>
                </div>
                <ul>
                  <li>✅ Higher returns if invested at market low</li>
                  <li>✅ Full amount earning returns immediately</li>
                  <li>✅ Good for bonus/windfall investments</li>
                  <li>⚠️ High risk if timed wrongly</li>
                  <li>⚠️ Requires market knowledge to time</li>
                  <li>⚠️ Not suitable for regular income</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Pro Tips ── */}
      {activeTab === 'tips' && (
        <div className="bg-section">
          <h2>💡 Pro Tips for Smart Investing</h2>
          <div className="bg-tips">
            {PRO_TIPS.map((tip, i) => (
              <div key={i} className="bg-tip-card">
                <div className="bgt-num">{i + 1}</div>
                <div className="bgt-icon">{tip.icon}</div>
                <div className="bgt-content">
                  <strong>{tip.title}</strong>
                  <p>{tip.tip}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Power of Compounding */}
          <div className="bg-compounding">
            <h3>🚀 The Power of Compounding</h3>
            <p>Why starting early matters — ₹5,000/month SIP at 12% annual return:</p>
            <div className="bgc-table-wrap">
              <table className="bgc-table">
                <thead>
                  <tr>
                    <th>Start Age</th>
                    <th>Duration</th>
                    <th>Total Invested</th>
                    <th>Corpus at 60</th>
                    <th>Wealth Multiplier</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { age: 22, dur: 38, invested: 22.8,  corpus: 3.5,   mult: 15.4 },
                    { age: 25, dur: 35, invested: 21.0,  corpus: 2.5,   mult: 11.9 },
                    { age: 30, dur: 30, invested: 18.0,  corpus: 1.6,   mult:  8.9 },
                    { age: 35, dur: 25, invested: 15.0,  corpus: 0.95,  mult:  6.3 },
                    { age: 40, dur: 20, invested: 12.0,  corpus: 0.50,  mult:  4.2 },
                  ].map(r => (
                    <tr key={r.age}>
                      <td style={{ color: r.age <= 25 ? '#2DCE89' : r.age <= 30 ? '#F0A500' : '#F5365C', fontWeight: 700 }}>
                        Age {r.age}
                      </td>
                      <td>{r.dur} years</td>
                      <td>₹{r.invested}L</td>
                      <td style={{ color: '#F0A500', fontWeight: 700 }}>₹{r.corpus}Cr</td>
                      <td style={{ color: '#2DCE89', fontWeight: 700 }}>{r.mult}x</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="bgc-note">⚡ Starting at 22 vs 35 gives 3.7x more corpus — despite investing only ₹7.8L more!</p>
          </div>
        </div>
      )}
    </div>
  );
}