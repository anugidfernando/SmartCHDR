import datetime
import jwt
import mysql.connector
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from config import Config
from utils import get_db

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body required'}), 400

    full_name = data.get('full_name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    phone_number = data.get('phone_number', '').strip()

    if not all([full_name, email, password]):
        return jsonify({'error': 'full_name, email and password are required'}), 400

    password_hash = generate_password_hash(password)

    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO users (full_name, email, password_hash, phone_number) VALUES (%s, %s, %s, %s)",
            (full_name, email, password_hash, phone_number or None)
        )
        conn.commit()
        user_id = cursor.lastrowid
        cursor.close()
        conn.close()
        return jsonify({'message': 'Registration successful', 'user_id': user_id}), 201
    except mysql.connector.IntegrityError:
        return jsonify({'error': 'Email already registered'}), 409
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body required'}), 400

    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not all([email, password]):
        return jsonify({'error': 'email and password are required'}), 400

    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()
        cursor.close()
        conn.close()

        if not user or not check_password_hash(user['password_hash'], password):
            return jsonify({'error': 'Invalid email or password'}), 401

        payload = {
            'user_id': user['user_id'],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=Config.JWT_EXPIRY_DAYS)
        }
        token = jwt.encode(payload, Config.JWT_SECRET_KEY, algorithm='HS256')

        return jsonify({
            'token': token,
            'user_id': user['user_id'],
            'full_name': user['full_name']
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
