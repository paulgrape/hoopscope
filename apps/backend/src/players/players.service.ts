import { Injectable } from '@nestjs/common';
import { EspnCoreAthlete, EspnService } from '../espn/espn.service';

@Injectable()
export class PlayersService {
  constructor(private readonly espn: EspnService) {}

  async findOne(id: string) {
    const a: EspnCoreAthlete = await this.espn.getPlayer(id);

    const birthPlace = [
      a.birthPlace?.city,
      a.birthPlace?.state,
      a.birthPlace?.country,
    ]
      .filter(Boolean)
      .join(', ');

    return {
      id: a.id,
      fullName: a.fullName,
      jersey: a.jersey,
      position: a.position?.displayName ?? a.position?.name ?? null,
      headshot: a.headshot?.href ?? null,
      age: a.age,
      height: a.displayHeight,
      weight: a.displayWeight,
      birthPlace: birthPlace || null,
      experience: a.experience?.years ?? 0,
      college: a.college?.name ?? null,
      active: a.active ?? null,
      status: a.status?.name ?? null,
      stats: null,
    };
  }
}
