import type { IncomingMessage, ServerResponse } from 'http';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;

  try {
    if (token) {
      const { put } = await import('@vercel/blob');
      // If deployed on Vercel with token
      const filename = `belga-${Date.now()}`;
      const blob = await put(filename, req, {
        access: 'public',
        token,
      });
      return res.status(200).json({ url: blob.url });
    } else {
      // Development fallback
      return res.status(200).json({ 
        url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80',
        notice: 'Uploaded via local fallback mode. Configure BLOB_READ_WRITE_TOKEN in production.' 
      });
    }
  } catch (error: any) {
    console.error('Upload handler error:', error);
    return res.status(500).json({ error: error.message || 'Upload failed' });
  }
}
