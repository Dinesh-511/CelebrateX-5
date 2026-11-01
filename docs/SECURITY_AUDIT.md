# CelebrateX Security Architecture & Verification Audit

CelebrateX is built with a zero-trust, defense-in-depth security model. This document details the threat modeling, OWASP Top 10 mitigation verification, and automated compliance pipelines implemented across the application.

---

## 1. Executive Summary

| Security Metric                      |   Value    |                        Compliance Status                         |
| :----------------------------------- | :--------: | :--------------------------------------------------------------: |
| **Known Production Vulnerabilities** |   **0**    |            Verified by `npm audit --audit-level=high`            |
| **API Key Exposure Risk**            |  **Zero**  | Verified by AST Regex Scanners (`tests/quality/hygiene.test.ts`) |
| **Raw HTML / XSS Injection Vectors** |  **Zero**  |  `dangerouslySetInnerHTML`, `innerHTML`, `eval` banned & tested  |
| **Content Security Policy (CSP)**    | **Strict** |  `default-src 'self'`, no `unsafe-inline`, `object-src 'none'`   |
| **Rate Limiting & Abuse Prevention** | **Active** |   Sliding-window per IP + Upstash Redis cross-instance limits    |
| **Access Control & CSRF Protection** | **Strict** |         Same-origin checks on all stateful/AI endpoints          |

---

## 2. OWASP Top 10 Verification Matrix

### A01: Broken Access Control

- **Mitigation**: All AI endpoints (`api/*.ts`) enforce same-origin verification via the `Origin` and `Host` headers (`api/_lib/http.ts:sameOrigin()`). Calls missing an origin or from unauthorized cross-origins fail immediately with `403 FORBIDDEN_ORIGIN`.
- **Verification**: `tests/api/http-edge.test.ts:sameOrigin` and `tests/api/handlers.test.ts`.

### A02: Cryptographic Failures

- **Mitigation**: Strict Transport Security (`max-age=63072000; includeSubDomains; preload`) enforced in `vercel.json` and mirrored in `vite.config.ts`.
- **Data in Transit**: All communication is strictly HTTPS.
- **Shared Link Verification**: Plans encoded in URLs use URL-safe LZ-compression with base64url validation, strict schema checks, and DAG cycle detection before hydration.

### A03: Injection (XSS, Prompt Injection & Prototype Pollution)

- **Cross-Site Scripting (XSS)**: Prohibited from using `dangerouslySetInnerHTML`, `.innerHTML`, `eval`, or `new Function`. Validated automatically via AST regex tests in `tests/quality/hygiene.test.ts`.
- **Prototype Pollution Defense**: All JSON parsing of untrusted inputs (hash decoding in `src/state/share.ts`, local storage hydration in `src/state/planStore.ts`, and POST request bodies in `api/_lib/http.ts`) enforces `safeJsonReviver`. Keys `__proto__`, `constructor`, and `prototype` are detected and rejected with an explicit error, verified in `tests/engine/compression.test.ts` and `tests/api/http-edge.test.ts`.
- **Prompt Injection Delimiters & Control Character Sanitization**: User inputs are stripped of non-printable control characters via `sanitizePromptText` and encapsulated within strict structured XML tags (`<user_text>` and `<user_input>`). System prompt instructions explicitly state that tagged content is untrusted data to analyze, never operational directives. Response payloads must strictly validate against Zod schemas.

### A04: Insecure Design

- **Mitigation**: Stateless, deterministic architecture. Money and timeline calculations are executed by pure TypeScript algorithms in `src/engine/` rather than delegating sensitive calculations to probabilistic LLM outputs.
- **Rate Limiting**: Sliding window rate limiter (20 requests per 5-minute window per IP) prevents quota exhaustion.

### A05: Security Misconfiguration

- **Headers Enforced**:
  - `Content-Security-Policy`: `default-src 'self'; connect-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'`
  - `X-Frame-Options`: `DENY` (clickjacking prevention)
  - `X-Content-Type-Options`: `nosniff` (MIME sniffing prevention)
  - `Cross-Origin-Opener-Policy`: `same-origin`
  - `Referrer-Policy`: `strict-origin-when-cross-origin`
  - `Permissions-Policy`: `camera=(), microphone=(), geolocation=(), payment=(), usb=()`

### A06: Vulnerable and Outdated Components

- **Mitigation**: Deterministic `package-lock.json` dependency tree. Production dependencies are strictly pruned (`react`, `react-dom`, `zod`, `@google/genai`).
- **Verification**: `npm audit --audit-level=high` runs in CI and on local builds with 0 critical/high findings.

### A07: Identification and Authentication Failures

- **Mitigation**: CelebrateX is intentionally serverless and stateless. No user credentials, cookies, or sessions are stored on disk or server databases, eliminating session hijacking, credential stuffing, and identity exposure surfaces.

### A08: Software and Data Integrity Failures

- **Mitigation**: Every payload received from an AI model or URL state parameter undergoes runtime Zod schema parsing before reaching application state. Corrupted or tampered states are cleanly rejected without application crash.

### A09: Security Logging and Monitoring Failures

- **Mitigation**: Server error logs log static constant message strings only (`console.error('SERVER_ERROR')`). User input, PII, and request payloads are never echoed into logs, eliminating log injection and PII leakage.
- **Verification**: Enforced by AST rule in `tests/quality/hygiene.test.ts`.

### A10: Server-Side Request Forgery (SSRF)

- **Mitigation**: Serverless API functions make zero dynamic outbound HTTP requests to user-supplied URLs. The only outbound connection is to the official Google Gemini API endpoint via authenticated SDK.

---

## 3. Running Automated Security Checks

To run the complete automated security verification suite:

```bash
npm run security:check
```

This command executes:

1. High-severity dependency vulnerability audit (`npm audit --audit-level=high`)
2. Secret scanning and code hygiene tests (`tests/quality/hygiene.test.ts`)
3. Origin verification and rate limiting edge tests (`tests/api/http-edge.test.ts`)
