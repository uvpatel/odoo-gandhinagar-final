# Security Policy

## Security Philosophy

PeoplePay360 handles sensitive HR and payroll concepts such as employee information, salary data, attendance, leave, and payroll records.

Security and authorization are therefore treated as core application requirements.

---

## Supported Versions

| Version        | Supported      |
| -------------- | -------------- |
| Latest         | ✅              |
| Older versions | ⚠️ Best effort |

As this project is currently an MVP/hackathon project, security support may be limited.

---

## Reporting a Vulnerability

Please do not publicly disclose security vulnerabilities through GitHub Issues.

Report security concerns privately to the project maintainers.

A report should include:

* Vulnerability description
* Affected component
* Steps to reproduce
* Potential impact
* Suggested remediation, if available
* Relevant logs or screenshots without exposing secrets

---

## Sensitive Information

Never include the following in an issue or public report:

* Passwords
* API keys
* Authentication secrets
* Database credentials
* OAuth credentials
* Employee personal information
* Salary information
* Private access tokens

---

## Security Areas

Security reviews should pay particular attention to:

### Authentication

* Session management
* Authentication configuration
* OAuth integrations
* Password/session security

### Authorization

* Role-based permissions
* Server-side authorization
* Employee data access
* Payroll access
* Administrative operations

### Database

* SQL injection prevention
* Query authorization
* Data validation
* Referential integrity

### Payroll

* Unauthorized salary access
* Payslip access
* Payrun manipulation
* Duplicate payroll processing
* Historical payroll modification

### File Generation

* Payslip PDF authorization
* Unauthorized document access
* Secure file delivery

### Email

* Unauthorized payslip delivery
* Recipient validation
* Sensitive information leakage

---

## Disclosure Process

After receiving a report, maintainers should:

1. Confirm receipt.
2. Reproduce the issue.
3. Assess severity and impact.
4. Develop a fix.
5. Validate the fix.
6. Release the correction when appropriate.
7. Document the issue if disclosure is appropriate.

---

## Responsible Disclosure

We appreciate responsible disclosure and ask researchers to avoid:

* Accessing unrelated user data
* Destroying or modifying production data
* Performing denial-of-service attacks
* Social engineering project contributors
* Publicly exposing vulnerabilities before remediation
