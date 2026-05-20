"""
sync_trigger.py
===============
Llama al endpoint /api/sync/winfac despues del sync de DBFs.
Se ejecuta desde sync_completo.bat justo despues de sync_arjun_neon.py.
"""

import urllib.request
import json
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

SYNC_KEY = os.getenv("SYNC_KEY", "")
APP_URL = os.getenv("APP_URL", "https://app-arjun.vercel.app")

while True:
    req = urllib.request.Request(
        f"{APP_URL}/api/sync/winfac",
        headers={"x-sync-key": SYNC_KEY}
    )
    with urllib.request.urlopen(req, timeout=30) as res:
        data = json.loads(res.read())
        print(data)
        if data.get("productos_creados", 0) == 0:
            break
