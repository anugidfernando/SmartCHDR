import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const LandingPage = () => {
  return (
    <div>
      <Navbar />
      <div className="container" style={{paddingTop: '60px', textAlign: 'center'}}>
        <h1 style={{fontSize: '42px', color: '#1b5e20', marginBottom: '16px'}}>
          Smart<span style={{color: '#4caf50'}}>CHDR</span>
        </h1>
        <p style={{fontSize: '18px', color: '#555', marginBottom: '8px'}}>
          AI-Powered Child Nutrition, Growth Monitoring
        </p>
        <p style={{fontSize: '18px', color: '#555', marginBottom: '40px'}}>
          and Vaccination Tracking for Sri Lankan Parents
        </p>
        <div style={{display: 'flex', gap: '16px', justifyContent: 'center'}}>
          <Link to="/register">
            <button className="btn-primary" style={{padding: '14px 32px', fontSize: '16px'}}>
              Get Started
            </button>
          </Link>
          <Link to="/login">
            <button className="btn-secondary" style={{padding: '14px 32px', fontSize: '16px'}}>
              Login
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;