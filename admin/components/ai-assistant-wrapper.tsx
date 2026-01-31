'use client';

import dynamic from 'next/dynamic';

// Dynamically import AIAssistant with no SSR to prevent hydration issues
const AIAssistant = dynamic(
  () => import('./ai-assistant').then((mod) => mod.AIAssistant),
  { ssr: false }
);

export function AIAssistantWrapper() {
  return <AIAssistant />;
}
