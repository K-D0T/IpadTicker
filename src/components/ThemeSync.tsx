'use client';

import { useEffect } from 'react';

export default function ThemeSync({ lightMode }: { lightMode: boolean }) {
  useEffect(() => {
    document.documentElement.dataset.theme = lightMode ? 'light' : 'dark';
  }, [lightMode]);

  return null;
}

