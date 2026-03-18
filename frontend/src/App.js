import React, { useState } from 'react';
import InputForm from './components/InputForm';
import RecommendationDashboard from './components/RecommendationDashboard';
import './App.css';

function App() {
  const [recommendations, setRecommendations] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRecommend = async (formData) => {
    setLoading(true);
    setError(null);
    setProfile(formData);
    try {
      const response = await fetch('https://curly-space-giggle-97g4g7gwwq6j2pjgq-8000.app.github.dev/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Failed to fetch recommendations');
      const data = await response.json();
      setRecommendations(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setRecommendations(null);
    setProfile(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">◈</span>
            <div>
              <h1>FundSage AI</h1>
              <p>Intelligent Mutual Fund Advisor</p>
            </div>
          </div>
          <div className="header-badges">
            <span className="badge badge-agentic">⚡ Agentic AI</span>
            <span className="badge badge-xai">🔍 Explainable AI</span>
            <span className="badge badge-live">● Live Data</span>
          </div>
        </div>
      </header>

      <main className="app-main">
        {!recommendations && !loading && (
          <InputForm onSubmit={handleRecommend} />
        )}

        {loading && (
          <div className="loading-screen">
            <div className="loading-spinner"></div>
            <h2>AI Agents Analysing Markets...</h2>
            <div className="loading-steps">
              <div className="step active">🤖 Planner Agent: Understanding your profile</div>
              <div className="step active">📊 Research Agent: Fetching live fund data</div>
              <div className="step active">🎯 Recommender Agent: Scoring funds</div>
              <div className="step active">🔍 XAI Engine: Generating explanations</div>
            </div>
          </div>
        )}

        {error && (
          <div className="error-card">
            <h3>⚠️ Error</h3>
            <p>{error}</p>
            <button onClick={handleReset}>Try Again</button>
          </div>
        )}

        {recommendations && !loading && (
          <RecommendationDashboard
            data={recommendations}
            profile={profile}
            onReset={handleReset}
          />
        )}
      </main>
    </div>
  );
}

export default App;