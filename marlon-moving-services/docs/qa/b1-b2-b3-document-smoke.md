# B1/B2/B3 Document Smoke Checklist

Use a disposable admin/customer test account and a safe test job. Do not generate or send documents against live customer jobs during smoke testing.

| Area | Check | Result | Notes |
| --- | --- | --- | --- |
| Web boot | `/documents` loads on Expo web without the `react-native-pdf` native-only Metro error. | Pending |  |
| Admin templates | `/templates` loads and groups templates by `document_type`. | Pending |  |
| Admin templates | Create or update throwaway slug `_qa_test`; preview renders in WebView and missing tokens show as red chips. | Pending |  |
| Admin templates | Editing `body_html` and saving returns a version bump toast. | Pending |  |
| Admin templates | List active toggle deactivates/reactivates using `admin-upsert-document-template`. | Pending |  |
| Admin templates | Delete 409 shows generated-document warning and Deactivate path works. | Pending |  |
| Admin job documents | `/moves/{job_id}` loads template/document rows for a safe test job. | Pending |  |
| Admin job documents | Generate single document creates a PDF row and refreshes the template/job data. | Pending |  |
| Admin job documents | Regenerate replaces an unsigned draft with `replace: true`. | Pending |  |
| Admin job documents | Generate package returns `Generated N · Skipped M locked`. | Pending |  |
| Admin job documents | PDF opens in-app; HTML snapshot opens from the secondary action. | Pending |  |
| Admin job documents | Send is disabled when there is no linked customer, already sent, signed, or locked. | Pending |  |
| Admin job documents | Sent rows show `Sent {relative time}` and signed rows show `Signed · v{n}`. | Pending |  |
| Customer documents | `/app/moves/{job_id}` lists only sent documents and hides leaked drafts defensively. | Pending |  |
| Customer documents | Unsigned signature-required document shows `Awaiting signature`. | Pending |  |
| Customer documents | `/app/documents/{document_id}` loads the signed PDF URL in-app. | Pending |  |
| Customer documents | HTML snapshot action opens `html_preview_url` in a no-JS WebView. | Pending |  |
| Customer signing | Typed-name signing sends `{ document_id, signer_name }`, refetches detail/list/dashboard, and reloads the signed PDF. | Pending |  |
| Customer signing | Re-signing an already signed document shows the already-signed/locked state without duplicate success. | Pending |  |
| Notifications | `document_to_sign` notification marks read and routes to `/app/documents/{document_id}` when present, otherwise `/app/moves/{job_id}`. | Pending |  |
| Android device | After a new Expo dev-client/EAS native rebuild, generated PDFs load with `react-native-pdf`. | Pending | Native rebuild required because `react-native-pdf` and `react-native-blob-util` were added. |
| iOS/web | Generated PDFs load with WebView; HTML snapshot still opens. | Pending |  |
| Verification | `npx tsc --noEmit` passes. | Passed |  |
| Verification | `npm run lint` passes. | Passed |  |
