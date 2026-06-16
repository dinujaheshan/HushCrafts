import re

path = r'C:\Users\user\.gemini\antigravity-ide\brain\b06f2634-7adc-48ec-8c61-922da9af403c\.system_generated\logs\transcript.jsonl'

try:
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    urls = set(re.findall(r'https://res\.cloudinary\.com/[^\s"\'\}\\]+', content))
    
    for url in sorted(urls):
        print(url)
except Exception as e:
    print("Error:", e)
