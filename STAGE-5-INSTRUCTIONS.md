# Stage 5: access control

1. Files:
```
cd ~/Arch-consult
unzip -o ~/storage/downloads/sandbox-stage5.zip
```
2. Database: open supabase/011_sandbox.sql, copy ALL of it, paste it into the Supabase SQL Editor and press Run. (Do this BEFORE pushing.)
3. Tests:
```
npx tsx scripts/sandbox-access.test.ts
npx tsx scripts/sandbox-advisor.test.ts
npx tsx scripts/sandbox-rules.test.ts
npx tsx scripts/sandbox-ui.test.ts
npx tsc --noEmit
```
4. Push:
```
git add -A
git commit -m "Sandbox stage 5: access control"
git push
```
5. Optional, in Vercel > Settings > Environment Variables: SANDBOX_FREE_ACCESS_EMAILS = your email (comma-separated for more). Those emails always get paid-level access. Redeploy after adding.

Test on the live site:
- Logged out: /sandbox shows "Sign in to run your simulation".
- Sign in with a verified account and run one simulation: works (free).
- Run another: shows "You have used your free simulation".
- To test paid access without paying, run in Supabase SQL Editor (use your account's email):
  insert into public.payments (tx_ref, item_type, item_name, amount, status, customer_email)
  values ('test-sandbox-1', 'package', 'Starter', 15000, 'successful', 'YOUR@EMAIL');
  Reload /sandbox: it works again. Then delete the test row:
  delete from public.payments where tx_ref = 'test-sandbox-1';
