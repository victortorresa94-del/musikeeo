# Mete las láminas de rentabilidad antes del cierre (quitando las de ronda/fondos de antes) y numera todo
import re
d = open('presentacion.html').read()
fin = '<!-- 15 · Cierre -->'
for marca in ('<!-- F0', '<!-- R0'):
    if marca in d:
        d = d[:d.index(marca)] + d[d.index(fin):]
if '<!-- 14 · La ronda -->' in d:
    d = d[:d.index('<!-- 14 · La ronda -->')] + d[d.index(fin):]
d = d.replace(fin, open('rentable.html').read() + '\n\n' + fin)
partes = re.split(r'(?=<section )', d); n = 0; out = []
for sec in partes:
    if sec.startswith('<section '):
        n += 1
        sec = re.sub(r'(<div class="pie">.*?<span>[^<]*?)(\d+)(</span></div>)', lambda m: m.group(1) + str(n) + m.group(3), sec, count=1, flags=re.S)
    out.append(sec)
open('presentacion.html', 'w').write(''.join(out)); print(n, 'láminas')
