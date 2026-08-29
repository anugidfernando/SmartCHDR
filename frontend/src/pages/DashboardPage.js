import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getChildren } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const DashboardPage = () => {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const res = await getChildren();
        setChildren(res.data.children || []);
      } catch (err) {
        console.error('Failed to fetch children:', err);
      }
      setLoading(false);
    };
    fetchChildren();
  }, []);

  const calculateAge = (dob) => {
    const birth = new Date(dob);
    const today = new Date();
    const months = (today.getFullYear() - birth.getFullYear()) * 12 +
                   (today.getMonth() - birth.getMonth());
    if (months < 12) return `${months} months`;
    const years = Math.floor(months / 12);
    const rem = months % 12;
    return rem > 0 ? `${years}y ${rem}m` : `${years} years`;
  };

  return (
    <div>
      <Navbar />
      <div className="container" style={{paddingTop: '30px'}}>
        <div style={{display: 'flex', justifyContent: 'space-between',
                     alignItems: 'center', marginBottom: '24px'}}>
          <div>
            <h1 style={{color: '#1b5e20', fontSize: '26px'}}>
              Welcome, {user?.full_name}!
            </h1>
            <p style={{color: '#666', marginTop: '4px'}}>
              Monitor your children's health and growth
            </p>
          </div>
          <Link to="/children/add">
            <button className="btn-primary">+ Add Child</button>
          </Link>
        </div>

        {loading ? (
          <div className="loading">Loading children...</div>
        ) : children.length === 0 ? (
          <div className="card" style={{textAlign: 'center', padding: '60px'}}>
            <p style={{fontSize: '18px', color: '#666', marginBottom: '20px'}}>
              No children added yet.
            </p>
            <Link to="/children/add">
              <button className="btn-primary">Add Your First Child</button>
            </Link>
          </div>
        ) : (
          <div className="grid-3">
            {children.map((child) => (
              <div key={child.child_id} className="card"
                   style={{cursor: 'pointer', transition: 'transform 0.2s'}}
                   onClick={() => navigate(`/children/${child.child_id}`)}>
                <div style={{fontSize: '48px', textAlign: 'center',
                             marginBottom: '12px'}}>
                  {child.gender === 'male' ? '👦' : '👧'}
                </div>
                <h3 style={{textAlign: 'center', color: '#1b5e20',
                            marginBottom: '8px'}}>
                  {child.full_name}
                </h3>
                <p style={{textAlign: 'center', color: '#666', fontSize: '14px'}}>
                  Age: {calculateAge(child.date_of_birth)}
                </p>
                <p style={{textAlign: 'center', color: '#666', fontSize: '14px'}}>
                  {child.gender === 'male' ? 'Boy' : 'Girl'}
                </p>
                <div style={{marginTop: '16px', display: 'flex',
                             gap: '8px', flexWrap: 'wrap',
                             justifyContent: 'center'}}>
                  <span style={{fontSize: '11px', background: '#e8f5e9',
                                color: '#2e7d32', padding: '3px 8px',
                                borderRadius: '12px'}}>
                    Growth
                  </span>
                  <span style={{fontSize: '11px', background: '#e3f2fd',
                                color: '#1565c0', padding: '3px 8px',
                                borderRadius: '12px'}}>
                    Nutrition
                  </span>
                  <span style={{fontSize: '11px', background: '#fce4ec',
                                color: '#c62828', padding: '3px 8px',
                                borderRadius: '12px'}}>
                    Vaccines
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;