/**
 * Cross-Origin Isolation service worker.
 * Injects COOP/COEP headers into every response so SharedArrayBuffer
 * (required for pthreads-based WASM) is available on GitHub Pages.
 *
 * Register this before any other script in index.html.
 */

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', e => {
    if (e.request.cache === 'only-if-cached' && e.request.mode !== 'same-origin') return;
    e.respondWith(
        fetch(e.request).then(r => {
            if (!r || r.status === 0 || r.type === 'opaque') return r;
            const headers = new Headers(r.headers);
            headers.set('Cross-Origin-Opener-Policy',   'same-origin');
            headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
            return new Response(r.body, {
                status:     r.status,
                statusText: r.statusText,
                headers,
            });
        })
    );
});
