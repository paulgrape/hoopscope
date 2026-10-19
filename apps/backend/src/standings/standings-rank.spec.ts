import { assignPlaces, type RankableTeam } from './standings-rank';

function team(
  id: string,
  wins: number,
  losses: number,
  extras: Partial<
    Pick<RankableTeam, 'conference' | 'division' | 'differential'>
  > = {},
): RankableTeam {
  return {
    id,
    wins,
    losses,
    conference: extras.conference ?? { wins: 0, losses: 0 },
    division: extras.division ?? { wins: 0, losses: 0 },
    differential: extras.differential ?? 0,
  };
}

function places(teams: RankableTeam[]): number[] {
  return assignPlaces(teams).map((entry) => entry.seed);
}

function order(teams: RankableTeam[]): string[] {
  return assignPlaces(teams).map((entry) => entry.id);
}

describe('assignPlaces', () => {
  it('numbers an unplayed conference 1 through n in feed order', () => {
    const teams = [
      team('1', 0, 0),
      team('2', 0, 0),
      team('4', 0, 0),
      team('5', 0, 0),
    ];

    expect(order(teams)).toEqual(['1', '2', '4', '5']);
    expect(places(teams)).toEqual([1, 2, 3, 4]);
  });

  it('keeps unplayed teams in default order between the winner and the loser', () => {
    const teams = [
      team('1', 0, 0),
      team('2', 1, 0),
      team('4', 0, 0),
      team('5', 0, 1),
    ];

    expect(order(teams)).toEqual(['2', '1', '4', '5']);
    expect(places(teams)).toEqual([1, 2, 3, 4]);
  });

  it('puts a .500 team above unplayed teams and a losing team below them', () => {
    const teams = [team('5', 0, 1), team('1', 0, 0), team('2', 1, 1)];

    expect(order(teams)).toEqual(['2', '1', '5']);
    expect(places(teams)).toEqual([1, 2, 3]);
  });

  it('ranks a longer .500 record above a shorter one', () => {
    const teams = [team('4', 5, 5), team('2', 10, 10)];

    expect(order(teams)).toEqual(['2', '4']);
    expect(places(teams)).toEqual([1, 2]);
  });

  it('ranks fewer losses above more losses when both teams are winless', () => {
    const teams = [team('4', 0, 2), team('2', 0, 1)];

    expect(order(teams)).toEqual(['2', '4']);
    expect(places(teams)).toEqual([1, 2]);
  });

  it('shares a place when played records and tiebreakers match', () => {
    const teams = [
      team('1', 12, 4),
      team('2', 10, 6),
      team('4', 10, 6),
      team('5', 8, 8),
    ];

    expect(order(teams)).toEqual(['1', '2', '4', '5']);
    expect(places(teams)).toEqual([1, 2, 2, 4]);
  });

  it('skips to the next open place after a tie at the top', () => {
    const teams = [
      team('2', 1, 0),
      team('17', 1, 0),
      team('1', 0, 0),
      team('5', 0, 1),
    ];

    expect(places(teams)).toEqual([1, 1, 3, 4]);
  });

  it('shares the last place when two losers are identical', () => {
    const teams = [
      team('2', 1, 0),
      team('1', 0, 0),
      team('4', 0, 1, { differential: -4 }),
      team('5', 0, 1, { differential: -4 }),
    ];

    expect(places(teams)).toEqual([1, 2, 3, 3]);
  });

  it('uses conference record to separate the same overall record', () => {
    const teams = [
      team('4', 10, 6, { conference: { wins: 4, losses: 6 } }),
      team('2', 10, 6, { conference: { wins: 8, losses: 2 } }),
    ];

    expect(order(teams)).toEqual(['2', '4']);
    expect(places(teams)).toEqual([1, 2]);
  });

  it('uses division record only when both teams share a division', () => {
    const sameDivision = [
      team('17', 10, 10, { division: { wins: 2, losses: 6 } }),
      team('2', 10, 10, { division: { wins: 8, losses: 1 } }),
    ];
    const differentDivisions = [
      team('2', 10, 10, { division: { wins: 8, losses: 1 } }),
      team('4', 10, 10, { division: { wins: 1, losses: 8 } }),
    ];

    expect(order(sameDivision)).toEqual(['2', '17']);
    expect(places(sameDivision)).toEqual([1, 2]);
    expect(places(differentDivisions)).toEqual([1, 1]);
  });

  it('uses point differential when the records still match', () => {
    const teams = [
      team('4', 10, 6, { differential: -3 }),
      team('2', 10, 6, { differential: 5 }),
    ];

    expect(order(teams)).toEqual(['2', '4']);
    expect(places(teams)).toEqual([1, 2]);
  });

  it('keeps feed order inside a shared place', () => {
    const teams = [
      team('4', 10, 6, { differential: 2 }),
      team('2', 10, 6, { differential: 2 }),
    ];

    expect(order(teams)).toEqual(['4', '2']);
    expect(places(teams)).toEqual([1, 1]);
  });
});
