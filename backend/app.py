from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from models.model_loader import load_models
from routes.auth_routes import auth_bp
from routes.child_routes import child_bp
from routes.growth_routes import growth_bp
from routes.meal_routes import meal_bp
from routes.vaccine_routes import vaccine_bp

app = Flask(__name__)
app.config.from_object(Config)
CORS(app)

load_models()

app.register_blueprint(auth_bp,    url_prefix='/api/auth')
app.register_blueprint(child_bp,   url_prefix='/api/children')
app.register_blueprint(growth_bp,  url_prefix='/api/growth')
app.register_blueprint(meal_bp,    url_prefix='/api/meals')
app.register_blueprint(vaccine_bp, url_prefix='/api/vaccines')


@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'running', 'message': 'SmartCHDR API is running'}), 200


if __name__ == '__main__':
    app.run(debug=Config.FLASK_DEBUG, host='0.0.0.0', port=5000)
