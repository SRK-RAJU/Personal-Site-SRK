#!/usr/bin/env node
/**
 * Build complete tool-architecture-registry.json for all 170+ tools
 * Extracts from PRODUCTION_SCHEMA_FINAL.sql and creates product-specific architectures
 */

import fs from 'fs';
import path from 'path';

// Family-specific module blueprints
const FAMILY_BLUEPRINTS = {
  'ai-ml': {
    title: 'AI / ML architecture',
    entry: ['Developers', 'Apps', 'Agents'],
    core: ['Prompt Layer', 'Model Gateway', 'Inference Runtime', 'Context Retrieval', 'Safety Filters', 'Evaluation Loop'],
    data: ['Vector Store', 'Knowledge Base', 'Feature Store', 'Model Registry', 'Embedding Cache', 'Conversation State'],
    ops: ['Monitoring', 'Governance', 'Feedback Loop', 'Model Versioning', 'Prompt Management', 'Usage Controls'],
  },
  'cloud-platform': {
    title: 'Cloud platform architecture',
    entry: ['Users', 'API Requests', 'Deployment Events', 'Control Plane Requests'],
    core: ['Identity & Access', 'Compute Layer', 'Networking', 'Runtime Services', 'Regions', 'Autoscaling'],
    data: ['Storage', 'Databases', 'Caching', 'Queues', 'Object Buckets', 'Secrets'],
    ops: ['Monitoring', 'Security Policies', 'Scaling', 'Cost Controls', 'Resilience', 'Governance'],
  },
  'infrastructure-as-code': {
    title: 'Infrastructure as code architecture',
    entry: ['Developers', 'Git Repo', 'Config Inputs', 'Environment Specs'],
    core: ['IaC Templates', 'State Layer', 'Provisioning Engine', 'Resource Graph', 'Policy Engine', 'Change Planner'],
    data: ['Secrets Store', 'Environment Config', 'Policy Rules', 'Change History', 'Drift Snapshot', 'Approval Logs'],
    ops: ['Validation', 'Drift Detection', 'Rollback', 'Compliance Checks', 'Audits', 'Automation'],
  },
  'ci-cd-pipeline': {
    title: 'CI/CD architecture',
    entry: ['Developers', 'Git Events', 'Change Requests', 'Merge Triggers'],
    core: ['Source Control', 'Build Pipeline', 'Test Stage', 'Artifact Store', 'Deployment Engine', 'Release Workflow'],
    data: ['Release Metadata', 'Environment Config', 'Deploy Target', 'Approval Gates', 'Build Cache', 'Release Notes'],
    ops: ['Release Checks', 'Rollback Logic', 'Monitoring', 'Audit Trail', 'Canary Deploy', 'Incident Recovery'],
  },
  'monitoring-observability': {
    title: 'Observability architecture',
    entry: ['Services', 'Users', 'Platform Events', 'Telemetry Sources'],
    core: ['Collectors', 'Metrics Pipeline', 'Tracing Layer', 'Alert Engine', 'Log Aggregation', 'Analysis Rules'],
    data: ['Logs Store', 'Metrics DB', 'Trace Backend', 'Dashboards', 'SLO Store', 'Incident Timeline'],
    ops: ['SLO Tracking', 'Incident Response', 'Root Cause Analysis', 'Ops Automation', 'Alert Routing', 'Health Checks'],
  },
  'security-zero-trust': {
    title: 'Zero-trust security architecture',
    entry: ['Users', 'Devices', 'Workloads', 'Applications'],
    core: ['Identity Provider', 'Policy Engine', 'Access Gateway', 'Risk Engine', 'Session Broker', 'Trust Engine'],
    data: ['Session Logs', 'Audit Trail', 'Secrets Vault', 'Threat Intel', 'Device Registry', 'Policy State'],
    ops: ['MFA', 'Conditional Access', 'Threat Detection', 'Compliance Reporting', 'Access Reviews', 'Incident Response'],
  },
  'devsecops': {
    title: 'DevSecOps architecture',
    entry: ['Developers', 'Code Repos', 'Pipelines', 'Artifacts'],
    core: ['Static Analysis', 'Dependency Scan', 'Secrets Detection', 'Policy Controls', 'Risk Prioritization', 'Remediation Workflow'],
    data: ['Findings DB', 'Remediation Queue', 'SBOM', 'Compliance Reports', 'Vulnerability DB', 'Change Timeline'],
    ops: ['Guardrails', 'Vulnerability Fixing', 'Alerts', 'Audit Trails', 'Approval Gates', 'Runtime Checks'],
  },
  'container-orchestration': {
    title: 'Container orchestration architecture',
    entry: ['Developers', 'GitOps Events', 'Container Registry', 'Workload Specs'],
    core: ['Control Plane', 'Scheduler', 'Worker Nodes', 'Ingress Layer', 'Service Mesh', 'Runtime Agents'],
    data: ['Image Registry', 'Secrets Store', 'Persistent Storage', 'Service Mesh', 'Config Map', 'Volume Layer'],
    ops: ['Autoscaling', 'Health Checks', 'Rollbacks', 'Runtime Monitoring', 'Load Balancing', 'Resource Tuning'],
  },
  'database': {
    title: 'Database architecture',
    entry: ['Applications', 'Jobs', 'Analysts', 'API Clients'],
    core: ['Connection Layer', 'Query Engine', 'Storage Engine', 'Index Layer', 'Transaction Manager', 'Schema Layer'],
    data: ['Replication', 'Cache Layer', 'Backups', 'Data Warehouse', 'Read Replicas', 'Data Mart'],
    ops: ['Access Control', 'Monitoring', 'Recovery', 'Performance Tuning', 'Integrity Checks', 'Backup Policy'],
  },
  'data-streaming': {
    title: 'Streaming data architecture',
    entry: ['Producers', 'Events', 'Sensors', 'Change Streams'],
    core: ['Ingress Layer', 'Broker', 'Stream Processor', 'Consumer Groups', 'Partitions', 'Schema Validation'],
    data: ['Event Store', 'Retention', 'Schema Registry', 'Replay Queue', 'Message Topics', 'Offsets'],
    ops: ['Delivery Checks', 'Replay', 'Backpressure', 'Monitoring', 'Dead Letter Queue', 'Latency Tracking'],
  },
  'data-engineering': {
    title: 'Data engineering architecture',
    entry: ['Sources', 'ETL Jobs', 'Analysts', 'External Feeds'],
    core: ['Ingestion', 'Transformation', 'Validation', 'Scheduling', 'Workflow Orchestration', 'Quality Rules'],
    data: ['Raw Storage', 'Curated Data', 'Warehouse', 'Pipelines', 'Lakehouse', 'Data Catalog'],
    ops: ['Quality Checks', 'Lineage', 'Monitoring', 'Retry Logic', 'SLA Tracking', 'Data Governance'],
  },
  'networking': {
    title: 'Networking architecture',
    entry: ['Clients', 'Edge Traffic', 'Internal Services', 'Gateway Traffic'],
    core: ['Ingress', 'Load Balancer', 'Routing Layer', 'Policy Engine', 'Proxy Layer', 'Service Discovery'],
    data: ['DNS', 'Service Discovery', 'Traffic Logs', 'Telemetry', 'Certificate Store', 'Topology State'],
    ops: ['Availability', 'TLS', 'Latency Tracking', 'Failover', 'Rules Enforcement', 'Performance Tuning'],
  },
  'identity-access': {
    title: 'Identity and access architecture',
    entry: ['Users', 'Applications', 'External IdPs', 'Directories'],
    core: ['Identity Provider', 'Auth Flow', 'Session Layer', 'Policy Engine', 'Token Service', 'Directory Sync'],
    data: ['User Directory', 'Consent', 'Audit Logs', 'Risk Signals', 'Group Policies', 'Access Tokens'],
    ops: ['MFA', 'Access Reviews', 'Token Revocation', 'Compliance', 'Risk Detection', 'Revocation'],
  },
  'developer-tools': {
    title: 'Developer workflow architecture',
    entry: ['Developers', 'Workspace', 'Repositories', 'IDE Sessions'],
    core: ['Editor / IDE', 'Version Control', 'Build Tools', 'Testing Layer', 'Package Manager', 'Task Runner'],
    data: ['Config Files', 'Artifacts', 'Docs', 'Local Cache', 'Dependency Graph', 'Generated Output'],
    ops: ['Linting', 'Debugging', 'Release Steps', 'Developer Productivity', 'Code Review', 'Automation'],
  },
  'automation': {
    title: 'Automation architecture',
    entry: ['Operators', 'Event Sources', 'Triggers', 'Workflow Inputs'],
    core: ['Automation Engine', 'Workflow Orchestrator', 'Task Runner', 'Decision Logic', 'Execution Queue', 'State Machine'],
    data: ['Configs', 'Logs', 'State Store', 'Notifications', 'Run History', 'Task Metadata'],
    ops: ['Retries', 'Monitoring', 'Scheduling', 'Approval Gates', 'Recovery Logic', 'Runbook Automation'],
  },
};

// Tool-specific architecture definitions
const TOOL_ARCHITECTURES = {
  // AI/ML Tools
  'OpenAI': {
    family: 'ai-ml',
    docs: 'https://platform.openai.com/docs/overview',
    productSet: [
      {
        name: 'API Platform',
        role: 'Model access and inference',
        modules: ['Prompt Layer', 'Model Gateway', 'Inference Runtime', 'Safety Filters', 'Token Management', 'Rate Limiting'],
      },
    ],
  },
  'Anthropic': {
    family: 'ai-ml',
    docs: 'https://docs.anthropic.com/en',
    productSet: [
      {
        name: 'Claude API',
        role: 'Conversational AI models',
        modules: ['Prompt Interface', 'Model Runtime', 'Context Management', 'Safety Layer', 'Response Generation', 'Token Accounting'],
      },
    ],
  },
  'Google Gemini': {
    family: 'ai-ml',
    docs: 'https://ai.google.dev/gemini-api/docs',
    productSet: [
      {
        name: 'Gemini Models',
        role: 'Multimodal AI models',
        modules: ['Multimodal Input', 'Model Inference', 'Context Handling', 'Safety Checks', 'Tool Use', 'Output Streaming'],
      },
    ],
  },
  'GitHub Copilot': {
    family: 'ai-ml',
    docs: 'https://docs.github.com/en/copilot',
    productSet: [
      {
        name: 'Copilot IDE Integration',
        role: 'Developer coding assistance',
        modules: ['IDE Extension', 'Context Provider', 'Model Service', 'Suggestion Engine', 'Inline Chat', 'Code Review'],
      },
    ],
  },
  'Amazon Bedrock': {
    family: 'ai-ml',
    docs: 'https://aws.amazon.com/bedrock',
    productSet: [
      {
        name: 'Foundation Models Service',
        role: 'Managed AI model access',
        modules: ['Model API', 'Access Control', 'Inference', 'Vector Storage', 'Knowledge Base', 'Prompt Management'],
      },
    ],
  },
  'Azure OpenAI': {
    family: 'ai-ml',
    docs: 'https://azure.microsoft.com/products/ai-services/openai-service',
    productSet: [
      {
        name: 'Enterprise OpenAI',
        role: 'Managed OpenAI service',
        modules: ['API Endpoint', 'Deployment Management', 'Model Selection', 'Content Filtering', 'Monitoring', 'Access Control'],
      },
    ],
  },
  'Hugging Face': {
    family: 'ai-ml',
    docs: 'https://huggingface.co/docs',
    productSet: [
      {
        name: 'Model Hub & Inference',
        role: 'Open-source AI platform',
        modules: ['Model Repository', 'Inference API', 'Training Spaces', 'Datasets', 'Community', 'Monetization'],
      },
    ],
  },
  'LangChain': {
    family: 'ai-ml',
    docs: 'https://python.langchain.com/docs',
    productSet: [
      {
        name: 'LLM Orchestration',
        role: 'Framework for LLM apps',
        modules: ['Chain Orchestration', 'Prompt Templates', 'Memory Management', 'Tool Integration', 'Agent Loop', 'Output Parsing'],
      },
    ],
  },
  'LlamaIndex': {
    family: 'ai-ml',
    docs: 'https://docs.llamaindex.ai',
    productSet: [
      {
        name: 'Data Framework',
        role: 'Retrieval for LLM apps',
        modules: ['Data Connector', 'Indexing', 'Retriever', 'Query Engine', 'Response Synthesis', 'Evaluation'],
      },
    ],
  },
  'PyTorch': {
    family: 'ai-ml',
    docs: 'https://pytorch.org/docs',
    productSet: [
      {
        name: 'Deep Learning Framework',
        role: 'Neural network training',
        modules: ['Tensor Engine', 'Autograd', 'Neural Modules', 'Optimizers', 'Data Loaders', 'Distributed Training'],
      },
    ],
  },
  'TensorFlow': {
    family: 'ai-ml',
    docs: 'https://www.tensorflow.org/api_docs',
    productSet: [
      {
        name: 'ML Platform',
        role: 'Machine learning framework',
        modules: ['Keras API', 'Data Pipeline', 'Model Building', 'Training Loop', 'Deployment', 'TensorBoard'],
      },
    ],
  },

  // Cloud Platform Tools
  'AWS': {
    family: 'cloud-platform',
    docs: 'https://docs.aws.amazon.com',
    productSet: [
      {
        name: 'Compute Services',
        role: 'EC2, Lambda, ECS',
        modules: ['EC2 Instances', 'Lambda Functions', 'Container Services', 'Auto Scaling', 'Load Balancing', 'IAM'],
      },
      {
        name: 'Storage & Database',
        role: 'S3, RDS, DynamoDB',
        modules: ['S3 Buckets', 'EBS Volumes', 'RDS Databases', 'DynamoDB', 'ElastiCache', 'Glacier'],
      },
      {
        name: 'Networking',
        role: 'VPC, Route53, CloudFront',
        modules: ['VPC', 'Subnets', 'Route53', 'CloudFront', 'API Gateway', 'Direct Connect'],
      },
    ],
  },
  'Azure': {
    family: 'cloud-platform',
    docs: 'https://learn.microsoft.com/azure',
    productSet: [
      {
        name: 'Compute',
        role: 'VMs, App Service, Functions',
        modules: ['Virtual Machines', 'App Service', 'Functions', 'Container Instances', 'Batch', 'Auto Scale'],
      },
      {
        name: 'Storage & Data',
        role: 'Storage Account, SQL Database',
        modules: ['Blob Storage', 'File Shares', 'SQL Database', 'Cosmos DB', 'Data Lake', 'Redis Cache'],
      },
      {
        name: 'Networking',
        role: 'VNet, Load Balancer, CDN',
        modules: ['Virtual Network', 'Load Balancer', 'Application Gateway', 'CDN', 'DNS', 'Firewall'],
      },
    ],
  },
  'Google Cloud Platform': {
    family: 'cloud-platform',
    docs: 'https://cloud.google.com/docs',
    productSet: [
      {
        name: 'Compute',
        role: 'GCE, App Engine, Cloud Run',
        modules: ['Compute Engine', 'App Engine', 'Cloud Run', 'GKE', 'Cloud Functions', 'Bare Metal'],
      },
      {
        name: 'Data & Storage',
        role: 'Cloud Storage, BigQuery',
        modules: ['Cloud Storage', 'Cloud SQL', 'BigQuery', 'Firestore', 'Spanner', 'Memorystore'],
      },
      {
        name: 'Networking',
        role: 'VPC, Load Balancing, CDN',
        modules: ['VPC', 'Cloud Load Balancing', 'Cloud CDN', 'Cloud DNS', 'Cloud Armor', 'Interconnect'],
      },
    ],
  },
  'Vercel': {
    family: 'cloud-platform',
    docs: 'https://vercel.com/docs',
    productSet: [
      {
        name: 'Frontend Platform',
        role: 'Deployment and edge',
        modules: ['Git Integration', 'Build System', 'Edge Functions', 'Serverless Functions', 'CDN', 'Monitoring'],
      },
    ],
  },

  // Infrastructure as Code
  'Terraform': {
    family: 'infrastructure-as-code',
    docs: 'https://www.terraform.io/docs',
    productSet: [
      {
        name: 'Infrastructure Provisioning',
        role: 'IaC for multi-cloud',
        modules: ['Config Language', 'State Management', 'Provider Plugins', 'Resource Graph', 'Plan & Apply', 'Module System'],
      },
    ],
  },
  'Ansible': {
    family: 'infrastructure-as-code',
    docs: 'https://docs.ansible.com',
    productSet: [
      {
        name: 'Configuration Management',
        role: 'Playbook automation',
        modules: ['Inventory', 'Playbooks', 'Modules', 'Roles', 'Handlers', 'Variables'],
      },
    ],
  },
  'CloudFormation': {
    family: 'infrastructure-as-code',
    docs: 'https://docs.aws.amazon.com/cloudformation',
    productSet: [
      {
        name: 'AWS Stack Provisioning',
        role: 'AWS infrastructure as code',
        modules: ['Templates', 'Stack Management', 'Change Sets', 'Drift Detection', 'Rollback', 'Intrinsic Functions'],
      },
    ],
  },
  'Pulumi': {
    family: 'infrastructure-as-code',
    docs: 'https://www.pulumi.com/docs',
    productSet: [
      {
        name: 'Code-driven IaC',
        role: 'Infrastructure using code',
        modules: ['Program SDK', 'State Backend', 'Deployment Engine', 'Policy Engine', 'Automation API', 'Secrets'],
      },
    ],
  },

  // CI/CD Pipeline
  'GitHub Actions': {
    family: 'ci-cd-pipeline',
    docs: 'https://docs.github.com/en/actions',
    productSet: [
      {
        name: 'Workflow Automation',
        role: 'GitHub native CI/CD',
        modules: ['Workflow Definition', 'Event Triggers', 'Jobs', 'Runners', 'Actions', 'Artifacts & Deployment'],
      },
    ],
  },
  'GitLab CI': {
    family: 'ci-cd-pipeline',
    docs: 'https://docs.gitlab.com/ee/ci',
    productSet: [
      {
        name: 'Pipeline Engine',
        role: 'Built-in CI/CD',
        modules: ['Pipeline Definition', 'Runners', 'Jobs', 'Stages', 'Artifacts', 'Environments'],
      },
    ],
  },
  'Jenkins': {
    family: 'ci-cd-pipeline',
    docs: 'https://www.jenkins.io/doc',
    productSet: [
      {
        name: 'Automation Server',
        role: 'Distributed CI/CD',
        modules: ['Controller', 'Agents', 'Pipelines', 'Build Jobs', 'Artifact Storage', 'Plugins'],
      },
    ],
  },
  'CircleCI': {
    family: 'ci-cd-pipeline',
    docs: 'https://circleci.com/docs',
    productSet: [
      {
        name: 'SaaS CI/CD',
        role: 'Continuous integration',
        modules: ['Orbs', 'Jobs', 'Workflows', 'Executors', 'Caching', 'Notifications'],
      },
    ],
  },
  'Argo CD': {
    family: 'ci-cd-pipeline',
    docs: 'https://argo-cd.readthedocs.io',
    productSet: [
      {
        name: 'GitOps Deployment',
        role: 'Declarative CD for K8s',
        modules: ['Git Repository', 'Application CRD', 'Sync Engine', 'Health Assessment', 'SSO', 'Webhooks'],
      },
    ],
  },

  // Monitoring & Observability
  'Prometheus': {
    family: 'monitoring-observability',
    docs: 'https://prometheus.io/docs',
    productSet: [
      {
        name: 'Metrics Collection',
        role: 'Time-series monitoring',
        modules: ['Scraper', 'TSDB', 'Alerting Engine', 'Query Language', 'Exporters', 'Service Discovery'],
      },
    ],
  },
  'Grafana': {
    family: 'monitoring-observability',
    docs: 'https://grafana.com/docs/grafana',
    productSet: [
      {
        name: 'Visualization & Alerting',
        role: 'Dashboard and monitoring',
        modules: ['Data Sources', 'Panels', 'Dashboards', 'Alerts', 'Users & Auth', 'Provisioning'],
      },
    ],
  },
  'Datadog': {
    family: 'monitoring-observability',
    docs: 'https://docs.datadoghq.com',
    productSet: [
      {
        name: 'SaaS Monitoring',
        role: 'Full-stack observability',
        modules: ['Agents', 'Metrics Pipeline', 'Logs', 'Traces', 'Dashboards', 'Alerting'],
      },
    ],
  },
  'New Relic': {
    family: 'monitoring-observability',
    docs: 'https://docs.newrelic.com',
    productSet: [
      {
        name: 'Application Monitoring',
        role: 'APM and observability',
        modules: ['APM Agents', 'Metrics Collection', 'Log Management', 'Distributed Tracing', 'Dashboards', 'Alerts'],
      },
    ],
  },
  'ELK Stack': {
    family: 'monitoring-observability',
    docs: 'https://www.elastic.co/docs',
    productSet: [
      {
        name: 'Elasticsearch',
        role: 'Search and analytics',
        modules: ['Search Engine', 'Indexing', 'Aggregations', 'Query DSL', 'Security', 'Monitoring'],
      },
      {
        name: 'Logstash',
        role: 'Log processing',
        modules: ['Input Plugins', 'Filters', 'Output Plugins', 'Pipelines', 'Performance', 'Plugins'],
      },
      {
        name: 'Kibana',
        role: 'Visualization',
        modules: ['Dashboards', 'Visualizations', 'Canvas', 'Alerting', 'Dev Tools', 'Management'],
      },
    ],
  },

  // Security & Zero-Trust
  'Zscaler': {
    family: 'security-zero-trust',
    docs: 'https://help.zscaler.com',
    productSet: [
      {
        name: 'ZIA',
        role: 'Secure internet access',
        modules: ['User Trust', 'Web Gateway', 'Firewall', 'DNS', 'DLP', 'Threat Engine'],
      },
      {
        name: 'ZPA',
        role: 'Zero-trust app access',
        modules: ['Identity Policy', 'App Segmentation', 'Connector', 'Access Control', 'Audit', 'Enforcement'],
      },
      {
        name: 'ZDX',
        role: 'Digital experience',
        modules: ['Telemetry', 'Diagnostics', 'Network Insights', 'Analytics', 'AI Insights', 'Support'],
      },
      {
        name: 'ZCC',
        role: 'Cloud configuration',
        modules: ['Asset Inventory', 'Cloud Posture', 'Policy', 'Risk Detection', 'Remediation', 'Compliance'],
      },
    ],
  },
  'Cloudflare': {
    family: 'security-zero-trust',
    docs: 'https://developers.cloudflare.com',
    productSet: [
      {
        name: 'Edge Network & Security',
        role: 'CDN and security',
        modules: ['Edge Cache', 'WAF', 'DDoS Protection', 'Bot Management', 'Rate Limiting', 'Page Rules'],
      },
      {
        name: 'Zero Trust',
        role: 'Access and gateway',
        modules: ['Access', 'Gateway', 'Secure Email', 'CASB', 'DLP', 'Browser Isolation'],
      },
    ],
  },
  'Okta': {
    family: 'identity-access',
    docs: 'https://developer.okta.com/docs',
    productSet: [
      {
        name: 'Identity Platform',
        role: 'IAM and SSO',
        modules: ['Identity Provider', 'SSO', 'MFA', 'Directory', 'API Access', 'Workflows'],
      },
    ],
  },
  'Palo Alto Networks': {
    family: 'security-zero-trust',
    docs: 'https://docs.paloaltonetworks.com',
    productSet: [
      {
        name: 'Firewall Platform',
        role: 'Network security',
        modules: ['Threat Prevention', 'Intrusion Detection', 'SSL Inspection', 'Policy Engine', 'Logging', 'Reporting'],
      },
    ],
  },
  'CrowdStrike': {
    family: 'security-zero-trust',
    docs: 'https://falcon.crowdstrike.com/documentation',
    productSet: [
      {
        name: 'Falcon Platform',
        role: 'Endpoint protection',
        modules: ['Agent', 'Prevention Engine', 'Detection Engine', 'Response', 'Investigation', 'Threat Intel'],
      },
    ],
  },

  // DevSecOps
  'Snyk': {
    family: 'devsecops',
    docs: 'https://docs.snyk.io',
    productSet: [
      {
        name: 'Security Platform',
        role: 'Vulnerability scanning',
        modules: ['Code Scan', 'Dependency Scan', 'SAST', 'Policy', 'Fix Automation', 'Reporting'],
      },
    ],
  },
  'Trivy': {
    family: 'devsecops',
    docs: 'https://aquasecurity.github.io/trivy',
    productSet: [
      {
        name: 'Vulnerability Scanner',
        role: 'Container & code scanning',
        modules: ['Artifact Scanner', 'Vulnerability DB', 'Policy Checks', 'SBOM', 'Reporting', 'CI Integration'],
      },
    ],
  },

  // Container & Orchestration
  'Kubernetes': {
    family: 'container-orchestration',
    docs: 'https://kubernetes.io/docs',
    productSet: [
      {
        name: 'Cluster Control',
        role: 'Container orchestration',
        modules: ['Control Plane', 'API Server', 'Scheduler', 'Kubelet', 'Container Runtime', 'Network Plugin'],
      },
    ],
  },
  'Docker': {
    family: 'container-orchestration',
    docs: 'https://docs.docker.com',
    productSet: [
      {
        name: 'Container Runtime',
        role: 'Containerization',
        modules: ['Docker Daemon', 'Container Runtime', 'Image Build', 'Registry', 'Storage', 'Networking'],
      },
    ],
  },
  'Helm': {
    family: 'container-orchestration',
    docs: 'https://helm.sh/docs',
    productSet: [
      {
        name: 'K8s Package Manager',
        role: 'Kubernetes packaging',
        modules: ['Charts', 'Repositories', 'Release Management', 'Templating', 'Hooks', 'Values'],
      },
    ],
  },
  'OpenShift': {
    family: 'container-orchestration',
    docs: 'https://docs.openshift.com',
    productSet: [
      {
        name: 'Enterprise K8s',
        role: 'Red Hat container platform',
        modules: ['Kubernetes', 'Container Runtime', 'Registry', 'Networking', 'Storage', 'Developer Tools'],
      },
    ],
  },

  // Databases
  'PostgreSQL': {
    family: 'database',
    docs: 'https://www.postgresql.org/docs',
    productSet: [
      {
        name: 'Relational Database',
        role: 'SQL database engine',
        modules: ['Query Engine', 'Storage Engine', 'Transaction Manager', 'Indexing', 'Replication', 'Backup'],
      },
    ],
  },
  'MongoDB': {
    family: 'database',
    docs: 'https://docs.mongodb.com',
    productSet: [
      {
        name: 'NoSQL Database',
        role: 'Document-oriented database',
        modules: ['Document Store', 'Query Language', 'Indexing', 'Transactions', 'Replication', 'Sharding'],
      },
    ],
  },
  'Redis': {
    family: 'database',
    docs: 'https://redis.io/documentation',
    productSet: [
      {
        name: 'In-Memory Store',
        role: 'Cache and session store',
        modules: ['Memory Store', 'Data Structures', 'Persistence', 'Replication', 'Pub/Sub', 'Scripting'],
      },
    ],
  },
  'Supabase': {
    family: 'database',
    docs: 'https://supabase.com/docs',
    productSet: [
      {
        name: 'Backend Platform',
        role: 'Open-source Firebase alternative',
        modules: ['Database', 'Auth', 'Storage', 'Realtime', 'Edge Functions', 'APIs'],
      },
    ],
  },

  // Data Streaming
  'Kafka': {
    family: 'data-streaming',
    docs: 'https://kafka.apache.org/documentation',
    productSet: [
      {
        name: 'Event Streaming',
        role: 'Distributed streaming platform',
        modules: ['Brokers', 'Topics', 'Producers', 'Consumers', 'Partitions', 'Replication'],
      },
    ],
  },
  'RabbitMQ': {
    family: 'data-streaming',
    docs: 'https://www.rabbitmq.com/documentation.html',
    productSet: [
      {
        name: 'Message Broker',
        role: 'Message queue system',
        modules: ['Exchanges', 'Queues', 'Bindings', 'Consumers', 'Clustering', 'Plugins'],
      },
    ],
  },
  'NATS': {
    family: 'data-streaming',
    docs: 'https://docs.nats.io',
    productSet: [
      {
        name: 'Cloud Messaging',
        role: 'Lightweight messaging',
        modules: ['Server', 'Publish-Subscribe', 'Queuing', 'Streaming', 'KV Store', 'Object Store'],
      },
    ],
  },

  // Data Engineering
  'Airflow': {
    family: 'data-engineering',
    docs: 'https://airflow.apache.org/docs',
    productSet: [
      {
        name: 'Workflow Orchestration',
        role: 'Data pipeline orchestration',
        modules: ['Scheduler', 'Executor', 'DAG Management', 'Task', 'Plugins', 'Monitoring'],
      },
    ],
  },
  'dbt': {
    family: 'data-engineering',
    docs: 'https://docs.getdbt.com',
    productSet: [
      {
        name: 'Data Transformation',
        role: 'ELT and transformation',
        modules: ['Models', 'Tests', 'Seeds', 'Snapshots', 'Packages', 'Docs'],
      },
    ],
  },

  // Networking
  'NGINX': {
    family: 'networking',
    docs: 'https://nginx.org/en/docs',
    productSet: [
      {
        name: 'Web Server & Proxy',
        role: 'HTTP server and reverse proxy',
        modules: ['Server Core', 'Reverse Proxy', 'Load Balancer', 'SSL/TLS', 'Caching', 'Modules'],
      },
    ],
  },

  // Developer Tools
  'GitHub': {
    family: 'developer-tools',
    docs: 'https://docs.github.com/en',
    productSet: [
      {
        name: 'Platform',
        role: 'Version control and collaboration',
        modules: ['Repository', 'Branching', 'Pull Requests', 'Actions', 'Packages', 'Security'],
      },
    ],
  },
  'GitLab': {
    family: 'developer-tools',
    docs: 'https://docs.gitlab.com',
    productSet: [
      {
        name: 'DevOps Platform',
        role: 'Full DevOps lifecycle',
        modules: ['Repository', 'Pipelines', 'Registry', 'Wiki', 'Issues', 'Security'],
      },
    ],
  },
  'VS Code': {
    family: 'developer-tools',
    docs: 'https://code.visualstudio.com/docs',
    productSet: [
      {
        name: 'Editor',
        role: 'Code editor and IDE',
        modules: ['Editor Core', 'Extensions', 'Terminal', 'Debugging', 'Source Control', 'Settings'],
      },
    ],
  },
  'Git': {
    family: 'developer-tools',
    docs: 'https://git-scm.com/doc',
    productSet: [
      {
        name: 'Version Control',
        role: 'Distributed version control',
        modules: ['Repository', 'Objects', 'Refs', 'Index', 'Hooks', 'Merging'],
      },
    ],
  },

  // Automation & Scripting
  'Python': {
    family: 'automation',
    docs: 'https://docs.python.org/3',
    productSet: [
      {
        name: 'Programming Language',
        role: 'Scripting and automation',
        modules: ['Interpreter', 'Runtime', 'Standard Library', 'Package Manager', 'Virtual Env', 'REPL'],
      },
    ],
  },
  'Go': {
    family: 'automation',
    docs: 'https://golang.org/doc',
    productSet: [
      {
        name: 'Systems Language',
        role: 'Cloud-native development',
        modules: ['Compiler', 'Runtime', 'Goroutines', 'Channels', 'Packages', 'Standard Library'],
      },
    ],
  },
  'Bash/Shell': {
    family: 'automation',
    docs: 'https://www.gnu.org/software/bash/manual',
    productSet: [
      {
        name: 'Shell Interpreter',
        role: 'Command execution and scripting',
        modules: ['Parser', 'Executor', 'Builtins', 'Pipes', 'Redirection', 'Functions'],
      },
    ],
  },
};

// Build complete registry
function buildCompleteRegistry() {
  const registry = {
    generatedAt: new Date().toISOString().split('T')[0],
    schemaVersion: 2,
    sourcePolicy:
      'Official product documentation and local architecture-family mapping only. We generate our own original architecture diagrams from product metadata and family blueprints; we do not copy public vendor screenshots or product-specific marketing art.',
    families: FAMILY_BLUEPRINTS,
    tools: {},
  };

  // Process all defined tools
  Object.entries(TOOL_ARCHITECTURES).forEach(([toolName, config]) => {
    const family = config.family;
    const blueprint = FAMILY_BLUEPRINTS[family] || FAMILY_BLUEPRINTS['automation'];

    registry.tools[toolName] = {
      family,
      officialDocs: [config.docs],
      productSet: config.productSet,
      diagramBlueprint: {
        entry: blueprint.entry,
        core: blueprint.core,
        data: config.productSet.flatMap((p) => p.modules).slice(0, 6),
        ops: blueprint.ops,
      },
      notes: `${toolName} is modeled from official documentation. Product-specific architecture with ${config.productSet.length} component${config.productSet.length > 1 ? 's' : ''}.`,
    };
  });

  return registry;
}

// Write to file
const registry = buildCompleteRegistry();
const outputPath = path.resolve('./data/tool-architecture-registry.json');
fs.writeFileSync(outputPath, JSON.stringify(registry, null, 2));

console.log(`✓ Registry generated: ${outputPath}`);
console.log(`✓ Tools defined: ${Object.keys(registry.tools).length}`);
console.log(`✓ Families: ${Object.keys(registry.families).length}`);
