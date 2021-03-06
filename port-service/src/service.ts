import { Service } from 'typedi';

import { TradyLogger } from './common/logger';
import { EventListener, EventPayload } from './event/types';
import { ClearPortfolioResult, LoadPortfolioResult, SavePortfolioResult } from './model';
import { PortRepository } from './repository';

@Service()
export class PortService implements EventListener {
  constructor(protected repo: PortRepository, protected logger: TradyLogger) {}

  // savePort
  async savePort(
    email: string,
    symbols: string[],
  ): Promise<SavePortfolioResult> {
    try {
      return await this.repo.savePortfolio(email, symbols);
    } catch (err: unknown) {
      this.logger.error(`PortService.savePort] ${(err as Error).stack}`);
      return { err: 'server error' };
    }
  }

  // listPort
  async listPort(email: string): Promise<LoadPortfolioResult> {
    try {
      return await this.repo.loadPortfolio(email);
    } catch (err: unknown) {
      this.logger.error(`PortService.listPort] ${(err as Error).stack}`);
      return { err: 'server error' };
    }
  }

  // handleEvent implements EventListener method
  async handleEvent(payload: Readonly<EventPayload>): Promise<void> {
    this.logger.info(`payload: ${JSON.stringify(payload)}`);

    // if one more cases added, use factory.
    switch (payload.payloadType) {
    case 'registerPort':
      await this.handleRegisterPort(payload);
      break;
    case 'clearPort':
      await this.handleClearPort(payload);
      break;
    default:
      this.logger.error(`invalid type`);
      break;
    }
  }

  protected async handleRegisterPort(
    payload: Readonly<EventPayload>,
  ): Promise<void> {
    this.logger.info(`handleRegisterPort`);

    try {
      // what if the process fails?
      const { email, symbols } = payload;

      const result = await this.repo.savePortfolio(email, symbols);
      if (result.err !== 'ok') throw new Error('save failed');
    } catch (err: unknown) {
      this.logger.error(
        `PortService.handleRegisterPort] ${(err as Error).stack}`,
      );
    }
  }

  protected async handleClearPort(
    payload: Readonly<EventPayload>,
  ): Promise<void> {
    this.logger.info(`handleClearPort`);

    try {
      // what if the process fails?
      const { email } = payload;

      const result = await this.clearPort(email);
      if (result.err !== 'ok') throw new Error('clear failed');
    } catch (err: unknown) {
      this.logger.error(`PortService.handleClearPort] ${(err as Error).stack}`);
    }
  }

  // clearPort
  async clearPort(email: Readonly<string>): Promise<ClearPortfolioResult> {
    return await this.repo.clearPortfolio(email);
  }
}
