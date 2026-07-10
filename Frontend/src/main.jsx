import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux'
import { GoogleOAuthProvider } from "@react-oauth/google";
import { store } from './redux/store'
import App from './App'
import './index.css'
import { registerSW } from 'virtual:pwa-register'
import 'react-toastify/dist/ReactToastify.css';

// Register service worker automatically
registerSW({ immediate: true });
console.log(import.meta.env.VITE_GOOGLE_CLIENT_ID);
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <Provider store={store}>
      <Router>
        <App />
      </Router>
    </Provider>
  </GoogleOAuthProvider>
</React.StrictMode>
)
