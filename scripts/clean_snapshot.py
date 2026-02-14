import re

file_path = r"c:/Users/thiag/.gemini/antigravity/scratch/atelie-facil/supabase/schema_snapshot.sql"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove DROP statement
content = re.sub(r'DROP TABLE IF EXISTS "CustomerMeasurements" CASCADE;\n', '', content)

# 2. Remove Table Creation Block
# Matches from "-- CustomerMeasurements (NEW)" down to the end of the indices
# The block ends before "-- Order"
# Regex:
# -- CustomerMeasurements \(NEW\)(.|\n)*?CREATE INDEX "CustomerMeasurements_tenantId_idx".*?;\n
# We need to be careful not to be too greedy.
# The table block ends with two Create Index lines.
table_pattern = r'-- CustomerMeasurements \(NEW\)\nCREATE TABLE "CustomerMeasurements" \((.|\n)*?\);\nCREATE INDEX "CustomerMeasurements_customerId_idx".*?;\nCREATE INDEX "CustomerMeasurements_tenantId_idx".*?;\n'
content = re.sub(table_pattern, '', content)

# 3. Remove Enable RLS
content = re.sub(r'ALTER TABLE "CustomerMeasurements" ENABLE ROW LEVEL SECURITY;\n', '', content)

# 4. Remove Policy
# -- CustomerMeasurements
# CREATE POLICY ...
policy_pattern = r'-- CustomerMeasurements\nCREATE POLICY "Tenant isolation for CustomerMeasurements" ON "CustomerMeasurements"\n  USING \("tenantId" = get_current_tenant_id\(\)\)\n  WITH CHECK \("tenantId" = get_current_tenant_id\(\)\);\n'
content = re.sub(policy_pattern, '', content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully cleaned up schema_snapshot.sql")
