import { NotFoundException } from '@nestjs/common';
import { AxiosError, AxiosHeaders } from 'axios';
import { CacheService } from '../cache/cache.service';
import { EspnService } from '../espn/espn.service';
import { TeamsService } from './teams.service';

function upstreamNotFound(): AxiosError {
  const error = new AxiosError('not found');
  error.response = {
    status: 404,
    statusText: '',
    data: null,
    headers: new AxiosHeaders(),
    config: { headers: new AxiosHeaders() },
  };
  return error;
}

describe('TeamsService.findOne', () => {
  let service: TeamsService;
  let espn: { getTeam: jest.Mock };

  beforeEach(() => {
    espn = { getTeam: jest.fn() };
    service = new TeamsService(
      espn as unknown as EspnService,
      new CacheService(),
    );
  });

  it('maps an ESPN team payload', async () => {
    espn.getTeam.mockResolvedValue({
      team: {
        id: '13',
        name: 'Lakers',
        abbreviation: 'LAL',
        displayName: 'Los Angeles Lakers',
        logos: [{ href: 'https://logo/13.png' }],
        color: '552583',
        alternateColor: 'fdb927',
        location: 'Los Angeles',
        record: { items: [{ summary: '40-20' }] },
      },
    });

    await expect(service.findOne('13')).resolves.toMatchObject({
      id: '13',
      displayName: 'Los Angeles Lakers',
      logo: 'https://logo/13.png',
      record: '40-20',
    });
  });

  it('turns an upstream 404 into a NotFoundException', async () => {
    espn.getTeam.mockRejectedValue(upstreamNotFound());

    await expect(service.findOne('999')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects a 200 response without a team', async () => {
    espn.getTeam.mockResolvedValue({});

    await expect(service.findOne('999')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
