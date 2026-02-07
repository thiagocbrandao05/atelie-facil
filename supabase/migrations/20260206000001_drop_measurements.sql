-- Drop the customer_measurements table as per user request
DROP TABLE IF EXISTS "CustomerMeasurement" CASCADE;

-- Revalidate paths will be handled by server actions if necessary, 
-- but this migration removes the schema reference.
