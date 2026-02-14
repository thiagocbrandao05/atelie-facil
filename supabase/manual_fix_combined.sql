
DO $$
BEGIN
    -- 1. Ensure 'colors' column exists
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'Material'
        AND column_name = 'colors'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE "Material" ADD COLUMN "colors" TEXT;
    END IF;

    -- 2. Ensure 'cost' column allows NULL values
    ALTER TABLE "Material" ALTER COLUMN "cost" DROP NOT NULL;
    ALTER TABLE "Material" ALTER COLUMN "cost" SET DEFAULT NULL;

END $$;
