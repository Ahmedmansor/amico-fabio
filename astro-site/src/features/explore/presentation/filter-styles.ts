export function filterClass(category: string, active: boolean): string {
  const base = 'inline-flex items-center justify-center h-8 px-3 rounded-full text-xs min-w-[64px] transition-colors';
  const style = category === 'bundles'
    ? active ? 'bg-gold text-white font-bold border border-gold shadow-[0_0_24px_rgba(212,175,55,0.8)]' : 'bg-black/90 text-gold border border-gray-700 hover:border-gold shadow-none'
    : active ? 'bg-transparent text-white border border-gold' : 'bg-black/60 text-white border border-gray-700 hover:border-gray-500';
  return `${base} ${style}`;
}
