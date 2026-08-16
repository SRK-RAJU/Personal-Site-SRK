#!/usr/bin/env node
/**
 * EXTENDED TOOL ARCHITECTURE REGISTRY
 * Adds remaining tools from PRODUCTION_SCHEMA_FINAL.sql
 */

import fs from 'fs';
import path from 'path';

// Load existing registry
const registryPath = path.resolve('./data/tool-architecture-registry.json');
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));

// Additional tools from database (beyond what was already generated)
const ADDITIONAL_TOOLS = {
  'Tavily': {
    family: 'ai-ml',
    docs: 'https://tavily.com/docs',
    productSet: [
      {
        name: 'Research API',
        role: 'AI-powered research',
        modules: ['Search Engine', 'Content Processing', 'Research Synthesis', 'API', 'Caching', 'Analytics'],
      },
    ],
  },
  'LangGraph': {
    family: 'ai-ml',
    docs: 'https://langchain-ai.github.io/langgraph',
    productSet: [
      {
        name: 'Graph Orchestration',
        role: 'Agent workflow framework',
        modules: ['Graph Definition', 'Node Execution', 'State Management', 'Edge Routing', 'Recursion', 'Interrupts'],
      },
    ],
  },
  'Weaviate': {
    family: 'ai-ml',
    docs: 'https://weaviate.io/developers/weaviate',
    productSet: [
      {
        name: 'Vector Database',
        role: 'Vector storage and search',
        modules: ['Vector Store', 'Indexing', 'Search', 'GraphQL API', 'RAG Integration', 'Monitoring'],
      },
    ],
  },
  'Pinecone': {
    family: 'ai-ml',
    docs: 'https://docs.pinecone.io',
    productSet: [
      {
        name: 'Managed Vector DB',
        role: 'Serverless vector database',
        modules: ['Vector Index', 'Query Engine', 'Metadata Filtering', 'Namespaces', 'Pod Types', 'Analytics'],
      },
    ],
  },
  'Scikit-learn': {
    family: 'ai-ml',
    docs: 'https://scikit-learn.org/stable',
    productSet: [
      {
        name: 'ML Library',
        role: 'Traditional machine learning',
        modules: ['Estimators', 'Transformers', 'Pipelines', 'Model Selection', 'Metrics', 'Datasets'],
      },
    ],
  },
  'Jupyter': {
    family: 'developer-tools',
    docs: 'https://jupyter.org/documentation',
    productSet: [
      {
        name: 'Notebook Environment',
        role: 'Interactive computing',
        modules: ['Kernel', 'Frontend', 'Notebook Format', 'Nbconvert', 'Widgets', 'Extensions'],
      },
    ],
  },
  'DigitalOcean': {
    family: 'cloud-platform',
    docs: 'https://docs.digitalocean.com',
    productSet: [
      {
        name: 'Cloud Platform',
        role: 'Developer-friendly cloud',
        modules: ['Droplets', 'Spaces', 'Databases', 'Kubernetes', 'App Platform', 'Networking'],
      },
    ],
  },
  'Linode': {
    family: 'cloud-platform',
    docs: 'https://www.linode.com/docs',
    productSet: [
      {
        name: 'Cloud Hosting',
        role: 'Akamai cloud platform',
        modules: ['Compute', 'Storage', 'Networking', 'Kubernetes', 'Databases', 'Monitoring'],
      },
    ],
  },
  'Chef': {
    family: 'infrastructure-as-code',
    docs: 'https://docs.chef.io',
    productSet: [
      {
        name: 'Configuration Management',
        role: 'Infrastructure automation',
        modules: ['Recipes', 'Cookbooks', 'Attributes', 'Providers', 'Resources', 'Testing'],
      },
    ],
  },
  'SaltStack': {
    family: 'infrastructure-as-code',
    docs: 'https://docs.saltproject.io',
    productSet: [
      {
        name: 'Configuration Orchestration',
        role: 'Event-driven automation',
        modules: ['Master', 'Minion', 'State', 'Pillar', 'Execution Modules', 'Returners'],
      },
    ],
  },
  'Azure DevOps Pipelines': {
    family: 'ci-cd-pipeline',
    docs: 'https://learn.microsoft.com/en-us/azure/devops/pipelines',
    productSet: [
      {
        name: 'CI/CD Service',
        role: 'Microsoft pipeline automation',
        modules: ['Pipelines', 'Jobs', 'Tasks', 'Stages', 'Approvals', 'Artifacts'],
      },
    ],
  },
  'Tekton': {
    family: 'ci-cd-pipeline',
    docs: 'https://tekton.dev/docs',
    productSet: [
      {
        name: 'Cloud-Native CI/CD',
        role: 'Kubernetes-native pipelines',
        modules: ['Tasks', 'Pipelines', 'Runs', 'PipelineResources', 'Triggers', 'Results'],
      },
    ],
  },
  'Jaeger': {
    family: 'monitoring-observability',
    docs: 'https://www.jaegertracing.io/docs',
    productSet: [
      {
        name: 'Distributed Tracing',
        role: 'Trace collection and analysis',
        modules: ['Agent', 'Collector', 'Query', 'Storage', 'UI', 'Instrumentation'],
      },
    ],
  },
  'OpenTelemetry': {
    family: 'monitoring-observability',
    docs: 'https://opentelemetry.io/docs',
    productSet: [
      {
        name: 'Observability Standard',
        role: 'Telemetry framework',
        modules: ['Traces', 'Metrics', 'Logs', 'Baggage', 'Exporters', 'Instrumentation'],
      },
    ],
  },
  'Loki': {
    family: 'monitoring-observability',
    docs: 'https://grafana.com/docs/loki',
    productSet: [
      {
        name: 'Log Aggregation',
        role: 'Grafana log storage',
        modules: ['Distributor', 'Ingester', 'Querier', 'Compactor', 'Query Language', 'Caching'],
      },
    ],
  },
  'Splunk': {
    family: 'monitoring-observability',
    docs: 'https://docs.splunk.com',
    productSet: [
      {
        name: 'Data Platform',
        role: 'Search and analytics',
        modules: ['Indexer', 'Search Head', 'Forwarder', 'Query Language', 'Dashboards', 'Alerts'],
      },
    ],
  },
  'Elastic': {
    family: 'monitoring-observability',
    docs: 'https://www.elastic.co/guide',
    productSet: [
      {
        name: 'Search & Analytics',
        role: 'Search platform',
        modules: ['Elasticsearch', 'Kibana', 'Beats', 'Logstash', 'Canvas', 'Alerting'],
      },
    ],
  },
  'HashiCorp Vault': {
    family: 'security-zero-trust',
    docs: 'https://www.vaultproject.io/docs',
    productSet: [
      {
        name: 'Secrets Management',
        role: 'Secure secrets store',
        modules: ['Auth Methods', 'Secret Engines', 'Audit', 'Encryption', 'Lease Management', 'Replication'],
      },
    ],
  },
  'Falco': {
    family: 'security-zero-trust',
    docs: 'https://falco.org/docs',
    productSet: [
      {
        name: 'Runtime Security',
        role: 'Threat detection',
        modules: ['Kernel Module', 'eBPF', 'Rules Engine', 'Outputs', 'Plugins', 'Dashboard'],
      },
    ],
  },
  'Keycloak': {
    family: 'identity-access',
    docs: 'https://www.keycloak.org/documentation.html',
    productSet: [
      {
        name: 'Identity Server',
        role: 'Open-source IAM',
        modules: ['Realms', 'Users', 'Roles', 'Clients', 'Protocols', 'Federation'],
      },
    ],
  },
  'OAuth 2.0': {
    family: 'identity-access',
    docs: 'https://oauth.net/2',
    productSet: [
      {
        name: 'Authorization Protocol',
        role: 'Industry standard auth',
        modules: ['Authorization Code', 'Token Endpoint', 'Scopes', 'Grants', 'PKCE', 'Refresh Tokens'],
      },
    ],
  },
  'SAML': {
    family: 'identity-access',
    docs: 'https://oasis-open.org/standards/#samlv2.0',
    productSet: [
      {
        name: 'Enterprise Identity',
        role: 'XML-based SSO',
        modules: ['Identity Provider', 'Service Provider', 'Assertions', 'Bindings', 'Protocols', 'Metadata'],
      },
    ],
  },
  'OpenID Connect': {
    family: 'identity-access',
    docs: 'https://openid.net/connect',
    productSet: [
      {
        name: 'Identity Layer',
        role: 'OAuth 2.0 identity extension',
        modules: ['Authorization Code', 'ID Token', 'UserInfo', 'Discovery', 'Session', 'Logout'],
      },
    ],
  },
  'Docker Swarm': {
    family: 'container-orchestration',
    docs: 'https://docs.docker.com/engine/swarm',
    productSet: [
      {
        name: 'Docker Clustering',
        role: 'Native container orchestration',
        modules: ['Manager', 'Worker', 'Services', 'Tasks', 'Overlay Network', 'Secrets'],
      },
    ],
  },
  'Nomad': {
    family: 'container-orchestration',
    docs: 'https://www.nomadproject.io/docs',
    productSet: [
      {
        name: 'Workload Orchestrator',
        role: 'Flexible orchestration',
        modules: ['Agent', 'Server', 'Scheduler', 'Jobs', 'Allocations', 'Drivers'],
      },
    ],
  },
  'Cassandra': {
    family: 'database',
    docs: 'https://cassandra.apache.org/doc',
    productSet: [
      {
        name: 'Distributed NoSQL',
        role: 'Wide-column store',
        modules: ['Node', 'Cluster', 'Partitioner', 'Replication', 'Consistency', 'Read Repair'],
      },
    ],
  },
  'ClickHouse': {
    family: 'database',
    docs: 'https://clickhouse.com/docs/en/intro',
    productSet: [
      {
        name: 'Analytical Database',
        role: 'OLAP database',
        modules: ['Table Engines', 'Columns', 'Compression', 'Replication', 'Distributed', 'Merges'],
      },
    ],
  },
  'TimescaleDB': {
    family: 'database',
    docs: 'https://docs.timescale.com',
    productSet: [
      {
        name: 'Time-Series Database',
        role: 'PostgreSQL extension',
        modules: ['Hypertables', 'Chunks', 'Compression', 'Continuous Aggregates', 'Retention', 'Automation'],
      },
    ],
  },
  'Pulsar': {
    family: 'data-streaming',
    docs: 'https://pulsar.apache.org/docs',
    productSet: [
      {
        name: 'Messaging Platform',
        role: 'Distributed pub-sub',
        modules: ['Brokers', 'BookKeepers', 'Topics', 'Subscriptions', 'Geo-Replication', 'Functions'],
      },
    ],
  },
  'Great Expectations': {
    family: 'data-engineering',
    docs: 'https://docs.greatexpectations.io',
    productSet: [
      {
        name: 'Data Quality',
        role: 'Data validation',
        modules: ['Datasets', 'Expectations', 'Validation', 'Profiling', 'Data Docs', 'Checkpoints'],
      },
    ],
  },
  'Apache Spark': {
    family: 'data-engineering',
    docs: 'https://spark.apache.org/docs/latest',
    productSet: [
      {
        name: 'Distributed Computing',
        role: 'Large-scale data processing',
        modules: ['Resilient RDD', 'DataFrames', 'SQL', 'MLlib', 'Streaming', 'GraphX'],
      },
    ],
  },
  'Apache Flink': {
    family: 'data-engineering',
    docs: 'https://nightlies.apache.org/flink/flink-docs-master',
    productSet: [
      {
        name: 'Stream Processing',
        role: 'Unified streaming framework',
        modules: ['Source', 'Operator', 'Sink', 'Window', 'State', 'Checkpoint'],
      },
    ],
  },
  'HAProxy': {
    family: 'networking',
    docs: 'http://www.haproxy.org/#docs',
    productSet: [
      {
        name: 'Load Balancer',
        role: 'High-availability proxy',
        modules: ['Frontend', 'Backend', 'ACL', 'Routing', 'Health Check', 'Monitoring'],
      },
    ],
  },
  'Envoy': {
    family: 'networking',
    docs: 'https://www.envoyproxy.io/docs/envoy/latest',
    productSet: [
      {
        name: 'Service Proxy',
        role: 'Communication bus',
        modules: ['Listener', 'Route', 'Cluster', 'Endpoint', 'Filters', 'Observability'],
      },
    ],
  },
  'Istio': {
    family: 'networking',
    docs: 'https://istio.io/latest/docs',
    productSet: [
      {
        name: 'Service Mesh',
        role: 'Microservices platform',
        modules: ['Pilot', 'Mixer', 'Citadel', 'Gateway', 'VirtualService', 'DestinationRule'],
      },
    ],
  },
  'Linkerd': {
    family: 'networking',
    docs: 'https://linkerd.io/2.14/overview',
    productSet: [
      {
        name: 'Lightweight Service Mesh',
        role: 'Minimal mesh',
        modules: ['Data Plane', 'Control Plane', 'Proxy', 'Identity', 'Policy', 'Telemetry'],
      },
    ],
  },
  'Cilium': {
    family: 'networking',
    docs: 'https://docs.cilium.io',
    productSet: [
      {
        name: 'eBPF Networking',
        role: 'Container networking',
        modules: ['eBPF Programs', 'Network Policies', 'Service Mesh', 'Load Balancing', 'Debugging', 'Monitoring'],
      },
    ],
  },
  'WireGuard': {
    family: 'networking',
    docs: 'https://www.wireguard.com/quickstart',
    productSet: [
      {
        name: 'VPN Protocol',
        role: 'Modern VPN',
        modules: ['Kernel Module', 'Interface', 'Peer', 'Handshake', 'Transport', 'Encryption'],
      },
    ],
  },
  'JetBrains IntelliJ': {
    family: 'developer-tools',
    docs: 'https://www.jetbrains.com/help/idea',
    productSet: [
      {
        name: 'IDE',
        role: 'Java and polyglot IDE',
        modules: ['Editor', 'Indexing', 'Inspections', 'Refactoring', 'Debugging', 'Plugins'],
      },
    ],
  },
  'Bitbucket': {
    family: 'developer-tools',
    docs: 'https://bitbucket.org/product/guides',
    productSet: [
      {
        name: 'Git Platform',
        role: 'Atlassian source control',
        modules: ['Repositories', 'Pipelines', 'Pull Requests', 'Issues', 'Permissions', 'Webhooks'],
      },
    ],
  },
  'Cursor': {
    family: 'developer-tools',
    docs: 'https://cursor.sh',
    productSet: [
      {
        name: 'AI Code Editor',
        role: 'IDE with AI assistance',
        modules: ['Editor', 'AI Chat', 'Code Completion', 'Terminal', 'Extensions', 'Workspace'],
      },
    ],
  },
  'OWASP': {
    family: 'devsecops',
    docs: 'https://owasp.org/www-project-top-ten',
    productSet: [
      {
        name: 'Security Standards',
        role: 'Web application security',
        modules: ['OWASP Top 10', 'Testing Guide', 'Cheat Sheets', 'Projects', 'Community', 'Training'],
      },
    ],
  },
  'Sonarqube': {
    family: 'devsecops',
    docs: 'https://docs.sonarqube.org/latest',
    productSet: [
      {
        name: 'Code Quality Platform',
        role: 'Code analysis and quality',
        modules: ['Scanner', 'Server', 'Analysis', 'Quality Gate', 'Issues', 'Reporting'],
      },
    ],
  },
};

// Merge additional tools
Object.entries(ADDITIONAL_TOOLS).forEach(([toolName, config]) => {
  if (!registry.tools[toolName]) {
    const family = config.family;
    const blueprint = registry.families[family] || registry.families['automation'];

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
  }
});

// Write back
fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));

console.log(`✓ Extended registry saved`);
console.log(`✓ Total tools now: ${Object.keys(registry.tools).length}`);
console.log(`✓ New tools added: ${Object.keys(ADDITIONAL_TOOLS).length}`);
