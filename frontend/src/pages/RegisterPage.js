import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../services/api';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', phone_number: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await registerUser(form);
      if (res.data.token) {
        login(
          { full_name: form.full_name, user_id: res.data.user_id },
          res.data.token
        );
        navigate('/dashboard');
      } else {
        navigate('/login');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
    setLoading(false);
  };

  return (
    <div style={{minHeight: '100vh', display: 'flex',
                 alignItems: 'center', justifyContent: 'center',
                 padding: '20px'}}>
      <div className="card" style={{width: '100%', maxWidth: '450px'}}>
        <h2 style={{color: '#1b5e20', marginBottom: '24px', textAlign: 'center'}}>
          Create Account
        </h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => setForm({...form, full_name: e.target.value})}
              placeholder="Enter your full name"
              required
            />
          </div>
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
              placeholder="Create a password"
              required
            />
          </div>
          <div className="form-group">
            <label>Phone Number (Optional)</label>
            <input
              type="text"
              value={form.phone_number}
              onChange={(e) => setForm({...form, phone_number: e.target.value})}
              placeholder="07XXXXXXXX"
            />
          </div>
          <button
            className="btn-primary"
            type="submit"
            disabled={loading}
            style={{width: '100%', padding: '12px', fontSize: '16px'}}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        <p style={{textAlign: 'center', marginTop: '16px', fontSize: '14px'}}>
          Already have an account? <Link to="/login"
          style={{color: '#2e7d32'}}>Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;