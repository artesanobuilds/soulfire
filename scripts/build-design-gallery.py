from pathlib import Path
import base64

root = Path(__file__).resolve().parent.parent
p = root / 'docs/design/review'
files = sorted(p.glob('*.png'))
html = '''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>soulfire — POC One design review</title><style>body{font:16px/1.6 Arial;background:#fdf8ef;color:#292c28;margin:40px}h1,h2{font-family:Georgia;color:#2e483d}nav{display:flex;flex-wrap:wrap;gap:14px}a{color:#4c6456}section{margin:50px 0}img{max-width:100%;height:auto;border:1px solid #d8ddd1}.mobile{max-width:390px}</style><h1>soulfire · Proof of Concept One</h1><p>Revised design checkpoint — actual browser captures at 1440px desktop and 390px mobile. Example practices are labeled. Loading, service-error and microphone-denial captures use simulations, explicitly marked in their names. No live model/audio success is represented.</p><p>Review refinements incorporated: setup state beside composer and voice controls, automatically expanding action/response fields, and explicit dialog keyboard focus trapping/restoration. The selected sage/ivory direction remains unchanged.</p><p>Flow: invitation → principle → editable practice → optional quiet → explicit sharing → small action. Four distinct journey examples; all twelve steps visible. Current local preview: http://127.0.0.1:3100. Live AI/voice still needs authorized setup.</p><nav>'''
for f in files:
    html += f'<a href="#{f.stem}">{f.stem}</a>'
html += '</nav>'
for f in files:
    css = 'mobile' if 'mobile' in f.stem else 'desktop'
    html += f'<section id="{f.stem}"><h2>{f.stem}</h2><img class="{css}" src="{f.name}" alt="{f.stem.replace("-", " ")}"></section>'
html += '</html>'
(p / 'index.html').write_text(html)
for f in files:
    html = html.replace(f'src="{f.name}"', 'src="data:image/png;base64,' + base64.b64encode(f.read_bytes()).decode() + '"')
(p / 'soulfire-design-review.html').write_text(html)
print(f'{len(files)} screenshots in both linked and self-contained galleries')
