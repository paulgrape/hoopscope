import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { NewsService } from './news.service';

@ApiTags('news')
@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  @ApiOperation({ summary: 'Get latest NBA news from ESPN' })
  findAll(@Query('limit') limit?: string) {
    const parsedLimit = limit
      ? Math.min(Math.max(Number.isFinite(Number(limit)) ? Number(limit) : 12, 1), 30)
      : 12;
    return this.newsService.findAll(parsedLimit);
  }
}
