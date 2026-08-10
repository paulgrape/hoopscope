import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule, Params } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

export const REQUEST_ID_HEADER = 'x-request-id';

/** Key the request id is logged and returned under, in logs and error bodies. */
export const REQUEST_ID_FIELD = 'requestId';

function requestId(req: IncomingMessage, res: ServerResponse): string {
  const inbound = req.headers[REQUEST_ID_HEADER];
  const id =
    typeof inbound === 'string' && inbound.length > 0 ? inbound : randomUUID();
  // Echoed back so a client can quote the id from a failed call.
  res.setHeader(REQUEST_ID_HEADER, id);
  return id;
}

@Module({
  imports: [
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): Params => {
        const nodeEnv = config.get<string>('NODE_ENV');
        const isProduction = nodeEnv === 'production';
        const isTest = nodeEnv === 'test';

        return {
          pinoHttp: {
            level:
              config.get<string>('LOG_LEVEL') ??
              (isTest ? 'silent' : isProduction ? 'info' : 'debug'),
            genReqId: requestId,
            // Binds the id to every log line made during the request instead of
            // dumping the whole req/res pair.
            quietReqLogger: true,
            customAttributeKeys: { reqId: REQUEST_ID_FIELD },
            autoLogging: {
              ignore: (req: IncomingMessage) =>
                req.url?.startsWith('/health') ?? false,
            },
            // Headers are dropped wholesale so cookies and auth never land in logs.
            serializers: {
              req: (req: IncomingMessage) => ({
                method: req.method,
                url: req.url,
              }),
              res: (res: ServerResponse) => ({ statusCode: res.statusCode }),
            },
            transport:
              isProduction || isTest
                ? undefined
                : {
                    target: 'pino-pretty',
                    options: {
                      singleLine: true,
                      translateTime: 'SYS:HH:MM:ss.l',
                      ignore: 'pid,hostname',
                    },
                  },
          },
        };
      },
    }),
  ],
})
export class LoggingModule {}
