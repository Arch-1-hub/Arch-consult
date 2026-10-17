# Stage 3: apply in Termux

```
cd ~/Arch-consult
unzip -o ~/storage/downloads/sandbox-stage3.zip
npx tsx scripts/sandbox-rules.test.ts
npx tsx scripts/sandbox-ui.test.ts
npx tsc --noEmit
git add -A
git commit -m "Sandbox stage 3: Nigeria rules and Scenario Lab"
git push
```
Both tests should end with ALL PASSED. No output from tsc means it passed.

What changed: tax, pension and payroll costs now follow Nigerian rules (checked 2026-10-17). The results page gains a Scenario Lab and a "Nigerian rules applied" section.
