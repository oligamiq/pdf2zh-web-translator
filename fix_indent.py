import re

with open('pc-api-python/main.py', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if line.startswith("                        try:") and i > 500:
        lines[i] = "                            try:\n"

with open('pc-api-python/main.py', 'w') as f:
    f.writelines(lines)
