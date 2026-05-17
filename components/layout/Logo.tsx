'use client';

import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: { width: 100, height: 24 },
  md: { width: 140, height: 34 },
  lg: { width: 180, height: 44 },
};

export function Logo({ size = 'md' }: LogoProps) {
  const { width, height } = sizes[size];

  return (
    <Link
      href="/"
      className="flex items-center transition-all duration-200 hover:scale-105 hover:opacity-90"
    >
      <Image
        src="/logo.svg"
        alt="FrameZ Logo"
        width={width}
        height={height}
        priority
        className="h-auto w-auto"
      />
    </Link>
  );
}