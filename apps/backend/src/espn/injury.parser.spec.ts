import { findPlayerInjury } from './injury.parser';

describe('findPlayerInjury', () => {
  it('reads the live injuries feed, link id, body part, and return date', () => {
    const injury = findPlayerInjury(
      {
        injuries: [
          {
            injuries: [
              {
                status: 'Out',
                date: '2026-11-13T00:06Z',
                shortComment:
                  'Gueye (foot) is ready to begin on-court activities.',
                athlete: {
                  displayName: 'Mouhamed Gueye',
                  links: [
                    {
                      rel: ['playercard', 'desktop', 'athlete'],
                      href: 'https://www.espn.com/nba/player/_/id/4397018/mouhamed-gueye',
                    },
                  ],
                },
                type: { name: 'INJURY_STATUS_OUT', description: 'out' },
                details: { type: 'Foot', returnDate: '2026-12-12' },
              },
            ],
          },
        ],
      },
      '4397018',
    );

    expect(injury).toEqual({
      status: 'Out',
      type: 'Foot',
      detail: 'Gueye (foot) is ready to begin on-court activities.',
      returnDate: '2026-12-12',
    });
  });

  it('still matches a legacy items report by athlete id', () => {
    const injury = findPlayerInjury(
      {
        items: [
          {
            injuries: [
              {
                status: 'Out',
                shortComment: 'James is out.',
                athlete: { id: '1966' },
                type: { name: 'Knee' },
                date: '2026-11-13T00:06Z',
              },
            ],
          },
        ],
      },
      '1966',
    );

    expect(injury).toEqual({
      status: 'Out',
      type: 'Knee',
      detail: 'James is out.',
      returnDate: null,
    });
  });

  it('returns null when the player is not on the report', () => {
    expect(findPlayerInjury({ injuries: [] }, '1')).toBeNull();
  });
});
