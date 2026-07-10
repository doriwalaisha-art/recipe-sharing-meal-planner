import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux'
import { store } from './redux/store'
import App from './App'
import './index.css'
import { registerSW } from 'virtual:pwa-register'
import 'react-toastify/dist/ReactToastify.css';

// Register service worker automatically
registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <Router>
        <App />
      </Router>
    </Provider>
  </React.StrictMode>,
)
