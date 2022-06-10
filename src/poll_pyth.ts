import { Cluster, clusterApiUrl, Connection } from '@solana/web3.js'
import { PythConnection } from './PythConnection'
import { getPythProgramKeyForCluster } from './cluster'
import { PriceStatus } from '.'

var fs = require('fs')
const SOLANA_CLUSTER_NAME: Cluster = 'mainnet-beta'
const connection = new Connection(clusterApiUrl(SOLANA_CLUSTER_NAME))
const pythPublicKey = getPythProgramKeyForCluster(SOLANA_CLUSTER_NAME)

const pythConnection = new PythConnection(connection, pythPublicKey)

let numPolls = 0

pythConnection.onPriceChange(async (product, price) => {
  if (product.symbol == 'Crypto.SOL/USD') {
    numPolls += 1
    let slot = await connection.getSlot()

    if (
      slot - price.aggregate.publishSlot > 25 ||
      price.numQuoters < price.minPublishers ||
      price.status !== PriceStatus.Trading
    ) {
      let content = `serverTime=${new Date(Date.now()).toUTCString()}, price=${price.price?.toFixed(2)}, status=${
        PriceStatus[price.status]
      }, publishers=${price.numQuoters}>${price.minPublishers}, lastSlot=${price.lastSlot}, validSlot=${
        price.validSlot
      } publishSlot=${price.aggregate.publishSlot}, connectionSlot=${slot}, numPolls=${numPolls}`

      fs.writeFile('bad-prices.log', content + '\n', { flag: 'a+' }, (_err: any) => {})
      console.log(content)
    }
  }
})

// tslint:disable-next-line:no-console
// console.log('Reading from Pyth price feed...')
fs.writeFile('bad-prices.log', 'Starting up!' + '\n', { flag: 'a+' }, (_err: any) => {})
pythConnection.start()
