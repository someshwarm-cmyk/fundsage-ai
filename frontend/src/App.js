import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import InputForm from './components/InputForm';
import RecommendationDashboard from './components/RecommendationDashboard';
import BeginnerGuide from './components/BeginnerGuide';
import './App.css';

const API       = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const GOOGLE_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '383914891009-n37ifv73kjmd17tca1umtc3gttn6qp63.apps.googleusercontent.com';

function App() {
  const [user,            setUser]            = useState(null);
  const [activeNav,       setActiveNav]       = useState('dashboard');
  const [recommendations, setRecommendations] = useState(null);
  const [profile,         setProfile]         = useState(null);
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState(null);
  const [retrying,        setRetrying]        = useState(false);
  const [retryCount,      setRetryCount]      = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('fundsage_user');
    if (saved) {
      try { setUser(JSON.parse(saved)); }
      catch { localStorage.removeItem('fundsage_user'); }
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setActiveNav('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('fundsage_user');
    setUser(null);
    setRecommendations(null);
    setProfile(null);
    setActiveNav('dashboard');
  };

  const handleRecommend = async (formData, attempt = 1) => {
    setLoading(true);
    setError(null);
    setProfile(formData);
    if (attempt > 1) {
      setRetrying(true);
      setRetryCount(attempt);
    }
    try {
      const response = await fetch(`${API}/api/recommend`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(formData),
      });
      if (response.status === 503) {
        // Server waking up — retry after 10 seconds
        if (attempt <= 4) {
          setTimeout(() => handleRecommend(formData, attempt + 1), 10000);
          return;
        }
        throw new Error('503');
      }
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const data = await response.json();
      setRecommendations(data);
      setActiveNav('results');
      setRetrying(false);
      setRetryCount(0);
    } catch (err) {
      if (err.message === '503') {
        setError('503');
      } else {
        setError(err.message);
      }
      setRetrying(false);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setRecommendations(null);
    setProfile(null);
    setError(null);
    setRetrying(false);
    setRetryCount(0);
    setActiveNav('home');
  };

  if (!user) {
    return (
      <GoogleOAuthProvider clientId={GOOGLE_ID}>
        <Login onLogin={handleLogin} />
      </GoogleOAuthProvider>
    );
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_ID}>
      <div className="app">

        {/* ── Header ── */}
        <header className="app-header">
          <div className="header-inner">
            <div className="logo" onClick={() => setActiveNav('dashboard')} style={{ cursor: 'pointer' }}>
              <span className="logo-icon">◈</span>
              <div>
                <h1>FundSage AI</h1>
                <p>Intelligent Mutual Fund Advisor</p>
              </div>
            </div>

            <nav className="header-nav">
              <button className={`nav-btn ${activeNav === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveNav('dashboard')}>🏠 Dashboard</button>
              <button className={`nav-btn ${activeNav === 'home' ? 'active' : ''}`}
                onClick={() => setActiveNav('home')}>🔍 Get Recommendations</button>
              {recommendations && (
                <button className={`nav-btn ${activeNav === 'results' ? 'active' : ''}`}
                  onClick={() => setActiveNav('results')}>📊 Results</button>
              )}
              <button className={`nav-btn ${activeNav === 'guide' ? 'active' : ''}`}
                onClick={() => setActiveNav('guide')}>📚 Beginner Guide</button>
            </nav>

            <div className="header-right">
              <div className="header-badges">
                <span className="badge badge-agentic">⚡ Agentic AI</span>
                <span className="badge badge-xai">🔍 Explainable AI</span>
                <span className="badge badge-live">● Live Data</span>
              </div>
              <div className="header-user" onClick={handleLogout} title="Click to sign out">
                <img src={user.picture} alt={user.name} referrerPolicy="no-referrer" />
                <span>{user.name.split(' ')[0]}</span>
              </div>
            </div>
          </div>
        </header>

        {/* ── Main ── */}
        <main className="app-main">

          {/* Dashboard */}
          {activeNav === 'dashboard' && (
            <Dashboard
              user={user}
              onGetStarted={() => setActiveNav('home')}
              onLogout={handleLogout}
            />
          )}

          {/* Home */}
          {activeNav === 'home' && !loading && !error && (
            <InputForm onSubmit={handleRecommend} loading={loading} />
          )}

          {/* Loading / Waking up */}
          {loading && (
            <div className="loading-screen">
              <div className="loading-spinner" />
              {retrying ? (
                <>
                  <h2>⏳ Waking up server...</h2>
                  <p className="loading-retry-msg">
                    Render free tier goes to sleep after 15 mins of inactivity.<br />
                    Auto-retrying... attempt {retryCount} of 4
                  </p>
                  <div className="loading-wake-bar">
                    <div className="loading-wake-fill" style={{ width: `${retryCount * 25}%` }} />
                  </div>
                </>
              ) : (
                <>
                  <h2>AI Agents Analysing Markets...</h2>
                  <div className="loading-steps">
                    <div className="step active">🤖 Planner Agent: Understanding your profile</div>
                    <div className="step active">📊 Research Agent: Fetching live fund data</div>
                    <div className="step active">🎯 Recommender: Scoring with Random Forest</div>
                    <div className="step active">🔍 XAI Engine: Computing SHAP values</div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="error-card">
              {error === '503' ? (
                <>
                  <h3>⏳ Server is still waking up</h3>
                  <p>Render's free tier sleeps after 15 minutes of inactivity. The server took too long to respond.</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
                    Please wait 30 seconds and try again.
                  </p>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                    <button onClick={() => {
                      setError(null);
                      handleRecommend(profile);
                    }}>🔄 Retry Now</button>
                    <button onClick={handleReset} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                      ← Go Back
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3>⚠️ Error</h3>
                  <p>{error}</p>
                  <button onClick={handleReset}>Try Again</button>
                </>
              )}
            </div>
          )}

          {/* Results */}
          {activeNav === 'results' && recommendations && !loading && (
            <RecommendationDashboard
              data={recommendations}
              profile={profile}
              onReset={handleReset}
              apiBase={API}
            />
          )}

          {/* Guide */}
          {activeNav === 'guide' && (
            <BeginnerGuide apiBase={API} />
          )}

        </main>

        {/* ── Footer ── */}
        <footer className="app-footer">
          <p>⚠️ FundSage AI is for educational purposes only. Consult a SEBI-registered advisor before investing.</p>
          <p>Data sourced from AMFI/MFAPI.in · Powered by Random Forest + SHAP + Groq LLaMA3</p>
        </footer>
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;
