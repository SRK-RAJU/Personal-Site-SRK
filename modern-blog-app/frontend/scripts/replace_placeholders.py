import json
from pathlib import Path
from datetime import datetime

base_path = Path(__file__).resolve().parents[1] / 'data' / 'industry-tools.json'
backup_path = base_path.with_suffix('.pre_replace_' + datetime.utcnow().strftime('%Y%m%dT%H%M%SZ') + '.bak')

with base_path.open('r', encoding='utf-8') as f:
    data = json.load(f)

# backup
with backup_path.open('w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

replacements = {
    'ai-ml': [
        {"name": "TensorFlow", "officialUrl": "https://www.tensorflow.org", "description": "Open-source ML framework", "tags": ["framework","ml","ai"]},
        {"name": "PyTorch", "officialUrl": "https://pytorch.org", "description": "Deep learning framework", "tags": ["framework","ml","ai"]},
        {"name": "Hugging Face", "officialUrl": "https://huggingface.co", "description": "Model hub and tooling for transformers", "tags": ["models","hub"]},
        {"name": "OpenAI", "officialUrl": "https://openai.com", "description": "AI models and APIs (GPT family)", "tags": ["api","ai","models"]},
        {"name": "Anthropic (Claude)", "officialUrl": "https://www.anthropic.com", "description": "Anthropic Claude family (Claude Instant, Claude 2, Claude 3)", "tags": ["ai","models","claude"]},
        {"name": "Google Gemini", "officialUrl": "https://gemini.google.com", "description": "Google's family of multimodal models", "tags": ["ai","models"]},
        {"name": "Cohere", "officialUrl": "https://cohere.ai", "description": "LLMs and semantic search APIs", "tags": ["ai","models"]},
        {"name": "Stability AI", "officialUrl": "https://stability.ai", "description": "Generative models for images and audio", "tags": ["generative","image"]},
        {"name": "Runway", "officialUrl": "https://runwayml.com", "description": "Creative AI tools for video and imagery", "tags": ["generative","creative"]},
        {"name": "Weights & Biases", "officialUrl": "https://wandb.ai", "description": "Experiment tracking and model monitoring", "tags": ["mlops"]}
    ],
    'cloud': [
        {"name": "Amazon Web Services (AWS)", "officialUrl": "https://aws.amazon.com", "description": "Comprehensive cloud platform", "tags": ["cloud"]},
        {"name": "Microsoft Azure", "officialUrl": "https://azure.microsoft.com", "description": "Cloud services from Microsoft", "tags": ["cloud"]},
        {"name": "Google Cloud Platform (GCP)", "officialUrl": "https://cloud.google.com", "description": "Google's cloud platform", "tags": ["cloud"]},
        {"name": "DigitalOcean", "officialUrl": "https://www.digitalocean.com", "description": "Developer-friendly cloud droplets and services", "tags": ["cloud"]},
        {"name": "Vercel", "officialUrl": "https://vercel.com", "description": "Frontend deployment and edge platform", "tags": ["frontend","edge"]}
    ],
    'cybersecurity': [
        {"name": "CrowdStrike", "officialUrl": "https://www.crowdstrike.com", "description": "Endpoint protection and threat intelligence", "tags": ["edr","security"]},
        {"name": "Palo Alto Networks", "officialUrl": "https://www.paloaltonetworks.com", "description": "Network and cloud security platforms", "tags": ["security"]},
        {"name": "Splunk", "officialUrl": "https://www.splunk.com", "description": "SIEM and security analytics", "tags": ["siem","security"]},
        {"name": "Tenable", "officialUrl": "https://www.tenable.com", "description": "Vulnerability management", "tags": ["vulnerability"]},
        {"name": "Okta", "officialUrl": "https://www.okta.com", "description": "Identity and access management", "tags": ["iam"]}
    ],
    'devops-ci-cd': [
        {"name": "Docker", "officialUrl": "https://www.docker.com", "description": "Container platform", "tags": ["containers"]},
        {"name": "Kubernetes", "officialUrl": "https://kubernetes.io", "description": "Container orchestration", "tags": ["orchestration"]},
        {"name": "Jenkins", "officialUrl": "https://www.jenkins.io", "description": "Automation server for CI/CD", "tags": ["ci","cd"]},
        {"name": "GitHub Actions", "officialUrl": "https://github.com/features/actions", "description": "CI/CD automation integrated with GitHub", "tags": ["ci","cd"]},
        {"name": "CircleCI", "officialUrl": "https://circleci.com", "description": "Continuous integration and delivery", "tags": ["ci","cd"]}
    ],
    'databases': [
        {"name": "PostgreSQL", "officialUrl": "https://www.postgresql.org", "description": "Open-source relational database", "tags": ["database","sql"]},
        {"name": "MySQL", "officialUrl": "https://www.mysql.com", "description": "Relational database", "tags": ["database","sql"]},
        {"name": "MongoDB", "officialUrl": "https://www.mongodb.com", "description": "NoSQL document database", "tags": ["database","nosql"]},
        {"name": "Redis", "officialUrl": "https://redis.io", "description": "In-memory data store and cache", "tags": ["cache","database"]},
        {"name": "CockroachDB", "officialUrl": "https://www.cockroachlabs.com", "description": "Distributed cloud-native SQL database", "tags": ["database","sql"]}
    ],
    'frontend-tools': [
        {"name": "React", "officialUrl": "https://reactjs.org", "description": "JavaScript UI library", "tags": ["frontend"]},
        {"name": "Next.js", "officialUrl": "https://nextjs.org", "description": "React framework for production", "tags": ["frontend"]},
        {"name": "Vue.js", "officialUrl": "https://vuejs.org", "description": "Progressive JavaScript framework", "tags": ["frontend"]},
        {"name": "Svelte", "officialUrl": "https://svelte.dev", "description": "Compile-time frontend framework", "tags": ["frontend"]}
    ],
    'analytics': [
        {"name": "Google Analytics 4", "officialUrl": "https://analytics.google.com", "description": "Web and app analytics", "tags": ["analytics"]},
        {"name": "Mixpanel", "officialUrl": "https://mixpanel.com", "description": "Product analytics and user tracking", "tags": ["analytics"]},
        {"name": "Amplitude", "officialUrl": "https://amplitude.com", "description": "Product analytics platform", "tags": ["analytics"]},
        {"name": "Tableau", "officialUrl": "https://www.tableau.com", "description": "Data visualization and BI", "tags": ["bi"]}
    ],
    'crm': [
        {"name": "Salesforce", "officialUrl": "https://www.salesforce.com", "description": "Enterprise CRM platform", "tags": ["crm"]},
        {"name": "HubSpot CRM", "officialUrl": "https://www.hubspot.com", "description": "Marketing and CRM platform", "tags": ["crm","marketing"]},
        {"name": "Zoho CRM", "officialUrl": "https://www.zoho.com/crm", "description": "CRM for SMBs", "tags": ["crm"]}
    ],
    'fintech': [
        {"name": "Stripe", "officialUrl": "https://stripe.com", "description": "Payments infrastructure", "tags": ["payments"]},
        {"name": "PayPal", "officialUrl": "https://www.paypal.com", "description": "Digital payments", "tags": ["payments"]},
        {"name": "Plaid", "officialUrl": "https://plaid.com", "description": "Bank connectivity APIs", "tags": ["banking","api"]}
    ],
    'cms': [
        {"name": "WordPress", "officialUrl": "https://wordpress.org", "description": "Popular CMS", "tags": ["cms"]},
        {"name": "Contentful", "officialUrl": "https://www.contentful.com", "description": "Headless CMS", "tags": ["cms","headless"]},
        {"name": "Strapi", "officialUrl": "https://strapi.io", "description": "Open-source headless CMS", "tags": ["cms","headless"]}
    ],
    'observability': [
        {"name": "Datadog", "officialUrl": "https://www.datadoghq.com", "description": "Monitoring and observability", "tags": ["monitoring"]},
        {"name": "Prometheus", "officialUrl": "https://prometheus.io", "description": "Open-source metrics collection", "tags": ["monitoring"]},
        {"name": "Grafana", "officialUrl": "https://grafana.com", "description": "Visualization and dashboards", "tags": ["monitoring","visualization"]}
    ],
    'cdns': [
        {"name": "Cloudflare", "officialUrl": "https://www.cloudflare.com", "description": "CDN and edge services", "tags": ["cdn","edge"]},
        {"name": "Akamai", "officialUrl": "https://www.akamai.com", "description": "Content delivery network", "tags": ["cdn"]},
        {"name": "Fastly", "officialUrl": "https://www.fastly.com", "description": "Edge cloud platform and CDN", "tags": ["cdn","edge"]}
    ],
    'search-engines': [
        {"name": "Elasticsearch", "officialUrl": "https://www.elastic.co/elasticsearch", "description": "Distributed search and analytics engine", "tags": ["search"]},
        {"name": "Algolia", "officialUrl": "https://www.algolia.com", "description": "Hosted search API", "tags": ["search"]},
        {"name": "Typesense", "officialUrl": "https://typesense.org", "description": "Open-source typo-tolerant search engine", "tags": ["search","open-source"]}
    ]
}

updated = 0
for c in data.get('categories', []):
    cid = c.get('id', '')
    if cid in replacements:
        c['tools'] = replacements[cid]
        updated += 1

with base_path.open('w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print('Backup saved to', backup_path)
print('Categories updated:', updated)
print('Wrote file:', base_path)
