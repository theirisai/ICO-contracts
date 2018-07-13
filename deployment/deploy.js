const ethers = require('ethers');

const config = require("./config");
const {runDeployment, localNodeProvider} = require("./provider");
const {initWallet} = require("./provider");

const multiSigJson = require("./../build/contracts/MultiSigWallet");

const linkedListJson = require("./../build/contracts/LinkedList");

const iDataContractJson = require("./../build/contracts/IDataContract");
const dataContractJson = require("./../build/contracts/DataContract");
const dataContractProxyJson = require("./../build/contracts/DataContractProxy");

const iHookOperatorJson = require("./../build/contracts/IHookOperator");
const hookOperatorJson = require("./../build/contracts/HookOperator");
const hookOperatorProxyJson = require("./../build/contracts/HookOperatorProxy");

const iUserManagerJson = require("./../build/contracts/IUserManager");
const userManagerJson = require("./../build/contracts/UserManager");
const userManagerProxyJson = require("./../build/contracts/UserManagerProxy");

const userContractJson = require("./../build/contracts/UserContract");

const iUserFactoryJson = require("./../build/contracts/IUserFactory");
const userFactoryJson = require("./../build/contracts/UserFactory");
const userFactoryProxyJson = require("./../build/contracts/UserFactoryProxy");

const iKYCVerificationJson = require("./../build/contracts/IKYCVerification");
const KYCVerificationJson = require("./../build/contracts/KYCVerification");
const KYCVerificationProxyJson = require("./../build/contracts/KYCVerificationProxy");

const exchangeOracleJson = require("./../build/contracts/ExchangeOracle");

const vestingJson = require("./../build/contracts/Vesting");

const icoCappedRefundableCrowdsaleJson = require("./../build/contracts/ICOCappedRefundableCrowdsale");

const tokenJson = require("./../build/contracts/ICOTokenExtended");

function getFutureTimestamp(plusMinutes) {
    let date = new Date();
    date.setMinutes(date.getMinutes() + plusMinutes);
    let timestamp = +date;
    timestamp = Math.ceil(timestamp / 1000);
    return timestamp;
}

run = async function () {
    console.log("\nDeployment Started on:", config.network);

    let wallet = await initWallet();
    let overrideOptions = {
        gasLimit: config.gasLimit,
        gasPrice: config.gasPrice
    };

    // TODO change wallet addresses and check all initial values
    // Pre-deploy configs
    // Multisig wallet
    let account1 = "0x775Ab28b08cC75C9e56311E05EC00926594c0986"; // Owner1
    let account2 = "0xA764b66134E8D720191bEe0F9326dDd7AAc73d30"; // Owner2
    let account3 = "0xa670C3ECE84F99b8509A23687b89A059C478832E"; // Owner3

    let allAccounts = [account1, account2, account3];
    let requiredConfirmations = 2;

    const owner = wallet.address;
    const kycAdmin = "0x32F8B86C35EEb383261F9B0e95d125d4073eB51F";
    const lister = "0x1DB59f0cF76Ca0360F9d6d8f0766430493b7b25f";
    const userCreator = "0x513cc910403dfb4F0E59dD1ede5801a880d1A82B";
    let overDepositTokensRecipient; // This is set after MultiSig deployment on line 104
    // Exchange Oracle
    const initialOracleRate = 100000;
    const realWorldRate = 100;

    // Crowdsale and Vesting
    const crowdsaleDuration = 77 * 24 * 60 * 60; // 11 weeks
    const startTime = getFutureTimestamp(15); // 15 Minutes from now
    const endTime =	startTime + crowdsaleDuration;
    const softCap = ethers.utils.parseEther('20000');
    const hardCap = ethers.utils.parseEther('167000');
    const token = 1000000000000000000;

    // UserFactory
    const createUsersBatchLimit = 20;

    // HookOperator
    const balancePercentageLimit = 2;

    // KYC initial limits (in ETH)
    const transactionsDailyLimitAnonymous = ((15 * token) / realWorldRate).toString(); // 15 tokens AIUR -> ETH
    const transactionWeeklyLimitAnonymous = ((60 * token) / realWorldRate).toString(); // 60 tokens AIUR -> ETH
    const transactionMonthlyLimitAnonymous = ((120 * token) / realWorldRate).toString(); // 120 tokens AIUR -> ETH
    const maxBalanceAnonymousUser = ((60 * token) / realWorldRate).toString(); // 60 tokens AIUR -> ETH

    const transactionsDailyLimitSemiVerified = ((70 * token) / realWorldRate).toString(); // 70 tokens AIUR -> ETH
    const transactionWeeklyLimitSemiVerified = ((280 * token) / realWorldRate).toString(); // 280 tokens AIUR -> ETH
    const transactionMonthlyLimitSemiVerified = ((560 * token) / realWorldRate).toString(); // 560 tokens AIUR -> ETH
    const maxBalanceSemiVerifiedUser = ((280 * token) / realWorldRate).toString(); // 280 tokens AIUR -> ETH

    // Deploy Owner MultiSig wallet
    // let ownerMultiSigDeployTxn = await ethers.Contract.getDeployTransaction(multiSigJson.bytecode, multiSigJson.abi, allAccounts, requiredConfirmations);
    let ownerMultiSigWalletAddress = "0x60D18008982cd7Fab6A62C3CC913FB920e575964"; // await runDeployment(wallet, ownerMultiSigDeployTxn, multiSigJson.contractName);

    // Deploy Ether Holder MultiSig wallet
    let etherHolderMultiSigWalletAddress = "0xcbFFb1c24f9c93382dabDAD8c72EFaB48C11b97A"; // await runDeployment(wallet, ownerMultiSigDeployTxn, multiSigJson.contractName);
    overDepositTokensRecipient = etherHolderMultiSigWalletAddress;

    // Deploy library
    let linkedListDeployTxn = await ethers.Contract.getDeployTransaction(linkedListJson.bytecode, linkedListJson.abi);
    let linkedListAddress = await runDeployment(wallet, linkedListDeployTxn, linkedListJson.contractName);

    // Deploy DataContract
    let dataContractBytecodeWithLibrary = dataContractJson.bytecode.replace(/__LinkedList____________________________/g, linkedListAddress.substring(2));
    let dataContractDeployTxn = await ethers.Contract.getDeployTransaction(dataContractBytecodeWithLibrary, dataContractJson.abi);
    let dataContractAddress = await runDeployment(wallet, dataContractDeployTxn, dataContractJson.contractName);

    let dataContractProxyDeployTxn = await ethers.Contract.getDeployTransaction(dataContractProxyJson.bytecode, dataContractProxyJson.abi, dataContractAddress);
    let dataContractProxyAddress = await runDeployment(wallet, dataContractProxyDeployTxn, dataContractProxyJson.contractName);

    let dataContractInstance = new ethers.Contract(dataContractProxyAddress, iDataContractJson.abi, wallet);
    let dataContractInitTxn = await dataContractInstance.init(overrideOptions);
    await logger(dataContractJson.contractName, dataContractInitTxn.hash, "init");

    // Deploy HookOperator
    let hookOperatorDeployTxn = await ethers.Contract.getDeployTransaction(hookOperatorJson.bytecode, hookOperatorJson.abi);
    let hookOperatorAddress = await runDeployment(wallet, hookOperatorDeployTxn, hookOperatorJson.contractName);

    let hookOperatorProxyDeployTxn = await ethers.Contract.getDeployTransaction(hookOperatorProxyJson.bytecode, hookOperatorProxyJson.abi, hookOperatorAddress);
    let hookOperatorProxyAddress = await runDeployment(wallet, hookOperatorProxyDeployTxn, hookOperatorProxyJson.contractName);

    let hookOperatorInstance = new ethers.Contract(hookOperatorProxyAddress, iHookOperatorJson.abi, wallet);
    let hookOperatorInitTxn = await hookOperatorInstance.init(overrideOptions);
    await logger(hookOperatorJson.contractName, hookOperatorInitTxn.hash, "init");

    // Deploy UserManager
    let userManagerDeployTxn = await ethers.Contract.getDeployTransaction(userManagerJson.bytecode, userManagerJson.abi);
    let userManagerAddress = await runDeployment(wallet, userManagerDeployTxn, userManagerJson.contractName);

    let userManagerProxyDeployTxn = await ethers.Contract.getDeployTransaction(userManagerProxyJson.bytecode, userManagerProxyJson.abi, userManagerAddress);
    let userManagerProxyAddress = await runDeployment(wallet, userManagerProxyDeployTxn, userManagerProxyJson.contractName);

    let userManagerInstance = new ethers.Contract(userManagerProxyAddress, iUserManagerJson.abi, wallet);
    let userManagerInitTxn = await userManagerInstance.init(overrideOptions);
    await logger(userManagerJson.contractName, userManagerInitTxn.hash, "init");

    // Deploy UserContract
    let userContractDeployTxn = await ethers.Contract.getDeployTransaction(userContractJson.bytecode, userContractJson.abi);
    let userContractAddress = await runDeployment(wallet, userContractDeployTxn, userContractJson.contractName);

    // Deploy UserFactory
    let userFactoryDeployTxn = await ethers.Contract.getDeployTransaction(userFactoryJson.bytecode, userFactoryJson.abi);
    let userFactoryAddress = await runDeployment(wallet, userFactoryDeployTxn, userFactoryJson.contractName);

    let userFactoryProxyDeployTxn = await ethers.Contract.getDeployTransaction(userFactoryProxyJson.bytecode, userFactoryProxyJson.abi, userFactoryAddress);
    let userFactoryProxyAddress = await runDeployment(wallet, userFactoryProxyDeployTxn, userFactoryProxyJson.contractName);

    let userFactoryInstance = new ethers.Contract(userFactoryProxyAddress, iUserFactoryJson.abi, wallet);
    let userFactoryInitTxn = await userFactoryInstance.init(overrideOptions);
    await logger(userFactoryJson.contractName, userFactoryInitTxn.hash, "init");

    // Deploy KYCVerification
    let KYCVerificationDeployTxn = await ethers.Contract.getDeployTransaction(KYCVerificationJson.bytecode, KYCVerificationJson.abi);
    let KYCVerificationAddress = await runDeployment(wallet, KYCVerificationDeployTxn, KYCVerificationJson.contractName);

    let KYCVerificationProxyDeployTxn = await ethers.Contract.getDeployTransaction(KYCVerificationProxyJson.bytecode, KYCVerificationProxyJson.abi, KYCVerificationAddress);
    let KYCVerificationProxyAddress = await runDeployment(wallet, KYCVerificationProxyDeployTxn, KYCVerificationProxyJson.contractName);

    let KYCVerificationInstance = new ethers.Contract(KYCVerificationProxyAddress, iKYCVerificationJson.abi, wallet);
    let KYCVerificationInitTxn = await KYCVerificationInstance.init(overrideOptions);
    await logger(KYCVerificationJson.contractName, KYCVerificationInitTxn.hash, "init");

    // Deploy ExchangeOracle
    let exchangeOracleDeployTxn = await ethers.Contract.getDeployTransaction(exchangeOracleJson.bytecode, exchangeOracleJson.abi, initialOracleRate);
    let exchangeOracleAddress = await runDeployment(wallet, exchangeOracleDeployTxn, exchangeOracleJson.contractName);
    let exchangeOracleInstance = new ethers.Contract(exchangeOracleAddress, exchangeOracleJson.abi, wallet);

    // Deploy VestingContract
    let vestingDeployTxn = await ethers.Contract.getDeployTransaction(vestingJson.bytecode, vestingJson.abi, etherHolderMultiSigWalletAddress, endTime);
    let vestingAddress = await runDeployment(wallet, vestingDeployTxn, vestingJson.contractName);
    let vestingInstance = new ethers.Contract(vestingAddress, vestingJson.abi, wallet);

    // Deploy Crowdsale
    let crowdsaleDeployTxn = await ethers.Contract.getDeployTransaction(
        icoCappedRefundableCrowdsaleJson.bytecode,
        icoCappedRefundableCrowdsaleJson.abi,
        startTime,
        endTime,
        hardCap,
        softCap,
        vestingAddress,
        hookOperatorInstance.address
    );
    let crowdsaleAddress = await runDeployment(wallet, crowdsaleDeployTxn, icoCappedRefundableCrowdsaleJson.contractName);
    let crowdsaleInstance = new ethers.Contract(crowdsaleAddress, icoCappedRefundableCrowdsaleJson.abi, wallet);
    let tokenExtendedAddress = await crowdsaleInstance.token();

    let tokenInstance = new ethers.Contract(tokenExtendedAddress, tokenJson.abi, wallet);

    // Default Setters
    let setOverDepositTokensRecipientTxn = await vestingInstance.setOverDepositTokensRecipient(overDepositTokensRecipient, overrideOptions);
    await logger(vestingJson.contractName, setOverDepositTokensRecipientTxn.hash, "setOverDepositTokensRecipient");

    let setUserCreatorTxn = await userFactoryInstance.setUserCreator(userCreator, overrideOptions);
    await logger(userFactoryJson.contractName, setUserCreatorTxn.hash, "setUserCreator");

    let setImplAddressTxn = await userFactoryInstance.setImplAddress(userContractAddress, overrideOptions);
    await logger(userFactoryJson.contractName, setImplAddressTxn.hash, "setImplAddress");

    let setBalancePercentageLimitTxn = await hookOperatorInstance.setBalancePercentageLimit(balancePercentageLimit, overrideOptions);
    await logger(hookOperatorJson.contractName, setBalancePercentageLimitTxn.hash, "setBalancePercentageLimit");

    let setListerTxn = await crowdsaleInstance.setLister(lister, overrideOptions);
    await logger(icoCappedRefundableCrowdsaleJson.contractName, setListerTxn.hash, "setLister");

    let setKYCUserOwnerTxn = await KYCVerificationInstance.setKYCUserOwner(kycAdmin, overrideOptions);
    await logger(KYCVerificationJson.contractName, setKYCUserOwnerTxn.hash, "setKYCUserOwner");

    // KYC Limits - Anonymous
    let setDailyLimitForAnonymousUsersTxn = await KYCVerificationInstance.setDailyLimitForAnonymousUsers(transactionsDailyLimitAnonymous, overrideOptions);
    await logger(KYCVerificationJson.contractName, setDailyLimitForAnonymousUsersTxn.hash, "setDailyLimitForAnonymousUsers");
    let setWeeklyLimitForAnonymousUsersTxn = await KYCVerificationInstance.setWeeklyLimitForAnonymousUsers(transactionWeeklyLimitAnonymous, overrideOptions);
    await logger(KYCVerificationJson.contractName, setWeeklyLimitForAnonymousUsersTxn.hash, "setWeeklyLimitForAnonymousUsers");
    let setMonthlyLimitForAnonymousUsersTxn = await KYCVerificationInstance.setMonthlyLimitForAnonymousUsers(transactionMonthlyLimitAnonymous, overrideOptions);
    await logger(KYCVerificationJson.contractName, setMonthlyLimitForAnonymousUsersTxn.hash, "setMonthlyLimitForAnonymousUsers");
    let setMaxBalanceLimitForAnonymousUsersTxn = await KYCVerificationInstance.setMaxBalanceLimitForAnonymousUsers(maxBalanceAnonymousUser, overrideOptions);
    await logger(KYCVerificationJson.contractName, setMaxBalanceLimitForAnonymousUsersTxn.hash, "setMaxBalanceLimitForAnonymousUsers");

    // KYC Limits - Semi Verified
    let setDailyLimitForSemiVerifiedUsersTxn = await KYCVerificationInstance.setDailyLimitForSemiVerifiedUsers(transactionsDailyLimitSemiVerified, overrideOptions);
    await logger(KYCVerificationJson.contractName, setDailyLimitForSemiVerifiedUsersTxn.hash, "setDailyLimitForSemiVerifiedUsers");
    let setWeeklyLimitForSemiVerifiedUsersTxn = await KYCVerificationInstance.setWeeklyLimitForSemiVerifiedUsers(transactionWeeklyLimitSemiVerified, overrideOptions);
    await logger(KYCVerificationJson.contractName, setWeeklyLimitForSemiVerifiedUsersTxn.hash, "setWeeklyLimitForSemiVerifiedUsers");
    let setMonthlyLimitForSemiVerifiedUsersTxn = await KYCVerificationInstance.setMonthlyLimitForSemiVerifiedUsers(transactionMonthlyLimitSemiVerified, overrideOptions);
    await logger(KYCVerificationJson.contractName, setMonthlyLimitForSemiVerifiedUsersTxn.hash, "setMonthlyLimitForSemiVerifiedUsers");
    let setMaxBalanceLimitForSemiVerifiedUsersTxn = await KYCVerificationInstance.setMaxBalanceLimitForSemiVerifiedUsers(maxBalanceSemiVerifiedUser, overrideOptions);
    await logger(KYCVerificationJson.contractName, setMaxBalanceLimitForSemiVerifiedUsersTxn.hash, "setMaxBalanceLimitForSemiVerifiedUsers");

    // Contracts connections
    let setDataContractTxn = await userFactoryInstance.setDataContract(dataContractInstance.address, overrideOptions);
    await logger(userFactoryJson.contractName, setDataContractTxn.hash, "setDataContract");
    let setUserManagerAddressTxn = await userFactoryInstance.setUserManagerAddress(userManagerInstance.address, overrideOptions);
    await logger(userFactoryJson.contractName, setUserManagerAddressTxn.hash, "setUserManagerAddress");
    let setHookOperatorAddressTxn = await userFactoryInstance.setHookOperatorAddress(hookOperatorInstance.address, overrideOptions);
    await logger(userFactoryJson.contractName, setHookOperatorAddressTxn.hash, "setHookOperatorAddress");
    let setKYCVerificationInstanceTxn = await userFactoryInstance.setKYCVerificationInstance(KYCVerificationInstance.address, overrideOptions);
    await logger(userFactoryJson.contractName, setKYCVerificationInstanceTxn.hash, "setKYCVerificationInstance");
    let setUsersBatchLimitTxn = await userFactoryInstance.setUsersBatchLimit(createUsersBatchLimit, overrideOptions);
    await logger(userFactoryJson.contractName, setUsersBatchLimitTxn.hash, "setUsersBatchLimit");

    setDataContractTxn = await userManagerInstance.setDataContract(dataContractInstance.address, overrideOptions);
    await logger(userManagerJson.contractName, setDataContractTxn.hash, "setDataContract");
    let setUserFactoryContractTxn = await userManagerInstance.setUserFactoryContract(userFactoryInstance.address, overrideOptions);
    await logger(userManagerJson.contractName, setUserFactoryContractTxn.hash, "setUserFactoryContract");
    let setHookOperatorContractTxn = await userManagerInstance.setHookOperatorContract(hookOperatorInstance.address, overrideOptions);
    await logger(userManagerJson.contractName, setHookOperatorContractTxn.hash, "setHookOperatorContract");
    let setCrowdsaleContractTxn = await userManagerInstance.setCrowdsaleContract(crowdsaleInstance.address, overrideOptions);
    await logger(userManagerJson.contractName, setCrowdsaleContractTxn.hash, "setCrowdsaleContract");

    let setUserManagerTxn = await dataContractInstance.setUserManager(userManagerInstance.address, overrideOptions);
    await logger(dataContractJson.contractName, setUserManagerTxn.hash, "setUserManager");
    let setUserFactoryTxn = await dataContractInstance.setUserFactory(userFactoryInstance.address, overrideOptions);
    await logger(dataContractJson.contractName, setUserFactoryTxn.hash, "setUserFactory");

    let setICOTokenTxn = await hookOperatorInstance.setICOToken(tokenInstance.address, overrideOptions);
    await logger(hookOperatorJson.contractName, setICOTokenTxn.hash, "setICOToken");
    setUserManagerTxn = await hookOperatorInstance.setUserManager(userManagerInstance.address, overrideOptions);
    await logger(hookOperatorJson.contractName, setUserManagerTxn.hash, "setUserManager");
    let setKYCVerificationContractTxn = await hookOperatorInstance.setKYCVerificationContract(KYCVerificationInstance.address, overrideOptions);
    await logger(hookOperatorJson.contractName, setKYCVerificationContractTxn.hash, "setKYCVerificationContract");

    setUserFactoryTxn = await KYCVerificationInstance.setUserFactory(userFactoryInstance.address, overrideOptions);
    await logger(KYCVerificationJson.contractName, setUserFactoryTxn.hash, "setUserFactory");
    let setExchangeOracleTxn = await KYCVerificationInstance.setExchangeOracle(exchangeOracleInstance.address, overrideOptions);
    await logger(KYCVerificationJson.contractName, setExchangeOracleTxn.hash, "setExchangeOracle");

    let setTokenInstanceTxn = await vestingInstance.setTokenInstance(tokenInstance.address, overrideOptions);
    await logger(vestingJson.contractName, setTokenInstanceTxn.hash, "setTokenInstance");
    let setHookOperatorTxn = await vestingInstance.setHookOperator(hookOperatorInstance.address, overrideOptions);
    await logger(vestingJson.contractName, setHookOperatorTxn.hash, "setHookOperator");

    let setUserManagerContractTxn = await crowdsaleInstance.setUserManagerContract(userManagerInstance.address, overrideOptions);
    await logger(icoCappedRefundableCrowdsaleJson.contractName, setUserManagerContractTxn.hash, "setUserManagerContract");

    // DataContract
    let transferOwnershipDataContractTxn = await dataContractInstance.transferOwnership(ownerMultiSigWalletAddress, overrideOptions);
    await logger(dataContractJson.contractName, transferOwnershipDataContractTxn.hash, "transferOwnershipDataContractTxn");

    // HookOperator
    let transferOwnershipHookOperatorTxn = await hookOperatorInstance.transferOwnership(ownerMultiSigWalletAddress, overrideOptions);
    await logger(dataContractJson.contractName, transferOwnershipHookOperatorTxn.hash, "transferOwnershipHookOperatorTxn");

    // Crowdsale
    let transferOwnershipCrowdSaleTxn = await crowdsaleInstance.transferOwnership(ownerMultiSigWalletAddress, overrideOptions);
    await logger(dataContractJson.contractName, transferOwnershipCrowdSaleTxn.hash, "transferOwnershipCrowdSaleTxn");

    // Token
    let transferOwnershipTokenTxn = await tokenInstance.transferOwnership(ownerMultiSigWalletAddress, overrideOptions);
    await logger(dataContractJson.contractName, transferOwnershipTokenTxn.hash, "transferOwnershipTokenTxn");

    // KYCContract
    let transferOwnershipKYCTxn = await KYCVerificationInstance.transferOwnership(ownerMultiSigWalletAddress, overrideOptions);
    await logger(dataContractJson.contractName, transferOwnershipKYCTxn.hash, "transferOwnershipKYCTxn");

    // Oracle
    let transferOwnershipExchangeTxn = await exchangeOracleInstance.transferOwnership(ownerMultiSigWalletAddress, overrideOptions);
    await logger(dataContractJson.contractName, transferOwnershipExchangeTxn.hash, "transferOwnershipExchangeTxn");

    // UserFactory
    let transferOwnershipUserFactoryTxn = await userFactoryInstance.transferOwnership(ownerMultiSigWalletAddress, overrideOptions);
    await logger(dataContractJson.contractName, transferOwnershipUserFactoryTxn.hash, "transferOwnershipUserFactoryTxn");

    // UserManager
    let transferOwnershipUserManagerTxn = await userManagerInstance.transferOwnership(ownerMultiSigWalletAddress, overrideOptions);
    await logger(dataContractJson.contractName, transferOwnershipUserManagerTxn.hash, "transferOwnershipUserManagerTxn");

    // Vesting
    let transferOwnershipVestingTxn = await vestingInstance.transferOwnership(ownerMultiSigWalletAddress, overrideOptions);
    await logger(dataContractJson.contractName, transferOwnershipVestingTxn.hash, "transferOwnershipVestingTxn");

    console.log("Done!");
};

logger = async function (contractName, txnHash, functionName) {
    console.log("Function " + contractName + " " + functionName + " txnHash: \n .... ", txnHash);
    await localNodeProvider.waitForTransaction(txnHash);
};

run();