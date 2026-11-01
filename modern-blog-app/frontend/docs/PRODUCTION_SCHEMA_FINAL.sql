-- ============================================================================
-- COMPLETE AI BLOGGING PLATFORM - PRODUCTION DATABASE SCHEMA
-- ============================================================================
-- File: PRODUCTION_SCHEMA_FINAL.sql
-- Purpose: Complete Supabase database schema for automated AI blog generation
-- Date: June 12, 2026
-- 
-- This schema includes:
-- 1. AI Generated Posts Table
-- 2. Tools Coverage Metadata (50+ DevOps/Cloud/Security/AI tools)
-- 3. Excluded Topics (Anti-Duplication List)
-- 4. Generation Logs (Tracking)
-- 5. Website Stats (Analytics)
-- 6. Sample Tools Data
-- ============================================================================

-- ============================================================================
-- 1. AI GENERATED POSTS TABLE
-- ============================================================================
-- Stores all AI-generated blog posts with metadata for weekly automation

CREATE TABLE IF NOT EXISTS ai_generated_posts (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(300) NOT NULL UNIQUE,
  slug VARCHAR(300) NOT NULL UNIQUE,
  content TEXT NOT NULL, -- Markdown content (15-20 KB typical)
  excerpt VARCHAR(500),
  category VARCHAR(100) DEFAULT 'DevOps',
  tags TEXT[], -- Array of tool names covered
  tools_covered TEXT[], -- Specific tools in this post
  cves_mentioned INTEGER DEFAULT 0, -- Number of CVEs referenced
  ai_model VARCHAR(100) DEFAULT 'groq-mixtral-8x7b',
  status VARCHAR(50) DEFAULT 'published', -- published, draft, archived
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  view_count INTEGER DEFAULT 0,
  
  -- Metadata for tracking and filtering
  week_of_year INTEGER,
  year INTEGER,
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('published', 'draft', 'archived'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_posts_status ON ai_generated_posts(status);
CREATE INDEX IF NOT EXISTS idx_ai_posts_published_at ON ai_generated_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_posts_slug ON ai_generated_posts(slug);
CREATE INDEX IF NOT EXISTS idx_ai_posts_tools ON ai_generated_posts USING GIN(tools_covered);

-- ============================================================================
-- 2. TOOLS COVERAGE METADATA
-- ============================================================================
-- Comprehensive list of 50+ enterprise DevOps, Cloud, Security, and AI tools
-- Used for round-robin coverage and research prioritization

CREATE TABLE IF NOT EXISTS tools_coverage_metadata (
  id BIGSERIAL PRIMARY KEY,
  tool_name VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(50) NOT NULL,
  description TEXT,
  official_url VARCHAR(500),
  documentation_url VARCHAR(500),
  github_url VARCHAR(500),
  priority INTEGER DEFAULT 5, -- 1-10, higher = more frequent coverage
  is_active BOOLEAN DEFAULT TRUE,
  last_covered_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Architecture Metadata (Product-specific architecture from registry)
  architecture_family VARCHAR(100), -- e.g., "AI/LLM", "Kubernetes", "Cloud-Platform"
  architecture_metadata JSONB DEFAULT '{}'::jsonb, -- Stores: {family, productSet[], diagramBlueprint, officialDocs}
  diagram_image_path VARCHAR(500), -- Path to stored diagram PNG in Supabase Storage
  diagram_updated_at TIMESTAMP WITH TIME ZONE, -- When diagram was last generated
  
  -- Constraints
  CONSTRAINT valid_category CHECK (category IN (
    'Container/Orchestration',
    'Cloud Platform',
    'Infrastructure as Code',
    'CI/CD Pipeline',
    'Monitoring/Observability',
    'Security/Zero-Trust',
    'Configuration Management',
    'Service Mesh',
    'Networking',
    'AI/ML',
    'Database',
    'Data Streaming',
    'Data Engineering',
    'API Gateway',
    'Identity & Access',
    'DevSecOps',
    'Automation',
    'Developer Tools'
  ))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tools_category ON tools_coverage_metadata(category);
CREATE INDEX IF NOT EXISTS idx_tools_active ON tools_coverage_metadata(is_active);
CREATE INDEX IF NOT EXISTS idx_tools_priority ON tools_coverage_metadata(priority DESC);
CREATE INDEX IF NOT EXISTS idx_tools_architecture_family ON tools_coverage_metadata(architecture_family);
CREATE INDEX IF NOT EXISTS idx_tools_diagram_updated ON tools_coverage_metadata(diagram_updated_at DESC);

-- ============================================================================
-- 3. EXCLUDED TOPICS (Anti-Duplication List)
-- ============================================================================
-- Tracks topics covered in the last 14 days to prevent duplicate posts

CREATE TABLE IF NOT EXISTS ai_excluded_topics (
  id BIGSERIAL PRIMARY KEY,
  tool_name VARCHAR(100) NOT NULL,
  feature_or_fix VARCHAR(500) NOT NULL,
  cve_id VARCHAR(50),
  post_id BIGINT REFERENCES ai_generated_posts(id) ON DELETE CASCADE,
  excluded_until TIMESTAMP WITH TIME ZONE, -- Topics excluded until this date
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint: Auto-expire after 14 days
  CONSTRAINT valid_expiry CHECK (excluded_until > NOW())
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_excluded_topics_until ON ai_excluded_topics(excluded_until);
CREATE INDEX IF NOT EXISTS idx_excluded_topics_tool ON ai_excluded_topics(tool_name);

-- ============================================================================
-- 4. GENERATION LOGS (Tracking & Debugging)
-- ============================================================================
-- Tracks every AI generation run for monitoring and debugging

CREATE TABLE IF NOT EXISTS ai_generation_logs (
  id BIGSERIAL PRIMARY KEY,
  run_id VARCHAR(100) UNIQUE NOT NULL,
  scheduled_time TIMESTAMP WITH TIME ZONE,
  execution_start TIMESTAMP WITH TIME ZONE NOT NULL,
  execution_end TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  status VARCHAR(50) DEFAULT 'running', -- running, success, partial, failed
  posts_generated INTEGER DEFAULT 0,
  posts_published INTEGER DEFAULT 0,
  tools_researched TEXT[],
  error_message TEXT,
  groq_tokens_used INTEGER,
  tavily_searches INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_log_status CHECK (status IN ('running', 'success', 'partial', 'failed'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gen_logs_status ON ai_generation_logs(status);
CREATE INDEX IF NOT EXISTS idx_gen_logs_created ON ai_generation_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gen_logs_run_id ON ai_generation_logs(run_id);

-- ============================================================================
-- 5. WEBSITE STATS (Analytics & Dashboard)
-- ============================================================================
-- Global website statistics for dashboard display

CREATE TABLE IF NOT EXISTS website_stats (
  id INTEGER PRIMARY KEY DEFAULT 1,
  articles INTEGER DEFAULT 0,
  monthly_views INTEGER DEFAULT 0,
  topics INTEGER DEFAULT 0,
  projects INTEGER DEFAULT 3,
  total_visits INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint: Only one row allowed
  CONSTRAINT only_one_row CHECK (id = 1)
);

-- Insert default stats
INSERT INTO website_stats (id, articles, monthly_views, topics, projects, total_visits)
VALUES (1, 0, 0, 0, 3, 0)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 6. PAGE ANALYTICS (Real-time Tracking)
-- ============================================================================
-- Track page views and visitor analytics

CREATE TABLE IF NOT EXISTS page_analytics (
  id BIGSERIAL PRIMARY KEY,
  page_path VARCHAR(500) NOT NULL,
  view_count INTEGER DEFAULT 1,
  unique_visitors INTEGER DEFAULT 0,
  last_visited TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_analytics_path ON page_analytics(page_path);
CREATE INDEX IF NOT EXISTS idx_page_analytics_updated ON page_analytics(updated_at DESC);

-- ============================================================================
-- 7. CONTACT MESSAGES
-- ============================================================================
-- Contact details are inserted by the server with the service-role key.
-- RLS is enabled and no anon/authenticated policies are created.

CREATE TABLE IF NOT EXISTS contact_messages (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(254) NOT NULL,
  subject VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Ensure the app roles can read/write the public schema tables used by the app
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated, service_role;

-- ============================================================================
-- 8. INSERT A BROAD ENTERPRISE TOOLS METADATA CATALOG
-- NOTE: For the AI blog generator, the main setup entry point is the root file
-- [SUPABASE_SETUP.sql] in the repository root. Run that file in Supabase SQL Editor.
-- ============================================================================
-- Comprehensive tools list covering major DevOps, Cloud, Security, AI, Data, and Developer platforms

INSERT INTO tools_coverage_metadata (tool_name, category, description, official_url, priority, is_active) VALUES
('OpenAI', 'AI/ML', 'Leading foundation model provider', 'https://openai.com', 10, TRUE),
('Anthropic', 'AI/ML', 'Claude and responsible AI platform', 'https://anthropic.com', 10, TRUE),
('Google Gemini', 'AI/ML', 'Google multimodal AI models', 'https://deepmind.google/technologies/gemini', 10, TRUE),
('GitHub Copilot', 'AI/ML', 'Developer co-pilot and coding assistant', 'https://github.com/features/copilot', 10, TRUE),
('Amazon Bedrock', 'AI/ML', 'Managed foundation model service', 'https://aws.amazon.com/bedrock', 9, TRUE),
('Azure OpenAI', 'AI/ML', 'Enterprise OpenAI service on Azure', 'https://azure.microsoft.com/products/ai-services/openai-service', 9, TRUE),
('Hugging Face', 'AI/ML', 'Model hub and open-source AI platform', 'https://huggingface.co', 9, TRUE),
('LangChain', 'AI/ML', 'Framework for LLM workflows', 'https://www.langchain.com', 8, TRUE),
('LlamaIndex', 'AI/ML', 'Data framework for LLM applications', 'https://www.llamaindex.ai', 8, TRUE),
('Tavily', 'AI/ML', 'AI-powered research and search', 'https://tavily.com', 8, TRUE),
('LangGraph', 'AI/ML', 'Graph-based orchestration for LLM agents', 'https://langchain-ai.github.io/langgraph', 7, TRUE),
('Weaviate', 'AI/ML', 'Vector database for AI apps', 'https://weaviate.io', 7, TRUE),
('Pinecone', 'AI/ML', 'Managed vector database', 'https://www.pinecone.io', 7, TRUE),
('PyTorch', 'AI/ML', 'Deep learning framework', 'https://pytorch.org', 8, TRUE),
('TensorFlow', 'AI/ML', 'Machine learning framework', 'https://www.tensorflow.org', 8, TRUE),
('Scikit-learn', 'AI/ML', 'Machine learning library', 'https://scikit-learn.org', 7, TRUE),
('Jupyter', 'AI/ML', 'Interactive notebooks', 'https://jupyter.org', 7, TRUE),
('AWS', 'Cloud Platform', 'Amazon Web Services - Leading cloud provider', 'https://aws.amazon.com', 10, TRUE),
('Azure', 'Cloud Platform', 'Microsoft Azure cloud platform', 'https://azure.microsoft.com', 10, TRUE),
('Google Cloud Platform', 'Cloud Platform', 'Google Cloud services and infrastructure', 'https://cloud.google.com', 9, TRUE),
('DigitalOcean', 'Cloud Platform', 'Cloud infrastructure for developers', 'https://digitalocean.com', 7, TRUE),
('Linode', 'Cloud Platform', 'Akamai cloud computing platform', 'https://linode.com', 6, TRUE),
('Vercel', 'Cloud Platform', 'Frontend deployment and edge platform', 'https://vercel.com', 10, TRUE),
('Terraform', 'Infrastructure as Code', 'Infrastructure as Code tool by HashiCorp', 'https://terraform.io', 10, TRUE),
('Ansible', 'Infrastructure as Code', 'Configuration management and automation', 'https://ansible.com', 9, TRUE),
('CloudFormation', 'Infrastructure as Code', 'AWS infrastructure as code service', 'https://aws.amazon.com/cloudformation/', 8, TRUE),
('Pulumi', 'Infrastructure as Code', 'Infrastructure as code using programming languages', 'https://pulumi.com', 7, TRUE),
('Chef', 'Infrastructure as Code', 'Infrastructure automation platform', 'https://chef.io', 6, TRUE),
('SaltStack', 'Infrastructure as Code', 'Configuration management and remote execution', 'https://saltproject.io', 6, TRUE),
('GitHub Actions', 'CI/CD Pipeline', 'GitHub native CI/CD automation', 'https://github.com/features/actions', 10, TRUE),
('GitLab CI', 'CI/CD Pipeline', 'GitLab built-in CI/CD platform', 'https://about.gitlab.com/stages-devops/continuous-integration/', 9, TRUE),
('Jenkins', 'CI/CD Pipeline', 'Open-source automation server', 'https://jenkins.io', 9, TRUE),
('CircleCI', 'CI/CD Pipeline', 'Continuous integration platform', 'https://circleci.com', 7, TRUE),
('Azure DevOps Pipelines', 'CI/CD Pipeline', 'Microsoft CI/CD service', 'https://azure.microsoft.com/services/devops/pipelines/', 8, TRUE),
('Tekton', 'CI/CD Pipeline', 'Cloud-native CI/CD framework', 'https://tekton.dev', 7, TRUE),
('Argo CD', 'CI/CD Pipeline', 'Declarative GitOps CD tool', 'https://argo-cd.readthedocs.io', 8, TRUE),
('Prometheus', 'Monitoring/Observability', 'Open-source monitoring and alerting', 'https://prometheus.io', 10, TRUE),
('Grafana', 'Monitoring/Observability', 'Visualization and monitoring platform', 'https://grafana.com', 10, TRUE),
('ELK Stack', 'Monitoring/Observability', 'Elasticsearch, Logstash, Kibana logging', 'https://elastic.co', 9, TRUE),
('Datadog', 'Monitoring/Observability', 'SaaS monitoring and analytics platform', 'https://datadog.com', 8, TRUE),
('New Relic', 'Monitoring/Observability', 'Application performance monitoring', 'https://newrelic.com', 8, TRUE),
('Jaeger', 'Monitoring/Observability', 'Distributed tracing platform', 'https://jaegertracing.io', 7, TRUE),
('OpenTelemetry', 'Monitoring/Observability', 'Telemetry standard and tooling', 'https://opentelemetry.io', 9, TRUE),
('Loki', 'Monitoring/Observability', 'Log aggregation system', 'https://grafana.com/oss/loki', 8, TRUE),
('Cloudflare', 'Security/Zero-Trust', 'Content delivery and security platform', 'https://cloudflare.com', 9, TRUE),
('Zscaler', 'Security/Zero-Trust', 'Zero-trust network security platform', 'https://zscaler.com', 10, TRUE),
('HashiCorp Vault', 'Security/Zero-Trust', 'Secrets and encryption management', 'https://vaultproject.io', 9, TRUE),
('Falco', 'Security/Zero-Trust', 'Runtime security monitoring', 'https://falco.org', 8, TRUE),
('Palo Alto Networks', 'Security/Zero-Trust', 'Network security and firewall platform', 'https://www.paloaltonetworks.com', 9, TRUE),
('CrowdStrike', 'Security/Zero-Trust', 'Endpoint security platform', 'https://www.crowdstrike.com', 9, TRUE),
('Okta', 'Security/Zero-Trust', 'Identity and access management', 'https://www.okta.com', 9, TRUE),
('Snyk', 'DevSecOps', 'Developer-first security platform', 'https://snyk.io', 9, TRUE),
('Trivy', 'DevSecOps', 'Container and dependency vulnerability scanner', 'https://github.com/aquasecurity/trivy', 9, TRUE),
('OWASP', 'DevSecOps', 'Web application security standards', 'https://owasp.org', 7, TRUE),
('Kubernetes', 'Container/Orchestration', 'Open-source container orchestration platform', 'https://kubernetes.io', 10, TRUE),
('Docker', 'Container/Orchestration', 'Containerization platform for applications', 'https://docker.com', 10, TRUE),
('Docker Swarm', 'Container/Orchestration', 'Docker native clustering and orchestration', 'https://docs.docker.com/engine/swarm/', 7, TRUE),
('OpenShift', 'Container/Orchestration', 'Red Hat enterprise Kubernetes platform', 'https://openshift.com', 8, TRUE),
('Nomad', 'Container/Orchestration', 'HashiCorp workload orchestrator', 'https://nomadproject.io', 7, TRUE),
('Helm', 'Container/Orchestration', 'Kubernetes package manager', 'https://helm.sh', 8, TRUE),
('PostgreSQL', 'Database', 'Advanced open-source relational database', 'https://postgresql.org', 10, TRUE),
('MongoDB', 'Database', 'NoSQL document database', 'https://mongodb.com', 9, TRUE),
('Redis', 'Database', 'In-memory data store', 'https://redis.io', 9, TRUE),
('Cassandra', 'Database', 'Distributed NoSQL database', 'https://cassandra.apache.org', 8, TRUE),
('Supabase', 'Database', 'Open-source Firebase alternative - Powers this blog', 'https://supabase.com', 10, TRUE),
('ClickHouse', 'Database', 'Analytical columnar database', 'https://clickhouse.com', 8, TRUE),
('TimescaleDB', 'Database', 'Time-series database', 'https://www.timescale.com', 7, TRUE),
('Kafka', 'Data Streaming', 'Event streaming platform', 'https://kafka.apache.org', 9, TRUE),
('RabbitMQ', 'Data Streaming', 'Message broker', 'https://www.rabbitmq.com', 8, TRUE),
('NATS', 'Data Streaming', 'Lightweight messaging system', 'https://nats.io', 7, TRUE),
('Airflow', 'Data Engineering', 'Workflow orchestration', 'https://airflow.apache.org', 8, TRUE),
('dbt', 'Data Engineering', 'Data transformation tool', 'https://www.getdbt.com', 8, TRUE),
('Great Expectations', 'Data Engineering', 'Data quality testing', 'https://greatexpectations.io', 7, TRUE),
('Apache Spark', 'Data Engineering', 'Distributed data processing', 'https://spark.apache.org', 8, TRUE),
('Apache Flink', 'Data Engineering', 'Stream processing framework', 'https://flink.apache.org', 7, TRUE),
('NGINX', 'Networking', 'Web server and reverse proxy', 'https://nginx.org', 9, TRUE),
('HAProxy', 'Networking', 'High-availability load balancer', 'https://haproxy.org', 8, TRUE),
('Envoy', 'Networking', 'Service proxy and communication bus', 'https://envoyproxy.io', 8, TRUE),
('Istio', 'Networking', 'Service mesh platform for Kubernetes', 'https://istio.io', 8, TRUE),
('Linkerd', 'Networking', 'Lightweight service mesh', 'https://linkerd.io', 7, TRUE),
('Cilium', 'Networking', 'eBPF-based container networking', 'https://cilium.io', 8, TRUE),
('WireGuard', 'Networking', 'Modern VPN protocol', 'https://wireguard.com', 7, TRUE),
('Keycloak', 'Identity & Access', 'Open-source identity platform', 'https://keycloak.org', 8, TRUE),
('OAuth 2.0', 'Identity & Access', 'Industry standard authorization protocol', 'https://oauth.net', 9, TRUE),
('SAML', 'Identity & Access', 'Enterprise identity standard', 'https://oasis-open.org/standards/#samlv2.0', 8, TRUE),
('OpenID Connect', 'Identity & Access', 'Identity layer on OAuth 2.0', 'https://openid.net/connect', 7, TRUE),
('Git', 'Developer Tools', 'Version control system', 'https://git-scm.com', 10, TRUE),
('GitHub', 'Developer Tools', 'Source control and collaboration', 'https://github.com', 10, TRUE),
('GitLab', 'Developer Tools', 'DevOps platform', 'https://about.gitlab.com', 9, TRUE),
('Bitbucket', 'Developer Tools', 'Git-based collaboration', 'https://bitbucket.org', 7, TRUE),
('VS Code', 'Developer Tools', 'Editor and productivity tool', 'https://code.visualstudio.com', 8, TRUE),
('JetBrains IntelliJ', 'Developer Tools', 'IDE for Java and polyglot development', 'https://www.jetbrains.com/idea', 7, TRUE),
('Python', 'Automation', 'Primary DevOps scripting language', 'https://python.org', 10, TRUE),
('Go', 'Automation', 'Modern systems programming language', 'https://golang.org', 9, TRUE),
('Bash/Shell', 'Automation', 'Unix shell and command language', 'https://gnu.org/software/bash/', 10, TRUE)
ON CONFLICT (tool_name) DO NOTHING;

-- ============================================================================
-- 9. ENABLE ROW LEVEL SECURITY (Optional but Recommended)
-- ============================================================================
-- For public read-only access to published posts

ALTER TABLE ai_generated_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can read published posts
CREATE POLICY "public_read_published_posts" ON ai_generated_posts
  FOR SELECT
  USING (status = 'published');

-- RLS Policy: Service role can write
CREATE POLICY "service_write_posts" ON ai_generated_posts
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- 10. CREATE VIEWS FOR EASIER QUERYING
-- ============================================================================

-- View for recent published posts
CREATE OR REPLACE VIEW recent_published_posts AS
SELECT 
  id, title, slug, excerpt, category, tools_covered, 
  cves_mentioned, published_at, view_count, ai_model
FROM ai_generated_posts
WHERE status = 'published'
ORDER BY published_at DESC
LIMIT 10;

-- View for dashboard statistics
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM ai_generated_posts WHERE status = 'published') as total_posts,
  (SELECT COUNT(DISTINCT YEAR) FROM ai_generated_posts) as years_active,
  (SELECT SUM(view_count) FROM ai_generated_posts) as total_views,
  (SELECT COUNT(DISTINCT tools_covered) FROM ai_generated_posts) as unique_tools,
  (SELECT COUNT(*) FROM tools_coverage_metadata WHERE is_active = TRUE) as active_tools;

-- ============================================================================
-- 11. INITIALIZE WEBSITE STATS
-- ============================================================================
-- Update with realistic initial data

UPDATE website_stats
SET 
  articles = 0,
  monthly_views = 0,
  topics = (SELECT COUNT(*) FROM tools_coverage_metadata WHERE is_active = TRUE),
  projects = 3,
  total_visits = 0,
  last_updated = NOW()
WHERE id = 1;

-- ============================================================================
-- 12. COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE ai_generated_posts IS 'Stores AI-generated blog posts for DevOps, Cloud, and Security topics';
COMMENT ON TABLE tools_coverage_metadata IS 'Reference list of 50+ enterprise tools for coverage rotation';
COMMENT ON TABLE ai_excluded_topics IS 'Tracks covered topics in last 14 days to prevent duplication';
COMMENT ON TABLE ai_generation_logs IS 'Logs of AI generation runs for monitoring and debugging';
COMMENT ON COLUMN ai_generated_posts.tools_covered IS 'Array of tool names covered in this post';
COMMENT ON COLUMN ai_generated_posts.cves_mentioned IS 'Count of CVE references in the post';
COMMENT ON COLUMN tools_coverage_metadata.priority IS 'Priority 1-10: Higher values get covered more frequently';

-- ============================================================================
-- COMPLETE! Database schema is ready for production AI blogging
-- ============================================================================
-- Next Steps:
-- 1. Run this entire SQL script in Supabase SQL Editor
-- 2. Verify all tables created with: SELECT tablename FROM pg_tables WHERE schemaname='public';
-- 3. Set environment variables: GOOGLE_GENERATIVE_AI_API_KEY, TAVILY_API_KEY
-- 4. Deploy to Vercel
-- 5. Trigger generation manually from the admin dashboard
-- ============================================================================
