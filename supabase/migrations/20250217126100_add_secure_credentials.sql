-- Create secure credentials table with encryption
create table credentials (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  service varchar not null,
  encrypted_data text not null,
  encryption_iv text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  last_used_at timestamptz,
  metadata jsonb default '{}'::jsonb,
  unique(user_id, service)
);

-- Enable RLS
alter table credentials enable row level security;

-- Policies
create policy "Users can insert their own credentials"
  on credentials for insert
  with check (auth.uid() = user_id);

create policy "Users can view their own credentials"
  on credentials for select
  using (auth.uid() = user_id);

create policy "Users can update their own credentials"
  on credentials for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own credentials"
  on credentials for delete
  using (auth.uid() = user_id);

-- Function to update last_used timestamp
create or replace function update_credentials_last_used()
returns trigger as $$
begin
  new.last_used_at = now();
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to update last_used_at on select
create trigger update_credentials_last_used_trigger
  before update on credentials
  for each row
  execute function update_credentials_last_used();

-- Add credentials_audit table for tracking changes
create table credentials_audit (
  id uuid primary key default uuid_generate_v4(),
  credential_id uuid references credentials(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  action varchar not null,
  performed_at timestamptz default now(),
  ip_address inet,
  user_agent text
);

-- Enable RLS on audit table
alter table credentials_audit enable row level security;

-- Audit policies
create policy "Users can view their own credential audit logs"
  on credentials_audit for select
  using (auth.uid() = user_id);

-- Function to record credential access
create or replace function log_credential_access()
returns trigger as $$
begin
  insert into credentials_audit (credential_id, user_id, action, ip_address, user_agent)
  values (
    new.id,
    new.user_id,
    TG_OP,
    inet_client_addr(),
    current_setting('request.headers')::json->>'user-agent'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Triggers for audit logging
create trigger credentials_audit_insert
  after insert on credentials
  for each row
  execute function log_credential_access();

create trigger credentials_audit_update
  after update on credentials
  for each row
  execute function log_credential_access();

create trigger credentials_audit_delete
  after delete on credentials
  for each row
  execute function log_credential_access();