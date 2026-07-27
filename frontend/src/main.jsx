import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import '@shopify/polaris/build/esm/styles.css';
import { AppProvider } from '@shopify/polaris';
import enTranslations from '@shopify/polaris/locales/en.json';

// App Bridge React v4: No Provider component needed.
// apiKey and host are injected via the <script> tag in index.html.

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProvider translations={enTranslations}>
      <App />
    </AppProvider>
  </React.StrictMode>,
);