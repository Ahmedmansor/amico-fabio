import {describe,it,expect} from 'vitest';
import {effectiveTheme,resolveThemePreference} from '../theme';
describe('theme preference policy',()=>{
  it('follows the device only when no explicit theme is selected',()=>{
    expect(effectiveTheme('system',true)).toBe('dark');
    expect(effectiveTheme('system',false)).toBe('light');
    expect(effectiveTheme('light',true)).toBe('light');
    expect(effectiveTheme('dark',false)).toBe('dark');
  });
  it('ignores invalid or unavailable stored preferences',()=>{
    for(const value of [null,undefined,'','LIGHT','invalid',{},1]){
      expect(resolveThemePreference(value)).toBe('system');
      expect(effectiveTheme(value,true)).toBe('dark');
    }
  });
});
