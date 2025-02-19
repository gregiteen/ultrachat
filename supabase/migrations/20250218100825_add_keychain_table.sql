create table if not exists keychain (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  service text not null,
  encrypted boolean default true not null,
  iv integer[] not null,
  encrypted_key integer[] not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  -- Add indexes for common queries
  unique(user_id, service),
  constraint valid_encryption check (
    (encrypted = true and iv is not null and encrypted_key is not null) or
    (encrypted = false and iv is null and encrypted_key is null)
  )
);

-- Add RLS policies
alter table keychain enable row level security;

create policy "Users can view their own keys"
  on keychain for select
  using (auth.uid() = user_id);

create policy "Users can insert their own keys"
  on keychain for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own keys"
  on keychain for update
  using (auth.uid() = user_id);

create policy "Users can delete their own keys"
  on keychain for delete
  using (auth.uid() = user_id);

-- Add updated_at trigger
create trigger set_keychain_updated_at
  before update on keychain
  for each row
  execute function public.set_current_timestamp_updated_at();