'use client';
import { useState } from 'react';
export function Photo({ src, alt, className = '', eager = false }: { src?: string; alt: string; className?: string; eager?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <div className={'photo-placeholder ' + className} role="img" aria-label={alt}><span>HDH<br /><small>Ảnh minh họa đang cập nhật</small></span></div>;
  // External licensed demo imagery; plain img avoids proxying external files on the server.
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={className} src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" onError={() => setFailed(true)} />;
}
