import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LeadersQueryDto } from './leaders-query.dto';
import { LeadersService } from './leaders.service';

@ApiTags('leaders')
@Controller('leaders')
export class LeadersController {
  constructor(private readonly leadersService: LeadersService) {}

  @Get()
  @ApiOperation({ summary: 'Get qualified NBA per-game season leaders' })
  findAll(@Query() query: LeadersQueryDto) {
    return this.leadersService.findAll(query);
  }
}
