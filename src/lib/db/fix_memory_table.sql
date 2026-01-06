-- Run this in your Supabase SQL Editor

-- 1. Create the table
CREATE TABLE IF NOT EXISTS public.user_memory (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL,
    content text NOT NULL,
    tags jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 2. Add foreign key to auth.users (if not implicit in your setup, usually good practice)
-- referencing public.user table as per schema.ts
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_memory_user_id_user_id_fk') THEN
        ALTER TABLE public.user_memory
        ADD CONSTRAINT user_memory_user_id_user_id_fk
        FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. Create Index
CREATE INDEX IF NOT EXISTS user_memory_user_id_idx ON public.user_memory (user_id);

-- 4. Enable RLS
ALTER TABLE public.user_memory ENABLE ROW LEVEL SECURITY;

-- 5. Create Policies (Drop existing to ensure clean slate if re-running)
DROP POLICY IF EXISTS "Users can manage own memories" ON public.user_memory;

CREATE POLICY "Users can manage own memories"
ON public.user_memory
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. Grant basic permissions to authenticated users
GRANT ALL ON TABLE public.user_memory TO service_role;
GRANT ALL ON TABLE public.user_memory TO authenticated;
