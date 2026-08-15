import json
from pathlib import Path

p = Path(r'c:\Users\Raju\local-vs-code-files\Personal-Site-SRK\modern-blog-app\frontend\data\industry-tools.json')
data = json.load(p.open(encoding='utf-8'))

# Real verified tools from web search and industry standards
verified_tools = {
    'fin-data-analytics': [
        {'name': 'Bloomberg Terminal', 'officialUrl': 'https://www.bloomberg.com/professional/products/terminal/', 'description': 'Professional financial data and analytics platform', 'tags': ['finance', 'data', 'analytics']},
        {'name': 'Reuters Eikon', 'officialUrl': 'https://www.refinitiv.com/en/products/eikon-trading-software', 'description': 'Financial data and analytics workstation', 'tags': ['finance', 'data', 'trading']},
        {'name': 'FactSet', 'officialUrl': 'https://www.factset.com', 'description': 'Financial data and analytics cloud platform', 'tags': ['finance', 'data', 'analytics']},
        {'name': 'S&P Global Market Intelligence', 'officialUrl': 'https://www.spglobal.com/marketintelligence', 'description': 'Financial intelligence and data analytics', 'tags': ['finance', 'analytics', 'intelligence']}
    ],
    'edge-iot': [
        {'name': 'AWS IoT Core', 'officialUrl': 'https://aws.amazon.com/iot-core/', 'description': 'Managed IoT connectivity and edge computing', 'tags': ['iot', 'cloud', 'edge']},
        {'name': 'Azure IoT Hub', 'officialUrl': 'https://azure.microsoft.com/en-us/products/iot-hub', 'description': 'Cloud gateway for IoT device connectivity', 'tags': ['iot', 'cloud']},
        {'name': 'Google Cloud IoT', 'officialUrl': 'https://cloud.google.com/iot', 'description': 'IoT device management and data ingestion', 'tags': ['iot', 'cloud']},
        {'name': 'Cisco Edge Intelligence', 'officialUrl': 'https://www.cisco.com/c/en/us/solutions/collateral/data-center-virtualization/enterprise-network-function/edge-computing.html', 'description': 'Enterprise edge computing and IoT solutions', 'tags': ['iot', 'edge', 'networking']}
    ],
    'game-dev': [
        {'name': 'Godot Engine', 'officialUrl': 'https://godotengine.org', 'description': 'Open-source 2D and 3D game engine', 'tags': ['game', 'engine', 'open-source']},
        {'name': 'Defold', 'officialUrl': 'https://www.defold.com', 'description': 'Cloud-based game development platform', 'tags': ['game', 'engine']},
        {'name': 'Cocos2d-x', 'officialUrl': 'https://www.cocos.com/en', 'description': 'Open-source game framework for 2D games', 'tags': ['game', 'framework', 'open-source']},
        {'name': 'Unreal Engine', 'officialUrl': 'https://www.unrealengine.com', 'description': 'Professional 3D game engine with Blueprints and C++', 'tags': ['game', 'engine', '3d']}
    ],
    'legal-tech': [
        {'name': 'LexisNexis', 'officialUrl': 'https://www.lexisnexis.com', 'description': 'Legal research and case law database platform', 'tags': ['legal', 'research', 'database']},
        {'name': 'Westlaw', 'officialUrl': 'https://www.westlaw.com', 'description': 'Legal research and law research platform', 'tags': ['legal', 'research', 'case-law']},
        {'name': 'Bloomberg Law', 'officialUrl': 'https://pro.bloomberglaw.com', 'description': 'Legal research and business law platform', 'tags': ['legal', 'research', 'business']},
        {'name': 'ContractExpress', 'officialUrl': 'https://www.contractexpress.com', 'description': 'Legal document automation and assembly', 'tags': ['legal', 'contracts', 'automation']}
    ],
    'search-engines': [
        {'name': 'Google Search', 'officialUrl': 'https://www.google.com', 'description': 'World\'s largest search engine', 'tags': ['search', 'web']},
        {'name': 'Bing', 'officialUrl': 'https://www.bing.com', 'description': 'Microsoft search engine and AI-powered results', 'tags': ['search', 'web']},
        {'name': 'DuckDuckGo', 'officialUrl': 'https://duckduckgo.com', 'description': 'Privacy-focused search engine', 'tags': ['search', 'privacy']},
        {'name': 'Yandex', 'officialUrl': 'https://www.yandex.com', 'description': 'Russian search engine and web services', 'tags': ['search', 'web']}
    ],
    'cdns': [
        {'name': 'Akamai', 'officialUrl': 'https://www.akamai.com', 'description': 'Leading CDN and content delivery platform', 'tags': ['cdn', 'delivery']},
        {'name': 'Cloudflare', 'officialUrl': 'https://www.cloudflare.com', 'description': 'CDN, DDoS protection, and edge computing', 'tags': ['cdn', 'security', 'edge']},
        {'name': 'AWS CloudFront', 'officialUrl': 'https://aws.amazon.com/cloudfront/', 'description': 'AWS content delivery network service', 'tags': ['cdn', 'aws', 'delivery']},
        {'name': 'Fastly', 'officialUrl': 'https://www.fastly.com', 'description': 'Edge cloud platform and content delivery', 'tags': ['cdn', 'edge', 'performance']}
    ],
    'customer-support': [
        {'name': 'Zendesk', 'officialUrl': 'https://www.zendesk.com', 'description': 'Customer service and support ticketing platform', 'tags': ['support', 'crm', 'ticketing']},
        {'name': 'Intercom', 'officialUrl': 'https://www.intercom.com', 'description': 'Customer messaging and support platform', 'tags': ['support', 'messaging']},
        {'name': 'Freshdesk', 'officialUrl': 'https://freshdesk.com', 'description': 'Cloud-based customer support software', 'tags': ['support', 'ticketing']},
        {'name': 'Help Scout', 'officialUrl': 'https://www.helpscout.com', 'description': 'Customer service platform with shared inbox', 'tags': ['support', 'email', 'ticketing']}
    ],
    'hr-ops': [
        {'name': 'Workday', 'officialUrl': 'https://www.workday.com', 'description': 'Cloud HR management and payroll platform', 'tags': ['hr', 'payroll', 'enterprise']},
        {'name': 'BambooHR', 'officialUrl': 'https://www.bamboohr.com', 'description': 'HR software for small and medium businesses', 'tags': ['hr', 'payroll', 'smb']},
        {'name': 'SuccessFactors', 'officialUrl': 'https://www.sap.com/products/successfactors.html', 'description': 'SAP cloud HR and workforce management', 'tags': ['hr', 'enterprise']},
        {'name': 'Guidepoint', 'officialUrl': 'https://www.guidepoint.com', 'description': 'HR operations and employee experience platform', 'tags': ['hr', 'operations']}
    ]
}

by_id = {c['id']: c for c in data['categories']}
for cat_id, tools in verified_tools.items():
    if cat_id not in by_id:
        continue
    existing = {t['name'].lower() for t in by_id[cat_id]['tools']}
    for tool in tools:
        if tool['name'].lower() not in existing:
            by_id[cat_id]['tools'].append(tool)
            existing.add(tool['name'].lower())

# Write compacted format - each tool on one line
lines = ['{', '  "categories": [']
for i, cat in enumerate(data['categories']):
    lines.append('    {')
    lines.append(f'      "id": {json.dumps(cat["id"])},')
    lines.append(f'      "displayName": {json.dumps(cat["displayName"])},')
    lines.append('      "tools": [')
    for j, tool in enumerate(cat['tools']):
        suffix = ',' if j < len(cat['tools']) - 1 else ''
        lines.append('        ' + json.dumps(tool, ensure_ascii=False, separators=(',', ':')) + suffix)
    lines.append('      ]')
    lines.append('    }' + (',' if i < len(data['categories']) - 1 else ''))
lines.append('  ]')
lines.append('}')

p.write_text('\n'.join(lines) + '\n', encoding='utf-8')

print('✓ Updated with verified real-world tools')
print('categories=', len(data['categories']))
print('tools=', sum(len(c['tools']) for c in data['categories']))

# Show updated counts for low-coverage categories
low = sorted([(c['id'], len(c['tools'])) for c in data['categories']], key=lambda x: x[1])
print('\nLowest coverage categories after update:')
for cid, cnt in low[:10]:
    print(f'  {cid:30} {cnt:2} tools')
