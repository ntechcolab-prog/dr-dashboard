// Runtime configuration — loaded before the app (see app/layout.tsx) and read via
// src/config/runtimeConfig.ts. Injected framework-neutrally, mirroring the Notify
// `web` apps' runtime-config.js pattern: a single build points at any environment
// because these values are read at runtime. Deploy overrides this file per env.
//
// All values here are PUBLIC (base URLs and the Turnstile *site* key are safe to
// ship to the browser; the Turnstile *secret* stays server-side on the backend).
window.configuration = {
  // Primary surface: the customer `api`. CONFIRMED against staging — the
  // manager@ account + batch/machine/production endpoints all live here (the
  // `manager-api` returned INVALID_CREDENTIALS for these accounts).
  apiUrl: 'https://api.iris-cloud-stg.netzsch.com/api',
  // The `manager-api` (service) surface, for the subset of endpoints that live
  // there (call with request base 'manager').
  managerApiUrl: 'https://manager-api.iris-cloud-stg.netzsch.com/api',
  // Cloudflare Turnstile site key (public) for the login captcha — the key whose
  // allowed-domains list includes batchbook.ntechcolab.com.
  turnstileSiteKey: '0x4AAAAAAAzSTGqzFmL6s3aC',
  // Staging reCaptcha bypass hash. TEMPORARY palliative so login works while the
  // Turnstile site-key ↔ backend-secret pair is sorted out. The login sends this
  // as `recaptchaValue` and skips the Turnstile widget entirely.
  // ⚠️ REMOVE (set to '') before pointing at the real prod backend — it lets
  // anyone skip the captcha on staging.
  recaptchaBypassHash: 'd417dc64-63cb-40b0-adb9-820f44e75715',
  releaseVersion: 'dev',
}

// Environment alternates (uncomment the pair you need):
//   dev:  https://api.iris-cloud-dev.netzsch.com/api  ·  https://manager-api.iris-cloud-dev.netzsch.com/api
//   prod: https://api.iris-cloud.netzsch.com/api      ·  https://manager-api.iris-cloud.netzsch.com/api
//   local: http://localhost:8080/api                  ·  http://localhost:8079/api
