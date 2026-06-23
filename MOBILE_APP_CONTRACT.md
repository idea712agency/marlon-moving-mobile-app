# Marlon Moving Services — Mobile App Backend Contract

Use this document in the Codex/Rork mobile project so it talks to the same Lovable Cloud (Supabase) backend that powers marlonmovingservices.com.

## 1. Connection

```
SUPABASE_URL          = https://njdrpgpcyeieynhgnupc.supabase.co
SUPABASE_ANON_KEY     = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qZHJwZ3BjeWVpZXluaGdudXBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNDY0NTIsImV4cCI6MjA3OTkyMjQ1Mn0.X3Zb0lpF3rVs7ZNXu6FE5fqeYhcpFt5yAMWpFBlaycQ
```

Use `@supabase/supabase-js` in the Expo app. The anon key is safe to embed.

## 2. Auth

- Customers sign up / sign in with email + password (and Google later).
- After sign-up, the `handle_new_user` trigger creates a `profiles` row automatically.
- The customer is linked to their move when staff sets `jobs.customer_user_id = <auth.users.id>` in the admin panel.

## 3. Row-Level Security (what the customer can read/write)

| Table                    | SELECT                              | INSERT / UPDATE                          |
|--------------------------|-------------------------------------|------------------------------------------|
| jobs                     | own (customer_user_id)              | UPDATE customer_notes only               |
| invoices                 | own                                 | —                                        |
| documents                | own                                 | UPDATE (signing fields) own              |
| chat_conversations       | own                                 | INSERT own                               |
| chat_messages            | own                                 | INSERT own                               |
| move_inventory           | own                                 | INSERT / UPDATE / DELETE own             |
| move_checklist_items     | own                                 | UPDATE own                               |
| customer_notifications   | own                                 | UPDATE (mark read) own                   |
| reschedule_requests      | own                                 | INSERT own                               |
| payment_intents          | own                                 | INSERT own                               |
| crew_locations           | own (job)                           | —                                        |
| profiles                 | own                                 | UPDATE own                               |

## 4. Edge functions (call via `supabase.functions.invoke`)

All require an authenticated user. Return JSON.

### `mobile-get-dashboard`
- Body: none
- Returns: `{ job, checklist, invoice, crew, documents, unread_notifications }`

### `mobile-sign-document`
- Body: `{ document_id: string, signer_name: string }`
- Returns: `{ document }`

### `mobile-send-message`
- Body: `{ job_id?: string, content: string }`
- Returns: `{ conversation, message }`

### `mobile-request-reschedule`
- Body: `{ job_id: string, requested_date: 'YYYY-MM-DD', arrival_window?: string, reason?: string }`
- Returns: `{ request }`

### `mobile-create-payment-intent` (stub)
- Body: `{ job_id?: string, invoice_id?: string, amount: number }`
- Returns: `{ payment_intent, note }`

### `mobile-register-push-token`
- Body: `{ expo_push_token: string }`
- Returns: `{ ok: true }`

## 5. Storage

Bucket: `media` (public-read).
Customer-private path convention: `customers/{auth.uid}/...`
Customer can read/write only inside their own folder.

## 6. Demo data

Seed a demo customer manually (sign up in the mobile app), then in the admin panel set:

- `jobs.customer_user_id = <new user id>` for John's demo move.
- Add rows to `move_inventory`, `move_checklist_items`, `documents`, `invoices` with the same `customer_user_id` and `job_id`.

## 7. Generating TypeScript types for the mobile app

Run in the mobile project root once:

```bash
npx supabase gen types typescript \
  --project-id njdrpgpcyeieynhgnupc \
  --schema public > src/types/supabase.ts
```
