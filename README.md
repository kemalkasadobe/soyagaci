# Soy Agaci

Next.js + Supabase ile calisan minimum aile soy agaci uygulamasi.

## Ortam Degiskenleri

Vercel ve lokal ortamda su degiskenleri tanimli olmalidir:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Supabase people Tablosu

Supabase SQL Editor icinde minimum tablo:

```sql
create table if not exists public.people (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null,
  birth_date date,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.people enable row level security;

create policy "Anyone can read people"
on public.people for select
to anon, authenticated
using (true);

create policy "Users can insert own people"
on public.people for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own people"
on public.people for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own people"
on public.people for delete
to authenticated
using (auth.uid() = user_id);
```

## Calistirma

```bash
pnpm install
pnpm dev
```

Build kontrolu:

```bash
pnpm build
```
