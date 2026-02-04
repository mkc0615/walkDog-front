# Security Tasks for Production Readiness

> **Platform**: Android & iOS only (no web version)

## Authentication & Login Security Checklist

### High Priority

- [ ] **1. Client credentials exposed in code**
  - **Current State**: `CLIENT_ID` and `CLIENT_PW` are stored in environment variables but still bundled into the app
  - **Risk**: Anyone can decompile the APK and extract these credentials
  - **Impact**: Attackers could use these credentials to make unauthorized OAuth requests
  - **Solution Options**:
    - A) Switch to PKCE (Proof Key for Code Exchange) flow - no client secret needed
    - B) Use a backend proxy for authentication
    - C) Use asymmetric keys where only public key is in app

---

### Medium Priority

- [ ] **2. No refresh token support**
  - **Current State**: Only access token is stored; when it expires, user must re-login
  - **Risk**: Poor user experience; users logged out unexpectedly
  - **Impact**: Users need to re-enter credentials frequently
  - **Solution Options**:
    - A) Implement refresh token flow with secure storage
    - B) Request long-lived access tokens (less secure)
    - C) Silent re-authentication in background

- [ ] **3. No input validation**
  - **Current State**: Only checks if email/password fields are empty
  - **Risk**: Invalid data sent to server; potential injection attacks
  - **Impact**: Poor UX, unnecessary API calls, potential security vulnerabilities
  - **Solution Options**:
    - A) Add email format validation (regex)
    - B) Add password minimum requirements display
    - C) Sanitize inputs before sending

---

### Low Priority

- [ ] **4. No token expiration handling**
  - **Current State**: App relies on 401/403 responses to detect expired tokens
  - **Risk**: API calls may fail before app realizes token is expired
  - **Impact**: Momentary errors shown to users before redirect to login
  - **Solution Options**:
    - A) Decode JWT and check `exp` claim before API calls
    - B) Proactively refresh token before expiration
    - C) Store token expiration time separately

- [x] **5. Password transmitted over network**
  - **Current State**: HTTPS enforced in production, certificate pinning infrastructure ready
  - **Risk**: Mitigated - HTTPS required, cleartext blocked on Android
  - **Implementation**:
    - A) ✅ HTTPS enforcement via `api-client.ts` - auto-upgrades HTTP to HTTPS in production
    - B) ✅ Certificate pinning plugin created (`plugins/withNetworkSecurityConfig.js`)
    - C) ✅ Android Network Security Config blocks cleartext traffic
  - **To enable certificate pinning**:
    1. Get your server's certificate pin hash (see plugin comments)
    2. Update `CONFIG.pinnedDomains` and `CONFIG.pinHashes` in the plugin
    3. Set `CONFIG.enableCertificatePinning = true`
    4. Rebuild with `eas build`

- [x] **6. No client-side rate limiting**
  - **Current State**: Implemented exponential backoff and lockout
  - **Risk**: Mitigated - prevents brute force attempts client-side
  - **Implementation**:
    - A) ✅ Button disabled while request pending
    - B) ✅ Exponential backoff after failures (1s, 2s, 4s, 8s...)
    - C) ✅ 5-minute lockout after 5 failed attempts
    - D) ✅ Visual feedback with countdown timer
    - E) ✅ Automatic reset after 15 minutes of inactivity

---

## Implementation Priority Order

1. **Client credentials** (High) - Most critical security issue
2. **Input validation** (Medium) - Quick win, improves security and UX
3. **Refresh token** (Medium) - Important for user experience
4. **Rate limiting** (Low) - Quick to implement
5. **Token expiration** (Low) - Nice to have
6. **Certificate pinning** (Low) - Advanced security

---

## Code Cleanup (Web Removal)

- [ ] **7. Remove web-specific code**
  - Remove `Platform.OS === 'web'` checks in auth-context.tsx
  - Remove AsyncStorage fallback (use SecureStore only)
  - Remove web-specific alert helper (use native Alert only)
  - Update app.json to remove web output config

---

## Notes

- **Platform**: Android & iOS only (Expo) - no web support
- Backend changes may be required for some solutions
- Testing should include security testing after changes
- Consider a security audit before production launch
- SecureStore provides encrypted storage on native platforms (more secure than web localStorage)

---

## Progress Tracking

| Task | Status | Date Completed | Notes |
|------|--------|----------------|-------|
| 1. Client credentials | Frontend Done | 2026-02-04 | Backend proxy endpoints needed |
| 2. Refresh token | Frontend Done | 2026-02-04 | Backend must return refresh_token |
| 3. Input validation | Done | 2026-02-04 | Email, password, name validation |
| 4. Token expiration | Done | 2026-02-04 | JWT decoded, proactive refresh |
| 5. HTTPS/Certificate | Done | 2026-02-04 | HTTPS enforced, pinning ready |
| 6. Rate limiting | Done | 2026-02-04 | Exponential backoff, lockout |
| 7. Remove web code | Done | 2026-02-04 | auth-context.tsx cleaned |
