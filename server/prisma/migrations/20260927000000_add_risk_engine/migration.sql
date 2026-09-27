-- Records which scorer produced each litigation/delay risk row so the UI can
-- show whether the FastAPI ml_service was live or the rule-based fallback ran.
ALTER TABLE "risk_scores" ADD COLUMN "engine" TEXT NOT NULL DEFAULT 'RULE_BASED';
