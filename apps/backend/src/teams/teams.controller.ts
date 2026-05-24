import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TeamsService } from './teams.service';

@ApiTags('teams')
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all 30 NBA teams' })
  findAll() {
    return this.teamsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get team by ID' })
  findOne(@Param('id') id: string) {
    return this.teamsService.findOne(id);
  }

  @Get(':id/roster')
  @ApiOperation({ summary: 'Get team roster' })
  findRoster(@Param('id') id: string) {
    return this.teamsService.findRoster(id);
  }
}
