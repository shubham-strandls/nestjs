import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PostHog } from 'posthog-node';

@Injectable()
export class PostHogService implements OnApplicationShutdown {
  private readonly client: PostHog;

  constructor(private readonly configService: ConfigService) {
    this.client = new PostHog(
      this.configService.getOrThrow<string>('POSTHOG_API_KEY'),
      {
        host: this.configService.getOrThrow<string>('POSTHOG_HOST'),
        enableExceptionAutocapture: true,
      },
    );
  }

  capture(
    distinctId: string,
    event: string,
    properties?: Record<string, unknown>,
  ): void {
    this.client.capture({ distinctId, event, properties });
  }

  identify(distinctId: string, properties?: Record<string, unknown>): void {
    this.client.identify({ distinctId, properties });
  }

  captureException(
    error: unknown,
    distinctId?: string,
    additionalProperties?: Record<string, unknown>,
  ): void {
    this.client.captureException(error, distinctId, additionalProperties);
  }

  async onApplicationShutdown(): Promise<void> {
    await this.client.shutdown();
  }
}
