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
Blog içeriği artık [blog-content.md](blog-content.md) dosyasından okunur. Bu sayede içerik değiştiğinde GitHub Pages üzerinden yayınlanan herkes yeni metni görür; değişiklikleri yayınlamak için dosyayı güncelleyip deploy etmek yeterlidir.
