-- Public representative photos only. Never store uploaded menu photos here.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('menu-cutouts','menu-cutouts',true,4000000,array['image/png']) on conflict(id) do nothing;
-- No client write policies: only the server service role uploads processed photos.
