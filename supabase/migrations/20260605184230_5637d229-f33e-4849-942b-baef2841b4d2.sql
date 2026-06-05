
UPDATE public.properties SET title = regexp_replace(title, 'boutique', 'Exclusivo', 'gi'), description = regexp_replace(description, 'boutique', 'exclusivo', 'gi') WHERE title ILIKE '%boutique%' OR description ILIKE '%boutique%';
UPDATE public.launches SET name = regexp_replace(name, 'boutique', 'Exclusivo', 'gi'), description = regexp_replace(description, 'boutique', 'exclusivo', 'gi') WHERE name ILIKE '%boutique%' OR description ILIKE '%boutique%';
UPDATE public.posts SET title = regexp_replace(title, 'boutique', 'exclusivo', 'gi'), excerpt = regexp_replace(coalesce(excerpt,''), 'boutique', 'exclusivo', 'gi'), content = regexp_replace(coalesce(content,''), 'boutique', 'exclusivo', 'gi') WHERE title ILIKE '%boutique%' OR excerpt ILIKE '%boutique%' OR content ILIKE '%boutique%';
