import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import roc_auc_score, accuracy_score
import joblib

print("Loading dataset and training litigation risk prediction model...")

df = pd.read_csv('dataset.csv')

feature_cols = [
    'multi_crop_irrigated_flag',
    'consent_percentage_collected',
    'valuation_gap_pct',
    'is_landbank_parcel',
    'sla_overrun_flag'
]

X = df[feature_cols]
y = df['litigation_delay_target']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = GradientBoostingClassifier(
    n_estimators=100,
    learning_rate=0.08,
    max_depth=4,
    random_state=42
)

model.fit(X_train, y_train)

y_pred_proba = model.predict_proba(X_test)[:, 1]
auc = roc_auc_score(y_test, y_pred_proba)
acc = accuracy_score(y_test, (y_pred_proba > 0.5).astype(int))

print(f"✅ Model Training Complete. AUC Score: {auc:.4f}, Accuracy: {acc*100:.2f}%.")

importances = model.feature_importances_
for col, imp in zip(feature_cols, importances):
    print(f"   - Feature '{col}': {imp*100:.2f}% importance")

joblib.dump(model, 'risk_model.joblib')
print("✅ Saved trained model to risk_model.joblib.")
