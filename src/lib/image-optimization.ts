export function lazyLoadImage(img: HTMLImageElement) {
  if ('loading' in HTMLImageElement.prototype) {
    img.loading = 'lazy';
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const image = entry.target as HTMLImageElement;
          if (image.dataset.src) {
            image.src = image.dataset.src;
            observer.unobserve(image);
          }
        }
      });
    });
    observer.observe(img);
  }
}

export function optimizeImage(url: string, width?: number, quality?: number): string {
  if (!url) return url;

  // If it's a Supabase storage URL, we can add transformation params
  if (url.includes('supabase')) {
    const params = new URLSearchParams();
    if (width) params.append('width', width.toString());
    if (quality) params.append('quality', quality.toString());
    return url + (params.toString() ? '?' + params.toString() : '');
  }

  return url;
}

export function preloadCriticalImages(urls: string[]) {
  urls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    document.head.appendChild(link);
  });
}
