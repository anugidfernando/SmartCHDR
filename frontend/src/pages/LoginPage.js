import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../services/api';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await loginUser(form);
      login(
        { full_name: res.data.full_name, user_id: res.data.user_id },
        res.data.token
      );
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div style={{minHeight: '100vh', display: 'flex', 
                 alignItems: 'center', justifyContent: 'center'}}>
      <div className="card" style={{width: '100%', maxWidth: '400px'}}>
        <h2 style={{color: '#1b5e20', marginBottom: '24px', textAlign: 'center'}}>
          Login to SmartCHDR
        </h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({...form, email: e.target.value})}
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({...form, password: e.target.value})}
              placeholder="Enter your password"
              required
            />
          </div>
          <button 
            className="btn-primary" 
            type="submit" 
            disabled={loading}
            style={{width: '100%', padding: '12px', fontSize: '16px'}}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p style={{textAlign: 'center', marginTop: '16px', fontSize: '14px'}}>
          Don't have an account? <Link to="/register" 
          style={{color: '#2e7d32'}}>Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;