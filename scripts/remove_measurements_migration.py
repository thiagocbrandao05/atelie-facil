import os

file_path = r"c:/Users/thiag/.gemini/antigravity/scratch/atelie-facil/supabase/migrations/20260211000000_init_v2.sql"

start_marker = "-- Original Migration: 20260205000002_customer_measurements.sql"
end_marker = "-- Original Migration: 20260206000002_add_discounts.sql"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Markers not found!")
    print(f"Start found: {start_idx != -1}")
    print(f"End found: {end_idx != -1}")
    exit(1)

# Keep the end marker line, remove everything before it up to start marker
new_content = content[:start_idx] + content[end_idx:]

# Remove the delimiter line of start marker + preceding line if it's separator
# Actually the slice `content[:start_idx]` keeps everything BEFORE the start marker.
# `content[end_idx:]` keeps the end marker AND everything after.
# This effecitvely removes the block in between.

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Successfully removed Customer Measurements section.")
