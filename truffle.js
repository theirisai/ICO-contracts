let testPrivateKey = '';
let infuraRopsten = 'https://ropsten.infura.io/H4UAAWyThMPs2WB9LsHD';

const HDWalletProvider = require("truffle-hdwallet-provider-privkey");

module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*",
    },
    ganache: {
      host: "localhost",
      port: 7545,
      network_id: "5777",
    },
    ropsten: {
          provider: function () {
              return new HDWalletProvider(testPrivateKey, infuraRopsten)
          },
          network_id: 3,
          port: 8545
    }
  },
  solc: {
    compiler: {
      version: "0.4.24",
      optimization: true
    },
    optimizer: {
      enabled: true,
      runs: 999
    }
  },
};
