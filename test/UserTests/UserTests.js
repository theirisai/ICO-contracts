const IUserContract = artifacts.require("./IUserContract.sol");
const UserContract = artifacts.require("./UserContract.sol");
const UserContractProxy = artifacts.require("./UserContractProxy.sol");

const UserUpgradeabilityTest = artifacts.require("./TestPurpose/User/TestUserUpgradeability.sol");
const IUserUpgradeabilityTest = artifacts.require("./TestPurpose/User/ITestUserUpgradeability.sol");

const ProjectInitializator = require("./../ProjectInitializator");

const timeTravel = require('./../util').timeTravel;
const expectThrow = require('./../util').expectThrow;
require("./../assertExtensions");

contract('User Contract', function (accounts) {

    const OWNER = accounts[0];
    const NOT_OWNER = accounts[1];
    const USER_ONE = accounts[2];
    const USER_CREATOR = accounts[3]

    const KYC_VERIFICATION = accounts[4];
    const USER_MANAGER = accounts[5];
    const HOOK_OPERATOR = accounts[6];

    const USER_GENERATION_RATIO = 0;
    let USER_GENERATION_RATIO_UPDATE = 3;

    const USER_KYC_STATUS = {
        ANONYMOUS: 0,
        SEMI_VERIFIED: 1,
        VERIFIED: 2,
        UNDEFINED: 3
    }
    
    const USER_LAST_TRANSACTION_TIME = 0;

    let userInstance;

    describe('Initialize user', () => {

        beforeEach(async () => {
            userInstance = await UserContract.new({from: OWNER});
        });

        describe('KYC user', () => {
            it('should initialize new KYC user', async () => {
                await userInstance.initKYCUser(USER_KYC_STATUS.ANONYMOUS, {from: OWNER});
    
                let userKYCStatus = await userInstance.KYCStatus.call();
                let userFactoryAddress = await userInstance.userFactoryContract.call();
                let userPolicy = await userInstance.userPolicy.call();
                let isExchangeUser = await userInstance.isExchangeUser.call();
                let isValidUser = await userInstance.isValidUser.call();
                
                assert.bigNumberEQNumber(userKYCStatus, USER_KYC_STATUS.ANONYMOUS);
                assert.equal(userFactoryAddress, OWNER, "User factory address is not initialized correctly");
                assert.isTrue(userPolicy[0], "Terms and conditions is not correctly set");
                assert.isTrue(userPolicy[1], "AML is no correctly set");
                assert.isTrue(userPolicy[2], "Constitution is not correctly set");
                assert.isTrue(userPolicy[3], "Common License Agreement is not correctly set");
                assert.isTrue(!isExchangeUser, "User is exchange one");
                assert.isTrue(isValidUser, "User is invalid");
            });
    
            it('should throw if user KYC status is outside the range', async () => {
                await expectThrow(
                    userInstance.initKYCUser(USER_KYC_STATUS.UNDEFINED)
                );
            });
    
            it('should throw on user initialization if this user already exists', async () => {
                await userInstance.initKYCUser(USER_KYC_STATUS.ANONYMOUS);
    
                await expectThrow(
                    userInstance.initKYCUser(USER_KYC_STATUS.ANONYMOUS)
                );
            });
        });

        describe('Exchange User', () => {
            it('should initialize new exchange user', async () => {
                await userInstance.initExchangeUser(USER_KYC_STATUS.VERIFIED, {from: OWNER});
    
                let userKYCStatus = await userInstance.KYCStatus.call();
                let userFactoryAddress = await userInstance.userFactoryContract.call();
                let isExchangeUser = await userInstance.isExchangeUser.call();
                let userPolicy = await userInstance.userPolicy.call();
                let isValidUser = await userInstance.isValidUser.call();
    
                assert.bigNumberEQNumber(userKYCStatus, USER_KYC_STATUS.VERIFIED);
                assert.equal(userFactoryAddress, OWNER, "User factory address is not initialized correctly");
                assert.isTrue(isExchangeUser, "User is not exchange one");
                assert.isTrue(!userPolicy[0], "Terms and conditions is not correctly set");
                assert.isTrue(!userPolicy[1], "AML is no correctly set");
                assert.isTrue(!userPolicy[2], "Constitution is not correctly set");
                assert.isTrue(!userPolicy[3], "Common License Agreement is not correctly set");
                assert.isTrue(isValidUser, "User is invalid");
            });
    
            it('should throw on user initialization if this user already exists', async () => {
                await userInstance.initExchangeUser(USER_KYC_STATUS.VERIFIED);
    
                await expectThrow(
                    userInstance.initExchangeUser(USER_KYC_STATUS.VERIFIED)
                );
            });
        });

        describe('Invalid user', () => {

            it('should initialize new user and convert it to invalid one', async () => {
                let contracts = await ProjectInitializator.initWithAddress(OWNER);
                userFactory = await contracts.userFactoryContract;
                
                await userFactory.setUserCreator(USER_CREATOR, {from: OWNER});
                await userFactory.createNewUser(USER_ONE, USER_KYC_STATUS.ANONYMOUS, {from: USER_CREATOR});
    
                let userContract = await userFactory.getUserContract(USER_ONE);
                userInstance = await IUserContract.at(userContract);


                await userInstance.updateUserPolicy(
                    true, // TermsAndConditions,
                    true, // AML,
                    false, // Constitution,
                    true, // CommonLicenseAgreement,
                {from: USER_CREATOR});

                let isInvalidUser = !(await userInstance.isValidUser.call());

                assert.isTrue(isInvalidUser, "User is valid, but is has not to be");
            });
        });
    });

    describe('User properties update', () => {

        let userFactory;

        beforeEach(async () => {
            let contracts = await ProjectInitializator.initWithAddress(OWNER);

            userFactory = await contracts.userFactoryContract;
            await userFactory.setUserManagerAddress(USER_MANAGER, {from: OWNER});
            await userFactory.setUserCreator(USER_CREATOR, {from: OWNER});
            await userFactory.createNewUser(USER_ONE, USER_KYC_STATUS.ANONYMOUS, {from: USER_CREATOR});

            let userContract = await userFactory.getUserContract(USER_ONE);
            userInstance = await IUserContract.at(userContract);
        });

        describe('Update user policy', () => {

            const USER_POLICY = {
                TermsAndConditions: true,
                AML: false,
                Constitution: true,
                CommonLicenseAgreement: true
            }
            
            it('should update user policy', async () => {
                let userDataBeforeUpdate = await userInstance.getUserData();
                let userPolicyBeforeUpdate = await userDataBeforeUpdate[5]; // AML element
                let isCorrectBeforeUpdate = await userInstance.isUserPolicyAccepted();

                await userInstance.updateUserPolicy(
                    USER_POLICY.TermsAndConditions,
                    USER_POLICY.AML,
                    USER_POLICY.Constitution,
                    USER_POLICY.CommonLicenseAgreement,
                {from: USER_CREATOR});

                let userDataAfterUpdate = await userInstance.getUserData();
                let userPolicyAfterUpdate = await userDataAfterUpdate[5]; // AML element
                let isCorrectAfterUpdate = await userInstance.isUserPolicyAccepted();

                assert.isTrue(userPolicyBeforeUpdate);
                assert.isTrue(!userPolicyAfterUpdate, "User policy is not updated correctly");

                assert.isTrue(isCorrectBeforeUpdate);
                assert.isTrue(!isCorrectAfterUpdate);
            });

            it('should throw if non-user creator try to update user policy', async () => {
                await expectThrow(
                    userInstance.updateUserPolicy(
                        USER_POLICY.TermsAndConditions,
                        USER_POLICY.AML,
                        USER_POLICY.Constitution,
                        USER_POLICY.CommonLicenseAgreement,
                    {from: NOT_OWNER})
                );
            });
        });

        describe('Update generation ratio', () => {
        
            it('should update user generation ratio', async () => {
                let userDataBeforeUpdate = await userInstance.getUserData();
                let userOneRatioBeforeUpdate = userDataBeforeUpdate[0];

                await userInstance.updateGenerationRatio(USER_GENERATION_RATIO_UPDATE, {from: USER_MANAGER});

                let userDataAfterUpdate = await userInstance.getUserData();
                let userOneRatioAfterBalance = userDataAfterUpdate[0];
    
                assert.bigNumberEQNumber(userOneRatioBeforeUpdate, USER_GENERATION_RATIO);
                assert.bigNumberEQNumber(userOneRatioAfterBalance, USER_GENERATION_RATIO_UPDATE);
            });
            
            it('should throw if non-user manager try to update user generation ratio', async () => {
                await expectThrow(
                    userInstance.updateGenerationRatio(USER_GENERATION_RATIO_UPDATE, {from: NOT_OWNER})
                );
            });
        });
    
        describe('Update KYC status', () => {
            let kycVerificationContractAddress = accounts[7];

            beforeEach(async () => {
                await userFactory.setKYCVerificationInstance(kycVerificationContractAddress, {from: OWNER});
            });
            
            it('should update user kyc status', async () => {
                let userDataBeforeUpdate = await userInstance.getUserData();
                let userOneKYCStatusBeforeUpdate = userDataBeforeUpdate[1];

                await userInstance.updateKYCStatus(USER_KYC_STATUS.VERIFIED, {from: kycVerificationContractAddress});

                let userDataAfterUpdate = await userInstance.getUserData();
                let userOneKYCStatusAfterUpdate = userDataAfterUpdate[1];

                assert.bigNumberEQNumber(userOneKYCStatusBeforeUpdate, USER_KYC_STATUS.ANONYMOUS);
                assert.bigNumberEQNumber(userOneKYCStatusAfterUpdate, USER_KYC_STATUS.VERIFIED);
            });

            it('should unblacklist a user when his kyc status is updated to true', async () => {
                const IS_BLACKLISTED_USER = true;

                await userInstance.setUserBlacklistedStatus(IS_BLACKLISTED_USER, {from: kycVerificationContractAddress});

                let userBlacklistStatusBeforeUpdate = await userInstance.isUserBlacklisted();
                await userInstance.updateKYCStatus(USER_KYC_STATUS.VERIFIED, {from: kycVerificationContractAddress});
                let userBlacklistStatusAfterUpdate = await userInstance.isUserBlacklisted();

                assert.isTrue(userBlacklistStatusBeforeUpdate);
                assert.isTrue(!userBlacklistStatusAfterUpdate);
            });

            it('should throw if kyc status is outside the range', async () => {
                await expectThrow(
                    userInstance.updateKYCStatus(USER_KYC_STATUS.UNDEFINED, {from: USER_MANAGER})
                );
            });

            it('should throw if non-user manager try to update user kyc status', async () => {
                await expectThrow(
                    userInstance.updateKYCStatus(USER_KYC_STATUS.VERIFIED, {from: NOT_OWNER})
                );
            });
        });
    
        describe('Update last transaction time', () => {
            
            const USER_LAST_TRANSACTION_TIME_UPDATE = Date.now();

            it('should update user last transaction time', async () => {
                let userDataBeforeUpdate = await userInstance.getUserData();
                let userOneTransactionLastTimesBeforeUpdate = userDataBeforeUpdate[2];

                await userInstance.updateLastTransactionTime(USER_LAST_TRANSACTION_TIME_UPDATE, {from: USER_MANAGER});

                let userDataAfterUpdate = await userInstance.getUserData();
                let userOneTransactionLastTimesAfterUpdate = userDataAfterUpdate[2];

                assert.bigNumberEQNumber(userOneTransactionLastTimesBeforeUpdate, USER_LAST_TRANSACTION_TIME);
                assert.bigNumberEQNumber(userOneTransactionLastTimesAfterUpdate, USER_LAST_TRANSACTION_TIME_UPDATE);
            });

            it('should throw if non-user manager try to update user last transaction time', async () => {
                await expectThrow(
                    userInstance.updateLastTransactionTime(USER_LAST_TRANSACTION_TIME_UPDATE, {from: NOT_OWNER})
                );
            });
        });
    });

    describe('Mark as founder', () => {

        beforeEach(async () => {
            let contracts = await ProjectInitializator.initWithAddress(OWNER);

            userFactory = await contracts.userFactoryContract;
            await userFactory.setUserManagerAddress(USER_MANAGER, {from: OWNER});
            await userFactory.setUserCreator(USER_CREATOR, {from: OWNER});
            await userFactory.createNewUser(USER_ONE, USER_KYC_STATUS.ANONYMOUS, {from: USER_CREATOR});

            let userContract = await userFactory.getUserContract(USER_ONE);
            userInstance = await IUserContract.at(userContract);
        });
        
        it('should mark a user as founder', async () => {
            let isFounderBeforeMark = await userInstance.isFounderUser();

            await userInstance.markAsFounder({from: USER_MANAGER});

            let isFounderAfterMark = await userInstance.isFounderUser();

            assert.isFalse(isFounderBeforeMark, "User is founder before marking");
            assert.isTrue(isFounderAfterMark, "User is not founder after marking");
        });

        it('should throw if non-user manager contract try to mark user as founder', async () => {
            
        });
    });

    describe('Negative user statuses', () => {

        beforeEach(async () => {
            let contracts = await ProjectInitializator.initWithAddress(OWNER);

            let userFactory = await contracts.userFactoryContract;
            await userFactory.setKYCVerificationInstance(KYC_VERIFICATION, {from: OWNER});
            await userFactory.setUserManagerAddress(USER_MANAGER, {from: OWNER});
            await userFactory.setUserCreator(USER_CREATOR, {from: OWNER});
            await userFactory.createNewUser(USER_ONE, USER_KYC_STATUS.ANONYMOUS, {from: USER_CREATOR});

            let userContract = await userFactory.getUserContract(USER_ONE);
            userInstance = await IUserContract.at(userContract);
        });

        describe('Blacklist user', () => {

            const IS_BLACKLISTED_USER = true;

            it('should set a user as a blacklisted one', async () => {
                let userBlacklistStatusBeforeUpdate = await userInstance.isUserBlacklisted();
                await userInstance.setUserBlacklistedStatus(IS_BLACKLISTED_USER, {from: KYC_VERIFICATION});
                let userBlacklistStatusAfterUpdate = await userInstance.isUserBlacklisted();

                assert.isTrue(!userBlacklistStatusBeforeUpdate);
                assert.isTrue(userBlacklistStatusAfterUpdate);
            });
    
            it('should throw if non-kyc verificator try to set a user as a blacklisted one', async () => {
                await expectThrow(
                    userInstance.setUserBlacklistedStatus(IS_BLACKLISTED_USER, {from: NOT_OWNER})
                );
            });
        });

        describe('Ban user', () => {

            const IS_BAN_USER = true;

            it('should ban user', async () => {
                let userBanStatusBeforeUpdate = await userInstance.isUserBanned();
                await userInstance.banUser({from: KYC_VERIFICATION});
                let userBanStatusAfterUpdate = await userInstance.isUserBanned();

                assert.isTrue(!userBanStatusBeforeUpdate);
                assert.isTrue(userBanStatusAfterUpdate);
            });

            it('should throw if non-kyc verificator try to ban an user', async () => {
                await expectThrow(
                    userInstance.setUserBlacklistedStatus(IS_BAN_USER, {from: NOT_OWNER})
                );
            });
        });
    });

    describe('Transaction volume increasing', () => {

        const DAY = 24 * 60 * 60;
        const WEEK = 7 * DAY;
        const MONTH = 31 * DAY;

        const DAILY_INITIAL_VOLUME = 0;
        const WEEKLY_INITIAL_VOLUME = 0;
        const MONTHLY_INITIAL_VOLUME = 0;

        const TOKEN = 1000000000000000000; // 1 token
        const TRANSACTION_VOLUME = 100 * TOKEN; // 100 tokens

        beforeEach(async () => {
            let contracts = await ProjectInitializator.initWithAddress(OWNER);

            userFactory = await contracts.userFactoryContract;
            await userFactory.setHookOperatorAddress(HOOK_OPERATOR, {from: OWNER});
            await userFactory.setUserCreator(USER_CREATOR, {from: OWNER});
            await userFactory.createNewUser(USER_ONE, USER_KYC_STATUS.ANONYMOUS, {from: USER_CREATOR});

            let userContract = await userFactory.getUserContract(USER_ONE);
            userInstance = await IUserContract.at(userContract);
        });

        describe('Daily transaction volume', () => {
            it('should increase daily sending transaction volume', async () => {
                let userVolumeBeforeTodayIncrease = await userInstance.getDailyTransactionVolumeSending();
                await userInstance.increaseDailyTransactionVolumeSending(TRANSACTION_VOLUME, {from: HOOK_OPERATOR});
                let userVolumeAfterTodayIncrease = await userInstance.getDailyTransactionVolumeSending();

                await timeTravel(web3, DAY);

                let userVolumeBeforeTomorrowIncrease = await userInstance.getDailyTransactionVolumeSending();
                await userInstance.increaseDailyTransactionVolumeSending(TRANSACTION_VOLUME, {from: HOOK_OPERATOR});
                let userVolumeAfterTomorrowIncrease = await userInstance.getDailyTransactionVolumeSending();

                assert.bigNumberEQNumber(userVolumeBeforeTodayIncrease, DAILY_INITIAL_VOLUME);
                assert.bigNumberEQNumber(userVolumeAfterTodayIncrease, TRANSACTION_VOLUME);

                assert.bigNumberEQNumber(userVolumeBeforeTomorrowIncrease, DAILY_INITIAL_VOLUME);
                assert.bigNumberEQNumber(userVolumeAfterTomorrowIncrease, TRANSACTION_VOLUME);
            });

            it('should increase daily receiving transaction volume', async () => {
                let userVolumeBeforeTodayIncrease = await userInstance.getDailyTransactionVolumeReceiving();
                await userInstance.increaseDailyTransactionVolumeReceiving(TRANSACTION_VOLUME, {from: HOOK_OPERATOR});
                let userVolumeAfterTodayIncrease = await userInstance.getDailyTransactionVolumeReceiving();

                await timeTravel(web3, DAY);

                let userVolumeBeforeTomorrowIncrease = await userInstance.getDailyTransactionVolumeReceiving();
                await userInstance.increaseDailyTransactionVolumeReceiving(TRANSACTION_VOLUME, {from: HOOK_OPERATOR});
                let userVolumeAfterTomorrowIncrease = await userInstance.getDailyTransactionVolumeReceiving();

                assert.bigNumberEQNumber(userVolumeBeforeTodayIncrease, DAILY_INITIAL_VOLUME);
                assert.bigNumberEQNumber(userVolumeAfterTodayIncrease, TRANSACTION_VOLUME);

                assert.bigNumberEQNumber(userVolumeBeforeTomorrowIncrease, DAILY_INITIAL_VOLUME);
                assert.bigNumberEQNumber(userVolumeAfterTomorrowIncrease, TRANSACTION_VOLUME);
            });
        });

        describe('Weekly transaction volume', () => {
            it('should increase weekly sending transaction volume', async () => {
                let userVolumeThisWeekBeforeIncrease = await userInstance.getWeeklyTransactionVolumeSending();
                await userInstance.increaseWeeklyTransactionVolumeSending(TRANSACTION_VOLUME, {from: HOOK_OPERATOR});
                let userVolumeThisWeekAfterIncrease = await userInstance.getWeeklyTransactionVolumeSending();

                await timeTravel(web3, WEEK);

                let userVolumeNextWeeBeforeIncrease = await userInstance.getWeeklyTransactionVolumeSending();
                await userInstance.increaseWeeklyTransactionVolumeSending(TRANSACTION_VOLUME, {from: HOOK_OPERATOR});
                let userVolumeNextWeekAfterIncrease = await userInstance.getWeeklyTransactionVolumeSending();

                assert.bigNumberEQNumber(userVolumeThisWeekBeforeIncrease, WEEKLY_INITIAL_VOLUME);
                assert.bigNumberEQNumber(userVolumeThisWeekAfterIncrease, TRANSACTION_VOLUME);

                assert.bigNumberEQNumber(userVolumeNextWeeBeforeIncrease, WEEKLY_INITIAL_VOLUME);
                assert.bigNumberEQNumber(userVolumeNextWeekAfterIncrease, TRANSACTION_VOLUME);
            });

            it('should increase weekly receiving transaction volume', async () => {
                let userVolumeThisWeekBeforeIncrease = await userInstance.getWeeklyTransactionVolumeReceiving();
                await userInstance.increaseWeeklyTransactionVolumeReceiving(TRANSACTION_VOLUME, {from: HOOK_OPERATOR});
                let userVolumeThisWeekAfterIncrease = await userInstance.getWeeklyTransactionVolumeReceiving();

                await timeTravel(web3, WEEK);

                let userVolumeNextWeeBeforeIncrease = await userInstance.getWeeklyTransactionVolumeReceiving();
                await userInstance.increaseWeeklyTransactionVolumeReceiving(TRANSACTION_VOLUME, {from: HOOK_OPERATOR});
                let userVolumeNextWeekAfterIncrease = await userInstance.getWeeklyTransactionVolumeReceiving();

                assert.bigNumberEQNumber(userVolumeThisWeekBeforeIncrease, WEEKLY_INITIAL_VOLUME);
                assert.bigNumberEQNumber(userVolumeThisWeekAfterIncrease, TRANSACTION_VOLUME);

                assert.bigNumberEQNumber(userVolumeNextWeeBeforeIncrease, WEEKLY_INITIAL_VOLUME);
                assert.bigNumberEQNumber(userVolumeNextWeekAfterIncrease, TRANSACTION_VOLUME);
            });
        });

        describe('Monthly transaction volume', () => {
            it('should increase monthly sending transaction volume', async () => {
                let userVolumeBeforeThisMonthIncrease = await userInstance.getMonthlyTransactionVolumeSending();
                await userInstance.increaseMonthlyTransactionVolumeSending(TRANSACTION_VOLUME, {from: HOOK_OPERATOR});
                let userVolumeAfterThisMonthIncrease = await userInstance.getMonthlyTransactionVolumeSending();

                await timeTravel(web3, MONTH);

                let userVolumeBeforeNextMonthIncrease = await userInstance.getMonthlyTransactionVolumeSending();
                await userInstance.increaseMonthlyTransactionVolumeSending(TRANSACTION_VOLUME, {from: HOOK_OPERATOR});
                let userVolumeAfterNextMonthIncrease = await userInstance.getMonthlyTransactionVolumeSending();

                assert.bigNumberEQNumber(userVolumeBeforeThisMonthIncrease, DAILY_INITIAL_VOLUME);
                assert.bigNumberEQNumber(userVolumeAfterThisMonthIncrease, TRANSACTION_VOLUME);

                assert.bigNumberEQNumber(userVolumeBeforeNextMonthIncrease, DAILY_INITIAL_VOLUME);
                assert.bigNumberEQNumber(userVolumeAfterNextMonthIncrease, TRANSACTION_VOLUME);
            });

            it('should increase monthly receiving transaction volume', async () => {
                let userVolumeBeforeThisMonthIncrease = await userInstance.getMonthlyTransactionVolumeReceiving();
                await userInstance.increaseMonthlyTransactionVolumeReceiving(TRANSACTION_VOLUME, {from: HOOK_OPERATOR});
                let userVolumeAfterThisMonthIncrease = await userInstance.getMonthlyTransactionVolumeReceiving();

                await timeTravel(web3, MONTH);

                let userVolumeBeforeNextMonthIncrease = await userInstance.getMonthlyTransactionVolumeReceiving();
                await userInstance.increaseMonthlyTransactionVolumeReceiving(TRANSACTION_VOLUME, {from: HOOK_OPERATOR});
                let userVolumeAfterNextMonthIncrease = await userInstance.getMonthlyTransactionVolumeReceiving();

                assert.bigNumberEQNumber(userVolumeBeforeThisMonthIncrease, DAILY_INITIAL_VOLUME);
                assert.bigNumberEQNumber(userVolumeAfterThisMonthIncrease, TRANSACTION_VOLUME);

                assert.bigNumberEQNumber(userVolumeBeforeNextMonthIncrease, DAILY_INITIAL_VOLUME);
                assert.bigNumberEQNumber(userVolumeAfterNextMonthIncrease, TRANSACTION_VOLUME);
            });
        });
    });

    describe('Upgradeability', () => {

        let userFactory;
        let newImplementationInstance;

        beforeEach(async () => {
            let contracts = await ProjectInitializator.initWithAddress(OWNER);

            userFactory = contracts.userFactoryContract;

            await userFactory.setHookOperatorAddress(HOOK_OPERATOR, {from: OWNER});
            await userFactory.setUserManagerAddress(USER_MANAGER, {from: OWNER});
            await userFactory.setUserCreator(USER_CREATOR, {from: OWNER});
            await userFactory.createNewUser(USER_ONE, USER_KYC_STATUS.ANONYMOUS, {from: USER_CREATOR});

            let userContract = await userFactory.getUserContract(USER_ONE);
            userInstance = await IUserContract.at(userContract);

            newImplementationInstance = await UserUpgradeabilityTest.new();
		});

        it('should keep the data state', async () => {
            let transactionVolume = 10;
            await userInstance.increaseDailyTransactionVolumeSending(transactionVolume, {from: HOOK_OPERATOR});

            await userFactory.setImplAddress(newImplementationInstance.address, {from: OWNER});

            let userContract = await userFactory.getUserContract(USER_ONE);
            let userUpgradeInstance = await IUserUpgradeabilityTest.at(userContract);

            let userDailyVolume = await userUpgradeInstance.getDailyTransactionVolumeSending();

            assert.bigNumberEQNumber(userDailyVolume, transactionVolume);
        });

        it('should add new functionality', async () => {
            await userFactory.setImplAddress(newImplementationInstance.address, {from: OWNER});

            let upgradedUserAddress = await userFactory.getUserContract(USER_ONE);
            let userUpgradeInstance = await IUserUpgradeabilityTest.at(upgradedUserAddress);

            await userUpgradeInstance.setAge(5);
            assert.bigNumberEQNumber(await userUpgradeInstance.getAge(), 5);
        });

        it('should throw on attempt to use the new functionality before upgrade', async () => {
            let userContract = await userFactory.getUserContract(USER_ONE);
            let userNonUpgradeInstance = await IUserUpgradeabilityTest.at(userContract);

            await expectThrow(
                userNonUpgradeInstance.getAge()
            );
        });

        it('should throw if non-owner try to upgrade', async () => {
            await expectThrow(
                userFactory.setImplAddress(newImplementationInstance.address, {from: NOT_OWNER})
            );
        });
    });
});