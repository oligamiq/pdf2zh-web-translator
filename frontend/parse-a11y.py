import json
from pathlib import Path
import sys

def main():
    with open(Path(__file__).with_name('lh-a11y-dev.json')) as f:
        data = json.load(f)
    
    score = data.get('categories', {}).get('accessibility', {}).get('score')
    print(f"Overall Accessibility Score: {score * 100 if score else 0}")

    audits = data.get('audits', {})
    for k, v in audits.items():
        if data.get('categories', {}).get('accessibility', {}).get('auditRefs'):
            acc_refs = [ref['id'] for ref in data['categories']['accessibility']['auditRefs']]
            if k in acc_refs:
                if v.get('score') is not None and v.get('score') < 1.0:
                    print(f"\nAudit: {k} (Score: {v.get('score')})")
                    print(f"Title: {v.get('title')}")
                    print(f"Description: {v.get('description')}")
                    if 'details' in v and 'items' in v['details']:
                        for item in v['details']['items']:
                            node = item.get('node', {})
                            print(f"  Element: {node.get('snippet')}")
                            print(f"  Selector: {node.get('selector')}")

if __name__ == "__main__":
    main()
