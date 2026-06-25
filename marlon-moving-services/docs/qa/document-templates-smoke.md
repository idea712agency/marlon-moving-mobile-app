# Manual Smoke Test Checklist - Dynamic Document Templates

Record this before starting:

| Field | Value |
| --- | --- |
| Date |  |
| Tester |  |
| Admin email |  |
| Customer email |  |
| Fresh job ID |  |
| Locked job ID |  |

## Test Prerequisites

- [ ] Two accounts are available: one admin and one customer with a job where `jobs.contact.email` matches the customer profile.
- [ ] One job is in confirmed/booked status with no documents yet. This is the fresh job.
- [ ] One job already has a generated, sent, and signed document. This is the locked job for deactivate/lock tests.
- [ ] Admin is open in one browser session and the customer portal is open in another.

## 1. Generate / Regenerate / Package

Use the fresh job in `/moves/{id}` -> Documents.

| Step | Action | Expected Backend State | Expected UI State | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| 1.1 Single generate | Click `Generate` on one template, such as Bill of Lading. | A `documents` row exists with `file_path` ending in `.pdf`, `html_snapshot_path` ending in `.html`, `generated_from_version` populated, `is_signed=false`, and `locked_at=null`. | Row flips to `Draft`; generated PDF opens in the in-app viewer. | Pending |  |
| 1.2 Regenerate unsigned | Edit the template body in `/templates/{id}`, save, and confirm the version increments. Return to the job and click `Generate` again on the same template. | Same `documents.id` is reused, no duplicate row is created, `generated_from_version` bumps, and `pdf_rendered_at` updates. | Row remains `Draft`; PDF reflects the new body. | Pending |  |
| 1.3 Package generate | Click `Generate document package`. | Response includes `generated`, `replaced`, `skipped_locked`, and `errors`. New templates land in `generated`, the existing unsigned document lands in `replaced`, and locked documents land in `skipped_locked`. No duplicate rows are created. | Toast summarizes generated/replaced/skipped results and the list refreshes. | Pending |  |
| 1.4 Locked guard | On the locked job, click `Generate` on the signed template if the UI allows it. | Single endpoint returns `409` / locked or package response includes the existing document in `skipped_locked`. No signed row is overwritten. | Status chip shows `Signed`; Generate is disabled or the locked-state message is shown. | Pending |  |

## 2. Sign Refresh - PDF Burn-In

Use the customer portal on the fresh job after the admin has sent the document.

| Step | Action | Expected Backend State | Expected UI State | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| 2.1 Sign document | Open the document, type a signer name between 2 and 100 characters, and submit. | Response includes `status: "signed"`, `regenerated: true`, and `regen_error: null`. | Success message appears and the detail refetches. | Pending |  |
| 2.2 Reload signed detail | Reload or revisit the document detail screen. | `is_signed=true`, `locked_at` is set, `generated_from_version` is pinned, and `pdf_rendered_at` is updated. | PDF viewer shows the typed name in the signature block; signing controls are hidden. | Pending |  |
| 2.3 Re-submit signed doc | Attempt to submit signing on the same document again. | Response includes `status: "already_signed"` with the original `signed_at`; no new PDF write occurs. | UI shows the already-signed/locked state without a duplicate signing success. | Pending |  |
| 2.4 Admin signed view | Admin reopens the job document row in `/moves/{id}` -> Documents. | Signed row remains locked and cannot be regenerated. | Generate is disabled, status chip shows `Signed`, and preview/view shows the signed PDF. | Pending |  |

## 3. Admin Send To Customer Gating

Use the fresh job's generated document in the admin Documents area.

| Precondition | Action | Expected Backend State | Expected UI State | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| Document exists but `file_path` is empty or no rendered content exists. | Try to send if possible. | If forced, response is `400 "no rendered content"`. | Send button is disabled. | Pending |  |
| Generated document and customer is linkable by `contact.email`. | Click `Send to customer`. | Response is `200`; `sent_to_customer_at` is set; one customer notification row is inserted; job activity is logged. | Row shows `Sent {relative time}`; customer bell badge increments once. | Pending |  |
| `sent_to_customer_at` already set and document is not signed. | Try to send again. | Response is `200`; `sent_to_customer_at` remains unchanged; no duplicate `customer_notifications` row is inserted. | UI should not double-fire notifications; row remains sent. | Pending |  |
| Document is signed or `locked_at` is set. | Try to send if possible. | No send mutation should run. | Send button is disabled. | Pending |  |
| Job `contact.email` has no matching customer profile. | Try to send if possible. | If forced, response is `400 "Customer account not linked"`. | Send button is disabled with a no-customer-linked hint. | Pending |  |
| Template body is empty. | Try to send if possible. | If forced, response is `400 "Template has no body"`. | Send button is disabled. | Pending |  |

Customer portal verification:

- [ ] Only documents with `sent_to_customer_at` appear in `customer-list-job-documents`.
- [ ] Draft documents never appear in the customer list.
- [ ] Bell badge increments only once for the first send.

## 4. Template Deactivate - 409 Flow

Use `/templates`.

| Step | Action | Expected Backend State | Expected UI State | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| 4.1 Locked reference deactivate | Pick a template referenced by the locked job's signed document and click Deactivate/Delete. | Endpoint returns HTTP `409` with `{ error: "Template referenced by locked documents", doc_count: N }`, where `N > 0`; template remains `is_active=true`. | Toast/dialog surfaces the document count and offers deactivate guidance without hiding the row. | Pending |  |
| 4.2 Deactivate unlocked template | Pick a template with only unsigned/unlocked docs or no docs and click Deactivate. | Endpoint returns `200 { ok: true }`; `is_active=false`; `updated_at` bumps. | Row hides from active list or shows inactive state. | Pending |  |
| 4.3 Reactivate | Reactivate with the list `is_active` toggle, which calls upsert with the full row. | Template returns to `is_active=true`; version is unchanged because `body_html` did not change; no PDF re-render is triggered. | Template returns to active list. | Pending |  |
| 4.4 Locked PDF still opens | Reopen the locked job's signed PDF. | Existing signed document still uses its pinned `generated_from_version`. | Signed PDF opens and still displays the signed version. | Pending |  |

## Sign-Off

- [ ] All four sections pass.
- [ ] No console errors occurred during the run.
- [ ] No orphan rows were left in `documents`.
- [ ] No duplicate or orphan rows were left in `customer_notifications`.
