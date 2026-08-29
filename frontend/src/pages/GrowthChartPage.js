import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getChildren, getGrowthHistory } from '../services/api';
import Navbar from '../components/Navbar';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend
);

const GrowthChartPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [child, setChild] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

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
      setLoading(false);
    };
    fetchData();
  }, [id]);

  if (loading) return (
    <div><Navbar /><div className="loading">Loading...</div></div>
  );

  // Prepare chart data
  const labels = records.map(r =>
    `${r.age_months}m`);

  const weightChartData = {
    labels,
    datasets: [
      {
        label: "Child's Weight (kg)",
        data: records.map(r => parseFloat(r.weight_kg)),
        borderColor: '#2e7d32',
        backgroundColor: 'rgba(46,125,50,0.1)',
        borderWidth: 2,
        pointRadius: 5,
        pointBackgroundColor: '#2e7d32',
        tension: 0.3,
      },
      {
        label: 'WHO Expected Weight (kg)',
        data: records.map(r => parseFloat(r.who_weight_median)),
        borderColor: '#1565c0',
        backgroundColor: 'rgba(21,101,192,0.1)',
        borderWidth: 2,
        borderDash: [6, 3],
        pointRadius: 4,
        pointBackgroundColor: '#1565c0',
        tension: 0.3,
      }
    ]
  };

  const heightChartData = {
    labels,
    datasets: [
      {
        label: "Child's Height (cm)",
        data: records.map(r => parseFloat(r.height_cm)),
        borderColor: '#e65100',
        backgroundColor: 'rgba(230,81,0,0.1)',
        borderWidth: 2,
        pointRadius: 5,
        pointBackgroundColor: '#e65100',
        tension: 0.3,
      },
      {
        label: 'WHO Expected Height (cm)',
        data: records.map(r => parseFloat(r.who_height_median)),
        borderColor: '#6a1b9a',
        backgroundColor: 'rgba(106,27,154,0.1)',
        borderWidth: 2,
        borderDash: [6, 3],
        pointRadius: 4,
        pointBackgroundColor: '#6a1b9a',
        tension: 0.3,
      }
    ]
  };

  const chartOptions = (title, unit) => ({
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: {
        display: true,
        text: title,
        font: { size: 14, weight: 'bold' },
        color: '#333'
      },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${ctx.raw} ${unit}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: { color: 'rgba(0,0,0,0.05)' }
      },
      x: {
        grid: { color: 'rgba(0,0,0,0.05)' }
      }
    }
  });

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
          <h1>Growth Charts</h1>
          <p>Visual growth trajectory compared to WHO standards</p>
        </div>

        {records.length === 0 ? (
          <div className="card" style={{textAlign: 'center',
                                         padding: '60px'}}>
            <div style={{fontSize: '48px', marginBottom: '16px'}}>
              📈
            </div>
            <p style={{color: '#666', fontSize: '16px',
                       marginBottom: '16px'}}>
              No growth records yet.
            </p>
            <button className="btn-primary"
              onClick={() => navigate(`/children/${id}/growth`)}>
              Add First Measurement
            </button>
          </div>
        ) : (
          <>
            {/* Weight Chart */}
            <div className="card">
              <Line
                data={weightChartData}
                options={chartOptions(
                  `Weight Progress — ${child?.full_name}`, 'kg')}
              />
              <p style={{textAlign: 'center', color: '#666',
                         fontSize: '12px', marginTop: '8px'}}>
                Solid line = child's actual weight |
                Dashed line = WHO standard reference
              </p>
            </div>

            {/* Height Chart */}
            <div className="card">
              <Line
                data={heightChartData}
                options={chartOptions(
                  `Height Progress — ${child?.full_name}`, 'cm')}
              />
              <p style={{textAlign: 'center', color: '#666',
                         fontSize: '12px', marginTop: '8px'}}>
                Solid line = child's actual height |
                Dashed line = WHO standard reference
              </p>
            </div>

            {/* Z-Score Summary */}
            <div className="card">
              <h3 style={{color: '#1b5e20', marginBottom: '16px'}}>
                📊 Z-Score History
              </h3>
              <p style={{color: '#666', fontSize: '13px',
                         marginBottom: '12px'}}>
                Z-score shows how far your child's measurements are
                from the WHO average. Between -2 and +2 is normal.
              </p>
              <div style={{overflowX: 'auto'}}>
                <table style={{width: '100%',
                               borderCollapse: 'collapse',
                               fontSize: '14px'}}>
                  <thead>
                    <tr style={{background: '#f0f4f8'}}>
                      {['Date','Age','Weight Z-Score',
                        'Height Z-Score','Status'].map(h => (
                        <th key={h} style={{padding: '10px 12px',
                                            textAlign: 'left',
                                            color: '#555',
                                            fontWeight: '600',
                                            borderBottom:
                                              '2px solid #ddd'}}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r, i) => (
                      <tr key={r.record_id}
                          style={{background:
                            i%2===0 ? 'white' : '#fafafa'}}>
                        <td style={{padding: '10px 12px'}}>
                          {new Date(r.recorded_date)
                            .toLocaleDateString()}
                        </td>
                        <td style={{padding: '10px 12px'}}>
                          {r.age_months}m
                        </td>
                        <td style={{padding: '10px 12px',
                          color: parseFloat(r.weight_zscore) < -2
                            ? '#c62828'
                            : parseFloat(r.weight_zscore) < -1
                            ? '#e65100' : '#2e7d32',
                          fontWeight: 'bold'}}>
                          {parseFloat(r.weight_zscore).toFixed(2)}
                        </td>
                        <td style={{padding: '10px 12px',
                          color: parseFloat(r.height_zscore) < -2
                            ? '#c62828'
                            : parseFloat(r.height_zscore) < -1
                            ? '#e65100' : '#2e7d32',
                          fontWeight: 'bold'}}>
                          {parseFloat(r.height_zscore).toFixed(2)}
                        </td>
                        <td style={{padding: '10px 12px'}}>
                          <span className={
                            `badge badge-${r.growth_status}`}>
                            {r.growth_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GrowthChartPage;