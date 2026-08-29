import pandas as pd
from flask import Blueprint, request, jsonify
from utils import get_db, require_auth
from utils import get_nutrient_priorities
from models.model_loader import models

growth_bp = Blueprint('growth', __name__)


@growth_bp.route('/predict', methods=['POST'])
@require_auth
def predict_growth():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body required'}), 400

    from datetime import date as _date
    child_id = data.get('child_id')
    age_months = data.get('age_months')
    gender = data.get('gender', '').strip().lower()
    weight_kg = data.get('weight_kg')
    height_cm = data.get('height_cm')
    recorded_date = data.get('recorded_date', _date.today().isoformat())

    if any(v is None for v in [child_id, age_months, weight_kg, height_cm]) or not gender:
        return jsonify({'error': 'child_id, age_months, gender, weight_kg and height_cm are required'}), 400

    if gender not in ['male', 'female']:
        return jsonify({'error': 'gender must be male or female'}), 400

    gender_encoded = 1 if gender == 'male' else 0

    try:
        
        # Model 1 — classify growth status
        X_classify = pd.DataFrame(
            [[int(age_months), gender_encoded, float(weight_kg), float(height_cm)]],
            columns=models['m1_features']
        )
        status_encoded = models['m1_classifier'].predict(X_classify)[0]
        growth_status = models['m1_label_enc'].inverse_transform([status_encoded])[0]
        growth_confidence = round(float(max(models['m1_classifier'].predict_proba(X_classify)[0])) * 100, 2)

        # Model 1 — predict WHO expected weight and height (age + gender only)
        X_reg = pd.DataFrame(
            [[int(age_months), gender_encoded]],
            columns=models['m1_reg_features']
        )
        who_weight = round(float(models['m1_weight_reg'].predict(X_reg)[0]), 2)
        who_height = round(float(models['m1_height_reg'].predict(X_reg)[0]), 2)

        # Model 2 — classify nutrition risk
        X_nutrition = pd.DataFrame(
            [[int(age_months), gender_encoded, float(weight_kg), float(height_cm)]],
            columns=models['m2_features']
        )
        risk_encoded = models['m2_classifier'].predict(X_nutrition)[0]
        nutrition_risk = models['m2_label_enc'].inverse_transform([risk_encoded])[0]
        nutrition_confidence = round(float(max(models['m2_classifier'].predict_proba(X_nutrition)[0])) * 100, 2)

        # Calculate z-scores relative to WHO median
        weight_sd = max(who_weight * 0.1, 0.1)
        height_sd = max(who_height * 0.05, 0.5)
        weight_zscore = round((float(weight_kg) - who_weight) / weight_sd, 2)
        height_zscore = round((float(height_cm) - who_height) / height_sd, 2)

        # Nutrient priority guidance based on risk level and z-scores
        nutrient_info = get_nutrient_priorities(
            age_months,
            nutrition_risk,
            weight_zscore,
            height_zscore
        )

    except Exception as e:
        return jsonify({'error': f'Prediction error: {str(e)}'}), 500

    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            """INSERT INTO growth_records
               (child_id, age_months, weight_kg, height_cm, growth_status, nutrition_risk,
                weight_zscore, height_zscore, who_weight_median, who_height_median, recorded_date)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            (child_id, int(age_months), float(weight_kg), float(height_cm),
             growth_status, nutrition_risk, weight_zscore, height_zscore,
             who_weight, who_height, recorded_date)
        )
        conn.commit()
        record_id = cursor.lastrowid
        cursor.close()
        conn.close()
    except Exception as e:
        return jsonify({'error': f'Database error: {str(e)}'}), 500

    return jsonify({
        'success'             : True,
        'record_id'           : record_id,
        'growth_status'       : growth_status,
        'growth_confidence'   : growth_confidence,
        'nutrition_risk'      : nutrition_risk,
        'nutrition_confidence': nutrition_confidence,
        'who_expected_weight' : who_weight,
        'who_expected_height' : who_height,
        'weight_zscore'       : weight_zscore,
        'height_zscore'       : height_zscore,
        'age_months'          : age_months,
        'weight_kg'           : weight_kg,
        'height_cm'           : height_cm,
        'nutrient_priorities' : nutrient_info['priority_nutrients'],
        'monthly_guidance'    : nutrient_info['monthly_guidance'],
    }), 200






@growth_bp.route('/<int:child_id>', methods=['GET'])
@require_auth
def get_growth_history(child_id):
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT * FROM growth_records WHERE child_id = %s ORDER BY age_months ASC",
            (child_id,)
        )
        records = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify({'records': records}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
