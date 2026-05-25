import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import posthog from 'posthog-js';

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
