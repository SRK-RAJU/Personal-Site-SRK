import re
names = set()
with open('if0_35679115_wp1.sql','r',encoding='utf-8',errors='ignore') as f:
    for line in f:
        m = re.search(r"CREATE TABLE `([^`]+)`", line)
        if m:
            names.add(m.group(1))
for n in sorted(names):
    print(n)
print('\nTotal tables:', len(names))
