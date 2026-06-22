import { Injectable } from '@nestjs/common';
import { EspnNewsArticle, EspnService } from '../espn/espn.service';
import { mapNewsArticle } from './news.mapper';

@Injectable()
export class NewsService {
  constructor(private readonly espn: EspnService) {}

  async findAll(limit = 12, offset = 0) {
    const data = (await this.espn.getNews()) as { articles?: EspnNewsArticle[] };
    const articles = data.articles ?? [];

    return {
      articles: articles.slice(offset, offset + limit).map((article) => mapNewsArticle(article)),
      total: articles.length,
    };
  }
}
