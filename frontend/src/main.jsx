import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import posthog from 'posthog-js';
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'https://43107ecc9f6441fe26b64708c65daa60@o4511451010826240.ingest.de.sentry.io/4511451043790928',
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  environment: import.meta.env.VITE_APP_STATUS ? 'development' : 'production',
});

posthog.init('phc_upZbEbkekGVB4Gi65UvYqytxoXHLMJ6QN2bGpTvTAbHW', {
  api_host: 'https://eu.i.posthog.com',
  defaults: '2026-01-30',
  person_profiles: 'identified_only',
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
