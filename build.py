# Joins the source pieces into index.html, app.js and sw.js. Run: python3 build.py
import hashlib, os, re
H = os.path.dirname(os.path.abspath(__file__)); r = lambda f: open(os.path.join(H, f), encoding='utf8').read()
stars_flag = '''const stars = n => `<svg aria-hidden="true" style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 390 470">${[[40,70],[90,40],[180,30],[250,60],[300,140],[60,150],[370,40],[140,120]].slice(0,n).map(([x,y])=>`<circle cx="${x}" cy="${y}" r="1.4" fill="#C9D6FF"/>`).join('')}</svg>`;
const flag = t => (t.place||'').trim().toLowerCase()==='lisbon'?`<svg class="flag" viewBox="0 0 24 24" aria-hidden="true"><rect width="10" height="24" fill="#046A38"/><rect x="10" width="14" height="24" fill="#DA291C"/><circle cx="10" cy="12" r="3.8" fill="#FFE000"/></svg>`:`<span class="flag" aria-hidden="true">${esc(((t.place||'?')[0]||'?').toUpperCase())}</span>`;
'''
app = '{\n' + r('_scenes.js') + stars_flag + r('_avatar.js') + r('_main.js') + '\n}\n'
ver = hashlib.sha1((app + r('api.js') + r('_style.css') + r('_extra.css')).encode()).hexdigest()[:8]
app = f"window.BAGSY_VERSION='{ver}';\n" + app
open(os.path.join(H, 'app.js'), 'w', encoding='utf8').write(app)
open(os.path.join(H, 'index.html'), 'w', encoding='utf8').write(r('index.tpl.html').replace('/*STYLE*/', r('_style.css') + r('_extra.css')))
open(os.path.join(H, 'sw.js'), 'w', encoding='utf8').write(r('sw.tpl.js').replace('__VERSION__', ver))
print('built', ver)
