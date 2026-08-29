import pickle
import json
import os
import pandas as pd
from config import Config

models = {}


def load_models():
    path = Config.MODELS_PATH
    try:
        # Model 1 — Growth Classifier + Regressors
        with open(os.path.join(path, 'model1_growth_classifier.pkl'), 'rb') as f:
            models['m1_classifier'] = pickle.load(f)
        with open(os.path.join(path, 'model1_weight_regressor.pkl'), 'rb') as f:
            models['m1_weight_reg'] = pickle.load(f)
        with open(os.path.join(path, 'model1_height_regressor.pkl'), 'rb') as f:
            models['m1_height_reg'] = pickle.load(f)
        with open(os.path.join(path, 'model1_label_encoder.pkl'), 'rb') as f:
            models['m1_label_enc'] = pickle.load(f)
        with open(os.path.join(path, 'model1_features.pkl'), 'rb') as f:
            models['m1_features'] = pickle.load(f)
        with open(os.path.join(path, 'model1_regressor_features.pkl'), 'rb') as f:
            models['m1_reg_features'] = pickle.load(f)

        # Model 2 — Nutrition Risk Classifier
        with open(os.path.join(path, 'model2_nutrition_classifier.pkl'), 'rb') as f:
            models['m2_classifier'] = pickle.load(f)
        with open(os.path.join(path, 'model2_label_encoder.pkl'), 'rb') as f:
            models['m2_label_enc'] = pickle.load(f)
        with open(os.path.join(path, 'model2_features.pkl'), 'rb') as f:
            models['m2_features'] = pickle.load(f)

        # Model 3 — Meal Recommender
        # model3_meal_dataset.pkl was saved with pandas to_csv() so read with read_csv
        models['m3_meal_dataset'] = pd.read_csv(os.path.join(path, 'model3_meal_dataset.pkl'))
        with open(os.path.join(path, 'model3_nutrition_cols.pkl'), 'rb') as f:
            models['m3_nutrition_cols'] = pickle.load(f)
        with open(os.path.join(path, 'model3_scaler.pkl'), 'rb') as f:
            models['m3_scaler'] = pickle.load(f)

        # Model 4 — Vaccination Tracker
        with open(os.path.join(path, 'model4_decision_tree.pkl'), 'rb') as f:
            models['m4_decision_tree'] = pickle.load(f)
        with open(os.path.join(path, 'model4_urgency_encoder.pkl'), 'rb') as f:
            models['m4_urgency_enc'] = pickle.load(f)
        with open(os.path.join(path, 'model4_epi_schedule.json'), 'r') as f:
            models['m4_epi_schedule'] = json.load(f)

        print("[OK] All models loaded successfully!")
        return True
    except Exception as e:
        print(f"[ERROR] Loading models failed: {e}")
        return False
