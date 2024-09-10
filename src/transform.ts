import { Transform } from 'node:stream';
import { LoggerOptions } from 'pino';
import build, { type PinoConfig } from 'pino-abstract-transport';
import { deserializeError } from 'serialize-error';
import { PinoTransportEcsOptions } from './types';

export const getTransform = (
  source: Transform & build.OnUnknown & PinoConfig,
  pinoConfigEcs: LoggerOptions,
  options?: PinoTransportEcsOptions,
) =>
  new Transform({
    autoDestroy: true,
    objectMode: true,
    transform(line, enc, cb) {
      if (options?.additionalBindings) {
        line = { ...line, ...options.additionalBindings };
      }

      if (pinoConfigEcs.messageKey && source.messageKey !== pinoConfigEcs.messageKey) {
        line = { ...line, [pinoConfigEcs.messageKey]: line[source.messageKey] };
        delete line[source.messageKey];
      }

      line['@timestamp'] = new Date(line.time).toISOString();
      delete line.time;

      line = {
        ...line,
        ...pinoConfigEcs.formatters!.level!(source.levels.labels[line.level], line.level),
      };

      delete line.level;

      if (line.err) {
        line.err = deserializeError(line.err);
      }

      line = pinoConfigEcs.formatters!.bindings!(line);
      line = pinoConfigEcs.formatters!.log!(line);

      this.push(`${JSON.stringify(line)}\n`);
      cb();
    },
  });
