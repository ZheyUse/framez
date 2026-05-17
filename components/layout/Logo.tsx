'use client';

import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: 80,
  md: 110,
  lg: 150,
};

export function Logo({ size = 'md' }: LogoProps) {
  return (
    <Link
      href="/"
      className="flex items-center transition-all duration-200 hover:scale-110 hover:opacity-90"
    >
      <svg
        viewBox="0 0 1080 1080"
        style={{ width: sizes[size], height: 'auto' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path fill="#ffffff" d="M125.26,488.63H86.85v-9.51H67.49v61.25L96.38,524.2v39L67.49,579.12v83.47H28.76V440.4h96.5Z"/>
        <path fill="#ffffff" d="M239.85,439.75v84.12h-38.4v-18.4l-19.38,10.8v146H143.35V439.75h38.72v32.37Z"/>
        <path fill="#ffffff" d="M350.33,662.28H311.59V630.22l-57.76,32.06V551.82l57.76-32.4V478.81h-19v19.35H253.83v-58.1h96.5Zm-38.74-87V558.48l-19,10.8v27.28l19-10.46Z"/>
        <path fill="#ffffff" d="M517.63,662H478.9V500.38l-19.36,10.49V662H420.8V510.87l-19.36-10.49V662H362.72V439.75l77.61,43.17,77.3-43.17Z"/>
        <path fill="#ffffff" d="M630.32,662.59H533.49V440.4h96.83V546.73l-58.09,32.39v44.75h19.36V602.3h38.73ZM591.59,479.12H572.23v60.94l19.36-10.74Z"/>
        <path fill="#aaff00" d="M891.48,556.54h150.24L904.62,662.27H663.5V500.33H793.57l77.86-60.11H663.5V417.41h387.74L914.13,523.15H779.93V642.64Z"/>
      </svg>
    </Link>
  );
}