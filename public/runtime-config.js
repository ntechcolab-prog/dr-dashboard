// Runtime configuration — loaded before the app (see app/layout.tsx) and read via
// src/config/runtimeConfig.ts. Injected framework-neutrally, mirroring the Notify
// `web` apps' runtime-config.js pattern: a single build points at any environment
// because these values are read at runtime. Deploy overrides this file per env.
//
// All values here are PUBLIC (base URLs and the Turnstile *site* key are safe to
// ship to the browser; the Turnstile *secret* stays server-side on the backend).
window.configuration = {
  // Primary surface. Provisionally the `manager-api` (service) because the only
  // staging credential we have is a `manager@` account, which authenticates
  // there. Revisit once a customer account / the customer-vs-manager split for
  // batch/machine data is confirmed — most domain endpoints may live on the
  // customer `api` (https://api.iris-cloud-stg.netzsch.com/api).
  apiUrl: 'https://manager-api.iris-cloud-stg.netzsch.com/api',
  // The `manager-api` surface (subset of endpoints; call with request base 'manager').
  managerApiUrl: 'https://manager-api.iris-cloud-stg.netzsch.com/api',
  // Cloudflare Turnstile site key (public) for the login captcha.
  turnstileSiteKey: '0x4AAAAAAAzNZxeP8rafvM96',
  releaseVersion: 'dev',
}

// Environment alternates (uncomment the pair you need):
//   dev:  https://api.iris-cloud-dev.netzsch.com/api  ·  https://manager-api.iris-cloud-dev.netzsch.com/api
//   prod: https://api.iris-cloud.netzsch.com/api      ·  https://manager-api.iris-cloud.netzsch.com/api
//   local: http://localhost:8080/api                  ·  http://localhost:8079/api
