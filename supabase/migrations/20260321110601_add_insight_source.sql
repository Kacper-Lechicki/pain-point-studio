-- Add insight source enum
CREATE TYPE insight_source AS ENUM (
  'survey',
  'user_interview',
  'competitor_analysis',
  'market_research',
  'own_observation'
);

-- Add source column with default (auto-backfills existing rows)
ALTER TABLE project_insights
  ADD COLUMN source insight_source NOT NULL DEFAULT 'own_observation';
