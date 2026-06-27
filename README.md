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

Bu değer workflow sırasında otomatik olarak [config.js](config.js) dosyasına yazılır.

## Not
Yazılar tarayıcıda localStorage üzerinde saklanır. Böylece veritabanı gerekmeden çalışır ve isterseniz içerik .md dosyası olarak indirilebilir.
