import { Injectable } from '@nestjs/common';
import { EspnNewsArticle, EspnService } from '../espn/espn.service';
import { mapNewsArticle } from './news.mapper';

@Injectable()
export class NewsService {
  constructor(private readonly espn: EspnService) {}

  async findAll(limit = 12) {
    const data = (await this.espn.getNews()) as { articles?: EspnNewsArticle[] };
    const articles = data.articles ?? [];

    return articles.slice(0, limit).map((article) => mapNewsArticle(article));
  }
}
