import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getChildren, generateMealPlan, getGrowthHistory } from '../services/api';
import Navbar from '../components/Navbar';

const DAYS = ['Monday','Tuesday','Wednesday',
              'Thursday','Friday','Saturday','Sunday'];
const MEAL_TYPES = ['breakfast','lunch','dinner','snack'];
const MEAL_ICONS = {
  breakfast: '🌅', lunch: '☀️',
  dinner: '🌙', snack: '🍎'
};

const MealPlanPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [child, setChild] = useState(null);
  const [mealPlan, setMealPlan] = useState(null);
  const [nutritionRisk, setNutritionRisk] = useState('low');
  const [ageMonths, setAgeMonths] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDay, setSelectedDay] = useState('Monday');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const childRes = await getChildren();
        const foundChild = childRes.data.children.find(
          c => c.child_id === parseInt(id));
        setChild(foundChild);

        // Calculate age in months
        const birth = new Date(foundChild.date_of_birth);
        const today = new Date();
        const months = (today.getFullYear() - birth.getFullYear())
          * 12 + (today.getMonth() - birth.getMonth());
        setAgeMonths(months);

        // Get latest nutrition risk from growth records
        const growthRes = await getGrowthHistory(id);
        const records = growthRes.data.records || [];
        if (records.length > 0) {
          const latest = records[records.length - 1];
          setNutritionRisk(latest.nutrition_risk || 'low');
        }
      } catch (err) {
        console.error(err);
      }
      setPageLoading(false);
    };
    fetchData();
  }, [id]);

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await generateMealPlan({
        child_id: parseInt(id),
        age_months: ageMonths,
        gender: child.gender,
        nutrition_risk: nutritionRisk,
        dietary_preference: child.dietary_preference || 'none'
      });
      setMealPlan(res.data.meal_plan);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate meal plan');
    }
    setLoading(false);
  };

  const getRiskColor = (risk) => {
    const colors = {
      low: '#2e7d32', moderate: '#e65100', high: '#c62828'
    };
    return colors[risk] || '#666';
  };

  if (pageLoading) return (
    <div><Navbar /><div className="loading">Loading...</div></div>
  );

  // Under 6 months — show breastfeeding guidance
  if (ageMonths < 6) {
    return (
      <div>
        <Navbar />
        <div className="container" style={{paddingTop: '30px'}}>
          <button onClick={() => navigate(`/children/${id}`)}
            style={{background: 'none', border: 'none',
                    color: '#2e7d32', cursor: 'pointer',
                    fontSize: '14px', marginBottom: '16px',
                    fontWeight: '600'}}>
            ← Back to {child?.full_name}'s Profile
          </button>
          <div className="card" style={{textAlign: 'center',
                                         padding: '40px'}}>
            <div style={{fontSize: '64px', marginBottom: '16px'}}>
              🤱
            </div>
            <h2 style={{color: '#1b5e20', marginBottom: '12px'}}>
              Breastfeeding Guidance
            </h2>
            <p style={{color: '#666', marginBottom: '16px',
                       maxWidth: '500px', margin: '0 auto 16px'}}>
              WHO recommends exclusive breastfeeding for the first
              6 months of life. {child?.full_name} is currently
              {ageMonths} month(s) old.
            </p>
            <div style={{background: '#e8f5e9', borderRadius: '8px',
                         padding: '16px', textAlign: 'left',
                         maxWidth: '500px', margin: '0 auto'}}>
              <p style={{fontWeight: '600', color: '#2e7d32',
                         marginBottom: '8px'}}>
                Guidelines:
              </p>
              {[
                'Breastfeed on demand — at least 8-12 times per day',
                'No solid foods or water before 6 months',
                'If formula feeding, follow tin instructions exactly',
                'Visit clinic regularly to monitor weight gain'
              ].map((g, i) => (
                <p key={i} style={{color: '#444', fontSize: '14px',
                                   marginBottom: '6px'}}>
                  ✓ {g}
                </p>
              ))}
            </div>
            <p style={{color: '#1565c0', marginTop: '16px',
                       fontSize: '14px'}}>
              Solid food introduction can begin at 6 months.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="container" style={{paddingTop: '30px'}}>

        <button onClick={() => navigate(`/children/${id}`)}
          style={{background: 'none', border: 'none',
                  color: '#2e7d32', cursor: 'pointer',
                  fontSize: '14px', marginBottom: '16px',
                  fontWeight: '600'}}>
          ← Back to {child?.full_name}'s Profile
        </button>

        <div className="page-header">
          <h1>Sri Lankan Meal Plan</h1>
          <p>Personalised 7-day meal recommendations for
            {' '}{child?.full_name}</p>
        </div>

        {/* Child Info Summary */}
        <div className="card" style={{display: 'flex',
                                       gap: '24px',
                                       alignItems: 'center',
                                       marginBottom: '20px'}}>
          <div style={{fontSize: '48px'}}>
            {child?.gender === 'male' ? '👦' : '👧'}
          </div>
          <div style={{flex: 1}}>
            <h3 style={{color: '#1b5e20'}}>{child?.full_name}</h3>
            <p style={{color: '#666', fontSize: '14px'}}>
              Age: {ageMonths} months | 
              Dietary Preference: {child?.dietary_preference || 'None'}
            </p>
            <p style={{fontSize: '14px', marginTop: '4px'}}>
              Nutrition Risk:{' '}
              <strong style={{color: getRiskColor(nutritionRisk),
                              textTransform: 'capitalize'}}>
                {nutritionRisk}
              </strong>
              {' '}(from latest growth record)
            </p>
          </div>
          <button className="btn-primary"
            onClick={handleGenerate} disabled={loading}
            style={{padding: '12px 24px', fontSize: '15px'}}>
            {loading ? 'Generating...' : '🍚 Generate Meal Plan'}
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Meal Plan Display */}
        {mealPlan ? (
          <div>
            {/* Day Selector Tabs */}
            <div style={{display: 'flex', gap: '8px',
                         marginBottom: '16px', flexWrap: 'wrap'}}>
              {DAYS.map(day => (
                <button key={day}
                  onClick={() => setSelectedDay(day)}
                  style={{
                    padding: '8px 16px', borderRadius: '20px',
                    border: 'none', cursor: 'pointer',
                    fontWeight: '600', fontSize: '13px',
                    background: selectedDay === day
                      ? '#1b5e20' : '#e8f5e9',
                    color: selectedDay === day
                      ? 'white' : '#2e7d32',
                    transition: 'all 0.2s'
                  }}>
                  {day}
                </button>
              ))}
            </div>

            {/* Selected Day Meals */}
            {mealPlan[selectedDay] && (
              <div className="grid-2">
                {MEAL_TYPES.map(mealType => {
                  const meal = mealPlan[selectedDay][mealType];
                  return meal ? (
                    <div key={mealType} className="card"
                         style={{borderTop: '3px solid #2e7d32'}}>
                      <div style={{display: 'flex',
                                   alignItems: 'center',
                                   gap: '8px', marginBottom: '8px'}}>
                        <span style={{fontSize: '20px'}}>
                          {MEAL_ICONS[mealType]}
                        </span>
                        <span style={{fontWeight: '600',
                                      color: '#555', fontSize: '13px',
                                      textTransform: 'uppercase'}}>
                          {mealType}
                        </span>
                      </div>
                      <h3 style={{color: '#1b5e20',
                                  marginBottom: '8px',
                                  fontSize: '16px'}}>
                        {meal.meal_name}
                      </h3>
                      <p style={{color: '#666', fontSize: '13px',
                                 marginBottom: '8px'}}>
                        {meal.description ||
                         'A nutritious Sri Lankan meal'}
                      </p>
                      <div style={{display: 'flex', gap: '12px',
                                   flexWrap: 'wrap'}}>
                        <span style={{fontSize: '12px',
                                      background: '#e8f5e9',
                                      color: '#2e7d32',
                                      padding: '3px 10px',
                                      borderRadius: '12px'}}>
                          🔥 {meal.calories} kcal
                        </span>
                        {meal.protein_g && (
                          <span style={{fontSize: '12px',
                                        background: '#e3f2fd',
                                        color: '#1565c0',
                                        padding: '3px 10px',
                                        borderRadius: '12px'}}>
                            💪 {meal.protein_g}g protein
                          </span>
                        )}
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
            )}

            {/* Daily Calorie Summary */}
            <div className="card" style={{
              background: '#f0f4f8', marginTop: '8px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between',
                           alignItems: 'center', flexWrap: 'wrap',
                           gap: '12px'}}>
                <strong style={{color: '#1b5e20'}}>
                  {selectedDay} Total Calories
                </strong>
                <div style={{display: 'flex', gap: '16px',
                             flexWrap: 'wrap'}}>
                  {MEAL_TYPES.map(mt => {
                    const meal = mealPlan[selectedDay]?.[mt];
                    return meal ? (
                      <span key={mt} style={{fontSize: '13px',
                                             color: '#555'}}>
                        {MEAL_ICONS[mt]} {mt}: {meal.calories} kcal
                      </span>
                    ) : null;
                  })}
                  <span style={{fontWeight: 'bold', color: '#1b5e20'}}>
                    Total: {MEAL_TYPES.reduce((sum, mt) => {
                      return sum + (mealPlan[selectedDay]?.[mt]
                        ?.calories || 0);
                    }, 0)} kcal
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card" style={{textAlign: 'center',
                                         padding: '60px'}}>
            <div style={{fontSize: '64px', marginBottom: '16px'}}>
              🍚
            </div>
            <p style={{color: '#666', fontSize: '16px',
                       marginBottom: '8px'}}>
              Click <strong>"Generate Meal Plan"</strong> above
            </p>
            <p style={{color: '#666', fontSize: '14px'}}>
              to get a personalised 7-day Sri Lankan meal plan
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MealPlanPage;