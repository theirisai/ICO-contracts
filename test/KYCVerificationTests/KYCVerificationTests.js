const ExchangeOracle = artifacts.require("./ExchangeOracle.sol");

const IUserFactory = artifacts.require("./IUserFactory.sol");
const UserFactory = artifacts.require("./UserFactory.sol");
const UserFactoryProxy = artifacts.require("./UserFactoryProxy.sol");

const IUserContract = artifacts.require("./IUserContract.sol");
const UserContract = artifacts.require("./UserContract.sol");
const UserContractProxy = artifacts.require("./UserContractProxy.sol");

const ICOToken = artifacts.require("./ICOTokenExtended.sol");

const TestKYCVerification = artifacts.require("./TestPurpose/KYCValidation/TestKYCValidationUpgradeability.sol");
const ITestKYCVerification = artifacts.require("./TestPurpose/KYCValidation/ITestKYCValidationUpgradeability.sol");

const expectThrow = require('./../util').expectThrow;
const getEvent = require('./../util').getEvent;
const timeTravel = require('./../util').timeTravel;

require("./../assertExtensions");

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

    let contracts;
    let ICOTokenInstance;
    let userFactoryContract;
    let kycVerificationContract;

    async function instantiateContracts() {
        contracts = await ProjectInitializator.initWithAddress(owner, kycAdmin);

        ICOTokenInstance = await contracts.icoTokenContract;
        userFactoryContract = await contracts.userFactoryContract;
        kycVerificationContract = await contracts.kycVerificationContract;

        await kycVerificationContract.setKYCUserOwner(kycAdmin, {from: owner});
    }

    before(async () => {
        await instantiateContracts();
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

    describe("Testing valid KYC user sender/receiver function", () => {
        const userCreator = accounts[3];
        const userManager = accounts[4];
        const hookOperatorAddress = accounts[5];

        const USER_KYC_STATUS = {
            ANONIMNOUS: 0,
            SEMI_VERIFIED: 1,
            VERIFIED: 2,
            UNDEFINED: 3
        }

        const WEEK = 7 * 24 * 60 * 60;

        beforeEach(async () => {
            await instantiateContracts();

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

           await kycVerificationContract.setKYCUserOwner(kycAdmin, {from: owner});

           await userFactoryContract.setKYCVerificationInstance(kycVerificationContract.address, {from: owner});
           await userFactoryContract.setUserManagerAddress(userManager, {from: owner});
           await userFactoryContract.setUserCreator(userCreator, {from: owner});
           await userFactoryContract.setHookOperatorAddress(hookOperatorAddress, {from: owner});
        });

        it("should not throw if all requires are valid", async () => {
            await userFactoryContract.createNewUser(userOneAddress, USER_KYC_STATUS.ANONIMNOUS, {from: userCreator});

            let tokensToSend = (2 * token); // 15 AIUR tokens
            let userAddress = await userFactoryContract.getUser(userOneAddress);

            await kycVerificationContract.isValidKYCUserSender(userAddress, tokensToSend, USER_KYC_STATUS.ANONIMNOUS);
        });

        it("should throw when weekly limit will be passed", async () => {
            await userFactoryContract.createNewUser(userOneAddress, USER_KYC_STATUS.ANONIMNOUS, {from: userCreator});

            // Weekly limit is 60 AIUR Tokens
            let tokensToIncrease = (58 * token); // 58 AIUR tokens
            let tokensToSend = (8 * token); // 8 AIUR tokens

            let userAddress = await userFactoryContract.getUser(userOneAddress);
            let userInstance = await IUserContract.at(userAddress);

            await userInstance.increaseDailyTransactionVolumeSending(tokensToIncrease, {from: hookOperatorAddress});
            await expectThrow(kycVerificationContract.isValidKYCUserSender(userAddress, tokensToSend, USER_KYC_STATUS.ANONIMNOUS));
        });

        it("should not throw when weekly limit was passed the previous week", async () => {
            await userFactoryContract.createNewUser(userTwoAddress, USER_KYC_STATUS.ANONIMNOUS, {from: userCreator});

            // Weekly limit is 60 AIUR Tokens
            let tokensToIncrease = (58 * token); // 58 AIUR tokens
            let tokensToSend = (8 * token); // 8 AIUR tokens

            let userAddress = await userFactoryContract.getUser(userTwoAddress);
            let userInstance = await IUserContract.at(userAddress);

            await userInstance.increaseDailyTransactionVolumeSending(tokensToIncrease, {from: hookOperatorAddress});
            await expectThrow(kycVerificationContract.isValidKYCUserSender(userAddress, tokensToSend, USER_KYC_STATUS.ANONIMNOUS));

            await timeTravel(web3, WEEK);

            await kycVerificationContract.isValidKYCUserSender(userAddress, tokensToSend, USER_KYC_STATUS.ANONIMNOUS);
        });
    });

    describe("Testing Blacklisted User", () => {
        const userCreator = accounts[3];
        const userManager = accounts[4];

        const USER_KYC_STATUS = {
            ANONIMNOUS: 0,
            SEMI_VERIFIED: 1,
            VERIFIED: 2,
            UNDEFINED: 3
        }

        beforeEach(async () => {
            let contracts = await ProjectInitializator.initWithAddress(owner, kycAdmin);

            ICOTokenInstance = await contracts.icoTokenContract;
            userFactoryContract = await contracts.userFactoryContract;
            kycVerificationContract = await contracts.kycVerificationContract;

            await kycVerificationContract.setKYCUserOwner(kycAdmin, {from: owner});

            await userFactoryContract.setKYCVerificationInstance(kycVerificationContract.address, {from: owner});
            await userFactoryContract.setUserManagerAddress(userManager, {from: owner});
            await userFactoryContract.setUserCreator(userCreator, {from: owner});
            await userFactoryContract.createNewUser(userOneAddress, USER_KYC_STATUS.ANONIMNOUS, {from: userCreator});            
        });

        it("should set blacklisted user to true", async () => {
            let userAddress = await userFactoryContract.getUser(userOneAddress);
            let userInstance = await IUserContract.at(userAddress);

            let isBlacklisted = await userInstance.isUserBlacklisted();
            assert.equal(isBlacklisted, false, `At the beginning isBlacklisted should be false but it returned ${isBlacklisted}`);

            await kycVerificationContract.setUserBlacklistedStatus(userOneAddress, true, {from: kycAdmin});

            let isBlacklistedAfterUpdate = await userInstance.isUserBlacklisted();
            assert.equal(isBlacklistedAfterUpdate, true, `isBlacklisted should be true but it returned ${isBlacklistedAfterUpdate}`);
        });

        it("should throw if the method caller is not the contract kyc admin", async () => {
            let userAddress = await userFactoryContract.getUser(userOneAddress);
            let userInstance = await IUserContract.at(userAddress);

            let isBlacklisted = await userInstance.isUserBlacklisted();
            assert.equal(isBlacklisted, false, `At the beginning isBlacklisted should be false but it returned ${isBlacklisted}`);

            await expectThrow(kycVerificationContract.setUserBlacklistedStatus(userOneAddress, true, {from: nonOwner}));
        });

        it("should throw is the use doesn't exist", async () => {
            await expectThrow(kycVerificationContract.setUserBlacklistedStatus(userTwoAddress, true, {from: kycAdmin}));
        });

        it("should set isBlacklisted to false when user if fully verified", async () => {
            let userAddress = await userFactoryContract.getUser(userOneAddress);
            let userInstance = await IUserContract.at(userAddress);

            let isBlacklisted = await userInstance.isUserBlacklisted();
            assert.equal(isBlacklisted, false, `At the beginning isBlacklisted should be false but it returned ${isBlacklisted}`);

            await kycVerificationContract.setUserBlacklistedStatus(userOneAddress, true, {from: kycAdmin});

            let isBlacklistedAfterUpdate = await userInstance.isUserBlacklisted();
            assert.equal(isBlacklistedAfterUpdate, true, `isBlacklisted should be true but it returned ${isBlacklistedAfterUpdate}`);

            let kycVerificationContractAddress = accounts[7];
            await userFactoryContract.setKYCVerificationInstance(kycVerificationContractAddress, {from: owner});

            await userInstance.updateKYCStatus(USER_KYC_STATUS.VERIFIED, {from: kycVerificationContractAddress});

            let isBlacklistedChangeAfterKYCUpdate = await userInstance.isUserBlacklisted();
            assert.equal(isBlacklistedChangeAfterKYCUpdate, false, `isBlacklisted should be false after KYC status update to VERIFIED but it returned ${isBlacklistedChangeAfterKYCUpdate}`);
        });
    });

    describe("Testing Banned User", () => {
        const userCreator = accounts[3];
        const userManager = accounts[4];

        const USER_KYC_STATUS = {
            ANONIMNOUS: 0,
            SEMI_VERIFIED: 1,
            VERIFIED: 2,
            UNDEFINED: 3
        }

        beforeEach(async () => {
            let contracts = await ProjectInitializator.initWithAddress(owner, kycAdmin);

            ICOTokenInstance = await contracts.icoTokenContract;
            userFactoryContract = await contracts.userFactoryContract;
            kycVerificationContract = await contracts.kycVerificationContract;

            await kycVerificationContract.setKYCUserOwner(kycAdmin, {from: owner});

            await userFactoryContract.setKYCVerificationInstance(kycVerificationContract.address, {from: owner});
            await userFactoryContract.setUserManagerAddress(userManager, {from: owner});
            await userFactoryContract.setUserCreator(userCreator, {from: owner});
            await userFactoryContract.createNewUser(userOneAddress, USER_KYC_STATUS.ANONIMNOUS, {from: userCreator});            
        });

        it("should ban user", async () => {
            let userAddress = await userFactoryContract.getUser(userOneAddress);
            let userInstance = await IUserContract.at(userAddress);

            let isBanned = await userInstance.isUserBanned();
            assert.equal(isBanned, false, `At the beginning isBanned should be false but it returned ${isBanned}`);

            await kycVerificationContract.banUser(userOneAddress, {from: kycAdmin});

            let isBannedAfterUpdate = await userInstance.isUserBanned();
            assert.equal(isBannedAfterUpdate, true, `isBanned should be true but it returned ${isBannedAfterUpdate}`);
        });

        it("should throw if the method caller is not the contract kyc admin", async () => {
            let userAddress = await userFactoryContract.getUser(userOneAddress);
            let userInstance = await IUserContract.at(userAddress);

            let isBanned = await userInstance.isUserBanned();
            assert.equal(isBanned, false, `At the beginning isBanned should be false but it returned ${isBanned}`);

            await expectThrow(kycVerificationContract.banUser(userOneAddress, {from: nonOwner}));
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

    describe("Updating User KYC status", () => {
        const userCreator = accounts[3];

        const USER_KYC_STATUS = {
            ANONIMNOUS: 0,
            SEMI_VERIFIED: 1,
            VERIFIED: 2,
            UNDEFINED: 3
        }

        let userManager;

        beforeEach(async () => {
            let contracts = await ProjectInitializator.initWithAddress(owner, kycAdmin);

            ICOTokenInstance = await contracts.icoTokenContract;
            userFactoryContract = await contracts.userFactoryContract;
            kycVerificationContract = await contracts.kycVerificationContract;
            userManager = await contracts.userManagerContract;

            await kycVerificationContract.setKYCUserOwner(kycAdmin, {from: owner});

            await userFactoryContract.setKYCVerificationInstance(kycVerificationContract.address, {from: owner});
            await userFactoryContract.setUserManagerAddress(userManager.address, {from: owner});
            await userFactoryContract.setUserCreator(userCreator, {from: owner});
            await userFactoryContract.createNewUser(userOneAddress, USER_KYC_STATUS.ANONIMNOUS, {from: userCreator});            
        });

        it("should update kyc status", async () => {
            let userAddress = await userFactoryContract.getUser(userOneAddress);
            let userInstance = await IUserContract.at(userAddress);

            let userCurrentKYCStatus = await userManager.isUserKYCVerified(userOneAddress);
            assert.equal(userCurrentKYCStatus, USER_KYC_STATUS.ANONIMNOUS, `Invalid KYC status should be ${USER_KYC_STATUS.ANONIMNOUS} but returned ${userCurrentKYCStatus}`);

            await kycVerificationContract.updateUserKYCStatus(userOneAddress, USER_KYC_STATUS.SEMI_VERIFIED, {from: kycAdmin});

            let userUpdatedKYCStatus = await userManager.isUserKYCVerified(userOneAddress);
            assert.equal(userUpdatedKYCStatus, USER_KYC_STATUS.SEMI_VERIFIED, `Invalid KYC status should be ${USER_KYC_STATUS.SEMI_VERIFIED} but returned ${userUpdatedKYCStatus}`);
        });

        it("should throw if the method caller is not the contract kyc admin", async () => {
            await expectThrow(kycVerificationContract.updateUserKYCStatus(userOneAddress, USER_KYC_STATUS.SEMI_VERIFIED, {from: nonOwner}));
        });

        it("should throw if user address is invalid", async () => {
            await expectThrow(kycVerificationContract.updateUserKYCStatus("0x0", USER_KYC_STATUS.SEMI_VERIFIED, {from: kycAdmin}));
        });
    });

    describe('Upgradeability', () => {

        let newImplementationInstance;

        beforeEach(async () => {
            newImplementationInstance = await TestKYCVerification.new();
        });
        
        it('should keep the data state', async () => {
            const TRANSACTION_DAILY_LIMIT = 10; // 10 tokens
            await kycVerificationContract.setDailyLimitForAnonymousUsers(TRANSACTION_DAILY_LIMIT, {from: kycAdmin});

            await kycVerificationContract.upgradeImplementation(newImplementationInstance.address, {from: owner})
            let upgradedContract = await ITestKYCVerification.at(kycVerificationContract.address);

            let transactionDailyLimit = await upgradedContract.getDailyLimitForAnonymousUsers();

            assert.bigNumberEQNumber(transactionDailyLimit, TRANSACTION_DAILY_LIMIT);
        });

        it('should add new functionality', async () => {
            const VERIFIED_USER_MAX_BALANCE = 20; // 20 tokens
            await kycVerificationContract.upgradeImplementation(newImplementationInstance.address, {from: owner})
            let upgradedContract = await ITestKYCVerification.at(kycVerificationContract.address);

            await upgradedContract.setMaxBalanceVerifiedUser(VERIFIED_USER_MAX_BALANCE);
            let verifiedUserMaxBalance = await upgradedContract.getMaxBalanceVerifiedUser();

            assert.bigNumberEQNumber(verifiedUserMaxBalance, VERIFIED_USER_MAX_BALANCE);
        });

        it('should throw if non-owner try to upgrade', async () => {
            await expectThrow(
                kycVerificationContract.upgradeImplementation(newImplementationInstance.address, {from: nonOwner})
            );
        });
    });
});