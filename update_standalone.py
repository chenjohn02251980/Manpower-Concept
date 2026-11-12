# -*- coding: utf-8 -*-
with open('generate_standalone_html.py', 'r', encoding='utf-8') as f:
    code = f.read()

# Make sure window.__IEC_EMBEDDED_SITES__ placeholder is in <head>
placeholder_script = '  <script id="iec-embedded-data">window.__IEC_EMBEDDED_SITES__ = null;</script>\n'
if 'window.__IEC_EMBEDDED_SITES__' not in code:
    code = code.replace('</head>', placeholder_script + '</head>')

# In script, check window.__IEC_EMBEDDED_SITES__
init_code_old = """    let currentPlantKey = 'tao';
    let currentTimePeriod = 'MONTHLY'; // MONTHLY | QUARTERLY
    let currentChartType = 'stacked'; // stacked | grouped
    let sites = JSON.parse(JSON.stringify(DEFAULT_SITES));

    // Try loading from localStorage"""

init_code_new = """    let currentPlantKey = 'tao';
    let currentTimePeriod = 'MONTHLY'; // MONTHLY | QUARTERLY
    let currentChartType = 'stacked'; // stacked | grouped
    let sites = JSON.parse(JSON.stringify(DEFAULT_SITES));

    // Support embedded data injection or localStorage
    if (typeof window !== 'undefined' && window.__IEC_EMBEDDED_SITES__) {
      try {
        sites = Object.assign({}, DEFAULT_SITES, window.__IEC_EMBEDDED_SITES__);
      } catch(e) {}
    } else {
      try {
        const saved = localStorage.getItem('ie_standalone_sites_state_v1');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') {
            sites = Object.assign({}, DEFAULT_SITES, parsed);
          }
        }
      } catch(e) {}
    }"""

code = code.replace(init_code_old, init_code_new)

with open('generate_standalone_html.py', 'w', encoding='utf-8') as f:
    f.write(code)

import subprocess
subprocess.run(['python3', 'generate_standalone_html.py'], check=True)
print("Updated and generated successfully!")
