import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { AllExceptionsFilter } from './../src/common/http-exception.filter';
import { EspnService } from './../src/espn/espn.service';
import { HealthModule } from './../src/health/health.module';

function scoreboardEvent(date: string, id = '401585601') {
  return {
    id,
    name: 'Away at Home',
    shortName: 'AWY @ HOM',
    date,
    status: {
      type: {
        state: 'post',
        description: 'Final',
        shortDetail: 'Final',
      },
      period: 4,
      displayClock: '0.0',
    },
    competitions: [
      {
        date,
        venue: { fullName: 'Arena' },
        competitors: [
          {
            homeAway: 'home',
            score: '110',
            team: {
              id: '1',
              displayName: 'Home',
              abbreviation: 'HOM',
              logos: [{ href: 'https://logo/1.png' }],
            },
          },
          {
            homeAway: 'away',
            score: '108',
            team: {
              id: '2',
              displayName: 'Away',
              abbreviation: 'AWY',
              logos: [{ href: 'https://logo/2.png' }],
            },
          },
        ],
      },
    ],
  };
}

const espnStub = {
  getStandings: jest.fn().mockResolvedValue({
    children: [
      {
        id: '5',
        name: 'Eastern Conference',
        abbreviation: 'East',
        standings: {
          seasonDisplayName: '2025-26',
          entries: [
            {
              team: {
                id: '2',
                name: 'Celtics',
                displayName: 'Boston Celtics',
                shortDisplayName: 'Celtics',
                abbreviation: 'BOS',
                logos: [{ href: 'https://logo/2.png' }],
                color: '008348',
              },
              stats: [
                { name: 'playoffSeed', value: 1 },
                { name: 'wins', value: 50 },
                { name: 'losses', value: 20 },
              ],
            },
          ],
        },
      },
    ],
  }),
  getScheduleCalendar: jest.fn().mockRejectedValue(new Error('no calendar')),
  getScoreboard: jest.fn().mockImplementation((espnDate?: string) => {
    if (espnDate === '20260114') {
      return Promise.resolve({
        events: [scoreboardEvent('2026-01-14T20:00:00.000Z')],
      });
    }
    return Promise.resolve({ events: [] });
  }),
  getGameSummary: jest.fn().mockImplementation((gameId: string) => {
    if (gameId === '404404') {
      return Promise.resolve({});
    }

    return Promise.resolve({
      header: {
        id: gameId,
        name: 'Away at Home',
        date: '2026-01-14T20:00:00.000Z',
        competitions: [
          {
            date: '2026-01-14T20:00:00.000Z',
            status: {
              type: {
                state: 'post',
                shortDetail: 'Final',
                description: 'Final',
              },
              period: 4,
              displayClock: '0.0',
            },
            competitors: [
              {
                homeAway: 'home',
                score: '110',
                team: {
                  id: '1',
                  displayName: 'Home',
                  abbreviation: 'HOM',
                  logos: [{ href: 'https://logo/1.png' }],
                },
                linescores: [],
              },
              {
                homeAway: 'away',
                score: '108',
                team: {
                  id: '2',
                  displayName: 'Away',
                  abbreviation: 'AWY',
                  logos: [{ href: 'https://logo/2.png' }],
                },
                linescores: [],
              },
            ],
          },
        ],
      },
      boxscore: { teams: [], players: [] },
      leaders: [],
      gameInfo: { venue: { fullName: 'Arena' } },
    });
  }),
  getTeam: jest.fn().mockResolvedValue({}),
};

describe('API (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EspnService)
      .useValue(espnStub)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /standings returns mapped conference standings', async () => {
    const response = await request(app.getHttpServer())
      .get('/standings')
      .expect(200);

    expect(response.body).toMatchObject({
      season: '2025-26',
      conferences: [
        {
          name: 'Eastern Conference',
          teams: [
            {
              displayName: 'Boston Celtics',
              seed: 1,
              wins: 50,
              losses: 20,
              playoffStatus: 'playoff',
            },
          ],
        },
      ],
    });
  });

  it('GET /games/schedule returns games for a local date', async () => {
    const response = await request(app.getHttpServer())
      .get('/games/schedule?date=2026-01-14')
      .expect(200);

    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: '401585601',
          date: '2026-01-14T20:00:00.000Z',
        }),
      ]),
    );
  });

  it('GET /games/schedule/nearest finds the closest date with games', async () => {
    const response = await request(app.getHttpServer())
      .get('/games/schedule/nearest?date=2026-01-15&direction=before')
      .expect(200);

    expect(response.body).toEqual({ date: '2026-01-14' });
  });

  it('GET /games/:gameId returns a mapped game summary', async () => {
    const response = await request(app.getHttpServer())
      .get('/games/401585601')
      .expect(200);

    expect(response.body).toMatchObject({
      id: '401585601',
      name: 'Away at Home',
      status: 'final',
      homeScore: 110,
      awayScore: 108,
    });
  });

  it('GET /games/:gameId returns 404 when ESPN has no competition', async () => {
    const response = await request(app.getHttpServer())
      .get('/games/404404')
      .expect(404);

    expect(response.body).toMatchObject({
      statusCode: 404,
      path: '/games/404404',
      message: 'Game 404404 not found',
    });
  });

  it('GET /games/live/:id returns 404 for an unknown simulation', async () => {
    const response = await request(app.getHttpServer())
      .get('/games/live/not-a-real-sim')
      .expect(404);

    expect(response.body).toMatchObject({
      statusCode: 404,
      message: 'Game not-a-real-sim not found',
    });
  });

  it('GET /teams/:id returns 404 when ESPN has no team payload', async () => {
    const response = await request(app.getHttpServer())
      .get('/teams/999')
      .expect(404);

    expect(response.body).toMatchObject({
      statusCode: 404,
      message: 'Team 999 not found',
    });
  });

  it('GET /shots/heatmap without playerId returns a normalized 400 error', async () => {
    const response = await request(app.getHttpServer())
      .get('/shots/heatmap')
      .expect(400);

    const body = response.body as { timestamp?: unknown; message?: string[] };
    expect(response.body).toMatchObject({
      statusCode: 400,
      path: '/shots/heatmap',
    });
    expect(body.message).toEqual(
      expect.arrayContaining(['playerId is required']),
    );
    expect(typeof body.timestamp).toBe('string');
  });

  it('GET /games/schedule rejects a malformed date', async () => {
    const response = await request(app.getHttpServer())
      .get('/games/schedule?date=31-01-2026')
      .expect(400);

    const body = response.body as { message?: string[] };
    expect(body.message).toEqual(
      expect.arrayContaining(['date must use YYYY-MM-DD format']),
    );
  });

  it('GET /news rejects a limit above the allowed range', async () => {
    await request(app.getHttpServer()).get('/news?limit=500').expect(400);
  });

  it('GET /games/:gameId rejects a non-numeric id', async () => {
    await request(app.getHttpServer()).get('/games/not-a-game').expect(400);
  });

  it('GET /health/live passes without reaching any upstream', async () => {
    const response = await request(app.getHttpServer())
      .get('/health/live')
      .expect(200);

    expect(response.body).toMatchObject({ status: 'ok' });
  });

  it('GET /unknown-route returns a normalized 404 error', async () => {
    const response = await request(app.getHttpServer())
      .get('/unknown-route')
      .expect(404);

    expect(response.body).toMatchObject({
      statusCode: 404,
      path: '/unknown-route',
    });
  });

  it('reuses an inbound request id and reports it on errors', async () => {
    const response = await request(app.getHttpServer())
      .get('/unknown-route')
      .set('x-request-id', 'e2e-correlation-id')
      .expect(404);

    expect(response.headers['x-request-id']).toBe('e2e-correlation-id');
    expect(response.body).toMatchObject({ requestId: 'e2e-correlation-id' });
  });

  it('generates a request id when the client does not send one', async () => {
    const response = await request(app.getHttpServer())
      .get('/unknown-route')
      .expect(404);

    const body = response.body as { requestId?: string };
    expect(body.requestId).toEqual(expect.any(String));
    expect(response.headers['x-request-id']).toBe(body.requestId);
  });
});

describe('API throttling (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([{ ttl: 60_000, limit: 2 }]),
        HealthModule,
      ],
      providers: [
        { provide: APP_GUARD, useClass: ThrottlerGuard },
        { provide: APP_FILTER, useClass: AllExceptionsFilter },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 429 after the request limit is exceeded', async () => {
    await request(app.getHttpServer()).get('/health/live').expect(200);
    await request(app.getHttpServer()).get('/health/live').expect(200);

    const response = await request(app.getHttpServer())
      .get('/health/live')
      .expect(429);

    expect(response.body).toMatchObject({
      statusCode: 429,
      path: '/health/live',
    });
  });
});
