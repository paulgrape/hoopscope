import { Injectable } from '@nestjs/common';
import { EspnService } from '../espn/espn.service';

@Injectable()
export class TeamsService {
  constructor(private readonly espn: EspnService) {}

  async findAll() {
    const data: any = await this.espn.getTeams();
    return data.sports[0].leagues[0].teams.map(({ team }: any) => ({
      id: team.id,
      name: team.name,
      abbreviation: team.abbreviation,
      displayName: team.displayName,
      logo: team.logos?.[0]?.href ?? null,
      color: team.color,
      alternateColor: team.alternateColor,
      location: team.location,
    }));
  }

  async findOne(id: string) {
    const data: any = await this.espn.getTeam(id);
    const team = data.team;
    return {
      id: team.id,
      name: team.name,
      abbreviation: team.abbreviation,
      displayName: team.displayName,
      logo: team.logos?.[0]?.href ?? null,
      color: team.color,
      alternateColor: team.alternateColor,
      location: team.location,
      record: team.record?.items?.[0]?.summary ?? null,
    };
  }

  async findRoster(teamId: string) {
    const data: any = await this.espn.getRoster(teamId);
    return data.athletes.flatMap((group: any) =>
      group.items.map((p: any) => ({
        id: p.id,
        fullName: p.fullName,
        jersey: p.jersey,
        position: p.position?.abbreviation ?? null,
        headshot: p.headshot?.href ?? null,
        age: p.age,
        experience: p.experience?.years ?? 0,
      })),
    );
  }
}
