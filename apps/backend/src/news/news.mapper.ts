import { EspnNewsArticle } from '../espn/espn.service';

export type MappedNewsArticle = {
  id: number;
  type: string;
  headline: string;
  description: string;
  published: string | null;
  imageUrl: string | null;
  imageCaption: string | null;
  url: string | null;
  byline: string | null;
  teams: string[];
};

export function mapNewsArticle(article: EspnNewsArticle): MappedNewsArticle {
  const headerImage =
    article.images?.find((image) => image.type === 'header') ??
    article.images?.[0];

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
