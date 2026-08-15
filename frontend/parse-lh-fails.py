import json
from pathlib import Path

with open(Path(__file__).with_name('lighthouse.json')) as f:
    data = json.load(f)

for k, v in data['audits'].items():
    if v.get('score') is not None and v.get('score') < 1.0:
        print(f"Audit {k}: score {v.get('score')}, display {v.get('displayValue')}")
