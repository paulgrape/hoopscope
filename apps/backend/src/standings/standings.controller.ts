import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { StandingsService } from './standings.service';

@ApiTags('standings')
@Controller('standings')
export class StandingsController {
  constructor(private readonly standingsService: StandingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get NBA standings by conference from ESPN' })
  findAll() {
    return this.standingsService.findAll();
  }
}
