import {expect,it,vi,afterEach} from 'vitest';
import {acceptedCategory} from 'vanilla-cookieconsent';
import {trackPlannerInquiry} from '../../../../shared/analytics/lead';
vi.mock('vanilla-cookieconsent',()=>({acceptedCategory:vi.fn()}));
afterEach(()=>vi.unstubAllGlobals());
it('tracks only an explicit handoff with consent and static locale context',()=>{
 const gtag=vi.fn();vi.stubGlobal('window',{gtag});vi.mocked(acceptedCategory).mockReturnValue(false);
 trackPlannerInquiry('it');expect(gtag).not.toHaveBeenCalled();
 vi.mocked(acceptedCategory).mockReturnValue(true);trackPlannerInquiry('it');
 expect(gtag).toHaveBeenCalledExactlyOnceWith('event','generate_lead',{event_category:'TripPlanner',channel:'whatsapp',site_language:'it'});
});
