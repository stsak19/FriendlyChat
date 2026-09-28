// FriendlyChat service worker: shows push notifications and opens the right chat when tapped
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

const ua = self.navigator.userAgent;
const isSafari = /safari/i.test(ua) && !/chrome|chromium|crios|android/i.test(ua);

self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil((async () => {
    // Skip if that exact chat is already open and in front of the user.
    // (Safari must always show something, so there we never skip.)
    if (!isSafari && d.url) {
      const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      if (wins.some((w) => w.visibilityState === 'visible' && w.focused && new URL(w.url).search === d.url)) return;
    }
    await self.registration.showNotification(d.title || 'FriendlyChat', {
      body: d.body || '',
      icon: 'icon-192.png',
      badge: 'icon-192.png',
      data: { url: d.url || '', tag: d.tag || '' },
    });
  })());
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '';
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (wins.length) {
      const w = wins[0];
      await w.focus();
      w.postMessage({ open: url });
      return;
    }
    await self.clients.openWindow(new URL(url || './', self.registration.scope).href);
  })());
});
