-- Allow administrators to restore the original letter-page experience.
alter table public.letters
  drop constraint if exists letters_letter_theme_check;

alter table public.letters
  add constraint letters_letter_theme_check
  check (letter_theme in ('romance','family','birthday','sympathy','friendship','graduation','original'));
