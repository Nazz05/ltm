import re, urllib.request
from pathlib import Path
p = Path('src/data/products.js').read_text(encoding='utf-8')
urls = re.findall(r'https://images\.unsplash\.com[^"\']+', p)
print('found', len(urls), 'urls')
uniq = sorted(set(urls))
print('checking', len(uniq))
for url in uniq:
    try:
        req = urllib.request.Request(url, headers={'User-Agent':'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=15) as resp:
            print(resp.status, url)
    except Exception as e:
        print('ERR', url, e)
