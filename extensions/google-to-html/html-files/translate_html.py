import re
import os
from bs4 import BeautifulSoup

INPUT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(INPUT_DIR, 'cleaned')

if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

html_files = [f for f in os.listdir(INPUT_DIR) if f.lower().endswith('.html')]

for filename in html_files:
    input_path = os.path.join(INPUT_DIR, filename)
    output_path = os.path.join(OUTPUT_DIR, filename)
    with open(input_path, 'r', encoding='utf-8') as f:
        html = f.read()

    soup = BeautifulSoup(html, 'html.parser')

    # Remove the first paragraph (TOC title)
    first_p = soup.find('p')
    if first_p and 'Article 1' in first_p.text:
        first_p.decompose()

    # Convert blockquotes to indented paragraphs
    for bq in soup.find_all('blockquote'):
        depth = 1  # Default indentation level
        parent = bq.parent
        while parent:
            if parent.name == 'blockquote':
                depth += 1
            parent = parent.parent
        for child in list(bq.children):
            if getattr(child, 'name', None) == 'p':
                indent = 40 * depth
                child['style'] = f'padding-left: {indent}px;'
                bq.insert_before(child)
        bq.decompose()

    # Convert section headings to h2 (remove <strong> inside <h2>)
    for p in soup.find_all('p'):
        strong = p.find('strong')
        if strong and re.match(r'\d+\.\d+|\d+\.\d+', strong.get_text(strip=True)):
            h2 = soup.new_tag('h2')
            h2.string = strong.get_text(strip=True)
            p.replace_with(h2)

    # Clean up formatting of tables
    for table in soup.find_all('table'):
        if 'style' in table.attrs:
            del table['style']
        if 'border' in table.attrs:
            del table['border']
        for tag in table.find_all(['thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'colgroup', 'col']):
            if 'style' in tag.attrs:
                del tag['style']
            if tag.name in ['th', 'td'] and 'style' in tag.attrs:
                del tag['style']
            if tag.name == 'th' and 'scope' in tag.attrs:
                del tag['scope']
            # Remove span color styling, keep text only
            if tag.name == 'span':
                tag.attrs = {}
        # Set blank td background color
        for td in table.find_all('td'):
            is_blank = (len(td.get_text(strip=True)) == 0) and (len(td.find_all()) == 0)
            if is_blank:
                td['style'] = 'background-color: #D9D9D9;'

    # Add caption to tables that are missing it
    for table in soup.find_all('table'):
        if not table.find('caption'):
            caption = soup.new_tag('caption')
            caption.string = 'Caption'
            table.insert(0, caption)

    # Remove empty paragraphs
    for p in soup.find_all('p'):
        if len(p.get_text(strip=True)) == 0:
            p.decompose()

    # Write the transformed HTML
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(str(soup))
    print(f"Processed {input_path} -> {output_path}")
