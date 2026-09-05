# Implementation audit

Initial source inspection: 2026-09-05. This supplements the pre-existing requirements audit without replacing it. Statuses below are discovery findings, not completion claims.

| Requirement | Frontend | Backend/API | Database | Authorization | Business logic / status | Required fix |
|---|---|---|---|---|---|---|
| Authentication / RBAC | signup-form, permissions | auth, allocations, dashboard | auth tables | Gaps identified | SECURITY ISSUE | Reject public roles; protect allocation writes and payroll metrics |
| Employee hub | employee list | detail stubs | employees, history | Existing central permissions; execution audit required | PARTIAL | Implement detail navigation and related counts |
| Contracts | contract form | contract CRUD, resolver | contracts | Existing central permissions; execution audit required | PARTIAL | Reject ambiguous periods; preserve history |
| Schedules | schedule form | header CRUD only | schedules, lines | Existing central permissions; execution audit required | BROKEN | Persist lines and derive weekly hours |
| Attendance | list and self-service | attendance CRUD | attendance, corrections | Existing central permissions; execution audit required | PARTIAL | Schedule context and audited corrections |
| Time off | types, allocations, requests | unconditional approval | requests, allocation FK | Existing central permissions; execution audit required | BROKEN | Transactional validity-aware consumption and reversal |
| Salary structures | placeholder | header CRUD | structures, rule links | Existing central permissions; execution audit required | MISSING | Rule membership and management UI |
| Salary engine | payslip view | two computation services | rules and line snapshots | Existing central permissions; execution audit required | BROKEN | Safe expressions; selected structure; deterministic totals |
| Payrun wizard | two-step wizard | nontransactional creation | payruns, payslips | Existing central permissions; execution audit required | PARTIAL | Reject invalid selection and duplicate periods atomically |
| State transitions / warnings | actions and warnings | compute, validate, paid | statuses, warnings | Existing central permissions; execution audit required | PARTIAL | Locks, atomic writes, immutable finalization |
| PDF / email | print/send buttons | HTML response, summary email | persisted lines | Existing central permissions; execution audit required | BROKEN | Real PDF attachments and recipient results |
| Dashboard | live charts, department filter | inconsistent aggregate scopes | payroll, HR tables | Existing central permissions; execution audit required | PARTIAL | Consistent date, department and type filtering |
| API validation / security | forms | mixed validation and stub routes | domain tables | Existing central permissions; execution audit required | PARTIAL | Zod validation, ownership, transaction guards |
| Performance / server state | mixed Query and manual fetch | unbounded lists | some indexes | Existing central permissions; execution audit required | PARTIAL | Pagination and consistent invalidation |
| Demo / verification | seeded UI | seed script | connected seed records | Existing central permissions; execution audit required | PARTIAL | Invariant tests, lint, build and workflow verification |
