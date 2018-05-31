const ExchangeOracle = artifacts.require("./ExchangeOracle.sol");

const IUserFactory = artifacts.require("./IUserFactory.sol");
const UserFactory = artifacts.require("./UserFactory.sol");
const UserFactoryProxy = artifacts.require("./UserFactoryProxy.sol");

const IUserContract = artifacts.require("./IUserContract.sol");
const UserContract = artifacts.require("./UserContract.sol");
const UserContractProxy = artifacts.require("./UserContractProxy.sol");

const ICOToken = artifacts.require("./ICOTokenExtended.sol");

const expectThrow = require('./../util').expectThrow;
const getEvent = require('./../util').getEvent;

const ProjectInitializator = require("./../ProjectInitializator");

contract('KYCVerification', function (accounts) {

    let instance;

    const owner = accounts[0];
    const nonOwner = accounts[9];
    const kycAdmin = accounts[8];

    const userOneAddress = accounts[1];
    const userTwoAddress = accounts[2];

    const oracleInitialRate = 100;
    const AIURWei = 1000000000000000000000; // 1000 AIUR tokens == 10**21 AIUR wei == 1 ETH == 10**18 ETH wei

    let etherWei = 1000000000000000000;
    let ether = etherWei;

    let tokenWei = 1000000000000000000;
    let token = tokenWei;

    const transactionsDailyLimitAnonymous = (15 * token) / oracleInitialRate; // 15 tokens AIUR -> ETH 
    const transactionWeeklyLimitAnonymous = (60 * token) / oracleInitialRate; // 60 tokens AIUR -> ETH
    const transactionMonthlyLimitAnonymous = (120 * token) / oracleInitialRate; // 120 tokens AIUR -> ETH
    const maxBalanceAnonymousUser = (60 * token) / oracleInitialRate; // 60 tokens AIUR -> ETH

    const transactionsDailyLimitSemiVerified = (70 * token) / oracleInitialRate; // 15 tokens AIUR -> ETH 
    const transactionWeeklyLimitSemiVerified = (280 * token) / oracleInitialRate; // 15 tokens AIUR -> ETH 
    const transactionMonthlyLimitSemiVerified = (560 * token) / oracleInitialRate; // 15 tokens AIUR -> ETH 
    const maxBalanceSemiVerifiedUser = (280 * token) / oracleInitialRate; // 15 tokens AIUR -> ETH 

    let ICOTokenInstance;
    let userFactoryContract;
    let kycVerificationContract;

    before(async () => {
        let contracts = await ProjectInitializator.initWithAddress(owner, kycAdmin);

        ICOTokenInstance = await contracts.icoTokenContract;
        userFactoryContract = await contracts.userFactoryContract;
        kycVerificationContract = await contracts.kycVerificationContract;

        await kycVerificationContract.setKYCUserOwner(kycAdmin, {from: owner});
	});

    describe("Testing KYC Setters", () => {

        describe("Testing daily limit", () => {
            it('should set daily limit for anonymous users', async () => {
                await kycVerificationContract.setDailyLimitForAnonymousUsers(transactionsDailyLimitAnonymous, {from: kycAdmin});
                let transactionsDailyLimit = await kycVerificationContract.getDailyLimitForAnonymousUsers();
    
                assert.equal(transactionsDailyLimit, transactionsDailyLimitAnonymous, `Daily limit should be ${transactionsDailyLimitAnonymous} but returned ${transactionsDailyLimit}`);
            });
    
            it('should not set daily limit for anonymous users if the method caller is not the contract kyc admin', async () => {
                await expectThrow(kycVerificationContract.setDailyLimitForAnonymousUsers(transactionsDailyLimitAnonymous, {from: nonOwner}));
            });

            it('should not set daily limit for anonymous users if the method caller is the main owner', async () => {
                await expectThrow(kycVerificationContract.setDailyLimitForAnonymousUsers(transactionsDailyLimitAnonymous, {from: owner}));
            });
    
            it('should set daily limit for semi verified users', async () => {
                await kycVerificationContract.setDailyLimitForSemiVerifiedUsers(transactionsDailyLimitSemiVerified, {from: kycAdmin});
                let transactionsDailyLimit = await kycVerificationContract.getDailyLimitForSemiVerifiedUsers();
    
                assert.equal(transactionsDailyLimit, transactionsDailyLimitSemiVerified, `Daily limit should be ${transactionsDailyLimitSemiVerified} but returned ${transactionsDailyLimit}`);
            });
    
            it('should not set daily limit for semi verified users if the method caller is not the contract kyc admin', async () => {
                await expectThrow(kycVerificationContract.setDailyLimitForSemiVerifiedUsers(transactionsDailyLimitSemiVerified, {from: nonOwner}));
            });

            it('should not set daily limit for semi verified users if the method caller is the main owner', async () => {
                await expectThrow(kycVerificationContract.setDailyLimitForSemiVerifiedUsers(transactionsDailyLimitSemiVerified, {from: owner}));
            });
        });

        describe("Testing weekly limit", () => {
            it('should set weekly limit for anonymous users', async () => {
                await kycVerificationContract.setWeeklyLimitForAnonymousUsers(transactionWeeklyLimitAnonymous, {from: kycAdmin});
                let transactionsWeeklyLimit = await kycVerificationContract.getWeeklyLimitForAnonymousUsers();

                assert.equal(transactionsWeeklyLimit, transactionWeeklyLimitAnonymous, `Weekly limit should be ${transactionWeeklyLimitAnonymous} but returned ${transactionsWeeklyLimit}`);
            });

            it('should not set daily limit for anonymous users if the method caller is not the contract kyc admin', async () => {
                await expectThrow(kycVerificationContract.setWeeklyLimitForAnonymousUsers(transactionWeeklyLimitAnonymous, {from: nonOwner}));
            });

            it('should not set daily limit for anonymous users if the method caller is the main owner', async () => {
                await expectThrow(kycVerificationContract.setWeeklyLimitForAnonymousUsers(transactionWeeklyLimitAnonymous, {from: owner}));
            });

            it('should set weekly limit for semi verified users', async () => {
                await kycVerificationContract.setWeeklyLimitForSemiVerifiedUsers(transactionWeeklyLimitSemiVerified, {from: kycAdmin});
                let transactionsWeeklyLimit = await kycVerificationContract.getWeeklyLimitForSemiVerifiedUsers();

                assert.equal(transactionsWeeklyLimit, transactionWeeklyLimitSemiVerified, `Weekly limit should be ${transactionWeeklyLimitSemiVerified} but returned ${transactionsWeeklyLimit}`);
            });

            it('should not set daily limit for semi verified users if the method caller is not the contract kyc admin', async () => {
                await expectThrow(kycVerificationContract.setWeeklyLimitForSemiVerifiedUsers(transactionWeeklyLimitSemiVerified, {from: nonOwner}));
            });

            it('should not set daily limit for semi verified users if the method caller is the main owner', async () => {
                await expectThrow(kycVerificationContract.setWeeklyLimitForSemiVerifiedUsers(transactionWeeklyLimitSemiVerified, {from: owner}));
            });
        });

        describe("Testing monthly limit", () => {
            it('should set monthly limit for anonymous users', async () => {
                await kycVerificationContract.setMonthlyLimitForAnonymousUsers(transactionMonthlyLimitAnonymous, {from: kycAdmin});
                let transactionsMonthlyLimit = await kycVerificationContract.getMonthlyLimitForAnonymousUsers();

                assert.equal(transactionsMonthlyLimit, transactionMonthlyLimitAnonymous, `Weekly limit should be ${transactionMonthlyLimitAnonymous} but returned ${transactionsMonthlyLimit}`);
            });

            it('should not set monthly limit for anonymous users if the method caller is not the contract kyc admin', async () => {
                await expectThrow(kycVerificationContract.setMonthlyLimitForAnonymousUsers(transactionMonthlyLimitAnonymous, {from: nonOwner}));
            });

            it('should not set monthly limit for anonymous users if the method caller is the main owner', async () => {
                await expectThrow(kycVerificationContract.setMonthlyLimitForAnonymousUsers(transactionMonthlyLimitAnonymous, {from: owner}));
            });

            it('should set monthly limit for semi verified users', async () => {
                await kycVerificationContract.setMonthlyLimitForSemiVerifiedUsers(transactionMonthlyLimitSemiVerified, {from: kycAdmin});
                let transactionsMonthlyLimit = await kycVerificationContract.getMonthlyLimitForSemiVerifiedUsers();

                assert.equal(transactionsMonthlyLimit, transactionMonthlyLimitSemiVerified, `Weekly limit should be ${transactionMonthlyLimitSemiVerified} but returned ${transactionsMonthlyLimit}`);
            });

            it('should not set monthly limit for semi verified users if the method caller is not the contract kyc admin', async () => {
                await expectThrow(kycVerificationContract.setMonthlyLimitForSemiVerifiedUsers(transactionMonthlyLimitSemiVerified, {from: nonOwner}));
            });

            it('should not set monthly limit for semi verified users if the method caller is the main owner', async () => {
                await expectThrow(kycVerificationContract.setMonthlyLimitForSemiVerifiedUsers(transactionMonthlyLimitSemiVerified, {from: owner}));
            });
        });

        describe("Testing balance limit", () => {
            it('should set max balance limit for anonymous users', async () => {
                await kycVerificationContract.setMaxBalanceLimitForAnonymousUsers(maxBalanceAnonymousUser, {from: kycAdmin});
                let maxBalance = await kycVerificationContract.getMaxBalanceLimitForAnonymousUsers();
                
                assert.equal(maxBalance, maxBalanceAnonymousUser, `Max balance limit should be ${maxBalanceAnonymousUser} but returned ${maxBalance}`);
            });

            it('should not set max balance limit for anonymous users if the method caller is not the contract kyc admin', async () => {
                await expectThrow(kycVerificationContract.setMaxBalanceLimitForAnonymousUsers(maxBalanceAnonymousUser, {from: nonOwner}));
            });

            it('should not set max balance limit for anonymous users if the method caller is the main owner', async () => {
                await expectThrow(kycVerificationContract.setMaxBalanceLimitForAnonymousUsers(maxBalanceAnonymousUser, {from: owner}));
            });

            it('should set max balance limit for semi verified users', async () => {
                await kycVerificationContract.setMaxBalanceLimitForSemiVerifiedUsers(maxBalanceSemiVerifiedUser, {from: kycAdmin});
                let maxBalance = await kycVerificationContract.getMaxBalanceLimitForSemiVerifiedUsers();
                
                assert.equal(maxBalance, maxBalanceSemiVerifiedUser, `Max balance limit should be ${maxBalanceSemiVerifiedUser} but returned ${maxBalance}`);
            });

            it('should not set max balance limit for semi verified users if the method caller is the main owner', async () => {
                await expectThrow(kycVerificationContract.setMaxBalanceLimitForSemiVerifiedUsers(maxBalanceSemiVerifiedUser, {from: owner}));
            });
        });
    });

    describe("Set up oracle", () => {
        it("should set up oracle", async () => {
            let exchangeOracle = await ExchangeOracle.new(oracleInitialRate);

            await kycVerificationContract.setExchangeOracle(exchangeOracle.address, {from: kycAdmin});
            let exchangeOracleInstance = await kycVerificationContract.getExchangeOracle(); 

            assert.strictEqual(exchangeOracleInstance, exchangeOracle.address, `The returned contract address is invalid. It should be ${exchangeOracle.address} instead of ${exchangeOracleInstance}`);
        });

        it("should throw when non owner is setting up the oracle", async () => {
            let exchangeOracle = await ExchangeOracle.new(oracleInitialRate);

            await expectThrow(kycVerificationContract.setExchangeOracle(exchangeOracle.address, {from: nonOwner}));
        });

        it("should throw if invalid address is passed", async () => {
            await expectThrow(kycVerificationContract.setExchangeOracle("0x0", {from: nonOwner}));
        });
    });

    describe("Set UserFactory Contract", () => {
        it("should set up user factory", async () => {
            await kycVerificationContract.setUserFactory(userFactoryContract.address, {from: kycAdmin});
            let userFactoryAddress = await kycVerificationContract.getUserFactoryContractAddress();

            assert.equal(userFactoryAddress, userFactoryContract.address, `User Factory address should be ${userFactoryContract.address} but returned ${userFactoryAddress}`);
        });

        it("should throw when non owner is setting up the user factory", async () => {
            await expectThrow(kycVerificationContract.setUserFactory(userFactoryContract.address, {from: nonOwner}));
        });

        it("should throw if invalid address is passed", async () => {
            await expectThrow(kycVerificationContract.setUserFactory("0x0", {from: nonOwner}));
        });
    });

    describe("Testing KYC Verifications functions", () => {
        let validTokensToSend = 5 * token;
        let invalidTokensToSend = 1000 * token;

        let validAmount = 5 * token;
        let invalidAmount = 1000 * token;

        before(async () => {
            /**
             * Anonymous
            */
            await kycVerificationContract.setDailyLimitForAnonymousUsers(transactionsDailyLimitAnonymous, {from: kycAdmin});
            await kycVerificationContract.setWeeklyLimitForAnonymousUsers(transactionWeeklyLimitAnonymous, {from: kycAdmin});
            await kycVerificationContract.setMonthlyLimitForAnonymousUsers(transactionMonthlyLimitAnonymous, {from: kycAdmin});
            await kycVerificationContract.setMaxBalanceLimitForAnonymousUsers(maxBalanceAnonymousUser, {from: kycAdmin});

            /**
             * Semi Verified
            */
            await kycVerificationContract.setDailyLimitForSemiVerifiedUsers(transactionsDailyLimitSemiVerified, {from: kycAdmin});
            await kycVerificationContract.setWeeklyLimitForSemiVerifiedUsers(transactionWeeklyLimitSemiVerified, {from: kycAdmin});
            await kycVerificationContract.setMonthlyLimitForSemiVerifiedUsers(transactionMonthlyLimitSemiVerified, {from: kycAdmin});
            await kycVerificationContract.setMaxBalanceLimitForSemiVerifiedUsers(maxBalanceSemiVerifiedUser, {from: kycAdmin});
        });

        describe("Testing Daily Limit - Anonymous Users", () => {
            it("should not throw if all requirements are passed", async () => {
                let tokensToSend = validTokensToSend; 
                let dailyAmount = validAmount;

                await kycVerificationContract.verifyDailyLimitKYC(tokensToSend, dailyAmount, 0);
            });

            it("should throw when daily amount is bigger than the daily limit", async () => {
                let tokensToSend = validTokensToSend; 
                let dailyAmount = invalidAmount;

                await expectThrow(kycVerificationContract.verifyDailyLimitKYC(tokensToSend, dailyAmount, 0));
            });

            it("should throw when the sended token will pass the limit", async () => {
                let tokensToSend = invalidTokensToSend; 
                let dailyAmount = validAmount;

                await expectThrow(kycVerificationContract.verifyDailyLimitKYC(tokensToSend, dailyAmount, 0));
            });
        }); 

        describe("Testing Daily Limit - Semi Verified Users", () => {
            it("should not throw if all requirements are passed", async () => {
                let tokensToSend = validTokensToSend;
                let dailyAmount = validAmount;

                await kycVerificationContract.verifyDailyLimitKYC(tokensToSend, dailyAmount, 1);
            });

            it("should throw when daily amount is bigger than the daily limit", async () => {
                let tokensToSend = validTokensToSend; 
                let dailyAmount = invalidAmount;

                await expectThrow(kycVerificationContract.verifyDailyLimitKYC(tokensToSend, dailyAmount, 1));
            });

            it("should throw when the sended token will pass the limit", async () => {
                let tokensToSend = invalidTokensToSend; 
                let dailyAmount = validAmount;

                await expectThrow(kycVerificationContract.verifyDailyLimitKYC(tokensToSend, dailyAmount, 1));
            });
        });

        describe("Testing Weekly Limit - Anonymous Users", () => {
            it("should not throw if all requirements are passed", async () => {
                let tokensToSend = validTokensToSend; 
                let weeklyAmount = validAmount;

                await kycVerificationContract.verifyWeeklyLimitKYC(tokensToSend, weeklyAmount, 0);
            });

            it("should throw when weekly amount is bigger than the weekly limit", async () => {
                let tokensToSend = validTokensToSend; 
                let weeklyAmount = invalidAmount;

                await expectThrow(kycVerificationContract.verifyWeeklyLimitKYC(tokensToSend, weeklyAmount, 0));
            });

            it("should throw when the sended token will pass the limit", async () => {
                let tokensToSend = invalidTokensToSend;
                let weeklyAmount = validAmount;

                await expectThrow(kycVerificationContract.verifyWeeklyLimitKYC(tokensToSend, weeklyAmount, 0));
            });
        });

        describe("Testing Weekly Limit - Semi Verified Users", () => {
            it("should not throw if all requirements are passed", async () => {
                let tokensToSend = validTokensToSend; 
                let weeklyAmount = validAmount;

                await kycVerificationContract.verifyWeeklyLimitKYC(tokensToSend, weeklyAmount, 1);
            });

            it("should throw when weekly amount is bigger than the weekly limit", async () => {
                let tokensToSend = validTokensToSend; 
                let weeklyAmount = invalidAmount;

                await expectThrow(kycVerificationContract.verifyWeeklyLimitKYC(tokensToSend, weeklyAmount, 1));
            });

            it("should throw when the sended token will pass the limit", async () => {
                let tokensToSend = invalidTokensToSend;
                let weeklyAmount = validAmount;

                await expectThrow(kycVerificationContract.verifyWeeklyLimitKYC(tokensToSend, weeklyAmount, 1));
            });
        });

        describe("Testing Monthly Limit - Anonymous Users", () => {
            it("should not throw if all requirements are passed", async () => {
                let tokensToSend = validTokensToSend; 
                let monthlyAmount = validAmount;

                await kycVerificationContract.verifyMontlyLimitKYC(tokensToSend, monthlyAmount, 0);
            });

            it("should throw when monthly amount is bigger than the monthly limit", async () => {
                let tokensToSend = validTokensToSend; 
                let monthlyAmount = invalidAmount;

                await expectThrow(kycVerificationContract.verifyMontlyLimitKYC(tokensToSend, monthlyAmount, 0));
            });

            it("should throw when the sended token will pass the limit", async () => {
                let tokensToSend = invalidTokensToSend; 
                let monthlyAmount = validAmount;

                await expectThrow(kycVerificationContract.verifyMontlyLimitKYC(tokensToSend, monthlyAmount, 0));
            });
        });

        describe("Testing Monthly Limit - Semi Verified Users", () => {
            it("should not throw if all requirements are passed", async () => {
                let tokensToSend = validTokensToSend; 
                let monthlyAmount = validAmount;

                await kycVerificationContract.verifyMontlyLimitKYC(tokensToSend, monthlyAmount, 1);
            });

            it("should throw when monthly amount is bigger than the monthly limit", async () => {
                let tokensToSend = validTokensToSend; 
                let monthlyAmount = invalidAmount;

                await expectThrow(kycVerificationContract.verifyMontlyLimitKYC(tokensToSend, monthlyAmount, 1));
            });

            it("should throw when the sended token will pass the limit", async () => {
                let tokensToSend = invalidTokensToSend; 
                let monthlyAmount = validAmount;

                await expectThrow(kycVerificationContract.verifyMontlyLimitKYC(tokensToSend, monthlyAmount, 1));
            });
        });

        describe("Testing Max Balance Limit - Anonymous Users", () => {
            it("should not throw if all requirements are passed", async () => {
                let tokensToSend = 5 * token; // 5 AIUR tokens
                let userBalance = 30 * token; // User balance = 30 AIUR tokens

                await kycVerificationContract.verifyMaxBalanceKYC(tokensToSend, userBalance, 0);
            });

            it("should throw if token amount is equal to zero", async () => {
                let tokensToSend = 0;
                let userBalance = 30 * token; // User balance = 30 AIUR tokens

                await expectThrow(kycVerificationContract.verifyMaxBalanceKYC(tokensToSend, userBalance, 0));
            });

            it('should throw if max balance limit will be passed', async () => {
                let tokensToSend = 1000 * token; // 1000 AIUR tokens
                let userBalance = 30 * token; // User balance = 30 AIUR tokens

                await expectThrow(kycVerificationContract.verifyMaxBalanceKYC(tokensToSend, userBalance, 0));
            });
        });

        describe("Testing Max Balance Limit - Semi Verified Users", () => {
            it("should not throw if all requirements are passed", async () => {
                let tokensToSend = 5 * token; // 5 AIUR tokens
                let userBalance = 30 * token; // User balance = 30 AIUR tokens

                await kycVerificationContract.verifyMaxBalanceKYC(tokensToSend, userBalance, 1);
            });

            it("should throw if token amount is equal to zero", async () => {
                let tokensToSend = 0;
                let userBalance = 30 * token; // User balance = 30 AIUR tokens

                await expectThrow(kycVerificationContract.verifyMaxBalanceKYC(tokensToSend, userBalance, 1));
            });

            it('should throw if max balance limit will be passed', async () => {
                let tokensToSend = 1000 * token; // 1000 AIUR tokens
                let userBalance = 30 * token; // User balance = 30 AIUR tokens

                await expectThrow(kycVerificationContract.verifyMaxBalanceKYC(tokensToSend, userBalance, 1));
            });
        });
    });

    xdescribe("Validate KYC user", () => {
        beforeEach(async () => {
            kycVerification = await KYCVerification.new();
            kycVerificationProxy = await KYCVerificationProxy.new(kycVerification.address);
            kycVerificationContract = await IKYCVerification.at(kycVerificationProxy.address);
            await kycVerificationContract.init();

            // Set up Oracle
            let exchangeOracle = await ExchangeOracle.new(oracleInitialRate);
            await kycVerificationContract.setExchangeOracle(exchangeOracle.address, {from: owner});
        });

        it("should throw when user make a transaction with amount bigger than the default one", async () => {
            // Set KYC Verification default values
            await kycVerificationContract.setTransactionMaxAmount(transactionMaxAmount, {from: owner}); // 1 ETH
            await kycVerificationContract.setTransactionDailyMaxVolume(transactionDailyMaxVolume, {from: owner}); // 3 ETH 
            await kycVerificationContract.setTransactionMonthlyMaxVolume(transactionMonthlyMaxVolume, {from: owner});// 9 ETH
            await kycVerificationContract.setUserAccountMaxBalance(userAccountMaxBalance, {from: owner}); // 4 ETH

            await expectThrow(ICOTokenInstance.transfer(userTwoAddress, AIURWei*100, {from: userOneAddress}));
        });

        it("should throw when user is about to have a daily volume bigger than the default one", async () => {
            // Set KYC Verification default values
            await kycVerificationContract.setTransactionMaxAmount("2000000000000000000", {from: owner}); // 2 ETH
            await kycVerificationContract.setTransactionDailyMaxVolume("1000000000000000000", {from: owner}); // 1 ETH 
            await kycVerificationContract.setTransactionMonthlyMaxVolume(transactionMonthlyMaxVolume, {from: owner});// 9 ETH
            await kycVerificationContract.setUserAccountMaxBalance(userAccountMaxBalance, {from: owner}); // 4 ETH

            await ICOTokenInstance.mint(userOneAddress, AIURWei); // 1000 AIUR tokens
            await ICOTokenInstance.mint(userTwoAddress, AIURWei); // 1000 AIUR tokens

            let userAddress = await userFactoryContract.getUser(userTwoAddress);
            let userContract = await UserContract.new(userAddress);

            userContract.increaseDailyTransactionVolumeSending("900000000000000000000"); // 0.90 ETH == 900 AIUR tokens

            await expectThrow(ICOTokenInstance.transfer(userTwoAddress, AIURWei, {from: userOneAddress}));
        });

        xit("should throw when user is about to have a monthly volume bigger than the default one", async () => {
            // Set KYC Verification default values
            await kycVerificationContract.setTransactionMaxAmount("2000000000000000000", {from: owner}); // 2 ETH
            await kycVerificationContract.setTransactionDailyMaxVolume("2000000000000000000", {from: owner}); // 2 ETH 
            await kycVerificationContract.setTransactionMonthlyMaxVolume("500000000000000000000", {from: owner});// 0.50 ETH
            await kycVerificationContract.setUserAccountMaxBalance(userAccountMaxBalance, {from: owner}); // 4 ETH

            await ICOTokenInstance.mint(userOneAddress, AIURWei); // 1 000 AIUR tokens
            await ICOTokenInstance.mint(userTwoAddress, AIURWei); // 1 000 AIUR tokens

            let userAddress = await userFactoryContract.getUser(userTwoAddress);
            let userContract = await UserContract.new(userAddress);

            userContract.increaseMonthlyTransactionVolume("500000000000000000000"); // 0.50 ETH

            await expectThrow(ICOTokenInstance.transfer(userTwoAddress, AIURWei, {from: userOneAddress}));
        });

        xit("should throw when user is about to have a balance bigger than the allowed", async () => {
            // Set KYC Verification default values
            await kycVerificationContract.setTransactionMaxAmount("3000000000000000000", {from: owner}); // 3 ETH
            await kycVerificationContract.setTransactionDailyMaxVolume("4000000000000000000", {from: owner}); // 4 ETH 
            await kycVerificationContract.setTransactionMonthlyMaxVolume("6000000000000000000", {from: owner});// 6 ETH
            await kycVerificationContract.setUserAccountMaxBalance("1000000000000000000", {from: owner}); // 1 ETH

            await ICOTokenInstance.mint(userOneAddress, AIURWei); // 1 000 AIUR tokens
            await ICOTokenInstance.mint(userTwoAddress, AIURWei); // 1 000 AIUR tokens

            let userAddress = await userFactoryContract.getUser(userTwoAddress);
            let userContract = await UserContract.new(userAddress);

            userContract.increaseMonthlyTransactionVolume("500000000000000000000"); // 0.50 ETH

            await expectThrow(ICOTokenInstance.transfer(userTwoAddress, AIURWei, {from: userOneAddress}));
        });
    });

    describe("Setting KYC Admin", () => {
        it("should set kyc owner", async () => {
            await kycVerificationContract.setKYCUserOwner(kycAdmin, {from: owner});

            let userAddress = await kycVerificationContract.getKYCUserOwner();
            assert.equal(userAddress, kycAdmin, `User address should be ${kycAdmin}, but it returned ${userAddress}`);
        });

        it("should throw if non owner is trying to set kyc owner", async () => {
            await expectThrow(kycVerificationContract.setKYCUserOwner(userTwoAddress, {from: nonOwner}));
        });
    });
});