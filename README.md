# SmartCHDR

**AI-Powered Web-Based Child Nutrition, Growth Monitoring and Vaccination Tracking System for Sri Lankan Parents**

SmartCHDR is a machine learning powered web application that gives parents of children aged 0–5 in Sri Lanka a personalised, continuously available tool to monitor their child's growth, understand their nutritional needs, plan meals using local Sri Lankan foods, and track vaccinations, complementing the clinic-based Child Health and Development Record (CHDR) rather than replacing it.

> This is **not** a digitisation of the CHDR. Health workers continue to manage the physical CHDR during clinic visits — SmartCHDR gives parents their own intelligent tool to use at home, between visits.

---

## Features

| Component | Description | Technique |
|---|---|---|
| **Growth Predictor** | Classifies growth status (normal / underweight / overweight / stunted) and predicts WHO-expected weight & height | Random Forest Classifier + Regressors |
| **Nutrition Risk Classifier** | Flags nutrition risk (low / moderate / high) and priority nutrients | Random Forest Classifier + SMOTE |
| **Meal Plan Recommender** | Generates a personalised 7-day Sri Lankan meal plan | Content-Based Filtering (Cosine Similarity) |
| **Vaccination Tracker** | Tracks Sri Lanka's national EPI schedule, flags overdue/due-soon vaccines, sends reminders | Rule-Based Logic + Decision Tree |

Plus: secure JWT-based authentication, multi-child profile support, and a permanent, cumulative health record per child.

---

## Tech Stack

**Frontend:** React.js, Chart.js
**Backend:** Python 3.12, Flask, Flask-CORS, PyJWT
**Machine Learning:** scikit-learn, pandas, NumPy, imbalanced-learn
**Database:** MySQL 8.0
**Dev Tools:** VS Code, Git, Jupyter Notebook

---

## Project Structure

```
SmartCHDR/
├── backend/
│   ├── models/
│   │   └── model_loader.py       # Loads all 4 trained ML models at startup
│   ├── routes/
│   │   ├── auth_routes.py
│   │   ├── child_routes.py
│   │   ├── growth_routes.py
│   │   ├── meal_routes.py
│   │   └── vaccine_routes.py
│   ├── app.py                    # Flask entry point
│   ├── config.py
│   ├── utils.py
│   └── .env
├── ml_models/                    # Trained .pkl / .csv / .json model artefacts
├── notebooks/                    # Dataset generation & model training notebooks
├── datasets/                     # WHO / UNICEF / custom Sri Lankan meal datasets
└── frontend/                     # React application
```

---

## Model Performance

| Model | Metric | Result |
|---|---|---|
| Model 1 — Growth Predictor | Test Accuracy / CV Mean | 95.25% / 88.22% |
| Model 2 — Nutrition Risk Classifier | Test Accuracy / CV Mean | 92.21% / 94.17% |
| Model 3 — Meal Recommender | Similarity Score | 0.82 – 0.88 |
| Model 4 — Vaccination Tracker | Schedule | 11 EPI vaccines, reminders within 14 days |

---

## Getting Started

### Prerequisites
- Python 3.12+
- Node.js
- MySQL 8.0

### 1. Backend Setup

```bash
cd SmartCHDR
python -m venv venv
venv\Scripts\activate        # Windows
pip install flask flask-cors scikit-learn pandas numpy mysql-connector-python python-dotenv openpyxl imbalanced-learn PyJWT
```

Create a `.env` file inside `backend/`:

```
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=your_secret_key
JWT_SECRET_KEY=your_jwt_secret
DB_HOST=localhost
DB_PORT=3306
DB_NAME=smartchdr
DB_USER=root
DB_PASSWORD=your_db_password
```

Run the backend:

```bash
cd backend
python app.py
```

The API will be available at `http://localhost:5000`.

### 2. Database Setup

Create a MySQL database named `smartchdr` with the following tables: `users`, `children`, `growth_records`, `vaccination_records`, `meal_plans`. See `/database` (or the ER diagram in the project report) for the full schema.

### 3. Frontend Setup

```bash
cd frontend
npm install
npm start
```

The app will be available at `http://localhost:3000`.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/auth/register` | Register a new parent account |
| POST | `/api/auth/login` | Log in and receive a JWT |
| POST | `/api/children` | Add a new child profile |
| GET | `/api/children` | Get all children for the logged-in parent |
| POST | `/api/growth/predict` | Submit a measurement, get ML predictions |
| GET | `/api/growth/<child_id>` | Get growth history for a child |
| POST | `/api/meals/generate` | Generate a 7-day meal plan |
| GET | `/api/vaccines/<child_id>` | Get vaccination schedule with reminders |
| PUT | `/api/vaccines/complete` | Mark a vaccine as completed |

---

## Known Limitations

- Requirement evidence is based on a 13-response parent questionnaire; no interview was conducted.
- Growth and nutrition models are trained on WHO/UNICEF reference data rather than local clinical data.
- The custom Sri Lankan meal dataset (70 meals) limits recommendation variety over extended use.
- Nutrition guidance currently covers undernutrition patterns only; overweight classifications do not yet return tailored dietary advice.

See the final project report for the full discussion of limitations and future work.

---

## Author

**Anugi Fernando**
BSc (Hons) Software Engineering — Cardiff Metropolitan University (delivered via ICBT Campus, Colombo)
Final Year Development Project, 2026
