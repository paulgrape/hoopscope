import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { NewsQueryDto } from './dto/news-query.dto';
import { NewsService } from './news.service';

const DEFAULT_LIMIT = 12;

@ApiTags('news')
@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  @ApiOperation({ summary: 'Get latest NBA news from ESPN' })
  findAll(@Query() query: NewsQueryDto) {
    return this.newsService.findAll(
      query.limit ?? DEFAULT_LIMIT,
      query.offset ?? 0,
    );
  }
}
