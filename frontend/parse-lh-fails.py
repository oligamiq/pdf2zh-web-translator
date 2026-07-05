import json

with open('/srv/pdf2zh-web/v2/frontend/lighthouse.json') as f:
    data = json.load(f)

for k, v in data['audits'].items():
    if v.get('score') is not None and v.get('score') < 1.0:
        print(f"Audit {k}: score {v.get('score')}, display {v.get('displayValue')}")
