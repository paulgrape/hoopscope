import { Injectable } from '@nestjs/common';
import { EspnService } from '../espn/espn.service';
import { SimulationService } from './simulation.service';

@Injectable()
export class GamesService {
  constructor(
    private readonly espn: EspnService,
    private readonly simulation: SimulationService,
  ) {}

  getActiveGames() {
    return this.simulation.getActiveGames();
  }
  getGame(id: string) {
    return this.simulation.getGame(id);
  }

  async getScoreboard() {
    const data: any = await this.espn.getScoreboard();
    return (
      data.events?.map((e: any) => ({
        id: e.id,
        name: e.name,
        date: e.date,
        status: e.status?.type?.description,
        homeTeam: e.competitions?.[0]?.competitors?.find(
          (c: any) => c.homeAway === 'home',
        ),
        awayTeam: e.competitions?.[0]?.competitors?.find(
          (c: any) => c.homeAway === 'away',
        ),
      })) ?? []
    );
  }
}
