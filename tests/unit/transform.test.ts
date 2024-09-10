import ecsFormat from '@elastic/ecs-pino-format';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import build, { PinoConfig } from 'pino-abstract-transport';
import { getTransform } from '../../src/transform';
import { testLogs } from '../fixtures/testLogs';

describe('Transform', () => {
  it('should convert all the examples messages without error', async () => {
    const testLogsStream: Transform & build.OnUnknown & PinoConfig = Readable.from(
      testLogs,
    ) as Transform & build.OnUnknown & PinoConfig;

    testLogsStream.levels = {
      labels: {
        10: 'trace',
        20: 'debug',
        30: 'info',
        40: 'warn',
        50: 'error',
        60: 'fatal',
      },
      values: {
        trace: 10,
        debug: 20,
        info: 30,
        warn: 40,
        error: 50,
        fatal: 60,
      },
    };
    testLogsStream.messageKey = 'msg';
    testLogsStream.errorKey = 'err';

    const pinoConfigEcs = ecsFormat();
    const transformStream = getTransform(testLogsStream, pinoConfigEcs, {});

    const pipelinePromise = pipeline(testLogsStream, transformStream);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for await (const line of transformStream) {
      // void data
    }

    await expect(pipelinePromise).resolves.toBeUndefined();
  });
});
