'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

export default function HeroActions() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const cachedUser = sessionStorage.getItem('user');
    if (cachedUser) {
      setIsLoggedIn(true);
    }

    fetch('/api/auth/me')
      .then((response) => setIsLoggedIn(response.ok))
      .catch(() => setIsLoggedIn(Boolean(cachedUser)))
      .finally(() => setIsAuthLoading(false));
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-6 justify-center lg:justify-start">
      {!isAuthLoading && !isLoggedIn && (
        <Link href="/auth/register"
          className="px-8 py-3 bg-[#7B2D42] text-white text-[10px] tracking-[0.3em] uppercase hover:bg-[#8A3048] transition-colors">
          Join Now
        </Link>
      )}
      <Link href="/profile"
        className="flex items-center gap-2 text-white text-[10px] tracking-[0.3em] uppercase hover:text-[#C8A96E] transition-colors">
        Explore Benefits <ArrowRightIcon className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
