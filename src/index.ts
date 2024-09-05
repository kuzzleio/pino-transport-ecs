import { ecsFormat } from '@elastic/ecs-pino-format';
import { pipeline, Transform } from 'node:stream';
import build from 'pino-abstract-transport';
import { deserializeError } from 'serialize-error';
import { PinoTransportEcsOptions } from './types';

export default async function pinoTransportEcs(options: PinoTransportEcsOptions) {
  const pinoConfigEcs = ecsFormat(options);

  return build(
    (source) => {
      const myTransportStream = new Transform({
        autoDestroy: true,
        objectMode: true,
        transform(line, enc, cb) {
          if (options.additionalBindings) {
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

      pipeline(source, myTransportStream, () => {});
      return myTransportStream;
    },
    {
      enablePipelining: true,
      expectPinoConfig: true,
    },
  );
}
