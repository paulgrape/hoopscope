import { Injectable } from '@nestjs/common';
import { EspnService } from '../espn/espn.service';

type EspnNewsArticle = {
  id: number;
  type?: string;
  headline: string;
  description?: string;
  published?: string;
  lastModified?: string;
  byline?: string;
  images?: Array<{
    type?: string;
    url?: string;
    caption?: string;
    width?: number;
    height?: number;
  }>;
  categories?: Array<{
    type?: string;
    description?: string;
  }>;
  links?: {
    web?: { href?: string };
  };
};

@Injectable()
export class NewsService {
  constructor(private readonly espn: EspnService) {}

  async findAll(limit = 12) {
    const data = (await this.espn.getNews()) as { articles?: EspnNewsArticle[] };
    const articles = data.articles ?? [];

    return articles.slice(0, limit).map((article) => this.mapArticle(article));
  }

  private mapArticle(article: EspnNewsArticle) {
    const headerImage =
      article.images?.find((image) => image.type === 'header') ?? article.images?.[0];

    const teams =
      article.categories
        ?.filter((category) => category.type === 'team')
        .map((category) => category.description)
        .filter((name): name is string => Boolean(name)) ?? [];

    return {
      id: article.id,
      type: article.type ?? 'Story',
      headline: article.headline,
      description: article.description ?? '',
      published: article.published ?? article.lastModified ?? null,
      imageUrl: headerImage?.url ?? null,
      imageCaption: headerImage?.caption ?? null,
      url: article.links?.web?.href ?? null,
      byline: article.byline ?? null,
      teams,
    };
  }
}
