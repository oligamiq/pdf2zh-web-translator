import { render } from 'solid-js/web';
import { Router, Route, Navigate } from '@solidjs/router';
import './index.css';
import App from './App';
import Dashboard from './pages/Dashboard';
import JobDetail from './pages/JobDetail';
import Settings from './pages/Settings';
import AdvancedSettings from './pages/AdvancedSettings';
import About from './pages/About';
import Licenses from './pages/Licenses';

const root = document.getElementById('root');

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    'Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?',
  );
}

render(
  () => (
    <Router root={App}>
      <Route path="/" component={Dashboard} />
      <Route path="/login" component={() => <Navigate href="/" />} />
      <Route path="/jobs/:id" component={JobDetail} />
      <Route path="/settings" component={Settings} />
      <Route path="/settings/advanced" component={AdvancedSettings} />
      <Route path="/about" component={About} />
      <Route path="/licenses" component={Licenses} />
    </Router>
  ),
  root!
);
