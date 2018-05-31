let ICOTokenExtended = artifacts.require("./ICOTokenExtended.sol");
let ICOCappedRefundableCrowdsale = artifacts.require("./ICOCappedRefundableCrowdsale.sol");

let IUserManager = artifacts.require("./IUserManager.sol");
let UserManager = artifacts.require("./UserManager.sol");
let UserManagerProxy = artifacts.require("./UserManagerProxy.sol");

let IHookOperator = artifacts.require("./IHookOperator.sol");
let HookOperator = artifacts.require("./HookOperator.sol");
let HookOperatorProxy = artifacts.require("./HookOperatorProxy.sol");

let LinkedList = artifacts.require("./LinkedList.sol");
let LinkedListContract = artifacts.require("./LinkedListContract.sol");

let IUserFactory = artifacts.require("./../contracts/User/UserFactory/IUserFactory.sol");
let UserFactory = artifacts.require("./../contracts/User/UserFactory/UserFactory.sol");
let UserFactoryProxy = artifacts.require("./../contracts/User/UserFactory/UserFactoryProxy.sol");

let IUserContract = artifacts.require("./../contracts/User/IUserContract.sol");
let UserContract = artifacts.require("./../contracts/User/UserContract.sol");
let UserContractProxy = artifacts.require("./../contracts/User/UserContractProxy.sol");

let IDataContract = artifacts.require("./../contracts/Data/IDataContract.sol");
let DataContract = artifacts.require("./../contracts/Data/DataContract.sol");
let DataContractProxy = artifacts.require("./../contracts/Data/DataContractProxy.sol");

let ExchangeOracle = artifacts.require("./../contracts/Oracle/ExchangeOracle.sol");

let IKYCVerification = artifacts.require("./../contracts/KYC/IKYCVerification.sol");
let KYCVerification = artifacts.require("./../contracts/KYC/KYCVerification.sol");
let KYCVerificationProxy = artifacts.require("./../contracts/KYC/KYCVerificationProxy.sol");

let MultiSigWalletOwner = artifacts.require("./MultiSigWallet.sol");
let MultiSigWalletEtherHolder = artifacts.require("./MultiSigWallet.sol");

function getFutureTimestamp(plusMinutes) {
	let date = new Date();
	date.setMinutes(date.getMinutes() + plusMinutes)
	let timestamp = +date;
	timestamp = Math.ceil(timestamp / 1000);
	return timestamp;
}

function getWeb3FutureTimestamp(plusMinutes) {
	return web3.eth.getBlock(web3.eth.blockNumber).timestamp + plusMinutes * 60;
}

module.exports = async function (deployer, network, accounts) {
	// const isDevNetwork = (network == 'development' || network == 'td' || network == 'ganache');
	// const fifteenMinutes = 15;

	// const crowdsaleDuration = 49 * 24 * 60 * 60; // 7 weeks
	
	// const startTime = isDevNetwork ? getWeb3FutureTimestamp(fifteenMinutes) : getFutureTimestamp(fifteenMinutes);
	// const endTime =	startTime + crowdsaleDuration;
	
	// const wallet = '0x795EFF09B1FE788DC7e6824AA5221aD893Fd465A';
	// const weiInEther = 1000000000000000000;

	// const initialOracleRate = 1000;

	// const softCap = 10000 * weiInEther;
	// const hardCap = 80000 * weiInEther;

	// // Set up multiSig wallets
    // let account1 = "0x795EFF09B1FE788DC7e6824AA5221aD893Fd465A"; // Owner1
    // let account2 = "0x795EFF09B1FE788DC7e6824AA5221aD893Fd465B"; // Owner2
    // let account3 = "0x795EFF09B1FE788DC7e6824AA5221aD893Fd465C"; // Owner3
    // let account4 = "0x795EFF09B1FE788DC7e6824AA5221aD893Fd465D"; // Owner4
    // let account5 = "0x795EFF09B1FE788DC7e6824AA5221aD893Fd465E"; // Owner5
    // let allAccounts = [account1, account2, account3, account4, account5];
    // let requiredConfirmations = 3;

	// // Multisig Wallets
    // console.log("Deploying MultiSigWalletOwner");
	// await deployer.deploy(MultiSigWalletOwner, allAccounts, requiredConfirmations);
	
    // // This wallet is used later to transfer ownership of all contracts to it
    // let multiSigWalletOwner = await MultiSigWalletOwner.deployed();

    // console.log("Deploying MultiSigWalletEtherHolder");
	// await deployer.deploy(MultiSigWalletEtherHolder, allAccounts, requiredConfirmations);
	
    // // This wallet is used to collect the ether from ICO
	// let multiSigWalletEtherHolderInstance = await MultiSigWalletEtherHolder.deployed();

	// // Linking library
	await deployer.deploy(LinkedList);
	await deployer.link(LinkedList, DataContract);

	// // Hook Operator Services
	// await deployer.deploy(UserManager);
	// let UserManagerImpl = await UserManager.deployed();
	// await deployer.deploy(UserManagerProxy, UserManagerImpl.address);
	// let UserManagerContract = await UserManagerProxy.deployed();
	// UserManagerContract = await IUserManager.at(UserManagerContract.address);
	// await UserManagerContract.init();
	
	// // Data Contract
	// await deployer.deploy(DataContract);
	// let DataContractImpl = await DataContract.deployed();
	// await deployer.deploy(DataContractProxy, DataContractImpl.address);
	// let DataContractInstance = await DataContractProxy.deployed();
	// DataContractInstance = await IDataContract.at(DataContractInstance.address);
	// await DataContractInstance.init();
   
	// // User Factory
	// await deployer.deploy(UserFactory);
	// let UserFactoryImpl = await UserFactory.deployed();
	// await deployer.deploy(UserFactoryProxy, UserFactoryImpl.address);
	// let UserFactoryContract = await UserFactoryProxy.deployed();
	// UserFactoryContract = await IUserFactory.at(UserFactoryContract.address);
	// await UserFactoryContract.init();
	
	// // User Contract
	// await deployer.deploy(UserContract);
	// let UserContractImpl = await UserContract.deployed();
	// await UserContractImpl.init();

	// // KYC Verification Contract
	// await deployer.deploy(KYCVerification);
	// let KYCVerificationImpl = await KYCVerification.deployed();
	// await deployer.deploy(KYCVerificationProxy, KYCVerificationImpl.address);
	// let KYCVerificationContract = await KYCVerificationProxy.deployed();
	// KYCVerificationContract = await IKYCVerification.at(KYCVerificationContract.address);
	// await KYCVerificationContract.init();

	// await KYCVerificationContract.setUserFactory(UserFactoryContract.address);

	// // Hook Operator
	// await deployer.deploy(HookOperator);
	// let HookOperatorImpl = await HookOperator.deployed();
	// await deployer.deploy(HookOperatorProxy, HookOperatorImpl.address); 
	// let HookOperatorContract = await HookOperatorProxy.deployed();
	// HookOperatorContract = await IHookOperator.at(HookOperatorContract.address);
	// await HookOperatorContract.init();

	// // ICO Token
	// await deployer.deploy(ICOCappedRefundableCrowdsale, startTime, endTime, hardCap, softCap, multiSigWalletEtherHolderInstance.address, HookOperatorContract.address);

	// // TODO: Check
	// let ICOCappedRefundableCrowdsaleInstance = await ICOCappedRefundableCrowdsale.deployed();
	// let ICOTokenExtendedAddress = await ICOCappedRefundableCrowdsaleInstance.token();
	// let ICOTokenInstance = await ICOTokenExtended.at(ICOTokenExtendedAddress);

	// // Connect Contracts
	// await UserManagerContract.setDataContract(DataContractInstance.address);
	// await UserManagerContract.setUserFactoryContract(UserFactoryContract.address);

	// await DataContractInstance.setUserManagerContract(UserManagerContract.address);
	// await UserFactoryContract.setUserManagerAddress(UserManagerContract.address);
	
	// await HookOperatorContract.setUserManager(UserManagerContract.address);
	// await HookOperatorContract.setKYCVerficationContract(KYCVerificationContract.address);
	// await HookOperatorContract.setICOToken(ICOTokenExtendedAddress);

	// // Oracle
	// await deployer.deploy(ExchangeOracle, initialOracleRate);
};