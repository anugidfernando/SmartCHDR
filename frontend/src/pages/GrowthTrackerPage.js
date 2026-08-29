import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getChildren, predictGrowth, getGrowthHistory } from '../services/api';
import Navbar from '../components/Navbar';

const GrowthTrackerPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [child, setChild] = useState(null);
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState({
    weight_kg: '', height_cm: '', recorded_date: '', notes: ''
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const childRes = await getChildren();
        const foundChild = childRes.data.children.find(
          c => c.child_id === parseInt(id));
        setChild(foundChild);
        const growthRes = await getGrowthHistory(id);
        setRecords(growthRes.data.records || []);
      } catch (err) {
        console.error(err);
      }
      setPageLoading(false);
    };
    fetchData();
  }, [id]);

  const calculateAgeMonths = (dob, recordedDate) => {
    const birth = new Date(dob);
    const recorded = new Date(recordedDate);
    return (recorded.getFullYear() - birth.getFullYear()) * 12 +
           (recorded.getMonth() - birth.getMonth());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const ageMonths = calculateAgeMonths(
        child.date_of_birth, form.recorded_date);
      if (ageMonths < 0 || ageMonths > 60) {
        setError('Child must be between 0 and 60 months old.');
        setLoading(false);
        return;
      }
      const res = await predictGrowth({
        child_id: parseInt(id),
        age_months: ageMonths,
        gender: child.gender,
        weight_kg: parseFloat(form.weight_kg),
        height_cm: parseFloat(form.height_cm),
        recorded_date: form.recorded_date,
        notes: form.notes
      });
      setResult(res.data);
      // Refresh records
      const growthRes = await getGrowthHistory(id);
      setRecords(growthRes.data.records || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Prediction failed');
    }
    setLoading(false);
  };

  const getStatusStyle = (status) => {
    const styles = {
      normal: { bg: '#e8f5e9', color: '#2e7d32' },
      underweight: { bg: '#fff3e0', color: '#e65100' },
      overweight: { bg: '#fce4ec', color: '#c62828' },
      stunted: { bg: '#f3e5f5', color: '#6a1b9a' }
    };
    return styles[status] || { bg: '#f5f5f5', color: '#333' };
  };

  const getRiskStyle = (risk) => {
    const styles = {
      low: { bg: '#e8f5e9', color: '#2e7d32' },
      moderate: { bg: '#fff3e0', color: '#e65100' },
      high: { bg: '#ffebee', color: '#c62828' }
    };
    return styles[risk] || { bg: '#f5f5f5', color: '#333' };
  };

  if (pageLoading) return (
    <div><Navbar /><div className="loading">Loading...</div></div>
  );

  return (
    <div>
      <Navbar />
      <div className="container" style={{paddingTop: '30px'}}>

        <button onClick={() => navigate(`/children/${id}`)}
          style={{background: 'none', border: 'none', color: '#2e7d32',
                  cursor: 'pointer', fontSize: '14px',
                  marginBottom: '16px', fontWeight: '600'}}>
          ← Back to {child?.full_name}'s Profile
        </button>

        <div className="page-header">
          <h1>Growth Tracker</h1>
          <p>Enter measurements to get AI-powered growth predictions</p>
        </div>

        <div className="grid-2">
          {/* Input Form */}
          <div className="card">
            <h3 style={{color: '#1b5e20', marginBottom: '16px'}}>
              📏 Enter New Measurement
            </h3>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Date of Measurement</label>
                <input
                  type="date"
                  value={form.recorded_date}
                  onChange={(e) => setForm({
                    ...form, recorded_date: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Weight (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.weight_kg}
                  onChange={(e) => setForm({
                    ...form, weight_kg: e.target.value})}
                  placeholder="e.g. 12.5"
                  required
                />
              </div>
              <div className="form-group">
                <label>Height (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.height_cm}
                  onChange={(e) => setForm({
                    ...form, height_cm: e.target.value})}
                  placeholder="e.g. 85.0"
                  required
                />
              </div>
              <div className="form-group">
                <label>Notes (Optional)</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm({
                    ...form, notes: e.target.value})}
                  placeholder="e.g. Clinic visit measurement"
                />
              </div>
              <button className="btn-primary" type="submit"
                disabled={loading}
                style={{width: '100%', padding: '12px'}}>
                {loading ? 'Analyzing...' : '🔍 Get AI Prediction'}
              </button>
            </form>
          </div>

          {/* Results */}
          <div>
            {result ? (
              <div>
                {/* Growth Status */}
                <div className="card" style={{
                  borderTop: `4px solid ${
                    getStatusStyle(result.growth_status).color}`}}>
                  <h3 style={{color: '#1b5e20', marginBottom: '16px'}}>
                    🤖 AI Prediction Results
                  </h3>

                  <div style={{display: 'flex', gap: '12px',
                               marginBottom: '16px'}}>
                    <div style={{flex: 1, textAlign: 'center',
                                 padding: '12px', borderRadius: '8px',
                                 background: getStatusStyle(
                                   result.growth_status).bg}}>
                      <p style={{fontSize: '11px', color: '#666',
                                 marginBottom: '4px'}}>GROWTH STATUS</p>
                      <p style={{fontWeight: 'bold', fontSize: '18px',
                                 color: getStatusStyle(
                                   result.growth_status).color,
                                 textTransform: 'capitalize'}}>
                        {result.growth_status}
                      </p>
                      <p style={{fontSize: '11px', color: '#666',
                                 marginTop: '4px'}}>
                        {result.growth_confidence?.toFixed(1)}% confidence
                      </p>
                    </div>
                    <div style={{flex: 1, textAlign: 'center',
                                 padding: '12px', borderRadius: '8px',
                                 background: getRiskStyle(
                                   result.nutrition_risk).bg}}>
                      <p style={{fontSize: '11px', color: '#666',
                                 marginBottom: '4px'}}>NUTRITION RISK</p>
                      <p style={{fontWeight: 'bold', fontSize: '18px',
                                 color: getRiskStyle(
                                   result.nutrition_risk).color,
                                 textTransform: 'capitalize'}}>
                        {result.nutrition_risk}
                      </p>
                      <p style={{fontSize: '11px', color: '#666',
                                 marginTop: '4px'}}>
                        {result.nutrition_confidence?.toFixed(1)}% confidence
                      </p>
                    </div>
                  </div>

                  {/* WHO Comparison */}
                  <div style={{background: '#f8f9fa', borderRadius: '8px',
                               padding: '12px', marginBottom: '12px'}}>
                    <p style={{fontWeight: '600', marginBottom: '8px',
                               color: '#333'}}>
                      📊 WHO Standard Comparison
                    </p>
                    <div style={{display: 'grid',
                                 gridTemplateColumns: '1fr 1fr',
                                 gap: '8px'}}>
                      <div>
                        <p style={{fontSize: '12px', color: '#666'}}>
                          Your child's weight
                        </p>
                        <p style={{fontWeight: 'bold', color: '#333'}}>
                          {result.weight_kg} kg
                        </p>
                        <p style={{fontSize: '12px', color: '#666'}}>
                          WHO expected
                        </p>
                        <p style={{fontWeight: 'bold',
                                   color: '#1565c0'}}>
                          {result.who_expected_weight} kg
                        </p>
                      </div>
                      <div>
                        <p style={{fontSize: '12px', color: '#666'}}>
                          Your child's height
                        </p>
                        <p style={{fontWeight: 'bold', color: '#333'}}>
                          {result.height_cm} cm
                        </p>
                        <p style={{fontSize: '12px', color: '#666'}}>
                          WHO expected
                        </p>
                        <p style={{fontWeight: 'bold',
                                   color: '#1565c0'}}>
                          {result.who_expected_height} cm
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Monthly Guidance */}
                  {result.monthly_guidance?.map((g, i) => (
                    <div key={i} className="alert alert-success"
                         style={{marginBottom: '8px'}}>
                      💡 {g}
                    </div>
                  ))}
                </div>

                {/* Nutrient Priorities */}
                {result.nutrient_priorities?.length > 0 && (
                  <div className="card">
                    <h3 style={{color: '#e65100', marginBottom: '12px'}}>
                      ⚠️ Priority Nutrients
                    </h3>
                    {result.nutrient_priorities.map((n, i) => (
                      <div key={i} style={{
                        padding: '10px', borderRadius: '8px',
                        background: n.priority === 'high'
                          ? '#ffebee' : '#fff3e0',
                        marginBottom: '8px',
                        borderLeft: `3px solid ${
                          n.priority === 'high' ? '#c62828' : '#e65100'}`}}>
                        <div style={{display: 'flex',
                                     justifyContent: 'space-between',
                                     alignItems: 'center'}}>
                          <strong style={{color: '#333'}}>
                            {n.nutrient}
                          </strong>
                          <span style={{
                            fontSize: '11px', fontWeight: 'bold',
                            color: n.priority === 'high'
                              ? '#c62828' : '#e65100',
                            textTransform: 'uppercase'}}>
                            {n.priority} priority
                          </span>
                        </div>
                        <p style={{fontSize: '12px', color: '#555',
                                   margin: '4px 0'}}>{n.reason}</p>
                        <p style={{fontSize: '12px', color: '#2e7d32'}}>
                          🥗 {n.food_sources}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="card" style={{textAlign: 'center',
                                             padding: '40px',
                                             color: '#666'}}>
                <div style={{fontSize: '48px', marginBottom: '16px'}}>
                  📊
                </div>
                <p>Enter measurements and click</p>
                <p><strong>"Get AI Prediction"</strong></p>
                <p>to see results here</p>
              </div>
            )}
          </div>
        </div>

        {/* Growth History */}
        {records.length > 0 && (
          <div className="card" style={{marginTop: '20px'}}>
            <h3 style={{color: '#1b5e20', marginBottom: '16px'}}>
              📋 Growth History
            </h3>
            <div style={{overflowX: 'auto'}}>
              <table style={{width: '100%', borderCollapse: 'collapse',
                             fontSize: '14px'}}>
                <thead>
                  <tr style={{background: '#f0f4f8'}}>
                    {['Date','Age','Weight','Height',
                      'WHO Weight','WHO Height',
                      'Status','Risk'].map(h => (
                      <th key={h} style={{padding: '10px 12px',
                                          textAlign: 'left',
                                          color: '#555',
                                          fontWeight: '600',
                                          borderBottom: '2px solid #ddd'}}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => (
                    <tr key={r.record_id}
                        style={{background: i%2===0 ? 'white' : '#fafafa'}}>
                      <td style={{padding: '10px 12px'}}>
                        {new Date(r.recorded_date).toLocaleDateString()}
                      </td>
                      <td style={{padding: '10px 12px'}}>
                        {r.age_months}m
                      </td>
                      <td style={{padding: '10px 12px'}}>
                        {parseFloat(r.weight_kg).toFixed(2)} kg
                      </td>
                      <td style={{padding: '10px 12px'}}>
                        {parseFloat(r.height_cm).toFixed(1)} cm
                      </td>
                      <td style={{padding: '10px 12px',
                                  color: '#1565c0'}}>
                        {parseFloat(r.who_weight_median).toFixed(2)} kg
                      </td>
                      <td style={{padding: '10px 12px',
                                  color: '#1565c0'}}>
                        {parseFloat(r.who_height_median).toFixed(1)} cm
                      </td>
                      <td style={{padding: '10px 12px'}}>
                        <span className={`badge badge-${r.growth_status}`}>
                          {r.growth_status}
                        </span>
                      </td>
                      <td style={{padding: '10px 12px'}}>
                        <span className={`badge badge-${r.nutrition_risk}`}>
                          {r.nutrition_risk}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GrowthTrackerPage;