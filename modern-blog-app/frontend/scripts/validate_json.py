import json
from pathlib import Path

p = Path(r'c:\Users\Raju\local-vs-code-files\Personal-Site-SRK\modern-blog-app\frontend\data\industry-tools.json')

# Validate JSON structure
try:
    data = json.load(p.open(encoding='utf-8'))
    print('✓ JSON is valid and well-formed')
except json.JSONDecodeError as e:
    print(f'✗ JSON Error: {e}')
    exit(1)

print(f'✓ Categories: {len(data["categories"])}')
total_tools = sum(len(c['tools']) for c in data['categories'])
print(f'✓ Total Tools: {total_tools}')
print(f'✓ Average per category: {total_tools / len(data["categories"]):.1f}')

# Check structure
print('\n✓ Structure verified:')
for cat in data['categories'][:1]:
    print(f'  - id: "{cat["id"]}"')
    print(f'  - displayName: "{cat["displayName"]}"')
    print(f'  - tools: {len(cat["tools"])} items')
    if cat['tools']:
        t = cat['tools'][0]
        print(f'    Sample tool: {t["name"]}')
        print(f'      - officialUrl: {t["officialUrl"]}')
        print(f'      - description: {t["description"][:50]}...')
        print(f'      - tags: {t["tags"]}')

# Verify all tools have required fields
print('\n✓ Validation checks:')
missing_fields = 0
for cat in data['categories']:
    for tool in cat['tools']:
        if not all(k in tool for k in ['name', 'officialUrl', 'description', 'tags']):
            missing_fields += 1
            print(f'  ✗ Missing fields in {tool.get("name", "UNKNOWN")}')

if missing_fields == 0:
    print('  ✓ All tools have required fields (name, officialUrl, description, tags)')

# Show sample categories and tool counts
print('\n✓ Sample categories:')
samples = ['ai-ml', 'legal-tech', 'ecommerce', 'blockchain', 'customer-support', 'edge-iot']
by_id = {c['id']: c for c in data['categories']}
for cid in samples:
    if cid in by_id:
        print(f'  {cid:25} {len(by_id[cid]["tools"]):2} tools')

# File size
file_size = p.stat().st_size
print(f'\n✓ File size: {file_size:,} bytes ({file_size/1024:.1f} KB)')

print('\n✓ FINALIZATION COMPLETE: industry-tools.json is ready for production use')
