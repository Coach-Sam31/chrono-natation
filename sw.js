// Garde l'app sur l'appareil pour qu'elle s'ouvre sans réseau au bord du bassin.
// Changer VERSION à chaque mise à jour publiée : l'iPad récupère alors la nouvelle version.
const VERSION = 'chrono-v4';
const FICHIERS = ['./', 'index.html', 'manifest.webmanifest', 'icon-180.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(cles => Promise.all(cles.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return; // les envois vers le Sheet passent toujours par le réseau
  const url = new URL(req.url);
  if (url.hostname.endsWith('script.google.com') || url.hostname.endsWith('googleusercontent.com')) return;
  // L'app d'abord depuis l'appareil (instantané, hors ligne) ; polices Google mises de côté au premier passage.
  e.respondWith(caches.match(req).then(enCache => enCache || fetch(req).then(rep => {
    if (rep.ok && (url.origin === location.origin || url.hostname.endsWith('gstatic.com') || url.hostname.endsWith('googleapis.com'))) {
      const copie = rep.clone();
      caches.open(VERSION).then(c => c.put(req, copie));
    }
    return rep;
  }).catch(() => caches.match('index.html'))));
});
