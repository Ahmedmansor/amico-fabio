// Public published-CSV endpoints copied from legacy assets/js/core/api.js.
const sheet = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQvcO6TH0o6KOqLY6vy-jp-ZcBEeLq_dGmAzmcOCWUeIOSfOAJLPJAFa1D80a4Bv-XVLbdYOJxclEwj/pub';
const csv = (gid: string) => `${sheet}?gid=${gid}&single=true&output=csv`;
export const sheetSources = {
  Trips_Prices: csv('0'), Global_Settings: csv('1501122855'),
  Trip_Addons: csv('468088862'), Packages: csv('457429210'),
} as const;
export type SheetName = keyof typeof sheetSources;
export const requiredColumns: Record<SheetName, readonly string[]> = {
  Trips_Prices: ['trip_id','p_adult','d_adult','p_child','d_child','min_pax','location','category','featured','badge_it','badge_en','is_active'],
  Packages: ['package_id','included_trip_ids','p_adult','d_adult','p_child','d_child','min_pax','location','category','badge_key','is_active'],
  Trip_Addons: ['trip_id','addon_id','label_it','label_en','price','is_active'],
  Global_Settings: ['key','val_it','val_en','is_active','start_date','end_date'],
};
