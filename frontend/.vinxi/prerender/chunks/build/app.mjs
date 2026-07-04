import { onMount } from 'file:///srv/pdf2zh-web/v2/node_modules/solid-js/dist/server.js';
import { t, n } from './authState-BZctefYf.mjs';

function i(t$1) {
  return onMount(() => {
    import('./firebase-D_DCxAHy.mjs').then(({ auth: r }) => {
      import('file:///srv/pdf2zh-web/v2/frontend/node_modules/firebase/auth/dist/index.mjs').then(({ onAuthStateChanged: e }) => {
        e(r, (o) => {
          t(o), n(true);
        });
      });
    });
  }), t$1.children;
}

export { i as default };
//# sourceMappingURL=app.mjs.map
