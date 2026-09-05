# Contributing to PeoplePay360

Thank you for contributing to PeoplePay360.

The goal of this project is to maintain a clean, reliable, and maintainable HR & Payroll platform where business logic is as important as the user interface.

---

## Development Workflow

Before starting work:

```bash
git pull origin main
npm install
```

Create a feature branch:

```bash
git checkout -b feature/employee-contract-management
```

Recommended branch naming:

```text
feature/<feature-name>
fix/<bug-name>
refactor/<area>
docs/<documentation-name>
chore/<task>
```

---

## Commit Convention

Use clear, descriptive commits.

Examples:

```text
feat: add employee contract management
feat: implement salary rule engine
fix: prevent duplicate payslips
fix: correct leave balance calculation
refactor: simplify payroll calculation service
docs: update architecture documentation
chore: update dependencies
```

---

## Pull Requests

Every pull request should:

* Explain what changed.
* Explain why it changed.
* Include relevant screenshots for UI changes.
* Include tests when applicable.
* Avoid unrelated changes.
* Confirm that existing functionality still works.

---

## Business Logic Changes

Changes to payroll, contracts, attendance, leave, or permissions require additional care.

Before submitting such changes, verify:

* Existing payroll records remain consistent.
* Historical records are not accidentally modified.
* Role permissions remain correct.
* Validation rules are preserved.
* Database relationships remain valid.
* Edge cases are handled.

---

## Database Changes

When modifying the database schema:

1. Update the Drizzle schema.
2. Generate a migration.
3. Review the generated migration.
4. Test the migration locally.
5. Verify affected queries and relationships.

Never manually modify production database records to compensate for an incorrect migration.

---

## UI Guidelines

Use the existing design system and shadcn/ui components.

Prefer:

* Reusable components
* Consistent spacing
* Accessible controls
* Loading states
* Empty states
* Error states
* Confirmation dialogs for destructive actions

Avoid:

* Duplicated components
* Hardcoded business data
* Fake dashboard metrics
* Client-only permission enforcement

---

## Security

Never commit:

```text
.env
.env.local
API keys
Database credentials
OAuth secrets
Authentication secrets
Private certificates
```

Security issues should be reported according to `SECURITY.md`.

---

## Code Quality

Before opening a PR:

```bash
npm run lint
npm run typecheck
npm test
```

If one of these commands is not available in the current project configuration, document the limitation in the PR.

---

## Review Checklist

### Functionality

* [ ] Feature works as expected
* [ ] Edge cases handled
* [ ] Error states implemented
* [ ] Loading states implemented

### Security

* [ ] Authorization checked server-side
* [ ] Sensitive data protected
* [ ] No secrets committed

### Database

* [ ] Schema updated
* [ ] Migration generated
* [ ] Relationships verified

### UI

* [ ] Responsive
* [ ] Accessible
* [ ] Consistent with existing design system

### Payroll

For payroll-related changes:

* [ ] Contract period logic verified
* [ ] Salary rule sequence verified
* [ ] Duplicate payslip handling verified
* [ ] Payroll validation verified
* [ ] Historical records protected

---

## Code of Conduct

By contributing, you agree to follow the project's `CODE_OF_CONDUCT.md`.
