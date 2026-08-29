from datetime import date, datetime
from dateutil.relativedelta import relativedelta
from flask import Blueprint, request, jsonify
from utils import get_db, require_auth
from models.model_loader import models

vaccine_bp = Blueprint('vaccines', __name__)


def build_schedule(date_of_birth_str, completed_vaccine_ids):
    dob = datetime.strptime(date_of_birth_str, '%Y-%m-%d').date()
    today = date.today()
    age_months = (today.year - dob.year) * 12 + (today.month - dob.month)

    epi_schedule = models['m4_epi_schedule']
    dt_model = models['m4_decision_tree']
    urgency_enc = models['m4_urgency_enc']

    schedule = []
    reminders = []

    for vaccine in epi_schedule:
        due_date = dob + relativedelta(months=int(vaccine['due_months']))
        is_completed = vaccine['vaccine_id'] in completed_vaccine_ids
        days_until = (due_date - today).days

        if is_completed:
            status = 'completed'
        elif days_until < 0:
            status = 'overdue'
        elif days_until <= 14:
            status = 'due_soon'
        else:
            status = 'upcoming'

        is_critical = 1 if vaccine.get('is_critical', True) else 0
        urgency_encoded = dt_model.predict([[days_until, age_months, is_critical]])[0]
        urgency = urgency_enc.inverse_transform([urgency_encoded])[0]

        schedule.append({
            'vaccine_id':   vaccine['vaccine_id'],
            'vaccine_name': vaccine['vaccine_name'],
            'due_label':    vaccine['due_label'],
            'due_date':     due_date.strftime('%Y-%m-%d'),
            'status':       status,
            'days_until':   days_until,
            'urgency':      urgency,
            'description':  vaccine['description'],
            'is_critical':  vaccine['is_critical']
        })

        if status == 'due_soon':
            reminders.append({
                'type':         'reminder',
                'vaccine_name': vaccine['vaccine_name'],
                'due_date':     due_date.strftime('%Y-%m-%d'),
                'days_until':   days_until,
                'message':      f"{vaccine['vaccine_name']} is due in {days_until} days ({due_date.strftime('%d %b %Y')})"
            })
        elif status == 'overdue':
            reminders.append({
                'type':         'urgent',
                'vaccine_name': vaccine['vaccine_name'],
                'due_date':     due_date.strftime('%Y-%m-%d'),
                'days_until':   days_until,
                'message':      f"{vaccine['vaccine_name']} is OVERDUE by {abs(days_until)} days. Please visit your clinic."
            })

    return schedule, reminders, age_months


@vaccine_bp.route('/<int:child_id>', methods=['GET'])
@require_auth
def get_vaccination_schedule(child_id):
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            "SELECT date_of_birth FROM children WHERE child_id = %s AND user_id = %s",
            (child_id, request.user_id)
        )
        child = cursor.fetchone()
        if not child:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Child not found'}), 404

        cursor.execute(
            "SELECT vaccine_id FROM vaccination_records WHERE child_id = %s AND status = 'completed'",
            (child_id,)
        )
        completed_ids = [row['vaccine_id'] for row in cursor.fetchall()]
        cursor.close()
        conn.close()

        dob_str = str(child['date_of_birth'])
        schedule, reminders, age_months = build_schedule(dob_str, completed_ids)

        return jsonify({
            'child_id':        child_id,
            'age_months':      age_months,
            'schedule':        schedule,
            'reminders':       reminders,
            'total_completed': len(completed_ids),
            'total_vaccines':  len(schedule)
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@vaccine_bp.route('/complete', methods=['PUT'])
@require_auth
def mark_vaccine_complete():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body required'}), 400

    child_id = data.get('child_id')
    vaccine_id = data.get('vaccine_id')
    completed_date = data.get('completed_date', date.today().isoformat())

    if not all([child_id, vaccine_id]):
        return jsonify({'error': 'child_id and vaccine_id are required'}), 400

    epi_schedule = models['m4_epi_schedule']
    vaccine = next((v for v in epi_schedule if v['vaccine_id'] == vaccine_id), None)
    if not vaccine:
        return jsonify({'error': f'Vaccine ID {vaccine_id} not found in EPI schedule'}), 404

    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            "SELECT child_id FROM children WHERE child_id = %s AND user_id = %s",
            (child_id, request.user_id)
        )
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'error': 'Child not found'}), 404

        # Calculate due_date from child DOB + vaccine due_months
        cursor.execute("SELECT date_of_birth FROM children WHERE child_id = %s", (child_id,))
        child_row = cursor.fetchone()
        dob = datetime.strptime(str(child_row['date_of_birth']), '%Y-%m-%d').date()
        due_date = dob + relativedelta(months=int(vaccine['due_months']))

        # Check if record already exists
        cursor.execute(
            "SELECT vaccination_id FROM vaccination_records WHERE child_id = %s AND vaccine_id = %s",
            (child_id, vaccine_id)
        )
        existing = cursor.fetchone()

        if existing:
            cursor.execute(
                "UPDATE vaccination_records SET completed_date = %s, status = 'completed' WHERE vaccination_id = %s",
                (completed_date, existing['vaccination_id'])
            )
        else:
            cursor.execute(
                """INSERT INTO vaccination_records
                   (child_id, vaccine_id, vaccine_name, due_date, completed_date, status)
                   VALUES (%s, %s, %s, %s, %s, 'completed')""",
                (child_id, vaccine_id, vaccine['vaccine_name'], due_date.isoformat(), completed_date)
            )

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({
            'message':        f"{vaccine['vaccine_name']} marked as completed",
            'child_id':       child_id,
            'vaccine_id':     vaccine_id,
            'completed_date': completed_date
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
