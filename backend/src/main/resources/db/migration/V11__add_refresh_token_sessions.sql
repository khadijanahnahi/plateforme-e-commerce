create table if not exists refresh_token_sessions (
    id bigserial primary key,
    user_id bigint not null references users(id) on delete cascade,
    token_hash varchar(64) not null unique,
    expires_at timestamp not null,
    revoked_at timestamp null,
    created_at timestamp not null,
    updated_at timestamp not null
);

create index if not exists idx_refresh_token_sessions_user_id on refresh_token_sessions(user_id);
create index if not exists idx_refresh_token_sessions_expires_at on refresh_token_sessions(expires_at);
