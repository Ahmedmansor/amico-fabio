export function filterClass(_category:string,active:boolean):string {
  return `explore-filter${active?' is-active':''}`;
}
