import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import InputForm from './components/InputForm';
import RecommendationDashboard from './components/RecommendationDashboard';
import BeginnerGuide from './components/BeginnerGuide';
import './App.css';

const API         = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const GOOGLE_ID   = process.env.REACT_APP_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';

function App() {
  const [user,            setUser]            = useState(null);
  const [activeNav,       setActiveNav]       = useState('dashboard');
  const [recommendations, setRecommendations] = useState(null);
  const [profile,         setProfile]         = useState(null);
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState(null);

  // Restore session from localStorage
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

  const handleRecommend = async (formData) => {
    setLoading(true);
    setError(null);
    setProfile(formData);
    try {
      const response = await fetch(`${API}/api/recommend`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(formData),
      });
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const data = await response.json();
      setRecommendations(data);
      setActiveNav('results');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setRecommendations(null);
    setProfile(null);
    setError(null);
    setActiveNav('home');
  };

  // Not logged in → show login page
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
              {/* User avatar in header */}
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

          {/* Home — Input Form */}
          {activeNav === 'home' && !loading && !error && (
            <InputForm onSubmit={handleRecommend} loading={loading} />
          )}

          {/* Loading */}
          {loading && (
            <div className="loading-screen">
              <div className="loading-spinner" />
              <h2>AI Agents Analysing Markets...</h2>
              <div className="loading-steps">
                <div className="step active">🤖 Planner Agent: Understanding your profile</div>
                <div className="step active">📊 Research Agent: Fetching live fund data</div>
                <div className="step active">🎯 Recommender Agent: Scoring with Random Forest</div>
                <div className="step active">🔍 XAI Engine: Computing SHAP values</div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="error-card">
              <h3>⚠️ Error</h3>
              <p>{error}</p>
              <button onClick={handleReset}>Try Again</button>
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
