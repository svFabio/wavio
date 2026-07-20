import { Module } from '@nestjs/common';
import { env } from '../config/env';

export const ENV_CONFIG = 'ENV_CONFIG';

@Module({
  providers: [
    {
      provide: ENV_CONFIG,
      useValue: env,
    },
  ],
  exports: [ENV_CONFIG],
})
export class AppConfigModule {}
