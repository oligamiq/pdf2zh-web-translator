import { render } from 'solid-js/web';
import { Router, Route } from '@solidjs/router';
import './index.css';
import App from './App';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import JobDetail from './pages/JobDetail';
import Settings from './pages/Settings';

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
      <Route path="/login" component={Login} />
      <Route path="/jobs/:id" component={JobDetail} />
      <Route path="/settings/llm" component={Settings} />
    </Router>
  ),
  root!
);
