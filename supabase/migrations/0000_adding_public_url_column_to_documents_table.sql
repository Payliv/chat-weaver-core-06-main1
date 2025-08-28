ALTER TABLE public.documents
ADD COLUMN public_url TEXT;

-- Optional: If you want to backfill existing documents with public URLs
-- This requires a service role key and might take time for many files.
-- You can run this manually in Supabase SQL Editor if needed.
-- DO NOT RUN THIS IN PRODUCTION WITHOUT CAREFUL CONSIDERATION.
-- UPDATE public.documents
-- SET public_url = 'https://jeurznrjcohqbevrzses.supabase.co/storage/v1/object/public/documents/' || storage_path
-- WHERE public_url IS NULL;