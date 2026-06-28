# personal-blog

Bu proje statik bir blog sitesidir. GitHub Pages üzerinden yayınlamak için hazırdır.

## Yayınlama adımları
1. GitHub üzerinde depoyu yayınlayın.
2. Repo ayarlarında Pages bölümünden "Deploy from a branch" seçin.
3. Ana dalı ve kök klasörünü seçin.
4. Sayfa yayımlandıktan sonra GitHub size bir URL verecektir.

## Şifre ayarı
Blog düzenleme şifresi deploy sırasında bir ortam değişkeninden gelir.

- Yerelde: [config.js](config.js) dosyasındaki değeri değiştirin.
- GitHub Pages / GitHub Actions ile deploy ederken: repo ayarlarında bir secret oluşturun.
  - Ad: BLOG_PASSWORD
  - Değer: istediğiniz şifre
  - Ad: BLOG_GITHUB_TOKEN
  - Değer: blog içeriğini GitHub depoya yazabilen bir kişisel erişim token'ı

Bu değerler workflow sırasında otomatik olarak [config.js](config.js) dosyasına yazılır.

Varsayılan yerel şifre: quietcorner2026!

## Not
Bu sürüm, düzenlemelerin tüm cihazlarda görünmesi için bir canlı sunucu gerektirir. Eğer siteyi efekaner.com gibi gerçek bir domaine bağlamak istiyorsanız, sunucuya yayımlanmış bir WebSocket uç noktası kurmanız gerekir.

Örnek kurulum:
1. Bu klasörü bir sunucuya yükleyin.
2. `npm install`
3. `npm start`
4. Sunucunun HTTPS adresini [config.js](config.js) dosyasındaki `syncUrl` alanına yazın.

Örneğin:
```js
window.__BLOG_CONFIG__ = {
  password: 'quietcorner2026!',
  syncUrl: 'wss://efekaner.com/ws'
};
```

Bu ayar yapılmadığında, site yalnızca yerelde çalışır ve gerçek domain üzerinde canlı paylaşım kurulmaz.
