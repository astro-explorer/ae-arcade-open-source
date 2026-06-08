const thumbUrlCache = new Map<number, string>();

export async function fetchAssetThumbnail(assetId: number): Promise<string | null> {
  if (thumbUrlCache.has(assetId)) {
    // console.log(`🧠 Cache hit for asset ${assetId}`);
    return thumbUrlCache.get(assetId)!;
  }

  try {
    const res = await fetch(`https://mainnet.api.perawallet.app/v1/public/assets/${assetId}`);
    if (!res.ok) throw new Error(`Failed to fetch asset ${assetId}`);
    const data = await res.json();
    const thumbUrl = data.collectible?.thumbnail_url || null;

    if (thumbUrl) {
      thumbUrlCache.set(assetId, thumbUrl);
    }

    return thumbUrl;
  } catch (err) {
    console.error(`❌ Error loading thumbnail for asset ${assetId}:`, err);
    return null;
  }
}