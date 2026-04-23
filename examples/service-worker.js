// 缓存名称
const CACHE_NAME = 'mindjob-cache-v2';

// 需要缓存的资源
const urlsToCache = [
  './visual_interface.html',
  './manifest.json',
  './service-worker.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-solid-900.woff2',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-regular-400.woff2',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-brands-400.woff2'
];

// 安装事件 - 缓存资源
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  // 强制激活新的service worker
  self.skipWaiting();
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', function(event) {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function() {
      // 立即控制所有客户端
      return self.clients.claim();
    })
  );
});

//  fetch 事件 - 从缓存中获取资源
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // 如果缓存中存在资源，直接返回
        if (response) {
          return response;
        }

        // 否则从网络获取
        return fetch(event.request).then(
          function(response) {
            // 检查响应是否有效
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // 克隆响应
            const responseToCache = response.clone();

            // 将响应添加到缓存
            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        ).catch(function() {
          // 网络错误时的 fallback
          if (event.request.mode === 'navigate') {
            return caches.match('./visual_interface.html');
          }
        });
      })
  );
});

// 后台同步事件
self.addEventListener('sync', function(event) {
  if (event.tag === 'sync-history') {
    event.waitUntil(syncHistory());
  }
});

// 同步历史记录的函数
function syncHistory() {
  // 这里可以添加同步历史记录到服务器的逻辑
  console.log('Syncing history...');
  return Promise.resolve();
}

// 推送通知事件
self.addEventListener('push', function(event) {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20logo%20for%20mental%20disability%20employment%20support%20assistant%2C%20green%20color%2C%20heart%20symbol%2C%20simple%20and%20friendly&image_size=square',
    badge: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=small%20green%20badge%20icon&image_size=square',
    vibrate: [100, 50, 100],
    data: {
      url: data.url
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 通知点击事件
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});