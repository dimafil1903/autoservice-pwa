#!/usr/bin/env python3
import os

admin_script_url = os.environ.get('ADMIN_SCRIPT_URL', '')
template_sheet_id = os.environ.get('TEMPLATE_SHEET_ID', '')
admin_password = os.environ.get('ADMIN_PASSWORD', '')

config = f"""const CONFIG = {{
  ADMIN_SCRIPT_URL: '{admin_script_url}',
  TEMPLATE_SHEET_ID: '{template_sheet_id}',
  PWA_URL: 'https://dimafil1903.github.io/autoservice-pwa/',
  APP_VERSION: '1.0.0',
  ADMIN_PASSWORD: '{admin_password}'
}};
"""

with open('config.js', 'w') as f:
    f.write(config)

print("✅ config.js written")
print(f"  ADMIN_SCRIPT_URL: {'SET' if admin_script_url else 'EMPTY'}")
print(f"  TEMPLATE_SHEET_ID: {'SET' if template_sheet_id else 'EMPTY'}")
print(f"  ADMIN_PASSWORD: {'SET' if admin_password else 'EMPTY'}")
