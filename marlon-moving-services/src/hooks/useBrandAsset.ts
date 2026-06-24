import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

type BrandAsset = { url: string; alt_text: string | null };

const cache = new Map<string, BrandAsset>();

export function useBrandAsset(key: string): BrandAsset {
  const [asset, setAsset] = useState<BrandAsset>(() => cache.get(key) ?? { url: '', alt_text: null });

  useEffect(() => {
    if (cache.has(key)) return;
    let cancelled = false;

    (supabase as any)
      .from('brand_assets')
      .select('url, alt_text')
      .eq('asset_key', key)
      .maybeSingle()
      .then(({ data }: { data: BrandAsset | null }) => {
        if (cancelled || !data) return;
        cache.set(key, data);
        setAsset(data);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [key]);

  return asset;
}
