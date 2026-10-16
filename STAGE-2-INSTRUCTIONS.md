# Stage 2: apply in Termux

1. Save sandbox-stage2.zip to your phone's Downloads, then:
```
cd ~/Arch-consult
unzip -o ~/storage/downloads/sandbox-stage2.zip
```
(If "unzip" is missing: `pkg install unzip -y`.) Files land in the right folders.

2. Test: `npx tsx scripts/sandbox-ui.test.ts` (ends with ALL PASSED)
3. Type check: `npx tsc --noEmit` (no output = good)
4. Publish:
```
git add -A
git commit -m "Sandbox stage 2: input flow and dashboard"
git push
```
After Vercel redeploys, open yoursite/sandbox directly. It is hidden from Google and not in the menu until Stage 5.
