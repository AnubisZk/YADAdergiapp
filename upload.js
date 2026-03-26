import crypto from 'crypto';

const MAKALE_FOLDER = '1c0RdVN8WbCC_h7U8SNupukUG9AaDje4F';
const ETIK_FOLDER   = '1pbbxMe4wnuWykNFQ5lekxK94MSMj138x';

async function getAccessToken() {
  const sa = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
  const now = Math.floor(Date.now() / 1000);
  const header  = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/drive.file',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  })).toString('base64url');

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(`${header}.${payload}`);
  const sig = sign.sign(sa.private_key, 'base64url');
  const jwt = `${header}.${payload}.${sig}`;

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const data = await resp.json();
  if (!data.access_token) throw new Error('Token alınamadı: ' + JSON.stringify(data));
  return data.access_token;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // fileData: base64 string, fileName: string, mimeType: string, folder: 'makale' | 'etik'
    const { fileData, fileName, mimeType, folder } = req.body;
    if (!fileData || !fileName) return res.status(400).json({ error: 'Dosya verisi eksik.' });

    const folderId = folder === 'etik' ? ETIK_FOLDER : MAKALE_FOLDER;
    const token = await getAccessToken();

    // Multipart upload to Drive
    const fileBuffer = Buffer.from(fileData, 'base64');
    const boundary = 'boundary_yada_' + Date.now();
    const metadata = JSON.stringify({ name: fileName, parents: [folderId] });

    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`),
      Buffer.from(metadata),
      Buffer.from(`\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`),
      fileBuffer,
      Buffer.from(`\r\n--${boundary}--`),
    ]);

    const uploadResp = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
          'Content-Length': body.length,
        },
        body,
      }
    );

    const uploadData = await uploadResp.json();
    if (!uploadResp.ok) throw new Error(uploadData.error?.message || 'Drive yükleme hatası');

    return res.status(200).json({ success: true, fileId: uploadData.id, name: uploadData.name });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
