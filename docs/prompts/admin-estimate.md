# Build the Admin Estimate Tool

## 1. Goal

Replace the customer-facing estimate wizard currently embedded at `/admin/app/estimate` with a purpose-built admin estimator for Marlon Moving Services.

The admin tool must allow authorized staff to:

- Build an estimate from scratch using the company’s existing pricing rules.
- Load an existing lead or `quote_requests` record and prefill the estimator.
- Save estimates as drafts.
- Generate and preview a branded PDF.
- Send the estimate to the customer by email or SMS.
- Track the estimate through its status workflow.
- Convert an accepted estimate into a job.

Reuse the existing `quote_requests`, `jobs`, and `contacts` tables. Do not create a new estimate table or duplicate the customer estimate wizard.

Before editing, inspect the referenced files, generated Supabase types, existing settings/rates implementation, RLS policies, edge functions, and reusable admin components. Do not guess missing columns, RPC signatures, storage conventions, or pricing values.

## 2. Where It Lives in the Codebase

- Route: `/admin/app/estimate`
  - This route is already wired in `src/App.tsx`.
- Page to replace: `src/pages/admin/app/AdminAppEstimate.tsx`
  - It is currently only:

    ```tsx
    const AdminAppEstimate = () => <Estimate embedded />;
    ```

- Admin layout: `src/pages/admin/app/AdminAppLayout`
  - Preserve the existing admin app shell, navigation, responsive behavior, and safe-area handling.
  - This admin area is English-only.
- Customer wizard reference: `src/pages/app/Estimate.tsx`
  - Use it only to understand existing fields, validation, calculations, and shared components.
  - Do not edit or repurpose this file.
  - Do not change the customer-facing estimate experience.
- Route and app integration: inspect `src/App.tsx` before changing the page.
- Supabase integration: use the existing client and generated types.

Keep the implementation modular. Extract focused admin estimate components and hooks when that makes the page easier to maintain, but do not introduce a new application domain or parallel backend.

## 3. Data Model

Reuse the current schema exactly as generated in the repository. Do not create tables or migrations.

### `quote_requests`

Use `quote_requests` as the source record and estimate workflow record.

Inspect its generated type and current web usage before implementing. Map the estimator only to columns that actually exist. It should hold or reference:

- Customer/contact information
- Move details
- Inventory or special-item information
- Pricing inputs and calculated totals
- Manual adjustments
- Deposit information
- Estimate status
- Generated PDF information, if matching columns already exist
- Relevant timestamps

If a required value has no matching column, do not invent one. Report the mismatch and keep the value in local form state until an approved persistence path is identified.

### `jobs`

Create a `jobs` row only when the admin explicitly chooses **Convert to job**.

Copy compatible customer, address, scheduling, crew, truck, move-detail, pricing, and notes fields from the estimate. Match the generated `jobs` type exactly.

Generate a fresh job number through the existing `generate_job_number()` database function/RPC. Do not generate job numbers in the browser.

### `contacts`

Use `contacts` for the customer reference when a matching contact exists or is selected.

Support:

- Searching existing contacts.
- Linking the estimate to a `contact_id`.
- Prefilling name, phone, and email from the selected contact.
- Preserving entered customer details when no contact is linked.

Do not silently create a contact unless that behavior already exists and is explicitly supported by the current admin workflow.

### Existing database helpers

Reuse existing helpers and triggers, including:

- `generate_job_number()`
- `update_updated_at_column()`

Do not duplicate trigger-managed timestamps in client logic unless the existing implementation requires it.

## 4. Pricing Rules

Pricing must use the current Marlon Moving Services rate configuration—not hardcoded example values.

The pricing model includes:

- Hourly labor
- Crew-size rates
- Truck fees
- Flat fees
- Travel fees
- Minimum billable hours
- Packing or materials charges
- Stairs
- Long carry
- Special items
- Other existing surcharges
- Discounts
- Deposit requirements

Use `mem://features/pricing` as the pricing source of truth when available in the Codex environment. Also inspect the repository for the live pricing settings table, settings hook, shared calculator, or existing admin pricing utilities.

Requirements:

1. Load the current rates from the existing source.
2. Reuse an existing pricing calculator if one exists.
3. Keep calculations deterministic and testable.
4. Display each charge as a separate line item.
5. Support authorized manual overrides without losing the original calculated value.
6. Recalculate totals immediately when relevant inputs change.
7. Clearly distinguish:
   - Calculated subtotal
   - Manual adjustments
   - Discount
   - Tax, if currently applicable
   - Estimate total
   - Required deposit
   - Remaining balance

If the memory source and repository settings conflict, stop and report the conflict rather than choosing a rate silently.

## 5. UX Flow

Build a responsive, step-based admin workflow inside the existing admin app layout.

### Entry mode

At the top of the page, provide:

- **Start blank**
- **Load from lead/quote**

The load option should open a searchable picker for existing leads and `quote_requests`. Show enough context to distinguish records, such as customer name, phone/email, origin, destination, requested date, status, and creation date.

Loading a record must prefill every compatible field. It must not overwrite unrelated data until the admin confirms the selection.

### Step 1 — Customer

Include:

- Customer name
- Phone
- Email
- Existing-contact search
- Linked `contact_id`
- Customer notes when supported by the schema

Validate required fields and normalize phone/email consistently with existing project patterns.

### Step 2 — Move details

Include all supported existing fields, such as:

- Origin address
- Destination address
- Requested or scheduled date
- Arrival/start window
- Move/job type
- Home size
- Origin and destination access details
- Stairs
- Long carry
- Special items
- Inventory
- Packing requirements
- Disassembly requirements
- Distance or travel details
- Customer and internal notes, where supported

Use address, inventory, and special-item components already present in the codebase when possible.

### Step 3 — Crew and time

Include:

- Number of movers
- Number and size of trucks
- Estimated labor hours
- Minimum billable hours
- Travel time or travel fee inputs
- Packing time when applicable

Show the rate assumptions used by the calculation.

### Step 4 — Pricing breakdown

Display an editable line-item breakdown with:

- Labor
- Truck fees
- Travel
- Packing/materials
- Access surcharges
- Special-item charges
- Other existing charges
- Discount
- Deposit
- Total
- Remaining balance

Allow manual overrides only through an explicit edit action. Visually mark overridden values and provide a way to restore the calculated amount.

### Step 5 — Review and send

Provide:

- Full estimate summary
- Customer and move details
- Pricing breakdown
- PDF preview action
- Download PDF action
- Save as draft
- Send by email
- Send by SMS
- Convert to job when allowed by status

Show clear success and error feedback. Disable duplicate submissions while a request is pending.

## 6. Status Workflow

Persist the workflow through `quote_requests.status` using:

```text
draft → sent → viewed → accepted | declined → converted
```

Rules:

- New unsent estimates begin as `draft`.
- Sending successfully changes `draft` to `sent`.
- Do not mark an estimate as `sent` when PDF generation or delivery fails.
- Preserve `viewed`, `accepted`, and `declined` when loading existing records.
- Only accepted estimates should normally expose **Convert to job**, unless the existing admin business rules explicitly allow conversion from another state.
- Successful job creation changes the quote status to `converted`.
- Prevent duplicate conversion.
- Show the current state and relevant timestamps in the interface.

Confirm that these status values are supported by the existing schema and application behavior before persisting them.

## 7. PDF Generation

Use the edge function:

```text
supabase/functions/generate-estimate-pdf
```

Inspect existing edge-function conventions before implementation. Reuse current authentication, CORS, error handling, email templates, PDF tooling, and storage helpers.

The PDF must include:

- Marlon Moving Services branding
- Company logo from the existing brand asset source
- USDOT #3470374
- Sterling, Virginia headquarters information
- Customer information
- Move details
- Estimate number or quote reference
- Itemized pricing
- Total and deposit
- Relevant terms and disclaimers already used by the business
- Generated date

Store generated PDFs in the existing `media` bucket using the repository’s established path convention. Return a signed or otherwise appropriately scoped URL based on the current storage policy.

Do not make private customer documents permanently public.

If `generate-estimate-pdf` does not exist, inspect the backend first. Do not silently invent a conflicting function name or payload. Implement it only if this task is authorized to add the referenced function and the existing backend conventions are clear.

## 8. Send to Customer

### Email

Use the project’s existing email infrastructure and templates.

`RESEND_API_KEY`/sending-domain configuration is currently pending, so customer email delivery may be paused. The UI must:

- Explain when email delivery is unavailable.
- Avoid reporting success when no message was sent.
- Keep the estimate as `draft` if delivery fails.
- Allow PDF generation/download independently of email delivery.

Do not expose email provider secrets to the client.

### SMS

Create or use a `send-estimate-sms` backend function only according to existing edge-function conventions.

There is no SMS provider yet. The initial implementation should be an explicit stub that:

- Validates the authenticated admin request.
- Validates the phone number and estimate reference.
- Logs the intended delivery safely without exposing sensitive content.
- Returns a response clearly marked as a stub/not delivered.

The UI must not claim the SMS was delivered.

Do not add a provider or credentials as part of this task.

## 9. Convert to Job

When the admin selects **Convert to job**:

1. Validate that the quote is eligible and has not already been converted.
2. Generate a new job number through the existing `generate_job_number()` RPC.
3. Insert one `jobs` row using only existing columns.
4. Copy all compatible values from the quote:
   - `contact_id`
   - Customer/user reference when applicable
   - Origin and destination
   - Date and start time
   - Job type
   - Home/access details
   - Crew size
   - Truck size
   - Estimated duration
   - Pricing fields
   - Packing/disassembly requirements
   - Special items
   - Notes
5. Update `quote_requests.status` to `converted`.
6. Preserve a link between the quote and job if the existing schema supports one.
7. Navigate to the new admin job detail page.

Make the operation atomic through an existing RPC or backend transaction if one exists. If no atomic server-side path exists, do not hide the partial-failure risk; implement careful rollback/error reporting or stop and report that a transactional backend operation is required.

## 10. Constraints

- Admin app UI must be English-only.
- Use existing Tailwind theme tokens:
  - `marlonBlue`
  - `marlonRed`
  - `marlonDarkBlue`
  - `marlonDarkAzure`
  - `marlonAzure`
- Do not hardcode replacement hex values when a theme token exists.
- Use existing shadcn/ui components and project form patterns.
- Preserve `AdminAppLayout` and existing `/admin/app` navigation.
- Enforce admin access through the existing `has_role`/RLS model.
- All reads and writes must be RLS-safe.
- Never use a service-role key in browser code.
- Do not edit:
  - `src/integrations/supabase/client.ts`
  - `src/integrations/supabase/types.ts`
- Do not edit `src/pages/app/Estimate.tsx`.
- Do not modify the customer estimate wizard.
- Do not create a new estimates table.
- Do not invent columns, status values, RPCs, storage paths, or pricing values.
- Do not introduce new dependencies unless an existing requirement is impossible without one and approval is obtained first.
- Reuse current query/mutation, validation, toast, loading, and error-state patterns.
- Keep the page usable on the admin mobile layout and desktop admin layout.
- Add focused tests for pricing calculations, status transitions, data mapping, and conversion safeguards when the repository has an established test setup.

## 11. Acceptance Checklist

- [ ] `/admin/app/estimate` renders a purpose-built admin estimator rather than the embedded customer wizard.
- [ ] Admin can build a complete estimate without leaving the page.
- [ ] Admin can start blank or load an existing lead/quote.
- [ ] Loading an existing record prefills every compatible field.
- [ ] Existing contacts can be searched and linked.
- [ ] Pricing uses the current configured rates.
- [ ] Pricing totals match the pricing memory/settings source.
- [ ] Minimums, travel, flat fees, special charges, discounts, overrides, and deposits calculate correctly.
- [ ] Manual overrides are visibly identified and reversible.
- [ ] Draft estimates persist to `quote_requests`.
- [ ] Status transitions persist correctly.
- [ ] A branded PDF is generated and downloadable.
- [ ] PDFs are stored using the existing secure `media` bucket convention.
- [ ] Email delivery accurately reports its unavailable, failed, or successful state.
- [ ] SMS is clearly presented as a non-delivery stub until a provider exists.
- [ ] **Convert to job** creates one `jobs` row with a fresh RPC-generated job number.
- [ ] Converted quotes cannot create duplicate jobs.
- [ ] Conversion updates `quote_requests.status` to `converted`.
- [ ] All admin UI copy is in English.
- [ ] The customer estimate wizard remains unchanged.
- [ ] No schema or unauthorized backend changes are introduced.
- [ ] Loading, validation, empty, success, and failure states are handled.
- [ ] Type checking, linting, tests, and production build pass.

## 12. Out of Scope

- Stripe payment capture
- Deposit payment processing
- Customer-facing estimate acceptance/decline portal
- Changing the customer-facing `Estimate.tsx` wizard
- Replacing the existing pricing configuration system
- Adding an SMS provider
- Changing Supabase authentication or role architecture
- Creating a new estimates table
- Broad redesigns of unrelated admin screens

## Implementation Handoff

Implement the feature completely, then report:

1. Files changed.
2. Existing backend functions/settings reused.
3. Exact persisted field mappings between `quote_requests` and `jobs`.
4. Any schema or infrastructure mismatch that prevented a requested behavior.
5. Email and SMS delivery limitations.
6. Validation performed, including type checking, tests, and build results.

