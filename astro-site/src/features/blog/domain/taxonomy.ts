export const destinations = ['cairo', 'luxor', 'aswan', 'sharm'] as const;
export const interests = ['history', 'diving', 'desert', 'food', 'tips', 'stories'] as const;
export const reservedSlugs = ['page', 'destinations', 'interests'] as const;

export type Destination = typeof destinations[number];
export type Interest = typeof interests[number];
