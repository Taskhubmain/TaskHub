import React from 'react';

interface NoTranslateProps {
  children: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export function NoTranslate({ children, className = '', as: Component = 'div' }: NoTranslateProps) {
  return (
    <Component className={`wg-notranslate ${className}`.trim()} data-no-translate="true">
      {children}
    </Component>
  );
}
