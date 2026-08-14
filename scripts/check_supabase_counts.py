import os
from supabase import create_client

SUPABASE_URL = "https://lymjjozpdsdoloahsyey.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5bWpqb3pwZHNkb2xvYWhzeWV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODgxMDQsImV4cCI6MjA4NjU2NDEwNH0.dC2d16T0DHt67rDr4RFuTU4hg79vxj0YUGf91xdxdBs"
SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

def check_count(key, label):
    try:
        sb = create_client(SUPABASE_URL, key)
        res = sb.table("groups").select("id", count="exact").execute()
        print(f"{label} count: {res.count}")
    except Exception as e:
        print(f"Error with {label}: {e}")

print("Checking Supabase Counts...")
check_count(ANON_KEY, "ANON_KEY")
if SERVICE_KEY:
    check_count(SERVICE_KEY, "SERVICE_KEY")
else:
    print("SERVICE_KEY not found in environment.")
