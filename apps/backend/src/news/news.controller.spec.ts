import { NewsController } from './news.controller';
import { NewsService } from './news.service';

describe('NewsController', () => {
  let controller: NewsController;
  let news: { findAll: jest.Mock };

  beforeEach(() => {
    news = { findAll: jest.fn() };
    controller = new NewsController(news as unknown as NewsService);
  });

  it('defaults limit to 12 and offset to 0', () => {
    const payload = { articles: [] };
    news.findAll.mockReturnValue(payload);

    expect(controller.findAll({})).toBe(payload);
    expect(news.findAll).toHaveBeenCalledWith(12, 0);
  });

  it('forwards explicit limit and offset', () => {
    news.findAll.mockReturnValue({ articles: [] });

    controller.findAll({ limit: 5, offset: 10 });

    expect(news.findAll).toHaveBeenCalledWith(5, 10);
  });
});
