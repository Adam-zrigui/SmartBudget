'use client';

import { ReactNode } from 'react';

interface PageAnimationWrapperProps {
  children: ReactNode;
  className?: string;
}

export default function PageAnimationWrapper({
  children,
  className = '',
}: PageAnimationWrapperProps) {
  return (
    <div className={`animate-page-enter ${className}`}>
      {children}
    </div>
  );
}
