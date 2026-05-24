import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../cache/cache.service';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class EspnService {
  private readonly http: AxiosInstance;
  private readonly logger = new Logger(EspnService.name);

  // TTLs
  private readonly TTL_TEAMS = 24 * 60 * 60 * 1000; // 24h
  private readonly TTL_PLAYERS = 24 * 60 * 60 * 1000;
  private readonly TTL_SCORES = 60 * 1000; // 60s

  constructor(
    private readonly config: ConfigService,
    private readonly cache: CacheService,
  ) {
    this.http = axios.create({
      baseURL: this.config.get<string>('ESPN_BASE_URL'),
      timeout: 8000,
    });
  }

  async get<T>(path: string, ttlMs: number): Promise<T> {
    const cached = this.cache.get<T>(path);
    if (cached) return cached;

    this.logger.log(`ESPN fetch: ${path}`);
    const { data } = await this.http.get<T>(path);
    this.cache.set(path, data, ttlMs);
    return data;
  }

  getTeams() {
    return this.get('/teams', this.TTL_TEAMS);
  }
  getTeam(id: string) {
    return this.get(`/teams/${id}`, this.TTL_TEAMS);
  }
  getRoster(teamId: string) {
    return this.get(`/teams/${teamId}/roster`, this.TTL_PLAYERS);
  }
  getPlayer(id: string) {
    return this.get(`/athletes/${id}`, this.TTL_PLAYERS);
  }
  getScoreboard() {
    return this.get('/scoreboard', this.TTL_SCORES);
  }
  getGameSummary(eventId: string) {
    return this.get(`/summary?event=${eventId}`, this.TTL_SCORES);
  }
}
