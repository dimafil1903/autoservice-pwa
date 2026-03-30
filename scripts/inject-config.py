#!/usr/bin/env python3
import os

supabase_url      = os.environ.get('SUPABASE_URL', '')
supabase_anon_key = os.environ.get('SUPABASE_ANON_KEY', '')
admin_password    = os.environ.get('ADMIN_PASSWORD', '')

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

print("✅ config.js written")
print(f"  SUPABASE_URL: {'SET' if supabase_url else 'EMPTY'}")
print(f"  SUPABASE_ANON_KEY: {'SET' if supabase_anon_key else 'EMPTY'}")
print(f"  ADMIN_PASSWORD: {'SET' if admin_password else 'EMPTY'}")
