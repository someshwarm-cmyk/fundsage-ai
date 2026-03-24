import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import './Login.css';

export default function Login({ onLogin }) {
  const [error, setError] = useState(null);

  const handleSuccess = (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      const user = {
        name:    decoded.name,
        email:   decoded.email,
        picture: decoded.picture,
        token:   credentialResponse.credential,
      };
      localStorage.setItem('fundsage_user', JSON.stringify(user));
      onLogin(user);
    } catch (err) {
      setError('Login failed. Please try again.');
    }
  };

  return (
    <div className="login-page">
      {/* Background animated orbs */}
      <div className="login-orb orb1" />
      <div className="login-orb orb2" />
      <div className="login-orb orb3" />

      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <span className="login-logo-icon">◈</span>
          <h1>FundSage <span>AI</span></h1>
        </div>
        <p className="login-tagline">Your intelligent mutual fund advisor</p>

        {/* Feature pills */}
        <div className="login-pills">
          <span>⚡ Agentic AI</span>
          <span>🔍 SHAP Explainability</span>
          <span>📊 Live AMFI Data</span>
        </div>

        <div className="login-divider">
          <span>Sign in to continue</span>
        </div>

        {/* Google Login Button */}
        <div className="login-google-btn">
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => setError('Google login failed. Please try again.')}
            useOneTap
            shape="pill"
            size="large"
            text="signin_with"
            theme="filled_black"
            width="300"
          />
        </div>

        {error && <p className="login-error">⚠️ {error}</p>}

        {/* Features list */}
        <div className="login-features">
          <div className="lf-item">
            <span className="lf-icon">🤖</span>
            <div>
              <strong>3-Agent AI Pipeline</strong>
              <p>Planner → Analyst → Explainer</p>
            </div>
          </div>
          <div className="lf-item">
            <span className="lf-icon">🌲</span>
            <div>
              <strong>Random Forest ML</strong>
              <p>Trained on 3,000 investor profiles</p>
            </div>
          </div>
          <div className="lf-item">
            <span className="lf-icon">💡</span>
            <div>
              <strong>SHAP Explanations</strong>
              <p>Know exactly why each fund is recommended</p>
            </div>
          </div>
          <div className="lf-item">
            <span className="lf-icon">📈</span>
            <div>
              <strong>Live NAV Data</strong>
              <p>Real-time data from AMFI/MFAPI.in</p>
            </div>
          </div>
        </div>

        <p className="login-disclaimer">
          For educational purposes only. Not SEBI-registered investment advice.
        </p>
      </div>
    </div>
  );
}
