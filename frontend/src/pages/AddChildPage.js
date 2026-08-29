import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addChild } from '../services/api';
import Navbar from '../components/Navbar';

const AddChildPage = () => {
  const [form, setForm] = useState({
    full_name: '',
    date_of_birth: '',
    gender: 'male',
    birth_weight: '',
    birth_height: '',
    dietary_preference: 'none'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await addChild(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add child');
    }
    setLoading(false);
  };

  return (
    <div>
      <Navbar />
      <div className="container" style={{paddingTop: '30px',
                                         maxWidth: '600px'}}>
        <div className="page-header">
          <h1>Add a Child</h1>
          <p>Enter your child's details to start monitoring</p>
        </div>

        <div className="card">
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>

            <div className="form-group">
              <label>Child's Full Name</label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => setForm({...form, full_name: e.target.value})}
                placeholder="Enter child's full name"
                required
              />
            </div>

            <div className="form-group">
              <label>Date of Birth</label>
              <input
                type="date"
                value={form.date_of_birth}
                onChange={(e) => setForm({
                  ...form, date_of_birth: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label>Gender</label>
              <select
                value={form.gender}
                onChange={(e) => setForm({...form, gender: e.target.value})}>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label>Birth Weight (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.birth_weight}
                  onChange={(e) => setForm({
                    ...form, birth_weight: e.target.value})}
                  placeholder="e.g. 3.2"
                />
              </div>
              <div className="form-group">
                <label>Birth Height (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.birth_height}
                  onChange={(e) => setForm({
                    ...form, birth_height: e.target.value})}
                  placeholder="e.g. 50.5"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Dietary Preference</label>
              <select
                value={form.dietary_preference}
                onChange={(e) => setForm({
                  ...form, dietary_preference: e.target.value})}>
                <option value="none">No Restriction</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="gluten_free">Gluten Free</option>
              </select>
            </div>

            <div style={{display: 'flex', gap: '12px', marginTop: '8px'}}>
              <button
                className="btn-primary"
                type="submit"
                disabled={loading}
                style={{flex: 1, padding: '12px'}}>
                {loading ? 'Adding...' : 'Add Child'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                style={{flex: 1, padding: '12px', background: '#eee',
                        border: 'none', borderRadius: '8px',
                        cursor: 'pointer', fontWeight: '600'}}>
                Cancel
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default AddChildPage;