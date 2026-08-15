import json
from pathlib import Path

with open(Path(__file__).with_name('lighthouse.json')) as f:
    data = json.load(f)

# Unused CSS
unused_css = data['audits'].get('unused-css-rules', {})
print(f"Unused CSS savings: {unused_css.get('displayValue')}")
print(f"Unused CSS raw score: {unused_css.get('score')}")
if 'details' in unused_css and 'items' in unused_css['details']:
    for item in unused_css['details']['items']:
        print(f"  {item.get('url')} - waste: {item.get('wastedBytes')} bytes")

# Forced Reflow / mainthread work breakdown
# Or maybe there is a forced-reflow diagnostic?
# Let's search for layout thrashing
thrashing = data['audits'].get('layout-thrashing', {})
if not thrashing or not thrashing.get('details'):
    # try other metrics
    for audit_name, audit_data in data['audits'].items():
        if 'reflow' in audit_name.lower() or 'thrashing' in audit_name.lower():
            print(f"Found audit: {audit_name}: {audit_data.get('displayValue')}")
            
# Let's check diagnostics for layout
diagnostics = data['audits'].get('diagnostics', {})
if 'details' in diagnostics and 'items' in diagnostics['details']:
    for item in diagnostics['details']['items']:
        print(f"Diagnostics: {item}")
