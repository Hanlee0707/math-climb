# Builds canvas/index.html from src.html + readalong.css (the Read Along stylesheet) + graph.js (the baked
# Learning Commons map). The hop key stays a placeholder here; the upload step swaps it in.
import os
here = os.path.dirname(os.path.abspath(__file__))
r = lambda p: open(os.path.join(here, p), encoding='utf-8').read()
out = r('src.html').replace('/*__READALONG_CSS__*/', r('readalong.css')).replace('/*__GRAPH__*/', r('graph.js'))
assert '__READALONG' not in out and '__GRAPH__' not in out
open(os.path.join(here, 'index.html'), 'w', encoding='utf-8').write(out)
print(len(out.encode('utf-8')), 'bytes')
