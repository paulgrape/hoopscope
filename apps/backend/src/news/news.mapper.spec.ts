import { EspnNewsArticle } from '../espn/espn.service';
import { mapNewsArticle } from './news.mapper';

const baseArticle = {
  id: 42,
  headline: 'Big win for the home team',
} as EspnNewsArticle;

describe('mapNewsArticle', () => {
  it('maps a fully populated article', () => {
    const article = {
      ...baseArticle,
      type: 'Recap',
      description: 'A thrilling finish.',
      published: '2026-01-01T00:00:00Z',
      byline: 'Jane Doe',
      images: [
        { type: 'header', url: 'https://img/header.jpg', caption: 'The arena' },
        { type: 'inline', url: 'https://img/inline.jpg' },
      ],
      links: { web: { href: 'https://espn.com/story' } },
      categories: [
        { type: 'team', description: 'Boston Celtics' },
        { type: 'league', description: 'NBA' },
        { type: 'team', description: undefined },
      ],
    } as unknown as EspnNewsArticle;

    expect(mapNewsArticle(article)).toEqual({
      id: 42,
      type: 'Recap',
      headline: 'Big win for the home team',
      description: 'A thrilling finish.',
      published: '2026-01-01T00:00:00Z',
      imageUrl: 'https://img/header.jpg',
      imageCaption: 'The arena',
      url: 'https://espn.com/story',
      byline: 'Jane Doe',
      teams: ['Boston Celtics'],
    });
  });

  it('applies defaults for a sparse article', () => {
    const mapped = mapNewsArticle(baseArticle);

    expect(mapped).toEqual({
      id: 42,
      type: 'Story',
      headline: 'Big win for the home team',
      description: '',
      published: null,
      imageUrl: null,
      imageCaption: null,
      url: null,
      byline: null,
      teams: [],
    });
  });

  it('falls back to the first image when no header image exists', () => {
    const article = {
      ...baseArticle,
      images: [{ type: 'inline', url: 'https://img/only.jpg' }],
    } as unknown as EspnNewsArticle;

    expect(mapNewsArticle(article).imageUrl).toBe('https://img/only.jpg');
  });

  it('falls back to lastModified when published is missing', () => {
    const article = {
      ...baseArticle,
      lastModified: '2026-02-02T00:00:00Z',
    } as unknown as EspnNewsArticle;

    expect(mapNewsArticle(article).published).toBe('2026-02-02T00:00:00Z');
  });
});
