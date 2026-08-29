import json
from datetime import date
import numpy as np
import pandas as pd
from flask import Blueprint, request, jsonify
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import MinMaxScaler
from utils import get_db, require_auth
from models.model_loader import models

meal_bp = Blueprint('meals', __name__)

NUTRITION_COLS = [
    'calories', 'protein_g', 'carbohydrates_g', 'fat_g', 'fiber_g',
    'iron_mg', 'calcium_mg', 'vitamin_a_ug', 'vitamin_c_mg', 'zinc_mg'
]

MEAL_PORTIONS = {
    'breakfast': 0.25,
    'lunch':     0.35,
    'dinner':    0.25,
    'snack':     0.15
}


def get_daily_nutritional_needs(age_months, nutrition_risk):
    if age_months < 6:
        needs = {
            'calories': 550, 'protein_g': 9.1, 'carbohydrates_g': 60.0,
            'fat_g': 31.0, 'fiber_g': 0.0, 'iron_mg': 0.27,
            'calcium_mg': 200.0, 'vitamin_a_ug': 400.0, 'vitamin_c_mg': 40.0, 'zinc_mg': 2.0
        }
    elif age_months < 12:
        needs = {
            'calories': 700, 'protein_g': 11.0, 'carbohydrates_g': 95.0,
            'fat_g': 30.0, 'fiber_g': 2.5, 'iron_mg': 11.0,
            'calcium_mg': 260.0, 'vitamin_a_ug': 500.0, 'vitamin_c_mg': 50.0, 'zinc_mg': 3.0
        }
    elif age_months < 24:
        needs = {
            'calories': 1000, 'protein_g': 13.0, 'carbohydrates_g': 130.0,
            'fat_g': 30.0, 'fiber_g': 19.0, 'iron_mg': 7.0,
            'calcium_mg': 700.0, 'vitamin_a_ug': 300.0, 'vitamin_c_mg': 15.0, 'zinc_mg': 3.0
        }
    elif age_months < 36:
        needs = {
            'calories': 1200, 'protein_g': 13.0, 'carbohydrates_g': 160.0,
            'fat_g': 35.0, 'fiber_g': 19.0, 'iron_mg': 7.0,
            'calcium_mg': 700.0, 'vitamin_a_ug': 300.0, 'vitamin_c_mg': 15.0, 'zinc_mg': 3.0
        }
    elif age_months < 48:
        needs = {
            'calories': 1400, 'protein_g': 19.0, 'carbohydrates_g': 190.0,
            'fat_g': 39.0, 'fiber_g': 25.0, 'iron_mg': 10.0,
            'calcium_mg': 1000.0, 'vitamin_a_ug': 400.0, 'vitamin_c_mg': 25.0, 'zinc_mg': 5.0
        }
    else:
        needs = {
            'calories': 1600, 'protein_g': 19.0, 'carbohydrates_g': 220.0,
            'fat_g': 44.0, 'fiber_g': 25.0, 'iron_mg': 10.0,
            'calcium_mg': 1000.0, 'vitamin_a_ug': 400.0, 'vitamin_c_mg': 25.0, 'zinc_mg': 5.0
        }

    multiplier = {'low': 1.0, 'moderate': 1.15, 'high': 1.25}.get(nutrition_risk, 1.0)
    for nutrient in ['protein_g', 'iron_mg', 'calcium_mg', 'vitamin_a_ug', 'vitamin_c_mg', 'zinc_mg']:
        needs[nutrient] = round(needs[nutrient] * multiplier, 2)

    return needs


def recommend_meals(age_months, nutrition_risk, meal_type, dietary_preference='none', top_n=14):
    meal_df = models['m3_meal_dataset']

    daily_needs = get_daily_nutritional_needs(age_months, nutrition_risk)
    portion = MEAL_PORTIONS.get(meal_type, 0.25)
    target_vector = np.array([daily_needs.get(col, 0) * portion for col in NUTRITION_COLS])

    eligible = meal_df[
        (meal_df['meal_type'] == meal_type) &
        (meal_df['age_group_min'] <= age_months) &
        (meal_df['age_group_max'] >= age_months)
    ].copy()

    # Apply dietary preference filter
    if dietary_preference == 'vegetarian':
        eligible = eligible[eligible['is_vegetarian'] == 1]
    elif dietary_preference == 'vegan':
        eligible = eligible[eligible['is_vegan'] == 1]
    elif dietary_preference == 'gluten_free':
        eligible = eligible[eligible['is_gluten_free'] == 1]

    if len(eligible) == 0:
        return pd.DataFrame()

    meal_matrix = eligible[NUTRITION_COLS].values
    # Scale target and meals together so no single nutrient dominates
    combined = np.vstack([target_vector, meal_matrix])
    scaler = MinMaxScaler()
    combined_scaled = scaler.fit_transform(combined)

    target_scaled = combined_scaled[0].reshape(1, -1)
    meals_scaled = combined_scaled[1:]

    similarities = cosine_similarity(target_scaled, meals_scaled)[0]
    eligible = eligible.copy()
    eligible['similarity_score'] = similarities

    return eligible.nlargest(top_n, 'similarity_score')


def generate_7day_plan(age_months, nutrition_risk, dietary_preference='none'):
    meal_types = ['breakfast', 'lunch', 'dinner', 'snack']
    recommendations = {
        mt: recommend_meals(age_months, nutrition_risk, mt, dietary_preference) for mt in meal_types
    }

    used_meals = {mt: [] for mt in meal_types}
    days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    plan = {}

    for day in days:
        day_plan = {}
        total_cal = 0

        for meal_type in meal_types:
            recs = recommendations[meal_type]
            if len(recs) == 0:
                day_plan[meal_type] = {'meal_name': 'Not available', 'meal_id': None, 'calories': 0}
                continue

            # Block meals used in last 2 days to ensure variety
            recent = used_meals[meal_type][-2:]
            available = recs[~recs['meal_name'].isin(recent)]
            if len(available) == 0:
                available = recs[~recs['meal_name'].isin(used_meals[meal_type][-1:])]
            if len(available) == 0:
                available = recs

            weights = available['similarity_score'].values.astype(float)
            weights = weights / weights.sum()
            chosen_idx = np.random.choice(len(available), p=weights)
            chosen = available.iloc[chosen_idx]

            day_plan[meal_type] = {
                'meal_name': chosen['meal_name'],
                'meal_id': int(chosen['meal_id']),
                'calories': int(chosen['calories'])
            }
            total_cal += int(chosen['calories'])
            used_meals[meal_type].append(chosen['meal_name'])

        day_plan['total_calories'] = total_cal
        plan[day] = day_plan

    return plan


@meal_bp.route('/generate', methods=['POST'])
@require_auth
def generate_meal():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body required'}), 400

    child_id = data.get('child_id')
    age_months = data.get('age_months')
    gender = data.get('gender', '').strip().lower()
    nutrition_risk = data.get('nutrition_risk', '').strip().lower()
    # Dietary preference from parent
    dietary_preference = data.get('dietary_preference', 'none').strip().lower()

    if any(v is None for v in [child_id, age_months]) or not gender:
        return jsonify({'error': 'child_id, age_months and gender are required'}), 400

    if dietary_preference not in ['none', 'vegetarian', 'vegan', 'gluten_free']:
        return jsonify({'error': 'dietary_preference must be none, vegetarian, vegan or gluten_free'}), 400

    age_months = int(age_months)

    # ── Under 6 months — breastfeeding guidance ───────────
    if age_months < 6:
        breastfeeding_guidance = {
            'type'   : 'breastfeeding',
            'title'  : 'Breastfeeding & Infant Feeding Guidance',
            'message': (
                'WHO recommends exclusive breastfeeding for '
                'the first 6 months of life. No solid foods '
                'or meal plans are needed at this stage.'
            ),
            'guidelines': [
                'Breastfeed on demand — at least 8 to 12 '
                'times per day for newborns',
                'If breastfeeding is not possible, use '
                'WHO/UNICEF recommended infant formula',
                'Do not introduce water, juice, or any '
                'solid foods before 6 months',
                'Ensure mother has adequate nutrition — '
                'this directly affects breast milk quality',
                'Visit your clinic regularly to monitor '
                'the child\'s weight gain',
            ],
            'formula_guidance': (
                'If using formula, follow the preparation '
                'instructions on the tin exactly. Use only '
                'boiled and cooled water. Never dilute '
                'formula to make it last longer.'
            ),
            'next_milestone': (
                f'Solid food introduction can begin at '
                f'6 months. Your child is currently '
                f'{age_months} month(s) old.'
            )
        }
        return jsonify({
            'success'    : True,
            'age_months' : age_months,
            'plan_type'  : 'breastfeeding',
            'guidance'   : breastfeeding_guidance
        }), 200

    if not nutrition_risk:
        return jsonify({'error': 'nutrition_risk is required'}), 400

    if nutrition_risk not in ['low', 'moderate', 'high']:
        return jsonify({'error': 'nutrition_risk must be low, moderate or high'}), 400

    try:
        plan = generate_7day_plan(age_months, nutrition_risk, dietary_preference)
    except Exception as e:
        return jsonify({'error': f'Meal plan generation error: {str(e)}'}), 500

    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            """INSERT INTO meal_plans (child_id, generated_date, age_months, nutrition_risk, plan_data)
               VALUES (%s, %s, %s, %s, %s)""",
            (child_id, date.today().isoformat(), int(age_months), nutrition_risk, json.dumps(plan))
        )
        conn.commit()
        plan_id = cursor.lastrowid
        cursor.close()
        conn.close()
    except Exception as e:
        return jsonify({'error': f'Database error: {str(e)}'}), 500

    return jsonify({
        'plan_id': plan_id,
        'age_months': age_months,
        'nutrition_risk': nutrition_risk,
        'dietary_preference': dietary_preference,
        'meal_plan': plan
    }), 201
