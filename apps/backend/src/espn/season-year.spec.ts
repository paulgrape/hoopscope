import { isUnstartedCurrentSeason, isUnstartedEspnSeason } from './season-year';

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
