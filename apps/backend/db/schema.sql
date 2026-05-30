-- Gugu Flash Backend Alpha schema draft.
-- The Alpha runtime currently persists JSON files, but these tables define the
-- first production database boundary for Postgres or SQLite migrations.

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'creator',
  status TEXT NOT NULL DEFAULT 'active',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'active',
  expires_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE ip_entries (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  governance_status TEXT NOT NULL DEFAULT 'active',
  supported_origins TEXT NOT NULL,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE personas (
  id TEXT PRIMARY KEY,
  ip_id TEXT NOT NULL REFERENCES ip_entries(id),
  name TEXT NOT NULL,
  role_type TEXT NOT NULL,
  avatar TEXT,
  tagline TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE ip_zones (
  id TEXT PRIMARY KEY,
  ip_id TEXT NOT NULL REFERENCES ip_entries(id),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  admin_user_ids_json TEXT NOT NULL DEFAULT '[]',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE zone_applications (
  id TEXT PRIMARY KEY,
  ip_id TEXT NOT NULL REFERENCES ip_entries(id),
  applicant_user_id TEXT NOT NULL REFERENCES users(id),
  invited_user_ids_json TEXT NOT NULL DEFAULT '[]',
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'submitted',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE works (
  id TEXT PRIMARY KEY,
  author_user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  status TEXT NOT NULL,
  content_origin TEXT NOT NULL,
  ip_id TEXT REFERENCES ip_entries(id),
  persona_id TEXT REFERENCES personas(id),
  current_version_id TEXT,
  metrics_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE work_versions (
  id TEXT PRIMARY KEY,
  work_id TEXT NOT NULL REFERENCES works(id),
  version INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'published',
  schema_version TEXT NOT NULL,
  pack_json TEXT NOT NULL,
  locked_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(work_id, version)
);

CREATE TABLE work_drafts (
  id TEXT PRIMARY KEY,
  author_user_id TEXT NOT NULL REFERENCES users(id),
  source_work_id TEXT REFERENCES works(id),
  status TEXT NOT NULL DEFAULT 'draft',
  draft_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE assets (
  id TEXT PRIMARY KEY,
  uploader_user_id TEXT NOT NULL REFERENCES users(id),
  story_project_id TEXT,
  story_project_version_id TEXT,
  render_job_id TEXT,
  panel_id TEXT,
  scene_id TEXT,
  character_id TEXT,
  kind TEXT NOT NULL,
  usage TEXT NOT NULL,
  filename TEXT,
  media_type TEXT,
  source_url TEXT,
  image_url TEXT,
  source_statement_json TEXT NOT NULL DEFAULT '{}',
  security_policy_version TEXT,
  security_report_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'uploaded',
  storage_key TEXT,
  checksum TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE render_jobs (
  id TEXT PRIMARY KEY,
  story_project_id TEXT,
  story_project_version_id TEXT,
  asset_id TEXT REFERENCES assets(id),
  stage TEXT NOT NULL,
  kind TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  provider TEXT,
  model TEXT,
  prompt TEXT,
  request_json TEXT NOT NULL DEFAULT '{}',
  result_json TEXT NOT NULL DEFAULT '{}',
  errors_json TEXT NOT NULL DEFAULT '[]',
  input_snapshot_id TEXT,
  output_snapshot_id TEXT,
  queued_at INTEGER,
  started_at INTEGER,
  completed_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE uploads (
  id TEXT PRIMARY KEY,
  asset_id TEXT NOT NULL REFERENCES assets(id),
  status TEXT NOT NULL DEFAULT 'requested',
  upload_url TEXT,
  storage_key TEXT,
  expires_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE comments (
  id TEXT PRIMARY KEY,
  work_id TEXT NOT NULL REFERENCES works(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'visible',
  report_count INTEGER NOT NULL DEFAULT 0,
  hidden_reason TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE interactions (
  id TEXT PRIMARY KEY,
  work_id TEXT NOT NULL REFERENCES works(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE(work_id, user_id, type)
);

CREATE TABLE block_relations (
  id TEXT PRIMARY KEY,
  blocker_user_id TEXT NOT NULL REFERENCES users(id),
  blocked_user_id TEXT NOT NULL REFERENCES users(id),
  blocked_user_name TEXT,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(blocker_user_id, blocked_user_id)
);

CREATE TABLE review_tasks (
  id TEXT PRIMARY KEY,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  review_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  risk_level TEXT NOT NULL DEFAULT 'medium',
  reason TEXT,
  evidence_json TEXT NOT NULL DEFAULT '[]',
  reviewer_user_id TEXT REFERENCES users(id),
  reviewed_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE store_listings (
  id TEXT PRIMARY KEY,
  work_id TEXT NOT NULL REFERENCES works(id),
  source_work_version_id TEXT NOT NULL REFERENCES work_versions(id),
  applicant_user_id TEXT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL,
  price_amount INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'CNY',
  rights_acknowledged_at INTEGER,
  rights_statement_json TEXT NOT NULL DEFAULT '{}',
  hardware_pack_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE compatibility_reports (
  id TEXT PRIMARY KEY,
  work_version_id TEXT NOT NULL REFERENCES work_versions(id),
  status TEXT NOT NULL,
  compatibility_level TEXT NOT NULL,
  report_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE hardware_packs (
  id TEXT PRIMARY KEY,
  store_listing_id TEXT NOT NULL REFERENCES store_listings(id),
  source_work_version_id TEXT NOT NULL REFERENCES work_versions(id),
  compatibility_report_id TEXT NOT NULL REFERENCES compatibility_reports(id),
  version TEXT NOT NULL,
  format_version TEXT NOT NULL,
  status TEXT NOT NULL,
  checksum TEXT,
  package_size_kb INTEGER,
  download_url TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE devices (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  model TEXT NOT NULL,
  status TEXT NOT NULL,
  persona_id TEXT REFERENCES personas(id),
  firmware_version TEXT,
  battery INTEGER,
  available_storage_kb INTEGER,
  current_store_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  buyer_user_id TEXT NOT NULL REFERENCES users(id),
  device_id TEXT NOT NULL REFERENCES devices(id),
  store_id TEXT NOT NULL,
  hardware_pack_id TEXT NOT NULL REFERENCES hardware_packs(id),
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CNY',
  status TEXT NOT NULL,
  payment_provider TEXT,
  paid_at INTEGER,
  refunded_at INTEGER,
  refund_reason TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE payment_callbacks (
  id TEXT PRIMARY KEY,
  provider_event_id TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL,
  provider_payment_id TEXT,
  order_id TEXT NOT NULL REFERENCES orders(id),
  result TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CNY',
  raw_payload_json TEXT NOT NULL DEFAULT '{}',
  received_at INTEGER NOT NULL,
  processed_at INTEGER
);

CREATE TABLE refund_callbacks (
  id TEXT PRIMARY KEY,
  provider_event_id TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL,
  provider_refund_id TEXT,
  order_id TEXT NOT NULL REFERENCES orders(id),
  result TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CNY',
  raw_payload_json TEXT NOT NULL DEFAULT '{}',
  received_at INTEGER NOT NULL,
  processed_at INTEGER
);

CREATE TABLE settlements (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id),
  store_listing_id TEXT NOT NULL REFERENCES store_listings(id),
  hardware_pack_id TEXT NOT NULL REFERENCES hardware_packs(id),
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CNY',
  status TEXT NOT NULL DEFAULT 'pending',
  frozen_reason TEXT,
  released_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE device_entitlements (
  id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL REFERENCES devices(id),
  hardware_pack_id TEXT NOT NULL REFERENCES hardware_packs(id),
  order_id TEXT NOT NULL REFERENCES orders(id),
  status TEXT NOT NULL,
  download_status TEXT NOT NULL DEFAULT 'not_downloaded',
  acquired_at INTEGER NOT NULL,
  revoked_at INTEGER,
  revoked_reason TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(device_id, hardware_pack_id)
);

CREATE TABLE device_installs (
  id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL REFERENCES devices(id),
  hardware_pack_id TEXT NOT NULL REFERENCES hardware_packs(id),
  store_id TEXT NOT NULL,
  status TEXT NOT NULL,
  last_sync_job_id TEXT,
  failure_reason TEXT,
  diagnostic_code TEXT,
  installed_at INTEGER,
  removed_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(device_id, hardware_pack_id)
);

CREATE TABLE device_sync_jobs (
  id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL REFERENCES devices(id),
  hardware_pack_id TEXT NOT NULL REFERENCES hardware_packs(id),
  store_id TEXT NOT NULL,
  status TEXT NOT NULL,
  failure_reason TEXT,
  diagnostic_code TEXT,
  previous_store_id TEXT,
  retry_of TEXT,
  steps_json TEXT NOT NULL DEFAULT '[]',
  device_context_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE reports (
  id TEXT PRIMARY KEY,
  reporter_user_id TEXT NOT NULL REFERENCES users(id),
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'submitted',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE rights_claims (
  id TEXT PRIMARY KEY,
  claimant_user_id TEXT NOT NULL REFERENCES users(id),
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  summary TEXT NOT NULL,
  evidence_json TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'submitted',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE appeals (
  id TEXT PRIMARY KEY,
  appellant_user_id TEXT NOT NULL REFERENCES users(id),
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE moderation_actions (
  id TEXT PRIMARY KEY,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  action TEXT NOT NULL,
  reason TEXT NOT NULL,
  operator_user_id TEXT NOT NULL REFERENCES users(id),
  source_id TEXT,
  status TEXT NOT NULL DEFAULT 'recorded',
  created_at INTEGER NOT NULL
);

CREATE TABLE operation_logs (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  detail TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_works_status_created_at ON works(status, created_at);
CREATE INDEX idx_work_versions_work_id ON work_versions(work_id);
CREATE INDEX idx_zone_applications_status ON zone_applications(status);
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_story_project_usage ON assets(story_project_id, usage, updated_at);
CREATE INDEX idx_assets_render_job_id ON assets(render_job_id);
CREATE INDEX idx_render_jobs_story_project_status ON render_jobs(story_project_id, status, updated_at);
CREATE INDEX idx_render_jobs_asset_id ON render_jobs(asset_id);
CREATE INDEX idx_uploads_status ON uploads(status);
CREATE INDEX idx_comments_work_id ON comments(work_id);
CREATE INDEX idx_block_relations_blocker_user_id ON block_relations(blocker_user_id);
CREATE INDEX idx_store_listings_status ON store_listings(status);
CREATE INDEX idx_hardware_packs_status ON hardware_packs(status);
CREATE INDEX idx_orders_buyer_user_id ON orders(buyer_user_id);
CREATE INDEX idx_payment_callbacks_provider_event_id ON payment_callbacks(provider_event_id);
CREATE INDEX idx_refund_callbacks_provider_event_id ON refund_callbacks(provider_event_id);
CREATE INDEX idx_settlements_status ON settlements(status);
CREATE INDEX idx_device_entitlements_device_id ON device_entitlements(device_id);
CREATE INDEX idx_device_installs_device_id ON device_installs(device_id);
CREATE INDEX idx_device_sync_jobs_device_id ON device_sync_jobs(device_id);
CREATE INDEX idx_review_tasks_status ON review_tasks(status);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_rights_claims_status ON rights_claims(status);
CREATE INDEX idx_appeals_status ON appeals(status);
CREATE INDEX idx_operation_logs_created_at ON operation_logs(created_at);
