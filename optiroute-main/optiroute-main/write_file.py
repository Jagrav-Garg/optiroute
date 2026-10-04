import sys, base64

if len(sys.argv) < 3:
    print('Usage: python3 write_file.py <target_path> <base64_content>')
    sys.exit(1)

target_path = sys.argv[1]
b64_content = sys.argv[2]
content = base64.b64decode(b64_content).decode('utf-8')

with open(target_path, 'w', encoding='utf-8') as f:
    f.write(content)

print(f'Wrote {len(content)} chars to {target_path}')
