from flask import Blueprint, request, jsonify
from utils import get_db, require_auth

child_bp = Blueprint('children', __name__)


@child_bp.route('', methods=['POST'])
@require_auth
def add_child():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body required'}), 400

    full_name = data.get('full_name', '').strip()
    date_of_birth = data.get('date_of_birth', '').strip()
    gender = data.get('gender', '').strip().lower()
    birth_weight = data.get('birth_weight')
    birth_height = data.get('birth_height')
    dietary_preference = data.get('dietary_preference', 'none')

    if not all([full_name, date_of_birth, gender]):
        return jsonify({'error': 'full_name, date_of_birth and gender are required'}), 400

    if gender not in ['male', 'female']:
        return jsonify({'error': 'gender must be male or female'}), 400

    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            """INSERT INTO children (user_id, full_name, date_of_birth, gender, birth_weight, birth_height, dietary_preference)
               VALUES (%s, %s, %s, %s, %s, %s, %s)""",
            (request.user_id, full_name, date_of_birth, gender, birth_weight, birth_height, dietary_preference)
        )
        conn.commit()
        child_id = cursor.lastrowid
        cursor.close()
        conn.close()
        return jsonify({'message': 'Child added successfully', 'child_id': child_id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@child_bp.route('', methods=['GET'])
@require_auth
def get_children():
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT * FROM children WHERE user_id = %s ORDER BY full_name",
            (request.user_id,)
        )
        children = cursor.fetchall()
        cursor.close()
        conn.close()

        for child in children:
            if child.get('date_of_birth'):
                child['date_of_birth'] = str(child['date_of_birth'])

        return jsonify({'children': children}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
