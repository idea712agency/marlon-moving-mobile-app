# Stabilization Smoke Checklist

Use this checklist for the Customer API Consolidation + Documents Parity stabilization pass. Mark each row Pass/Fail and add notes, payload mismatches, screenshots, or account IDs as needed.

| Area | Scenario | Expected result | Status | Notes |
| --- | --- | --- | --- | --- |
| Customer inventory | Customer with 2 jobs adds inventory | New item is attached to `mobile-get-dashboard.job.id`, not an arbitrary scheduled job | Pending |  |
| Customer messages | Open Messages for a customer with a linked job | `mobile-get-messages` returns only the customer/job conversation | Pending |  |
| Customer messages | Send first message when no conversation exists | Conversation is auto-created and new message appears after refresh | Pending |  |
| Reschedule | Open Reschedule from customer portal | Current move header matches `mobile-get-dashboard.job` | Pending |  |
| Reschedule | Submit a request | Request payload uses dashboard job id and appears in existing requests after refetch | Pending |  |
| Account | Save full name/phone | `mobile-update-profile` updates auth user profile row; email remains read-only | Pending |  |
| Admin Documents | Filter Photos | Photos count/filter uses `mime_type LIKE 'image/%'` | Pending | Lovable web |
| Admin Documents | Rename a document | Inline rename saves and row refreshes | Pending | Lovable web |
| Admin Documents | Reclassify category | Dynamic `document_categories` options load and save per row | Pending | Lovable web |
| Payment | Submit Zelle with reference | Invoice becomes `pending_review`; customer timeline advances to `payment_pending_review` | Pending |  |
| Payment | Admin approves submission | Invoice status/paid state update and customer portal timeline advances | Pending |  |
| Payment | Admin rejects submission | Rejection reason appears and invoice remains payable | Pending |  |
| Documents | Sign document once | First signature succeeds and dashboard/document queries refresh | Pending |  |
| Documents | Sign document twice | Second attempt returns 409 and UI shows already-signed state | Pending |  |
| Auth boundary | Customer calls admin endpoint | Customer receives 403 | Pending |  |
| Auth boundary | Admin reviews manual payment | `admin-review-manual-payment` succeeds for admin | Pending |  |
| Notifications | Mark notification read | Unread count refreshes after mark-read | Pending | Current Expo uses mobile functions |
