export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const { url } = req.body || {};

  try {
    if (token && url) {
      const { del } = await import('@vercel/blob');
      await del(url, { token });
      return res.status(200).json({ success: true });
    }
    return res.status(200).json({ success: true, message: 'Simulated delete' });
  } catch (error: any) {
    console.error('Delete upload error:', error);
    return res.status(500).json({ error: error.message || 'Delete failed' });
  }
}
