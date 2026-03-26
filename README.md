# YADA Dergisi — Makale Gönderim Sistemi

## Klasör Yapısı
```
/
├── api/
│   ├── evaluate.js     ← AI değerlendirme
│   └── upload.js       ← Google Drive yükleme
├── public/
│   └── index.html      ← 2 sayfalı arayüz
└── vercel.json
```

---

## Vercel Environment Variables

Vercel → Settings → Environment Variables'a şunları ekleyin:

### 1. ANTHROPIC_API_KEY
- Anthropic Console'dan aldığınız anahtar

### 2. GOOGLE_SERVICE_ACCOUNT
Google Drive yükleme için Service Account JSON:

1. console.cloud.google.com → Yeni proje oluşturun
2. "APIs & Services" → "Enable APIs" → "Google Drive API" aktif edin
3. "Credentials" → "Create Credentials" → "Service Account"
4. Service account oluşturun → "Keys" → "Add Key" → "JSON" indirin
5. İndirilen JSON dosyasının tüm içeriğini kopyalayın
6. Vercel'de GOOGLE_SERVICE_ACCOUNT olarak ekleyin
7. Drive klasörlerini service account e-postasıyla paylaşın (Editor yetkisi)

---

## k12.tr'ye Gömme
```html
<iframe src="https://yada-dergi.vercel.app" width="100%" height="850"
  style="border:none;border-radius:8px;" title="YADA Dergisi">
</iframe>
```
