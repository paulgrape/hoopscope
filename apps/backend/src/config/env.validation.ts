import { Type, plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsUrl,
  Matches,
  Max,
  Min,
  validateSync,
} from 'class-validator';

export enum NodeEnv {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

/** pino levels; `silent` disables logging entirely. */
export enum LogLevel {
  Trace = 'trace',
  Debug = 'debug',
  Info = 'info',
  Warn = 'warn',
  Error = 'error',
  Fatal = 'fatal',
  Silent = 'silent',
}

/** Local URLs have no TLD, so the default validator rule would reject them. */
const URL_OPTIONS = { require_tld: false, require_protocol: true };

export class EnvironmentVariables {
  @IsOptional()
  @IsEnum(NodeEnv)
  NODE_ENV?: NodeEnv;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65_535)
  PORT?: number;

  @IsOptional()
  @IsUrl(URL_OPTIONS)
  FRONTEND_URL?: string;

  @IsOptional()
  @IsEnum(LogLevel)
  LOG_LEVEL?: LogLevel;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  HISTORIC_GAME_TICK_MS?: number;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}$/, { message: 'NBA_DEFAULT_SEASON must be YYYY-YY' })
  NBA_DEFAULT_SEASON?: string;

  @IsOptional()
  @IsUrl(URL_OPTIONS)
  ESPN_BASE_URL?: string;

  @IsOptional()
  @IsUrl(URL_OPTIONS)
  ESPN_WEB_API_BASE_URL?: string;

  @IsOptional()
  @IsUrl(URL_OPTIONS)
  ESPN_CORE_BASE_URL?: string;

  @IsOptional()
  @IsUrl(URL_OPTIONS)
  ESPN_NOW_API_URL?: string;

  @IsOptional()
  @IsUrl(URL_OPTIONS)
  ESPN_STANDINGS_BASE_URL?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10)
  ESPN_RETRY_ATTEMPTS?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  ESPN_RETRY_BASE_DELAY_MS?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  ESPN_RETRY_MAX_DELAY_MS?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  ESPN_MAX_CONCURRENCY?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  ESPN_REQUEST_GAP_MS?: number;
}

/**
 * Fails the boot instead of letting a typo in the environment surface later as
 * a confusing runtime error.
 */
export function validate(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const parsed = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(parsed, {
    skipMissingProperties: true,
    forbidUnknownValues: false,
  });

  if (errors.length > 0) {
    const details = errors
      .map((error) => Object.values(error.constraints ?? {}).join(', '))
      .join('; ');

    throw new Error(`Invalid environment configuration: ${details}`);
  }

  return parsed as unknown as Record<string, unknown>;
}
