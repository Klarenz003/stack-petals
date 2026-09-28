-- Persist the checkout-selected theme on each private letter.
alter table public.letters
  add column if not exists letter_theme text not null default 'romance';

alter table public.letters
  drop constraint if exists letters_letter_theme_check;

alter table public.letters
  add constraint letters_letter_theme_check
  check (letter_theme in ('romance','family','birthday','sympathy','friendship','graduation'));
