-- Dev/demo passwords for seeded users after moving auth into Postgres.
-- Default password for all three accounts: password123

update users
set
  password_hash = case email
    when 'admin@linchpinstudio.in' then 'pbkdf2$210000$dev-admin$j5DQ4YBZEl-8df7Ljgx3wC-55D_3ASrSjK29asp8iso'
    when 'priya@spicebowl.in' then 'pbkdf2$210000$dev-priya$63pjyeJrTnVTLuQvZzRYrr-Dy6AjsAuIjjXZRPeJwgs'
    when 'rahul@bytebrew.in' then 'pbkdf2$210000$dev-rahul$9x6C_5fARl970lNk8CJmhWHsDLfHvTPo2w0_QOOE6Vw'
  end,
  password_set_at = now()
where email in (
  'admin@linchpinstudio.in',
  'priya@spicebowl.in',
  'rahul@bytebrew.in'
);
