const ICOCrowdsale = artifacts.require("./ICOCrowdsale.sol");
const ICOTokenExtended = artifacts.require("./ICOTokenExtended.sol");
const ICOToken = artifacts.require("./ICOToken.sol");

let UserManagerProxy = artifacts.require("./UserManagerProxy.sol");
let UserManager = artifacts.require("./UserManager.sol");
let IUserManager = artifacts.require("./IUserManager.sol");

let HookOperatorProxy = artifacts.require("./HookOperatorProxy.sol");
let HookOperator = artifacts.require("./HookOperator.sol");
let IHookOperator = artifacts.require("./IHookOperator.sol");

let IUserFactory = artifacts.require("./IUserFactory.sol");
let UserFactory = artifacts.require("./UserFactory.sol");
let UserFactoryProxy = artifacts.require("./UserFactoryProxy.sol");

let IUserContract = artifacts.require("./IUserContract.sol");
let UserContract = artifacts.require("./UserContract.sol");
let UserContractProxy = artifacts.require("./UserContractProxy.sol");

let LinkedList = artifacts.require("./LinkedList.sol");
let LinkedListContract = artifacts.require("./LinkedListContract.sol");

let IDataContract = artifacts.require("./IDataContract.sol");
let DataContract = artifacts.require("./DataContract.sol");
let DataContractProxy = artifacts.require("./DataContractProxy.sol");

const IKYCVerification = artifacts.require("./IKYCVerification.sol");
const KYCVerification = artifacts.require("./KYCVerification.sol");
const KYCVerificationProxy = artifacts.require("./KYCVerificationProxy.sol");

const ExchangeOracle = artifacts.require("./ExchangeOracle.sol");

var ProjectInitializator = (function () {
    let userManagerContract;
    let dataContract;
    let userContract;
    let userFactoryContract;
    let hookOperatorContract;
    let icoTokenContract;
    let kycVerificationContract;
    let exchangeOracleContract;

    let initWithAddress = async function(_owner) {

        const rate = 100; // 0.01 eth = 1 token

        await initUserManager(_owner);
        await initDataContract(_owner);
        await initUserContract(_owner);
        await initUserFactory(_owner);
        await initHookOperator(_owner);
        await initToken(_owner);
        await initKYCVerification(_owner);
        await initExchangeOracle(_owner, rate);

        /**
         * Connect Contracts
        */
        await relateUserFactoryContract(_owner);
        await relateUserManagerContract(_owner);
        await relateDataContract(_owner);
        await relateHookOperatorContract(_owner);
        await relateIcoTokenContract(_owner);
        await relateKYCVerificationContract(_owner);
	
        // /**
        //  * Initialize Default Values
        // */
        const balancePercentageLimit = 2; // a user can have to 2% of the total tokens supply 
        const isOverBalanceLimitHolder = true;

        await hookOperatorContract.setBalancePercentageLimit(balancePercentageLimit, {from: _owner});
        await hookOperatorContract.setOverBalanceLimitHolder(_owner, isOverBalanceLimitHolder, {from: _owner});

        await userFactoryContract.setUserCreator(_owner, {from: _owner});

        return {
            userManagerContract: userManagerContract,
            dataContract: dataContract,
            userContract: userContract,
            userFactoryContract: userFactoryContract,
            hookOperatorContract: hookOperatorContract,
            icoTokenContract: icoTokenContract,
            kycVerificationContract: kycVerificationContract,
            exchangeOracleContract: exchangeOracleContract
        }
    };

    let initUserManager = async function(owner) {
        let userManager = await UserManager.new({from: owner});
        let userManagerProxy = await UserManagerProxy.new(userManager.address);
        userManagerContract = await IUserManager.at(userManagerProxy.address);

        await userManagerContract.init({from: owner});

        return userManagerContract;
    }

    let initDataContract = async function(owner) {
        let linkedList = await LinkedList.new();
        DataContract.link("LinkedList", linkedList.address);

        let data = await DataContract.new({from: owner});
        let dataContractProxy = await DataContractProxy.new(data.address);
        dataContract = await IDataContract.at(dataContractProxy.address);

        await dataContract.init({from: owner});

        return dataContract;
    }
   
    let initUserContract = async function(owner) {
        userContract = await UserContract.new({from: owner});

        return userContract;
    }

    let initUserFactory = async function(owner) {
        let userFactory = await UserFactory.new();
        let userFactoryProxy = await UserFactoryProxy.new(userFactory.address);
        userFactoryContract = await IUserFactory.at(userFactoryProxy.address);

        await userFactoryContract.init({from: owner});

        return userFactoryContract;
    }

    let initHookOperator = async function(owner) {
        let hookOperator = await HookOperator.new({from: owner});
        let hookOperatorProxy = await HookOperatorProxy.new(hookOperator.address);
        hookOperatorContract = await IHookOperator.at(hookOperatorProxy.address);

        await hookOperatorContract.init({from: owner});

        return hookOperatorContract;
    }

    let initToken = async function(owner) {
        icoTokenContract = await ICOTokenExtended.new({from: owner});
        
        return icoTokenContract;
    }

    let initKYCVerification = async function(owner) {
        let kycVerification = await KYCVerification.new();
        let kycVerificationProxy = await KYCVerificationProxy.new(kycVerification.address);
        kycVerificationContract = await IKYCVerification.at(kycVerificationProxy.address);
        
        await kycVerificationContract.init({from: owner});

        return kycVerificationContract;
    }

    let initExchangeOracle = async function(owner, initialRate) {
        exchangeOracleContract = await ExchangeOracle.new(initialRate, {from: owner});

        return exchangeOracleContract;
    }

    let relateUserFactoryContract = async function(owner) {
        await userFactoryContract.setImplAddress(userContract.address, {from: owner});
        await userFactoryContract.setUserManagerAddress(userManagerContract.address, {from: owner});
        await userFactoryContract.setDataContract(dataContract.address, {from: owner});
    }

    let relateUserManagerContract = async function(owner) {
        await userManagerContract.setDataContract(dataContract.address, {from: owner});
        await userManagerContract.setUserFactoryContract(userFactoryContract.address, {from: owner});
        await userManagerContract.setHookOperatorContract(hookOperatorContract.address, {from: owner});
    }

    let relateDataContract = async function(owner) {
        await dataContract.setUserManager(userManagerContract.address, {from: owner});
        await dataContract.setUserFactory(userFactoryContract.address, {from: owner});
    }

    let relateHookOperatorContract = async function(owner) {
        await hookOperatorContract.setUserManager(userManagerContract.address, {from: owner});
        await hookOperatorContract.setICOToken(icoTokenContract.address, {from: owner});
        await hookOperatorContract.setKYCVerficationContract(kycVerificationContract.address, {from: owner});
    }

    let relateIcoTokenContract = async function(owner) {
        await icoTokenContract.setHookOperator(hookOperatorContract.address, {from: owner});
        await icoTokenContract.setExchangeOracle(exchangeOracleContract.address, {from: owner});
    }

    let relateKYCVerificationContract = async function(owner) {
        await kycVerificationContract.setKYCUserOwner(owner, {from: owner});
        await kycVerificationContract.setExchangeOracle(exchangeOracleContract.address, {from: owner});
        await kycVerificationContract.setUserFactory(userFactoryContract.address, {from: owner});
    }

    let createVerifiedUsers = async function(owner, users) {
        let verifiedStatus = 2;

        for (let i = 0; i < users.length; i++) {
            await userFactoryContract.createNewUser(users[i], verifiedStatus, {from: owner});            
        }
    }

    let getContracts = function (){
        return{
            userManagerContract: userManagerContract,
            dataContract: dataContract,
            userContract: userContract,
            userFactoryContract: userFactoryContract,
            hookOperatorContract: hookOperatorContract,
            icoTokenContract: icoTokenContract,
            kycVerificationContract: kycVerificationContract,
            exchangeOracleContract: exchangeOracleContract,
        }
       
    } 

    return {
        initWithAddress: initWithAddress,
        initUserManager: initUserManager,
        initDataContract: initDataContract,
        initHookOperator: initHookOperator,
        initUserContract: initUserContract,
        initUserFactory: initUserFactory,
        initToken: initToken,
        initKYCVerification: initKYCVerification,
        initExchangeOracle: initExchangeOracle,
        relateDataContract: relateDataContract,
        relateIcoTokenContract: relateIcoTokenContract,
        relateUserManagerContract: relateUserManagerContract,
        relateHookOperatorContract: relateHookOperatorContract,
        relateUserFactoryContract: relateUserFactoryContract,
        relateKYCVerificationContract: relateKYCVerificationContract,
        createVerifiedUsers: createVerifiedUsers,
        getContracts: getContracts
    }
})();

module.exports = ProjectInitializator;