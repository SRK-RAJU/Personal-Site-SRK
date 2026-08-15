import json
from pathlib import Path

p = Path(r'c:\Users\Raju\local-vs-code-files\Personal-Site-SRK\modern-blog-app\frontend\data\industry-tools.json')
data = json.load(p.open(encoding='utf-8'))

# Additional verified tools for remaining low-coverage categories
additional_tools = {
    'customer-support': [
        {'name': 'Gorgias', 'officialUrl': 'https://www.gorgias.com', 'description': 'E-commerce customer support platform', 'tags': ['support', 'ecommerce']},
        {'name': 'Crisp', 'officialUrl': 'https://crisp.chat', 'description': 'Messaging platform for customer support', 'tags': ['support', 'messaging', 'chat']},
        {'name': 'Drift', 'officialUrl': 'https://www.drift.com', 'description': 'Conversational marketing and sales platform', 'tags': ['support', 'chat', 'marketing']}
    ],
    'ecommerce': [
        {'name': 'Shopify', 'officialUrl': 'https://www.shopify.com', 'description': 'E-commerce platform for online stores', 'tags': ['ecommerce', 'platform']},
        {'name': 'WooCommerce', 'officialUrl': 'https://woocommerce.com', 'description': 'WordPress e-commerce plugin and platform', 'tags': ['ecommerce', 'wordpress']},
        {'name': 'BigCommerce', 'officialUrl': 'https://www.bigcommerce.com', 'description': 'Enterprise e-commerce platform', 'tags': ['ecommerce', 'enterprise']},
        {'name': 'Magento', 'officialUrl': 'https://business.adobe.com/products/magento/magento-commerce.html', 'description': 'Adobe commerce platform for e-commerce', 'tags': ['ecommerce', 'adobe']}
    ],
    'cms': [
        {'name': 'WordPress', 'officialUrl': 'https://wordpress.org', 'description': 'Open-source content management system', 'tags': ['cms', 'open-source']},
        {'name': 'Contentful', 'officialUrl': 'https://www.contentful.com', 'description': 'Headless CMS platform', 'tags': ['cms', 'headless']},
        {'name': 'Drupal', 'officialUrl': 'https://www.drupal.org', 'description': 'Open-source enterprise CMS', 'tags': ['cms', 'open-source', 'enterprise']},
        {'name': 'Statamic', 'officialUrl': 'https://statamic.com', 'description': 'Flat-first, Laravel-powered CMS', 'tags': ['cms', 'laravel']}
    ],
    'testing-qa': [
        {'name': 'Selenium', 'officialUrl': 'https://www.selenium.dev', 'description': 'Open-source web browser automation framework', 'tags': ['testing', 'automation', 'open-source']},
        {'name': 'Cypress', 'officialUrl': 'https://www.cypress.io', 'description': 'JavaScript E2E testing framework', 'tags': ['testing', 'e2e', 'javascript']},
        {'name': 'TestRail', 'officialUrl': 'https://www.testrail.com', 'description': 'Test management and reporting platform', 'tags': ['testing', 'qa', 'reporting']},
        {'name': 'JUnit', 'officialUrl': 'https://junit.org', 'description': 'Java unit testing framework', 'tags': ['testing', 'java', 'unit-test']}
    ],
    'video-audio': [
        {'name': 'FFmpeg', 'officialUrl': 'https://ffmpeg.org', 'description': 'Open-source multimedia framework', 'tags': ['video', 'audio', 'open-source']},
        {'name': 'OBS Studio', 'officialUrl': 'https://obsproject.com', 'description': 'Open-source live streaming and recording software', 'tags': ['video', 'streaming', 'open-source']},
        {'name': 'Adobe Creative Cloud', 'officialUrl': 'https://www.adobe.com/creativecloud.html', 'description': 'Professional video and audio editing suite', 'tags': ['video', 'audio', 'adobe']},
        {'name': 'DaVinci Resolve', 'officialUrl': 'https://www.blackmagicdesign.com/products/davinciresolve/', 'description': 'Professional video editing and color grading', 'tags': ['video', 'editing']}
    ],
    'blockchain': [
        {'name': 'Ethereum', 'officialUrl': 'https://ethereum.org', 'description': 'Decentralized platform for smart contracts', 'tags': ['blockchain', 'cryptocurrency']},
        {'name': 'Bitcoin', 'officialUrl': 'https://bitcoin.org', 'description': 'Peer-to-peer cryptocurrency network', 'tags': ['blockchain', 'cryptocurrency']},
        {'name': 'Solana', 'officialUrl': 'https://solana.com', 'description': 'High-performance blockchain platform', 'tags': ['blockchain', 'cryptocurrency']},
        {'name': 'Polkadot', 'officialUrl': 'https://polkadot.network', 'description': 'Heterogeneous multi-chain framework', 'tags': ['blockchain', 'network']}
    ],
    'supply-chain': [
        {'name': 'SAP S/4HANA', 'officialUrl': 'https://www.sap.com/products/s4hana.html', 'description': 'Enterprise resource planning for supply chain', 'tags': ['supply-chain', 'erp', 'enterprise']},
        {'name': 'Oracle NetSuite', 'officialUrl': 'https://www.netsuite.com', 'description': 'Cloud ERP with supply chain management', 'tags': ['supply-chain', 'erp', 'cloud']},
        {'name': 'Infor', 'officialUrl': 'https://www.infor.com', 'description': 'Supply chain and manufacturing software', 'tags': ['supply-chain', 'manufacturing']},
        {'name': 'Kinaxis', 'officialUrl': 'https://www.kinaxis.com', 'description': 'Supply chain planning and visibility platform', 'tags': ['supply-chain', 'planning']}
    ],
    'low-code': [
        {'name': 'Microsoft Power Platform', 'officialUrl': 'https://powerplatform.microsoft.com', 'description': 'Low-code platform for business applications', 'tags': ['low-code', 'microsoft']},
        {'name': 'OutSystems', 'officialUrl': 'https://www.outsystems.com', 'description': 'Low-code application development platform', 'tags': ['low-code', 'development']},
        {'name': 'Mendix', 'officialUrl': 'https://www.mendix.com', 'description': 'Low-code application development platform', 'tags': ['low-code', 'development']},
        {'name': 'Appian', 'officialUrl': 'https://appian.com', 'description': 'Low-code platform for business process automation', 'tags': ['low-code', 'bpa']}
    ]
}

by_id = {c['id']: c for c in data['categories']}
for cat_id, tools in additional_tools.items():
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

print('✓ Added more verified industry-standard tools')
print('categories=', len(data['categories']))
total_tools = sum(len(c['tools']) for c in data['categories'])
print('total tools=', total_tools)
print('average tools per category=', round(total_tools / len(data['categories']), 1))

# Show final distribution
low = sorted([(c['id'], len(c['tools'])) for c in data['categories']], key=lambda x: x[1])
print('\nFinal tool distribution:')
print(f'  Minimum: {low[0][1]} tools')
print(f'  Maximum: {low[-1][1]} tools')
print(f'  Categories with 4-5 tools: {sum(1 for _, cnt in low if cnt <= 5)}')
print(f'  Categories with 6+ tools: {sum(1 for _, cnt in low if cnt >= 6)}')
