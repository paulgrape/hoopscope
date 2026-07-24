import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { EspnService } from './../src/espn/espn.service';

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

  it('GET /shots/heatmap without playerId returns a normalized 400 error', async () => {
    const response = await request(app.getHttpServer())
      .get('/shots/heatmap')
      .expect(400);

    const body = response.body as { timestamp?: unknown };
    expect(response.body).toMatchObject({
      statusCode: 400,
      message: 'playerId is required',
      path: '/shots/heatmap',
    });
    expect(typeof body.timestamp).toBe('string');
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
});
