import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Typed access to the environment. Every other module reads config through this
 * facade rather than touching `process.env`, so required keys are validated in
 * one place and the rest of the code depends on named getters, not strings.
 */
@Injectable()
export class AppConfig {
  constructor(private readonly config: ConfigService) {}

  get databaseUrl(): string {
    return this.require('DATABASE_URL');
  }

  get jwtSecret(): string {
    return this.require('JWT_SECRET');
  }

  get jwtExpiresIn(): string {
    return this.config.get<string>('JWT_EXPIRES_IN') ?? '24h';
  }

  get port(): number {
    return Number(this.config.get<string>('PORT') ?? '3000');
  }

  private require(key: string): string {
    const value = this.config.get<string>(key);
    if (!value) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
  }
}
