import pandas as pd
import numpy as np

# Set random seed for reproducible synthetic dataset generation
np.random.seed(42)

NUM_SAMPLES = 2500

print("Generating synthetic RFCTLARR land acquisition dataset...")

# Features anchored to empirical land litigation statistics in India (CAG & Supreme Court reports)
# Multi-crop irrigated land faces high legal restrictions under Sec 10 of RFCTLARR Act 2013
multi_crop_irrigated_flag = np.random.choice([0, 1], size=NUM_SAMPLES, p=[0.65, 0.35])

# SIA consent % collected (under Sec 2(2), 70% consent required for PPP, 80% for private projects)
consent_percentage_collected = np.random.normal(loc=72.0, scale=18.0, size=NUM_SAMPLES)
consent_percentage_collected = np.clip(consent_percentage_collected, 20.0, 99.0)

# Valuation Gap % between market market_value and circle rate / demand
valuation_gap_pct = np.random.uniform(5.0, 50.0, size=NUM_SAMPLES)

# Government land bank flag (clear title reduces dispute risk)
is_landbank_parcel = np.random.choice([0, 1], size=NUM_SAMPLES, p=[0.75, 0.25])

# SLA overrun flag during SIA / Section 19 notification
sla_overrun_flag = np.random.choice([0, 1], size=NUM_SAMPLES, p=[0.60, 0.40])

# District Code categorical distribution
district_codes = np.random.choice(
    ['WB-HGH', 'WB-PBD', 'WB-N24', 'WB-S24', 'WB-HWR', 'WB-PMD', 'WB-MSD'],
    size=NUM_SAMPLES
)

# Target computation (Ground truth delay/litigation outcome probability)
# Probability of court stay order / delay > 3 years
logit = (
    -2.0
    + 1.8 * multi_crop_irrigated_flag
    - 0.04 * (consent_percentage_collected - 70.0)
    + 0.05 * valuation_gap_pct
    - 1.2 * is_landbank_parcel
    + 1.5 * sla_overrun_flag
    + np.random.normal(0, 0.5, size=NUM_SAMPLES)
)

prob_litigation = 1 / (1 + np.exp(-logit))
litigation_delay_target = (prob_litigation > 0.45).astype(int)

df = pd.DataFrame({
    'multi_crop_irrigated_flag': multi_crop_irrigated_flag,
    'consent_percentage_collected': consent_percentage_collected,
    'valuation_gap_pct': valuation_gap_pct,
    'is_landbank_parcel': is_landbank_parcel,
    'sla_overrun_flag': sla_overrun_flag,
    'district_code': district_codes,
    'litigation_delay_target': litigation_delay_target
})

df.to_csv('dataset.csv', index=False)
print(f"✅ Generated dataset.csv with {NUM_SAMPLES} records. Litigation rate: {df['litigation_delay_target'].mean()*100:.1f}%.")
