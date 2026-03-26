export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { author, title, type, text, wordCount } = req.body;
    if (!text || text.length < 30) return res.status(400).json({ error: 'Metin çok kısa.' });

    const prompt = `Sen YADA Dergisi etik değerlendirme asistanısın. Makaleyi YADA Dergisi Etik Şartları'na göre değerlendir.

KRİTERLER:
1. DİL VE ÜSLUP (20p): Türkçe, sade, argo/ayrımcı ifade yok
2. KELİME SINIRI (15p): Max 2000 kelime. Mevcut: ${wordCount}
3. BAŞLIK UYUMU (10p): Kısa, dikkat çekici, içerikle uyumlu
4. YAZIM VE NOKTALAMA (15p): TDK kuralları
5. İÇERİK ÖZGÜNLÜĞÜ (20p): Özgün, intihal yok
6. ETİK SINIRLAR (20p): Hakaret, saldırı, doğrulanmamış iddia yok

Bilgiler: Yazar: ${author} | Başlık: "${title}" | Tür: ${type} | Kelime: ${wordCount}

METİN:
${text.substring(0, 3000)}

SADECE JSON yanıt ver, başka hiçbir şey yazma:
{"toplam_puan":<0-100>,"kriterler":[{"ad":"Dil ve Üslup","puan":<0-20>,"max":20,"yorum":"<Türkçe>"},{"ad":"Kelime Sınırı","puan":<0-15>,"max":15,"yorum":"<Türkçe>"},{"ad":"Başlık Uyumu","puan":<0-10>,"max":10,"yorum":"<Türkçe>"},{"ad":"Yazım ve Noktalama","puan":<0-15>,"max":15,"yorum":"<Türkçe>"},{"ad":"İçerik Özgünlüğü","puan":<0-20>,"max":20,"yorum":"<Türkçe>"},{"ad":"Etik Sınırlar","puan":<0-20>,"max":20,"yorum":"<Türkçe>"}],"genel_degerlendirme":"<2-3 cümle>","gelistirme_onerileri":["<öneri1>","<öneri2>","<öneri3>"]}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: errData.error?.message || 'API hatası' });
    }

    const data = await response.json();
    const raw = data.content.map(b => b.text || '').join('');
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
    return res.status(200).json(parsed);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
