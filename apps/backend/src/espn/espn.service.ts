import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { CacheService } from '../cache/cache.service';

export interface EspnCoreAthlete {
  id: string;
  fullName?: string;
  jersey?: string;
  age?: number;
  displayHeight?: string;
  displayWeight?: string;
  active?: boolean;
  birthPlace?: {
    city?: string;
    state?: string;
    country?: string;
  };
  position?: {
    name?: string;
    displayName?: string;
  };
  headshot?: {
    href?: string;
  };
  experience?: {
    years?: number;
  };
  college?: {
    name?: string;
  };
  status?: {
    name?: string;
  };
}

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
  async getPlayer(id: string): Promise<EspnCoreAthlete> {
    const base =
      this.config.get<string>('ESPN_CORE_BASE_URL') ??
      'https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba';
    const url = `${base}/athletes/${id}`;

    const cached = this.cache.get<EspnCoreAthlete>(url);
    if (cached) return cached;

    const { data } = await this.http.get<EspnCoreAthlete>(url);
    this.cache.set(url, data, this.TTL_PLAYERS);
    return data;
  }
  getScoreboard() {
    return this.get('/scoreboard', this.TTL_SCORES);
  }
  getGameSummary(eventId: string) {
    return this.get(`/summary?event=${eventId}`, this.TTL_SCORES);
  }
}
