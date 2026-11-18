create table if not exists public.user_books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  progress smallint not null default 0 check (progress between 0 and 100),
  modified_at timestamptz not null default now(),
  course jsonb not null
);

create index if not exists user_books_user_modified_idx
  on public.user_books (user_id, modified_at desc);

alter table public.user_books enable row level security;

drop policy if exists "Users manage their own books" on public.user_books;
create policy "Users manage their own books"
  on public.user_books
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
