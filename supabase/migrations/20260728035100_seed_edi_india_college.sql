-- The seeded college list covered 65 institutions but omitted EDI, so students
-- signing up with an @ediindia.org address were never auto-verified.
insert into public.colleges (name, slug, domain)
values ('Entrepreneurship Development Institute of India', 'edi-india', 'ediindia.org')
on conflict do nothing;
