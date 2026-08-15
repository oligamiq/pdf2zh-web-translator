import json
from pathlib import Path

with open(Path(__file__).with_name('lh-a11y-dev.json')) as f:
    data = json.load(f)

score = data['categories']['accessibility']['score']
print("Score:", score)

# get audits that are in accessibility category
acc_refs = [ref['id'] for ref in data['categories']['accessibility']['auditRefs']]
audits = {k: {"score": v.get("score"), "title": v.get("title")} for k, v in data['audits'].items() if k in acc_refs and v.get("score") is not None and v.get("score") < 1.0}

print("Failed Audits:", json.dumps(audits, indent=2))
