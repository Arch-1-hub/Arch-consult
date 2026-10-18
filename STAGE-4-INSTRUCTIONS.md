# Stage 4: apply in Termux

```
cd ~/Arch-consult
unzip -o ~/storage/downloads/sandbox-stage4.zip
npx tsx scripts/sandbox-advisor.test.ts
npx tsx scripts/sandbox-rules.test.ts
npx tsx scripts/sandbox-ui.test.ts
npx tsc --noEmit
git add -A
git commit -m "Sandbox stage 4: AI advisor"
git push
```
Each test ends with ALL PASSED. No output from tsc means it passed.

The advisor uses your existing OPENAI_API_KEY or GROQ_API_KEY in Vercel. No new key needed.
