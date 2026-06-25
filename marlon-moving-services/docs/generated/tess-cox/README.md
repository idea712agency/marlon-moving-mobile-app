# Tess Cox Document Packet Ingestion

## What Is Ready

- The seven Tess Cox DOCX source files were copied into `docs/source/tess-cox/`.
- `source-manifest.json` records filename, byte size, and SHA-256 for each source file.
- `extracted-client-data.json` contains the client, job, estimate, and company fields parsed from the packet.
- `extracted-text.json` contains the full paragraph/table text extracted from each DOCX.
- `template-payloads.json` contains seven `admin-upsert-document-template`-ready payloads with semantic HTML and merge tokens.

## Extracted Tess Cox Data

- Customer: Tess Cox
- Phone: `(910) 548-4206`
- Email: `tess.j.cox@aol.com`
- Job number / estimate: `MMS-2026-0615`
- Move date: `2026-06-16`
- Arrival window: `8:00 AM – 9:00 AM`
- Origin: Leesburg, Virginia
- Destination: Ashburn, Virginia
- Crew: 3 professional movers
- Truck: 28 ft Moving Truck
- Hourly rate: `$149/hr`
- Truck fee: `$240`
- Deposit paid: `$250`
- Optional packing/protection package: `$149`

Note: document 1 contains likely typos (`Tess Coxc`, `(910) 548-4209`, `tess.j.coxc@aol.com`). Documents 2-7 consistently use Tess Cox, `(910) 548-4206`, and `tess.j.cox@aol.com`. Exact original-file outputs should preserve the DOCX content; dynamic templates should use the consistent fields above.

## Blockers

- No staging Supabase target is configured in this repo. The app currently points to one hardcoded Supabase project in `src/lib/supabase.ts`, so Codex did not create a live Tess Cox customer/job or mutate document/template rows.
- Local DOCX render QA is blocked because the bundled LibreOffice binary expects `/opt/homebrew/opt/little-cms2/lib/liblcms2.2.dylib`. The matching library exists inside the Codex runtime, but `/opt/homebrew` is not writable in this sandbox, so `render_docx.py` cannot produce PDFs/PNGs here.

## Lovable / Staging Handoff

1. Seed staging with a Tess Cox customer/contact/job using `extracted-client-data.json`.
2. Use `template-payloads.json` to call `admin-upsert-document-template` for all seven dynamic templates.
3. Preview each dynamic template with the Tess Cox staging job ID through `admin-preview-document-template`.
4. Generate the full package with `admin-generate-job-document-package`.
5. Attach exact originals by converting the source DOCX files to PDFs in an environment with working LibreOffice/Word/Pages, then upload them as job documents.
6. Send staging documents to the customer account and verify `/app/moves/{job_id}` and `/app/documents/{document_id}`.
7. Sign one staging document and verify `locked_at`, signed PDF burn-in, and disabled regeneration.

## Files

- Source DOCX: `docs/source/tess-cox/`
- Parsed client/job data: `docs/generated/tess-cox/extracted-client-data.json`
- Template payloads: `docs/generated/tess-cox/template-payloads.json`
- Full extracted text: `docs/generated/tess-cox/extracted-text.json`
- Source hashes: `docs/generated/tess-cox/source-manifest.json`
