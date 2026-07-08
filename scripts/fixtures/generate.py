from reportlab.platypus import SimpleDocTemplate, Paragraph
from reportlab.lib.styles import getSampleStyleSheet
import os

os.makedirs("scripts/fixtures", exist_ok=True)
doc = SimpleDocTemplate("scripts/fixtures/smoke-paragraph.pdf")
styles = getSampleStyleSheet()
style = styles["Normal"]

with open("scripts/fixtures/smoke-paragraph.md", "r") as f:
    text = f.read().strip()

p = Paragraph(text, style)
doc.build([p])
print("Generated scripts/fixtures/smoke-paragraph.pdf")
