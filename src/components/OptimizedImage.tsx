import React, { useState, useEffect } from 'react';
import { optimizeImage } from '@/lib/image-optimization';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  quality?: number;
  lazy?: boolean;
}

export function OptimizedImage({
  src,
  alt,
  width,
  quality = 80,
  lazy = true,
  className,
  ...props
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState<string>('');

  useEffect(() => {
    const optimizedSrc = optimizeImage(src, width, quality);
    setImageSrc(optimizedSrc);
  }, [src, width, quality]);

  return (
    <img
      src={imageSrc}
      alt={alt}
      loading={lazy ? 'lazy' : 'eager'}
      className={className}
      {...props}
    />
  );
}
