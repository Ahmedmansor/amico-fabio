/** Real author identity is an editorial input; no invented publication default. */
export const authors: Readonly<Record<string, { name: string; type: 'Person' | 'Organization'; url?: string }>> = {};
