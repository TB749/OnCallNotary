CREATE TABLE IF NOT EXISTS requests (
 id TEXT PRIMARY KEY, access_hash TEXT NOT NULL, idempotency_key TEXT NOT NULL UNIQUE,
 input_hash TEXT NOT NULL, kind TEXT NOT NULL, payload TEXT NOT NULL, quote TEXT,
 status TEXT NOT NULL DEFAULT 'requested', payment_status TEXT NOT NULL DEFAULT 'unpaid',
 created_at TEXT NOT NULL, confirmed_at TEXT, starts_at TEXT, ends_at TEXT,
 final_quote TEXT, email_status TEXT NOT NULL DEFAULT 'pending'
);
CREATE TABLE IF NOT EXISTS reservations (
 request_id TEXT PRIMARY KEY REFERENCES requests(id), starts_at TEXT NOT NULL, ends_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS outbox (
 id TEXT PRIMARY KEY, request_id TEXT NOT NULL, recipient TEXT NOT NULL, subject TEXT NOT NULL,
 body TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', attempts INTEGER NOT NULL DEFAULT 0,
 created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS audit (
 id TEXT PRIMARY KEY, request_id TEXT NOT NULL, action TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL);
