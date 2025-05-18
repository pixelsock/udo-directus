import os
import requests

# CONFIGURE THESE
DIRECTUS_API = 'http://localhost:8055/google-docs-to-html-endpoint/upload'  # Change port if needed
DOCX_DIR = '../docx'  # relative to script location
OUTPUT_DIR = './'     # save HTML files in current directory

for filename in os.listdir(DOCX_DIR):
    if filename.endswith('.docx'):
        docx_path = os.path.join(DOCX_DIR, filename)
        print(f'Uploading {filename}...')
        with open(docx_path, 'rb') as f:
            files = {'file': (filename, f, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')}
            resp = requests.post(DIRECTUS_API, files=files)
        if resp.ok:
            html = resp.json().get('data', {}).get('html')
            if html:
                out_name = os.path.splitext(filename)[0] + '.html'
                out_path = os.path.join(OUTPUT_DIR, out_name)
                with open(out_path, 'w', encoding='utf-8') as outf:
                    outf.write(html)
                print(f'Saved {out_name}')
            else:
                print(f'No HTML returned for {filename}')
        else:
            print(f'Failed to convert {filename}: {resp.status_code} {resp.text}')