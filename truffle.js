const HDWalletProvider = require("truffle-hdwallet-provider-privkey");

let testPrivateKey = 'b818fe6909848165fe4b1e06fbb5af2f1c0ea02a7f19c03fbc315565ddb16c47';
let infuraRinkeby = 'https://rinkeby.infura.io/BU88vVanV6hLdd9qPCPW';
let infuraRopsten = 'https://ropsten.infura.io/n6voCDZxStY0q8JTbggg';

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
                return new HDWalletProvider(testPrivateKey, infuraRinkeby)
            },
            network_id: 3,
            port: 8545,
            gas: 4712387,
            gasPrice: 100000000000
        },
        rinkeby: {
            provider: function () {
                return new HDWalletProvider(testPrivateKey, infuraRinkeby)
            },
            network_id: 3,
            port: 8545,
            gas: 4712387
        }
    },
    solc: {
        optimizer: {
            enabled: true,
            runs: 999
        }
    },
    mocha: {
        reporter: 'eth-gas-reporter',
        reporterOptions: {
            currency: 'USD',
            gasPrice: 20
        }
    }
};
