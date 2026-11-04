export type Adventure = 'sea' | 'desert' | 'both';

export function programAdventures(tripIds: readonly string[], trips: readonly {id:string;category:string}[]): Adventure[] {
  const categories = tripIds.map(id => {
    const trip = trips.find(item => item.id === id);
    if (!trip) throw new Error(`[blu:journey] Unknown included trip ${id}.`);
    return trip.category;
  });
  const adventures: Adventure[] = [];
  if (categories.includes('sea')) adventures.push('sea');
  if (categories.includes('desert')) adventures.push('desert');
  if (adventures.length === 2) adventures.push('both');
  return adventures;
}
