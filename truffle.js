let testPrivateKey = '2956b7afa2b93c048f2281be59a5d0ecaf247c5f82430a2209143c1e973c5b82';
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
