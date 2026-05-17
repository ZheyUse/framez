'use client';

import { Logo } from './Logo';

interface NavbarProps {
  rightContent?: React.ReactNode;
}

export function Navbar({ rightContent }: NavbarProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-[#2a2a2a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        <Logo size="sm" />
        {rightContent && <div>{rightContent}</div>}
      </div>
    </nav>
  );
}