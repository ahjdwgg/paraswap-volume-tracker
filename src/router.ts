import * as express from 'express';
import { isAddress } from '@ethersproject/address';
import volumeTracker from './lib/volume-tracker';
import { PoolInfo } from './lib/pool-info';
import { Claim } from './models/Claim';
import { DEFAULT_CHAIN_ID, STAKING_CHAIN_IDS_SET } from './lib/constants';

const logger = global.LOGGER();

const router = express.Router({});

export default class Router {
  app: express.Express;
  volumeTracker = volumeTracker;

  configure(app: express.Express) {
    this.app = app;
    this.setRoutes();
  }

  private setRoutes() {
    this.app.use('/', this.setAPIRoutes());
  }

  private setAPIRoutes(): express.Router {
    router.get('/volume/:network?', async (req, res) => {
      try {
        const fromTime = req.query.fromTime
          ? parseInt(<string>req.query.fromTime)
          : undefined;
        const toTime = req.query.toTime
          ? parseInt(<string>req.query.toTime)
          : undefined;
        const result = await this.volumeTracker.getVolumeUSD(fromTime, toTime);
        res.json(result);
      } catch (e) {
        logger.error('VolumeTracker_Error', e);
        res.status(403).send({ error: 'VolumeTracker Error' });
      }
    });

    router.get('/volume/aggregation/:network?', async (req, res) => {
      try {
        const period = req.query.period || '30d';
        res.json(
          await this.volumeTracker.getVolumeAggregationUSD(period as string),
        );
      } catch (e) {
        logger.error('VolumeTracker_Error', e);
        res.status(403).send({ error: 'VolumeTracker Error' });
      }
    });

    router.get('/pools/:network?', async (req, res) => {
      try {
        const network = Number(req.params.network || DEFAULT_CHAIN_ID);
        if (!STAKING_CHAIN_IDS_SET.has(network)) {
          return res
            .status(403)
            .send({ error: `Unsupported network: ${network}` });
        }
        const result = await PoolInfo.getInstance(network).getLatestPoolData();
        res.json(result);
      } catch (e) {
        logger.error(req.path, e);
        res.status(403).send({ error: 'VolumeTracker Error' });
      }
    });

    router.get('/pools/earning/:address/:network?', async (req, res) => {
      try {
        const network = Number(req.params.network || DEFAULT_CHAIN_ID);
        if (!STAKING_CHAIN_IDS_SET.has(network)) {
          return res
            .status(403)
            .send({ error: `Unsupported network: ${network}` });
        }
        const address = <string>req.params.address;
        if(!isAddress(address)) {
          return res
            .status(403)
            .send({ error: `Invalid address: ${address}` }); 
        }
        const result = await PoolInfo.getInstance(network).fetchEarnedPSP(address);
        res.json(result);
      } catch (e) {
        logger.error(req.path, e);
        res.status(403).send({ error: 'VolumeTracker Error' });
      }
    });

    router.get('/airdrop/claim/:user', async (req, res) => {
      try {
        const claim = await Claim.findByPk(req.params.user);
        res.json({
          user: req.params.user,
          claim: claim ? claim.claim : null,
        });
      } catch (e) {
        logger.error(req.path, e);
        res.status(403).send({ error: 'VolumeTracker Error' });
      }
    });

    router.get('/rewards/:network?', async (req, res) => {
      try {
        if (!req.query.epochEndTime)
          return res.status(403).send({ error: 'epochEndTime is required' });
        const epochEndTime = parseInt(<string>req.query.epochEndTime);
        const network = Number(req.params.network || DEFAULT_CHAIN_ID);
        if (!STAKING_CHAIN_IDS_SET.has(network)) {
          return res
            .status(403)
            .send({ error: `Unsupported network: ${network}` });
        }
        const result = await PoolInfo.getInstance(
          network,
        ).getCurrentEpochRewardParams(epochEndTime);
        res.json(result);
      } catch (e) {
        logger.error(req.path, e);
        res.status(403).send({ error: 'VolumeTracker Error' });
      }
    });

    return router;
  }
}
