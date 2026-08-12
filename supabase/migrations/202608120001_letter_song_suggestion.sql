alter table public.letters
  add column if not exists song_suggestion text not null default '';
