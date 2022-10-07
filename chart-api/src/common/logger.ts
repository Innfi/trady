import { Service } from 'typedi';
import winston from 'winston';
import {
  ElasticsearchTransport,
  ElasticsearchTransportOptions,
} from 'winston-elasticsearch';
import dotenv from 'dotenv';

dotenv.config();
const esUrl = process.env.ES_URL ? process.env.ES_URL : 'http://localhost:9200';

@Service()
export class TradyLogger {
  readonly apiName = 'Trady.ChartAPI';

  protected esTransportOptions: ElasticsearchTransportOptions = {
    level: 'info',
    clientOpts: { node: esUrl },
  };

  protected esTransport = new ElasticsearchTransport(this.esTransportOptions);

  protected logger: Readonly<winston.Logger> = winston.createLogger({
    transports: [this.esTransport],
  });

  constructor() {
    this.logger.info('TradyLogger] ');

    if (process.env.NODE_ENV !== 'local') return;

    this.logger.add(
      new winston.transports.Console({
        format: winston.format.simple(),
      }),
    );
  }

  info(msg: string) {
    this.logger.info({
      actor: this.apiName,
      msg,
    });
  }

  debug(msg: string) {
    this.logger.info({
      actor: this.apiName,
      msg,
    });
  }

  error(msg: string) {
    this.logger.error({
      actor: this.apiName,
      msg,
    });
  }
}
