-- Create category table
CREATE TABLE IF NOT EXISTS category (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_deleted  BOOLEAN DEFAULT FALSE,
  deleted_at  TIMESTAMP
);

-- Create tools table (price removed — lives on plans now)
CREATE TABLE IF NOT EXISTS tools (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  category_id INTEGER REFERENCES category(id) ON DELETE SET NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_deleted  BOOLEAN DEFAULT FALSE,
  deleted_at  TIMESTAMP
);

-- Pricing plans for each tool
CREATE TABLE IF NOT EXISTS plans (
  id                    SERIAL PRIMARY KEY,
  tool_id               INTEGER NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  name                  VARCHAR(255) NOT NULL,
  description           TEXT,
  price                 NUMERIC(10, 2) NOT NULL DEFAULT 0,  -- flat monthly price (0 for token-based)
  billing_cycle         VARCHAR(20) NOT NULL DEFAULT 'monthly',
  features              TEXT[],
  is_popular            BOOLEAN DEFAULT FALSE,
  -- Token-based pricing (for Foundation Models / Embedding Models)
  is_token_based        BOOLEAN DEFAULT FALSE,
  price_input_per_1m    NUMERIC(12, 6),   -- USD per 1M input tokens
  price_output_per_1m   NUMERIC(12, 6),   -- USD per 1M output tokens
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_deleted            BOOLEAN DEFAULT FALSE,
  deleted_at            TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tools_category_id  ON tools(category_id);
CREATE INDEX IF NOT EXISTS idx_tools_is_deleted   ON tools(is_deleted);
CREATE INDEX IF NOT EXISTS idx_category_is_deleted ON category(is_deleted);
CREATE INDEX IF NOT EXISTS idx_plans_tool_id      ON plans(tool_id);
CREATE INDEX IF NOT EXISTS idx_plans_is_deleted   ON plans(is_deleted);

-- Cloud providers reference
CREATE TABLE IF NOT EXISTS cloud_providers (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(50) NOT NULL UNIQUE,  -- aws | azure | gcp
  label      VARCHAR(100) NOT NULL,
  logo_key   VARCHAR(50)                   -- for UI icon mapping
);

-- Cloud instance types (compute options per provider)
CREATE TABLE IF NOT EXISTS cloud_instances (
  id            SERIAL PRIMARY KEY,
  provider_id   INTEGER NOT NULL REFERENCES cloud_providers(id) ON DELETE CASCADE,
  instance_type VARCHAR(100) NOT NULL,   -- e.g. t3.medium, Standard_B2s, n1-standard-2
  vcpu          NUMERIC(4,1) NOT NULL,
  memory_gb     NUMERIC(6,2) NOT NULL,
  price_hourly  NUMERIC(10, 6) NOT NULL, -- USD/hour on-demand
  price_monthly NUMERIC(10, 2) GENERATED ALWAYS AS (ROUND(price_hourly * 730, 2)) STORED,
  region        VARCHAR(100) DEFAULT 'us-east-1',
  is_deleted    BOOLEAN DEFAULT FALSE
);

-- Which tools support self-hosting and on which instances
CREATE TABLE IF NOT EXISTS tool_self_hosting (
  id           SERIAL PRIMARY KEY,
  tool_id      INTEGER NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  instance_id  INTEGER NOT NULL REFERENCES cloud_instances(id) ON DELETE CASCADE,
  notes        TEXT,    -- e.g. "Minimum recommended for production"
  is_recommended BOOLEAN DEFAULT FALSE,
  UNIQUE (tool_id, instance_id)
);

CREATE INDEX IF NOT EXISTS idx_cloud_instances_provider ON cloud_instances(provider_id);
CREATE INDEX IF NOT EXISTS idx_tool_self_hosting_tool   ON tool_self_hosting(tool_id);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  diagram     JSONB,        -- stores ReactFlow nodes + edges
  selections  JSONB,        -- stores selected tools/plans snapshot
  total_monthly NUMERIC(10,2) DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_deleted  BOOLEAN DEFAULT FALSE,
  deleted_at  TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_projects_is_deleted ON projects(is_deleted);
