import { Service } from 'typedi';

import TradyLogger from '../common/logger';
import { ReadStockDataResult } from './model';
import StatRepository from './persistence/repository';

@Service()
class StatService {
  constructor(
    protected statRepo: StatRepository,
    protected logger: TradyLogger,
  ) {}

  // loadIntraday
  async loadIntraday(
    symbol: string,
    interval: string,
  ): Promise<ReadStockDataResult> {
    try {
      return await this.statRepo.loadIntraday(symbol, interval);
    } catch (err: unknown) {
      this.logger.error(`StatService.loadIntraday] ${(err as Error).stack}`);
      return { err: 'server error' };
    }
  }
}

export default StatService;
