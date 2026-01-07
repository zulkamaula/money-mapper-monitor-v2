-- filename: server/db/schema.sql
-- Updated for Clerk compatibility: using TEXT for IDs instead of UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE public.users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.money_books (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.pockets (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  money_book_id TEXT NOT NULL REFERENCES public.money_books(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  percentage NUMERIC(5,2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  order_index INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.allocations (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  money_book_id TEXT NOT NULL REFERENCES public.money_books(id) ON DELETE CASCADE,
  source_amount BIGINT NOT NULL CHECK (source_amount >= 0),
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.allocation_items (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  allocation_id TEXT NOT NULL REFERENCES public.allocations(id) ON DELETE CASCADE,
  pocket_id TEXT NOT NULL REFERENCES public.pockets(id) ON DELETE CASCADE,
  pocket_name TEXT NOT NULL,
  pocket_percentage NUMERIC(5,2) NOT NULL CHECK (pocket_percentage >= 0),
  amount BIGINT NOT NULL CHECK (amount >= 0)
);

CREATE INDEX IF NOT EXISTS idx_books_user ON public.money_books(user_id);
CREATE INDEX IF NOT EXISTS idx_pockets_book ON public.pockets(money_book_id, order_index);
CREATE INDEX IF NOT EXISTS idx_alloc_book_date ON public.allocations(money_book_id, date);
CREATE INDEX IF NOT EXISTS idx_items_alloc_pocket ON public.allocation_items(allocation_id, pocket_id);
