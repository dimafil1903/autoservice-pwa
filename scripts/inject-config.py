#!/usr/bin/env python3
import os

supabase_url      = os.environ.get('SUPABASE_URL', '')
supabase_anon_key = os.environ.get('SUPABASE_ANON_KEY', '')
admin_password    = os.environ.get('ADMIN_PASSWORD', '')

# ⚠️ Service key ніколи не потрапляє в браузер
config = f"""const CONFIG = {{
  SUPABASE_URL: '{supabase_url}',
  SUPABASE_ANON_KEY: '{supabase_anon_key}',
  PWA_URL: 'https://dimafil1903.github.io/autoservice-pwa/',
  APP_VERSION: '1.0.0',
  ADMIN_PASSWORD: '{admin_password}'
}};
"""

with open('config.js', 'w') as f:
    f.write(config)

print("✅ config.js written (no service key)")
