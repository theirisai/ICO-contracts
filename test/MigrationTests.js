let ICOTokenExtended = artifacts.require("./../contracts/InitialCoinOffering/ICOTokenExtended.sol");
let ICOCappedRefundableCrowdsale = artifacts.require("./../contracts/InitialCoinOffering/ICOCappedRefundableCrowdsale.sol");

let IUserManager = artifacts.require("./../contracts/UserManager/IUserManager.sol");
let UserManager = artifacts.require("./../contracts/UserManager/UserManager.sol");
let UserManagerProxy = artifacts.require("./../contracts/UserManager/UserManagerProxy.sol");

let IHookOperator = artifacts.require("./../contracts/HookOperator/IHookOperator.sol");
let HookOperator = artifacts.require("./../contracts/HookOperator/HookOperator.sol");
let HookOperatorProxy = artifacts.require("./../contracts/HookOperator/HookOperatorProxy.sol");

let LinkedList = artifacts.require("./../contracts/LinkedList/LinkedList.sol");
let LinkedListContract = artifacts.require("./../contracts/LinkedList/LinkedListContract.sol");

let IUserFactory = artifacts.require("./../contracts/User/UserFactory/IUserFactory.sol");
let UserFactory = artifacts.require("./../contracts/User/UserFactory/UserFactory.sol");
let UserFactoryProxy = artifacts.require("./../contracts/User/UserFactory/UserFactoryProxy.sol");

let IUserContract = artifacts.require("./../contracts/User/IUserContract.sol");
let UserContract = artifacts.require("./../contracts/User/UserContract.sol");
let UserContractProxy = artifacts.require("./../contracts/User/UserContractProxy.sol");

let IDataContract = artifacts.require("./../contracts/Data/IDataContract.sol");
let DataContract = artifacts.require("./../contracts/Data/DataContract.sol");
let DataContractProxy = artifacts.require("./../contracts/Data/DataContractProxy.sol");

let Vesting = artifacts.require("./../contracts/Vesting.sol");
let ExchangeOracle = artifacts.require("./../contracts/Oracle/ExchangeOracle.sol");

let IKYCVerification = artifacts.require("./../contracts/KYC/IKYCVerification.sol");
let KYCVerification = artifacts.require("./../contracts/KYC/KYCVerification.sol");
let KYCVerificationProxy = artifacts.require("./../contracts/KYC/KYCVerificationProxy.sol");

let MultiSigWalletEtherHolder = artifacts.require("./../contracts/InitialCoinOffering/MultiSigWallet.sol");

const expectThrow = require('./util').expectThrow;
const timeTravel = require('./util').timeTravel;
const web3FutureTime = require('./util').web3FutureTime;
const web3Now = require('./util').web3Now;
require('./assertExtensions');

contract('Migration Tests', function (accounts) {

    
});