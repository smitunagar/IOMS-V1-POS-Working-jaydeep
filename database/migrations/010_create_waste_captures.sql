CREATE TABLE IF NOT EXISTS waste_captures (
  id BIGSERIAL PRIMARY KEY,
  source TEXT,
  station TEXT,
  image_url TEXT,
  image_key TEXT,
  image_bucket TEXT,
  image_mime_type TEXT,
  image_size_bytes BIGINT,
  analysis JSONB,
  fallback BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS waste_captures_created_at_idx ON waste_captures (created_at DESC);
CREATE INDEX IF NOT EXISTS waste_captures_station_idx ON waste_captures (station);
