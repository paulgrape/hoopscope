import {
  isSeasonComplete,
  isUnstartedCurrentSeason,
  isUnstartedEspnSeason,
  mapEspnSeasonType,
  usesLiveStatsTtl,
} from './season-year';

describe('mapEspnSeasonType', () => {
  it('maps ESPN season codes', () => {
    expect(mapEspnSeasonType({ type: 1 })).toBe('preseason');
    expect(mapEspnSeasonType({ type: 2 })).toBe('regular');
    expect(mapEspnSeasonType({ type: 3 })).toBe('playoffs');
    expect(mapEspnSeasonType({ type: 5 })).toBe('play-in');
  });

  it('falls back to the season slug when the code is missing', () => {
    expect(mapEspnSeasonType({ slug: 'preseason' })).toBe('preseason');
    expect(mapEspnSeasonType({ slug: 'regular-season' })).toBe('regular');
    expect(mapEspnSeasonType({ slug: 'post-season' })).toBe('playoffs');
    expect(mapEspnSeasonType({ slug: 'play-in' })).toBe('play-in');
  });

  it('prefers a known code over a conflicting slug', () => {
    expect(mapEspnSeasonType({ type: 3, slug: 'preseason' })).toBe('playoffs');
  });

  it('returns null for offseason, unknown values, and a missing season', () => {
    expect(mapEspnSeasonType({ type: 4 })).toBeNull();
    expect(mapEspnSeasonType({ type: 4, slug: 'offseason' })).toBeNull();
    expect(mapEspnSeasonType({ slug: 'exhibition' })).toBeNull();
    expect(mapEspnSeasonType(null)).toBeNull();
    expect(mapEspnSeasonType(undefined)).toBeNull();
  });
});

describe('isUnstartedEspnSeason', () => {
  it('treats ESPN type 1 and 4 as unstarted', () => {
    expect(isUnstartedEspnSeason({ year: 2027, type: 1 })).toBe(true);
    expect(isUnstartedEspnSeason({ year: 2026, type: 4 })).toBe(true);
  });

  it('treats regular and postseason as started', () => {
    expect(isUnstartedEspnSeason({ year: 2027, type: 2 })).toBe(false);
    expect(isUnstartedEspnSeason({ year: 2027, type: 3 })).toBe(false);
  });

  it('falls back to season name when type is missing', () => {
    expect(isUnstartedEspnSeason({ name: 'Preseason' })).toBe(true);
    expect(isUnstartedEspnSeason({ name: 'Off Season' })).toBe(true);
    expect(isUnstartedEspnSeason({ name: 'Regular Season' })).toBe(false);
  });
});

describe('isUnstartedCurrentSeason', () => {
  it('is true only for the live year while ESPN is still preseason or offseason', () => {
    const current = { year: 2027, type: 1, name: 'Preseason' };

    expect(isUnstartedCurrentSeason(2027, current)).toBe(true);
    expect(isUnstartedCurrentSeason(2026, current)).toBe(false);
  });

  it('is false once the live year is regular season', () => {
    expect(
      isUnstartedCurrentSeason(2027, {
        year: 2027,
        type: 2,
        name: 'Regular Season',
      }),
    ).toBe(false);
  });
});

describe('isSeasonComplete', () => {
  const regular = { year: 2027, type: 2, name: 'Regular Season' };

  it('treats an older year as complete during the regular season', () => {
    expect(isSeasonComplete(2026, regular)).toBe(true);
    expect(isSeasonComplete(2027, regular)).toBe(false);
    expect(isSeasonComplete(2028, regular)).toBe(false);
  });

  it('treats the live year as complete in the offseason', () => {
    const offseason = { year: 2027, type: 4, name: 'Off Season' };

    expect(isSeasonComplete(2027, offseason)).toBe(true);
    expect(isSeasonComplete(2026, offseason)).toBe(true);
  });
});

describe('usesLiveStatsTtl', () => {
  it('refreshes regular season, play-in, postseason, and a missing type', () => {
    expect(usesLiveStatsTtl({ year: 2027, type: 2 })).toBe(true);
    expect(usesLiveStatsTtl({ year: 2027, type: 3 })).toBe(true);
    expect(usesLiveStatsTtl({ year: 2027, type: 5 })).toBe(true);
    expect(usesLiveStatsTtl({ year: 2027 })).toBe(true);
  });

  it('keeps preseason and offseason on the long cache', () => {
    expect(usesLiveStatsTtl({ year: 2027, type: 1 })).toBe(false);
    expect(usesLiveStatsTtl({ year: 2027, type: 4 })).toBe(false);
  });
});
