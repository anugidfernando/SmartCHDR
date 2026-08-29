import jwt
import mysql.connector
from functools import wraps
from flask import request, jsonify
from config import Config


def get_db():
    return mysql.connector.connect(
        host=Config.DB_HOST,
        port=Config.DB_PORT,
        database=Config.DB_NAME,
        user=Config.DB_USER,
        password=Config.DB_PASSWORD
    )


def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        token = auth_header.replace('Bearer ', '').strip()
        if not token:
            return jsonify({'error': 'Token required'}), 401
        try:
            payload = jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=['HS256'])
            request.user_id = payload['user_id']
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        return f(*args, **kwargs)
    return decorated 

def get_nutrient_priorities(age_months, nutrition_risk, 
                             weight_zscore, height_zscore):
    """
    Identify specific nutrient priorities based on age,
    nutrition risk level and growth indicators.
    Based on WHO/UNICEF nutrition guidelines.
    
    Returns list of priority nutrients with guidance.
    """
    
    priorities = []
    guidance = []
    
    # ── Iron ──────────────────────────────────────────────
    # High risk for all ages, especially 6-24 months
    if nutrition_risk in ['high', 'moderate']:
        if age_months >= 6:
            priorities.append({
                'nutrient'   : 'Iron',
                'priority'   : 'high' if nutrition_risk == 'high' 
                               else 'moderate',
                'reason'     : 'Essential for brain development '
                               'and preventing anaemia',
                'food_sources': 'Dhal, green leaves, egg yolk, '
                                'fish, mukunuwenna'
            })
    
    # ── Calcium ───────────────────────────────────────────
    # Critical for bone development in all ages
    if height_zscore < -1 or nutrition_risk == 'high':
        priorities.append({
            'nutrient'    : 'Calcium',
            'priority'    : 'high' if height_zscore < -2 
                            else 'moderate',
            'reason'      : 'Critical for bone growth and '
                            'height development',
            'food_sources': 'Milk, curd, ragi porridge, '
                            'dried fish, gotukola'
        })
    
    # ── Protein ───────────────────────────────────────────
    # Critical when weight zscore is low
    if weight_zscore < -1 or nutrition_risk == 'high':
        priorities.append({
            'nutrient'    : 'Protein',
            'priority'    : 'high' if weight_zscore < -2 
                            else 'moderate',
            'reason'      : 'Essential for weight gain '
                            'and muscle development',
            'food_sources': 'Eggs, fish, chicken, dhal, '
                            'mung beans, curd'
        })
    
    # ── Vitamin A ─────────────────────────────────────────
    # Important for infants and young children
    if age_months < 24 and nutrition_risk in ['high', 'moderate']:
        priorities.append({
            'nutrient'    : 'Vitamin A',
            'priority'    : 'high' if age_months < 12 
                            else 'moderate',
            'reason'      : 'Critical for immune system '
                            'and eye development',
            'food_sources': 'Pumpkin, carrot, papaya, '
                            'sweet potato, mango'
        })
    
    # ── Vitamin D ─────────────────────────────────────────
    # Needed for calcium absorption
    if height_zscore < -1:
        priorities.append({
            'nutrient'    : 'Vitamin D',
            'priority'    : 'moderate',
            'reason'      : 'Needed for calcium absorption '
                            'and bone strength',
            'food_sources': 'Sunlight exposure, egg yolk, '
                            'fish, fortified milk'
        })
    
    # ── Zinc ──────────────────────────────────────────────
    # Important for stunted children
    if height_zscore < -2:
        priorities.append({
            'nutrient'    : 'Zinc',
            'priority'    : 'high',
            'reason'      : 'Supports linear growth '
                            'and immune function',
            'food_sources': 'Meat, fish, mung beans, '
                            'chickpeas, ragi'
        })
    
    # ── Generate monthly guidance text ────────────────────
    if nutrition_risk == 'high':
        guidance.append(
            'Your child needs urgent nutritional attention. '
            'Please consult your clinic at the next visit.')
    elif nutrition_risk == 'moderate':
        guidance.append(
            'Your child shows some nutritional risk. '
            'Focus on the highlighted nutrients this month.')
    else:
        guidance.append(
            'Your child has good nutritional status. '
            'Continue the current balanced diet.')
    
    # Age specific guidance
    if age_months < 6:
        guidance.append(
            'Exclusive breastfeeding is recommended '
            'for children under 6 months.')
    elif age_months < 12:
        guidance.append(
            'Continue breastfeeding alongside '
            'introducing soft complementary foods.')
    elif age_months < 24:
        guidance.append(
            'Offer a variety of foods including '
            'soft rice, vegetables, and protein sources.')
    else:
        guidance.append(
            'Encourage family foods with a focus '
            'on iron-rich and calcium-rich Sri Lankan meals.')
    
    return {
        'priority_nutrients': priorities,
        'monthly_guidance'  : guidance,
        'nutrient_count'    : len(priorities)
    }
