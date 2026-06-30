# Soy Agaci

Next.js + Supabase ile calisan minimum aile soy agaci uygulamasi.

## Giris Modeli

- Ziyaretciler ad soyad yazar ve soy agacini gorur.
- Ana yonetici: `kemalkasadobe@gmail.com`
- Editorler Supabase Auth kullanicisi olarak email + sifre ile girer.
- Magic link/email OTP kullanilmaz; boylece Supabase email rate limit'e takilmaz.

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

create policy "Main admin can insert people"
on public.people for insert
to authenticated
with check ((auth.jwt() ->> 'email') = 'kemalkasadobe@gmail.com');

create policy "Authenticated users can update people notes"
on public.people for update
to authenticated
using (true)
with check (true);

create policy "Main admin can delete people"
on public.people for delete
to authenticated
using ((auth.jwt() ->> 'email') = 'kemalkasadobe@gmail.com');
```

Editorlerin yalnizca `notes` kolonunu guncelleyebilmesi icin ek guvenlik:

```sql
revoke update on public.people from authenticated;
grant update (notes) on public.people to authenticated;
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
