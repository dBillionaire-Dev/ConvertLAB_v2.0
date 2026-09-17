# ConvertLAB Release Checklist

## Phase 61 — Accessibility

- [x] Calculator inputs expose required/optional semantics.
- [x] Calculator result announces completion to assistive technology.
- [x] Result heading receives focus after calculation.
- [x] Calculator can submit with Enter.
- [x] Main landmark is keyboard-focusable for skip navigation.

## Phase 62 — Performance

- [x] Calculator pages use loading boundaries.
- [x] Long calculator runner content uses browser content-visibility where supported.
- [x] Service-worker caching remains available for offline use.
- [ ] Measure production Web Vitals after deployment.

## Phase 63 — Security

- [x] TypeScript build errors are not ignored.
- [x] Powered-by header disabled.
- [x] MIME sniffing protection.
- [x] Clickjacking protection.
- [x] Referrer policy.
- [x] Permissions policy.
- [x] Production HSTS.
- [x] Production COOP/CORP headers.
- [ ] Run an external production security scan after deployment.

## Phase 64 — Automated tests

- [x] Registry integrity tests.
- [x] Clinical audit tests.
- [x] Service-worker route coverage.
- [x] Release-hardening tests.
- [ ] Execute the complete suite in CI.

## Phase 65 — Production build

CI runs: install → typecheck → unit tests → Next.js production build.

## Phase 66 — Final release audit

Run:

```bash
pnpm release:audit
pnpm verify
```

The release audit is a structural gate. Clinical use still requires review of each calculator's source, intended population, local SOPs/protocols, and validation status.
