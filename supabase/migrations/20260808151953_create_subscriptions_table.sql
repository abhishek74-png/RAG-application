create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text,
  price_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add unique constraint to user_id so we can easily upsert by it if needed, or by stripe_customer_id
alter table public.subscriptions add constraint subscriptions_user_id_key unique (user_id);
alter table public.subscriptions add constraint subscriptions_stripe_customer_id_key unique (stripe_customer_id);

alter table public.subscriptions enable row level security;

create policy "Users can view own subscription"
  on public.subscriptions for select
  using ( auth.uid() = user_id );

-- We only allow the service role (webhook) to insert/update.
-- Users cannot modify their own subscriptions directly.