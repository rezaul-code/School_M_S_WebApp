# TODO: Fix Student Fee Summary API 404

## Plan
1. Identify where fee summary drawer is opened and how `studentId` is set.
2. Fix the broken open flow that can temporarily render `FeeSummaryDrawer` with `studentId` missing.
3. Add temporary console logs in `FeeSummaryDrawer` to verify `studentId` and constructed API URL.
4. Ensure React Query `enabled` condition is `enabled: open && !!studentId`.
5. Verify the network request now includes `/api/students/{studentId}/fees/summary`.

## Status
- [x] Step 1: Locate and confirm broken open flow (timeout toggle removed)
- [x] Step 2: Implement code change in `src/pages/Students.tsx`
- [x] Step 3: Implement temporary logs in `src/components/students/FeeSummaryDrawer.tsx`
- [x] Step 4: Confirm query enabled condition is safe (`enabled: open && !!studentId`)
- [x] Step 5: Run/verify in dev server / check network tab

