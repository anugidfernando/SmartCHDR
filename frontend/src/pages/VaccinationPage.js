import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getVaccineSchedule, markVaccineComplete } from '../services/api';
import Navbar from '../components/Navbar';

const VaccinationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [childName, setChildName] = useState('');
  const [ageMonths, setAgeMonths] = useState(0);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchSchedule = async () => {
    try {
      const res = await getVaccineSchedule(id);
      setSchedule(res.data.schedule || []);
      setReminders(res.data.reminders || []);
      setChildName(res.data.child_name || '');
      setAgeMonths(res.data.age_months || 0);
      setTotalCompleted(res.data.total_completed || 0);
    } catch (err) {
      setError('Failed to load vaccination schedule');
    }
    setLoading(false);
  };

  useEffect(() => { fetchSchedule(); }, [id]);

  const handleMarkComplete = async (vaccine) => {
    setMarking(vaccine.vaccine_id);
    setError('');
    setSuccess('');
    try {
      await markVaccineComplete({
        child_id: parseInt(id),
        vaccine_id: vaccine.vaccine_id,
        vaccine_name: vaccine.vaccine_name,
        completed_date: new Date().toISOString().split('T')[0],
        due_date: vaccine.due_date
      });
      setSuccess(`${vaccine.vaccine_name} marked as completed!`);
      await fetchSchedule();
    } catch (err) {
      setError('Failed to mark vaccine as complete');
    }
    setMarking(null);
  };

  const getStatusStyle = (status) => {
    const styles = {
      completed: { bg: '#e8f5e9', color: '#2e7d32',
                   border: '#a5d6a7', label: '✅ Completed' },
      upcoming:  { bg: '#e3f2fd', color: '#1565c0',
                   border: '#90caf9', label: '📅 Upcoming' },
      due_soon:  { bg: '#fff3e0', color: '#e65100',
                   border: '#ffcc80', label: '⚠️ Due Soon' },
      overdue:   { bg: '#ffebee', color: '#c62828',
                   border: '#ef9a9a', label: '🚨 Overdue' },
    };
    return styles[status] || styles.upcoming;
  };

  const totalVaccines = schedule.length;
  const progressPercent = totalVaccines > 0
    ? Math.round((totalCompleted / totalVaccines) * 100) : 0;

  if (loading) return (
    <div><Navbar /><div className="loading">Loading...</div></div>
  );

  return (
    <div>
      <Navbar />
      <div className="container" style={{paddingTop: '30px'}}>

        <button onClick={() => navigate(`/children/${id}`)}
          style={{background: 'none', border: 'none',
                  color: '#2e7d32', cursor: 'pointer',
                  fontSize: '14px', marginBottom: '16px',
                  fontWeight: '600'}}>
          ← Back to {childName}'s Profile
        </button>

        <div className="page-header">
          <h1>Vaccination Tracker</h1>
          <p>Sri Lanka National EPI Immunization Schedule
            for {childName}</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && (
          <div className="alert alert-success">{success}</div>)}

        {/* Progress Card */}
        <div className="card" style={{marginBottom: '20px'}}>
          <div style={{display: 'flex', justifyContent: 'space-between',
                       alignItems: 'center', marginBottom: '12px'}}>
            <div>
              <h3 style={{color: '#1b5e20'}}>
                Vaccination Progress
              </h3>
              <p style={{color: '#666', fontSize: '14px'}}>
                Age: {ageMonths} months |
                {totalCompleted} of {totalVaccines} vaccines completed
              </p>
            </div>
            <div style={{textAlign: 'center'}}>
              <div style={{fontSize: '32px', fontWeight: 'bold',
                           color: progressPercent === 100
                             ? '#2e7d32' : '#1565c0'}}>
                {progressPercent}%
              </div>
              <div style={{fontSize: '12px', color: '#666'}}>
                Complete
              </div>
            </div>
          </div>
          {/* Progress Bar */}
          <div style={{background: '#e0e0e0', borderRadius: '8px',
                       height: '12px', overflow: 'hidden'}}>
            <div style={{
              width: `${progressPercent}%`,
              height: '100%',
              background: progressPercent === 100
                ? '#2e7d32' : '#1565c0',
              borderRadius: '8px',
              transition: 'width 0.5s ease'
            }} />
          </div>
        </div>

        {/* Reminders */}
        {reminders.length > 0 && (
          <div style={{marginBottom: '20px'}}>
            <h3 style={{color: '#c62828', marginBottom: '12px'}}>
              🔔 Active Alerts ({reminders.length})
            </h3>
            {reminders.map((r, i) => (
              <div key={i} className="alert alert-warning"
                   style={{marginBottom: '8px', fontWeight: '500'}}>
                {r.message || `${r.vaccine_name} — ${r.status}`}
              </div>
            ))}
          </div>
        )}

        {/* Vaccine Schedule */}
        <h3 style={{color: '#1b5e20', marginBottom: '12px'}}>
          💉 Full EPI Schedule
        </h3>
        <div style={{display: 'flex', flexDirection: 'column',
                     gap: '10px'}}>
          {schedule.map((vaccine) => {
            const style = getStatusStyle(vaccine.status);
            return (
              <div key={vaccine.vaccine_id}
                   style={{
                     background: style.bg,
                     border: `1px solid ${style.border}`,
                     borderRadius: '10px',
                     padding: '14px 18px',
                     display: 'flex',
                     alignItems: 'center',
                     gap: '16px',
                     flexWrap: 'wrap'
                   }}>

                {/* Status Badge */}
                <div style={{minWidth: '110px'}}>
                  <span style={{fontSize: '12px', fontWeight: 'bold',
                                color: style.color}}>
                    {style.label}
                  </span>
                </div>

                {/* Vaccine Info */}
                <div style={{flex: 1}}>
                  <p style={{fontWeight: '600', color: '#333',
                             marginBottom: '2px'}}>
                    {vaccine.vaccine_name}
                  </p>
                  <p style={{fontSize: '12px', color: '#666'}}>
                    Due: {vaccine.due_label} •
                    Date: {new Date(vaccine.due_date)
                      .toLocaleDateString()}
                    {vaccine.days_until > 0 && (
                      <span style={{color: '#1565c0',
                                    marginLeft: '8px'}}>
                        ({vaccine.days_until} days away)
                      </span>
                    )}
                    {vaccine.days_until < 0 &&
                     vaccine.status !== 'completed' && (
                      <span style={{color: '#c62828',
                                    marginLeft: '8px'}}>
                        ({Math.abs(vaccine.days_until)} days overdue)
                      </span>
                    )}
                  </p>
                  <p style={{fontSize: '12px', color: '#777',
                             marginTop: '2px'}}>
                    {vaccine.description}
                  </p>
                </div>

                {/* Mark Complete Button */}
                {vaccine.status !== 'completed' && (
                  <button
                    onClick={() => handleMarkComplete(vaccine)}
                    disabled={marking === vaccine.vaccine_id}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '6px',
                      border: 'none',
                      background: '#2e7d32',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}>
                    {marking === vaccine.vaccine_id
                      ? 'Saving...' : '✓ Mark Done'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default VaccinationPage;