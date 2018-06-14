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

// Migration script is commented because it is too large and breaks tests
// For testing, migrations have to be commented
// For migration, uncomment it

module.exports = async function (deployer, network, accounts) {
	// const isDevNetwork = (network == 'development' || network == 'td' || network == 'ganache');
	// const fifteenMinutes = 15;

	// /**
	//  * Initial Parameters
	// */
	// const crowdsaleDuration = 49 * 24 * 60 * 60; // 7 weeks
	// const startTime = isDevNetwork ? getWeb3FutureTimestamp(fifteenMinutes) : getFutureTimestamp(fifteenMinutes);
	// const endTime =	startTime + crowdsaleDuration;

	// const weiInEther = 1000000000000000000;
	// const softCap = 10000 * weiInEther;
	// const hardCap = 80000 * weiInEther;

	// // User can have up to 2% of the total tokens supply
	// const balancePercentageLimit = 2;  

	// // Initial exchange rate
	// const oracleInitialRate = 100;
	// const minWeiAmount = 1;

    // const tokenWei = 1000000000000000000;
    // const token = tokenWei;

	// // KYC initial limits (in ETH)
    // const transactionsDailyLimitAnonymous = (15 * token) / oracleInitialRate; // 15 tokens AIUR -> ETH 
    // const transactionWeeklyLimitAnonymous = (60 * token) / oracleInitialRate; // 60 tokens AIUR -> ETH
    // const transactionMonthlyLimitAnonymous = (120 * token) / oracleInitialRate; // 120 tokens AIUR -> ETH
    // const maxBalanceAnonymousUser = (60 * token) / oracleInitialRate; // 60 tokens AIUR -> ETH

    // const transactionsDailyLimitSemiVerified = (70 * token) / oracleInitialRate; // 15 tokens AIUR -> ETH 
    // const transactionWeeklyLimitSemiVerified = (280 * token) / oracleInitialRate; // 15 tokens AIUR -> ETH 
    // const transactionMonthlyLimitSemiVerified = (560 * token) / oracleInitialRate; // 15 tokens AIUR -> ETH 
    // const maxBalanceSemiVerifiedUser = (280 * token) / oracleInitialRate; // 15 tokens AIUR -> ETH 

	// /**
	//  * Addresses
	// */
	// const owner = accounts[0];
	// const kycAdmin = owner;
	// const lister = owner;
	// const userCreator = owner;
	// const overDepositTokensRecipient = owner;

	// /**
	//  * Set up multiSig wallets
	// */
    // let account1 = "0x795EFF09B1FE788DC7e6824AA5221aD893Fd465A"; // Owner1
    // let account2 = "0x795EFF09B1FE788DC7e6824AA5221aD893Fd465B"; // Owner2
    // let account3 = "0x795EFF09B1FE788DC7e6824AA5221aD893Fd465C"; // Owner3
    // let account4 = "0x795EFF09B1FE788DC7e6824AA5221aD893Fd465D"; // Owner4
    // let account5 = "0x795EFF09B1FE788DC7e6824AA5221aD893Fd465E"; // Owner5
    // let allAccounts = [owner];
	// let requiredConfirmations = 1;

	// /**
	//  * Contracts Deployment
	// */
	
	// // This wallet is used to collect the ether from ICO
	// await deployer.deploy(MultiSigWalletEtherHolder, allAccounts, requiredConfirmations);
	// let multiSigWalletEtherHolderInstance = await MultiSigWalletEtherHolder.deployed();
	
	// /**
	//  * Linking library
	// */
	// await deployer.deploy(LinkedList);
	// await deployer.link(LinkedList, DataContract);

	// /**
	//  * Data Contract
	// */
	// await deployer.deploy(DataContract);
	// let DataContractImpl = await DataContract.deployed();
	// await deployer.deploy(DataContractProxy, DataContractImpl.address);
	// let DataContractInstance = await DataContractProxy.deployed();
	// DataContractInstance = await IDataContract.at(DataContractInstance.address);
	// await DataContractInstance.init({from: owner});

	// /**
	//  * Hook Operator
	// */
	// await deployer.deploy(HookOperator);
	// let HookOperatorImpl = await HookOperator.deployed();
	// await deployer.deploy(HookOperatorProxy, HookOperatorImpl.address); 
	// let HookOperatorInstance = await HookOperatorProxy.deployed();
	// HookOperatorInstance = await IHookOperator.at(HookOperatorInstance.address);
	// await HookOperatorInstance.init({from: owner});

	// /**
	//  * User Manager
	// */
	// await deployer.deploy(UserManager);
	// let UserManagerImpl = await UserManager.deployed();
	// await deployer.deploy(UserManagerProxy, UserManagerImpl.address);
	// let UserManagerInstance = await UserManagerProxy.deployed();
	// UserManagerInstance = await IUserManager.at(UserManagerInstance.address);
	// await UserManagerInstance.init({from: owner});
	
	// /**
	//  * User Contract
	// */
	// await deployer.deploy(UserContract);
	// let UserContractImpl = await UserContract.deployed();

	// /**
	//  * User Factory
	// */
	// await deployer.deploy(UserFactory);
	// let UserFactoryImpl = await UserFactory.deployed();
	// await deployer.deploy(UserFactoryProxy, UserFactoryImpl.address);
	// let UserFactoryInstance = await UserFactoryProxy.deployed();
	// UserFactoryInstance = await IUserFactory.at(UserFactoryInstance.address);
	// await UserFactoryInstance.init({from: owner});
		
	// /**
	//  * KYC Verification Contract
	// */
	// await deployer.deploy(KYCVerification);
	// let KYCVerificationImpl = await KYCVerification.deployed();
	// await deployer.deploy(KYCVerificationProxy, KYCVerificationImpl.address);
	// let KYCVerificationInstance = await KYCVerificationProxy.deployed();
	// KYCVerificationInstance = await IKYCVerification.at(KYCVerificationInstance.address);
	// await KYCVerificationInstance.init({from: owner});

	// /**
	//  * Exchange Oracle
	// */
	// await deployer.deploy(ExchangeOracle, oracleInitialRate, {from: owner});
	// let ExchangeOracleInstance = await ExchangeOracle.deployed();

	// /**
	//  * Vesting Contract
	// */
	// await deployer.deploy(Vesting, multiSigWalletEtherHolderInstance.address, endTime, {from: owner});
	// let VestingInstance = await Vesting.deployed();

	// /**
	//  * Crowdsale
	// */
	// await deployer.deploy(ICOCappedRefundableCrowdsale, startTime, endTime, hardCap, softCap, VestingInstance.address, HookOperatorInstance.address);
	// let ICOCappedRefundableCrowdsaleInstance = await ICOCappedRefundableCrowdsale.deployed();
	// let TokenExtendedAddress = await ICOCappedRefundableCrowdsaleInstance.token();
	// let TokenInstance = await ICOTokenExtended.at(TokenExtendedAddress);

	// /**
	//  * Set up default parameters
	// */
	// await VestingInstance.setOverDepositTokensRecipient(overDepositTokensRecipient, {from: owner});

	// await UserFactoryInstance.setUserCreator(userCreator, {from: owner});
	// await UserFactoryInstance.setImplAddress(UserContractImpl.address, {from: owner});

	// await HookOperatorInstance.setBalancePercentageLimit(balancePercentageLimit, {from: owner});

	// await ICOCappedRefundableCrowdsaleInstance.setLister(lister, {from: owner});

	// await KYCVerificationInstance.setKYCUserOwner(kycAdmin, {from: owner});

	// /**
	//  * KYC Limits - Anonymous
	// */
	// await KYCVerificationInstance.setDailyLimitForAnonymousUsers(transactionsDailyLimitAnonymous, {from: kycAdmin});
	// await KYCVerificationInstance.setWeeklyLimitForAnonymousUsers(transactionWeeklyLimitAnonymous, {from: kycAdmin});
	// await KYCVerificationInstance.setMonthlyLimitForAnonymousUsers(transactionMonthlyLimitAnonymous, {from: kycAdmin});
	// await KYCVerificationInstance.setMaxBalanceLimitForAnonymousUsers(maxBalanceAnonymousUser, {from: kycAdmin});

	// /**
	//  * KYC Limits - Semi Verified
	// */
	// await KYCVerificationInstance.setDailyLimitForSemiVerifiedUsers(transactionsDailyLimitSemiVerified, {from: kycAdmin});
	// await KYCVerificationInstance.setWeeklyLimitForSemiVerifiedUsers(transactionWeeklyLimitSemiVerified, {from: kycAdmin});
	// await KYCVerificationInstance.setMonthlyLimitForSemiVerifiedUsers(transactionMonthlyLimitSemiVerified, {from: kycAdmin});
	// await KYCVerificationInstance.setMaxBalanceLimitForSemiVerifiedUsers(maxBalanceSemiVerifiedUser, {from: kycAdmin});
	
	// /**
	//  * Contracts connections
	// */
	// await UserFactoryInstance.setDataContract(DataContractInstance.address, {from: owner});
	// await UserFactoryInstance.setUserManagerAddress(UserManagerInstance.address, {from: owner});
	
	// await UserManagerInstance.setDataContract(DataContractInstance.address, {from: owner});
	// await UserManagerInstance.setUserFactoryContract(UserFactoryInstance.address, {from: owner});
	// await UserManagerInstance.setHookOperatorContract(HookOperatorInstance.address, {from: owner});
	// await UserManagerInstance.setCrowdsaleContract(ICOCappedRefundableCrowdsaleInstance.address, {from: owner});
	
	// await DataContractInstance.setUserManager(UserManagerInstance.address, {from: owner});
	// await DataContractInstance.setUserFactory(UserFactoryInstance.address, {from: owner});
	
	// await HookOperatorInstance.setICOToken(TokenInstance.address, {from: owner});
	// await HookOperatorInstance.setUserManager(UserManagerInstance.address, {from: owner});
	// await HookOperatorInstance.setKYCVerificationContract(KYCVerificationInstance.address, {from: owner});
	
	// await KYCVerificationInstance.setUserFactory(UserFactoryInstance.address, {from: owner});
	// await KYCVerificationInstance.setExchangeOracle(ExchangeOracleInstance.address, {from: owner});
		
	// await VestingInstance.setTokenInstance(TokenInstance.address, {from: owner});
	// await VestingInstance.setHookOperator(HookOperatorInstance.address, {from: owner});

	// await ICOCappedRefundableCrowdsaleInstance.setUserManagerContract(UserManagerInstance.address, {from: owner});

	// console.log("Done");
};
