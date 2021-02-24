const cacheStorage = 'video_offline_store'

// Array von Daten, die wir in den Cache legen wollen.
const CacheArray = [
    '/index.html',
    '/main.js',
    '/style.css',
    '/fotos/1.jpeg',
    '/fotos/2.jpeg',
    '/fotos/3.jpeg',
    '/fotos/4.jpeg',
]

self.addEventListener('install', (event) => {

    self.skipWaiting()
    console.log('Service Worker wurde instaliert');
    event.waitUntil(
        caches.open(cacheStorage).then((cache) => {
            console.log('Die Daten aus dem CacheArray werden in das Cache plaziert')
                // das Array "CacheArray" durchlaufen und alles in den Cache legen 
            return cache.addAll(CacheArray)
        })
    )
});

// In diesem Fall kann der alte Cache entfernt werden.

self.addEventListener('activate', (event) => {
    console.log("Activate")
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(cacheNames.map(cache => {
                if (cache != cacheStorage) {
                    console.log("Service Worker löscht altes Cache")
                    return caches.delete(cache);
                }
            }))
        })
    )
});

self.addEventListener('fetch', (event) => {
    console.log('Es wird eine Anfrage an den Server gestellt');
    event.respondWith(
        //  Network falling back to cache
        fetch(event.request)
        .then(async(response) => {
            const cache = await caches.open(cacheStorage);
            cache.put(event.request.url, response.clone());
            console.log('Service Worker nimmt die Daten aus dem Netz', event.request.url);
            return response.clone();
        })
        .catch(async() => {
            console.log('Service Worker nimmt die Daten aus dem Cache', event.request.url)
            const response = await caches.match(event.request);
            return response;
        })
    )
});