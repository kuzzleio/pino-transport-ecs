import { ecsFormat } from '@elastic/ecs-pino-format';
import { pipeline } from 'node:stream';
import build from 'pino-abstract-transport';
import { getTransform } from './transform';
import { PinoTransportEcsOptions } from './types';

export default async function pinoTransportEcs(options?: PinoTransportEcsOptions) {
  const pinoConfigEcs = ecsFormat(options);

  return build(
    (source) => {
      const transformStream = getTransform(source, pinoConfigEcs, options);

      pipeline(source, transformStream, () => {});
      return transformStream;
    },
    {
      enablePipelining: true,
      expectPinoConfig: true,
    },
  );
}
