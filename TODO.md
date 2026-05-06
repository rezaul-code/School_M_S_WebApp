# TODO

## Students navigation UX change
- [ ] Update `src/App.tsx` to add route `/students/admit` rendering `src/pages/AdmissionWizard.tsx`.
- [ ] Update `src/components/layout/Sidebar.tsx` to add expandable/collapsible `Students` section with:
  - [ ] `Student List` -> `/students`
  - [ ] `Admit Student` -> `/students/admit`
  - [ ] Preserve existing patterns (ChevronDown, expandedSection state) and highlight active item.
- [ ] Update `src/pages/Students.tsx` to remove only the drawer UX trigger (`Admit New Student` button + `AdmitStudentDrawer` usage) while keeping students table + other drawers intact.
- [ ] Quick manual validation:
  - [ ] `/students` works and drawers for student details/fee summary still open.
  - [ ] Sidebar navigation and expand/collapse works.
  - [ ] `/students/admit` loads full-page admission wizard (no drawer).

