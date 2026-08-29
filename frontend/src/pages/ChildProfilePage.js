import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getChildren, getGrowthHistory } from '../services/api';
import Navbar from '../components/Navbar';

const ChildProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [child, setChild] = useState(null);
  const [latestGrowth, setLatestGrowth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get child details
        const childRes = await getChildren();
        const foundChild = childRes.data.children.find(
          c => c.child_id === parseInt(id));
        setChild(foundChild);

        // Get latest growth record
        const growthRes = await getGrowthHistory(id);
        const records = growthRes.data.records || [];
        if (records.length > 0) {
          setLatestGrowth(records[records.length - 1]);
        }
      } catch (err) {
        console.error('Failed to fetch child data:', err);
      }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const calculateAge = (dob) => {
    const birth = new Date(dob);
    const today = new Date();
    const months = (today.getFullYear() - birth.getFullYear()) * 12 +
                   (today.getMonth() - birth.getMonth());
    if (months < 12) return `${months} months`;
    const years = Math.floor(months / 12);
    const rem = months % 12;
    return rem > 0 ? `${years} years ${rem} months` : `${years} years`;
  };

  const getStatusColor = (status) => {
    const colors = {
      normal: '#2e7d32', underweight: '#e65100',
      overweight: '#c62828', stunted: '#6a1b9a'
    };
    return colors[status] || '#666';
  };

  const getRiskColor = (risk) => {
    const colors = { low: '#2e7d32', moderate: '#e65100', high: '#c62828' };
    return colors[risk] || '#666';
  };

  if (loading) return (
    <div><Navbar /><div className="loading">Loading...</div></div>
  );

  if (!child) return (
    <div><Navbar />
    <div className="container" style={{paddingTop:'30px'}}>
      <p>Child not found.</p>
    </div></div>
  );

  const ageMonths = () => {
    const birth = new Date(child.date_of_birth);
    const today = new Date();
    return (today.getFullYear() - birth.getFullYear()) * 12 +
           (today.getMonth() - birth.getMonth());
  };

  return (
    <div>
      <Navbar />
      <div className="container" style={{paddingTop: '30px'}}>

        {/* Back button */}
        <button onClick={() => navigate('/dashboard')}
          style={{background: 'none', border: 'none', color: '#2e7d32',
                  cursor: 'pointer', fontSize: '14px', marginBottom: '16px',
                  fontWeight: '600'}}>
          ← Back to Dashboard
        </button>

        {/* Child Info Card */}
        <div className="card" style={{display: 'flex',
                                       alignItems: 'center', gap: '24px'}}>
          <div style={{fontSize: '72px'}}>
            {child.gender === 'male' ? '👦' : '👧'}
          </div>
          <div style={{flex: 1}}>
            <h1 style={{color: '#1b5e20', marginBottom: '8px'}}>
              {child.full_name}
            </h1>
            <div style={{display: 'flex', gap: '24px', flexWrap: 'wrap'}}>
              <span style={{color: '#666', fontSize: '14px'}}>
                🎂 Age: <strong>{calculateAge(child.date_of_birth)}</strong>
              </span>
              <span style={{color: '#666', fontSize: '14px'}}>
                ⚧ Gender: <strong>
                  {child.gender === 'male' ? 'Boy' : 'Girl'}
                </strong>
              </span>
              <span style={{color: '#666', fontSize: '14px'}}>
                📅 DOB: <strong>
                  {new Date(child.date_of_birth).toLocaleDateString()}
                </strong>
              </span>
              {child.birth_weight && (
                <span style={{color: '#666', fontSize: '14px'}}>
                  ⚖️ Birth Weight: <strong>{child.birth_weight} kg</strong>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Latest Growth Status */}
        {latestGrowth && (
          <div className="card">
            <h2 style={{color: '#1b5e20', marginBottom: '16px'}}>
              Latest Growth Status
            </h2>
            <div className="grid-3">
              <div style={{textAlign: 'center', padding: '16px',
                           background: '#f8f9fa', borderRadius: '8px'}}>
                <p style={{color: '#666', fontSize: '12px',
                           marginBottom: '4px'}}>GROWTH STATUS</p>
                <p style={{fontSize: '20px', fontWeight: 'bold',
                           color: getStatusColor(latestGrowth.growth_status),
                           textTransform: 'capitalize'}}>
                  {latestGrowth.growth_status}
                </p>
              </div>
              <div style={{textAlign: 'center', padding: '16px',
                           background: '#f8f9fa', borderRadius: '8px'}}>
                <p style={{color: '#666', fontSize: '12px',
                           marginBottom: '4px'}}>NUTRITION RISK</p>
                <p style={{fontSize: '20px', fontWeight: 'bold',
                           color: getRiskColor(latestGrowth.nutrition_risk),
                           textTransform: 'capitalize'}}>
                  {latestGrowth.nutrition_risk}
                </p>
              </div>
              <div style={{textAlign: 'center', padding: '16px',
                           background: '#f8f9fa', borderRadius: '8px'}}>
                <p style={{color: '#666', fontSize: '12px',
                           marginBottom: '4px'}}>LAST RECORDED</p>
                <p style={{fontSize: '16px', fontWeight: 'bold',
                           color: '#333'}}>
                  {new Date(latestGrowth.recorded_date)
                    .toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Cards */}
        <h2 style={{color: '#1b5e20', marginBottom: '16px'}}>
          Health Monitoring
        </h2>
        <div className="grid-2">

          {/* Growth Tracker */}
          <div className="card" style={{cursor: 'pointer',
                                         borderLeft: '4px solid #2e7d32'}}
               onClick={() => navigate(`/children/${id}/growth`)}>
            <div style={{fontSize: '32px', marginBottom: '8px'}}>📏</div>
            <h3 style={{color: '#1b5e20', marginBottom: '6px'}}>
              Growth Tracker
            </h3>
            <p style={{color: '#666', fontSize: '14px'}}>
              Enter measurements and get AI growth predictions
            </p>
          </div>

          {/* Growth Charts */}
          <div className="card" style={{cursor: 'pointer',
                                         borderLeft: '4px solid #1565c0'}}
               onClick={() => navigate(`/children/${id}/charts`)}>
            <div style={{fontSize: '32px', marginBottom: '8px'}}>📈</div>
            <h3 style={{color: '#1565c0', marginBottom: '6px'}}>
              Growth Charts
            </h3>
            <p style={{color: '#666', fontSize: '14px'}}>
              View growth trajectory against WHO standards
            </p>
          </div>

          {/* Meal Plan */}
          <div className="card" style={{cursor: 'pointer',
                                         borderLeft: '4px solid #e65100'}}
               onClick={() => navigate(`/children/${id}/meals`)}>
            <div style={{fontSize: '32px', marginBottom: '8px'}}>🍚</div>
            <h3 style={{color: '#e65100', marginBottom: '6px'}}>
              Sri Lankan Meal Plan
            </h3>
            <p style={{color: '#666', fontSize: '14px'}}>
              Get personalised 7-day Sri Lankan meal recommendations
            </p>
          </div>

          {/* Vaccination */}
          <div className="card" style={{cursor: 'pointer',
                                         borderLeft: '4px solid #6a1b9a'}}
               onClick={() => navigate(`/children/${id}/vaccines`)}>
            <div style={{fontSize: '32px', marginBottom: '8px'}}>💉</div>
            <h3 style={{color: '#6a1b9a', marginBottom: '6px'}}>
              Vaccination Tracker
            </h3>
            <p style={{color: '#666', fontSize: '14px'}}>
              Track EPI vaccination schedule and get reminders
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ChildProfilePage;