const UserFactory = artifacts.require("./UserFactory/UserFactory.sol");
const UserFactoryProxy = artifacts.require("./UserFactory/UserFactoryProxy.sol");
const IUserFactory = artifacts.require("./UserFactory/IUserFactory.sol");

const TestUserFactoryUpgradeabiliy = artifacts.require("./TestPurpose/User/UserFactory/TestUserFactoryUpgradeabiliy.sol");
const ITestUserFactoryUpgradeabiliy = artifacts.require("./TestPurpose/User/UserFactory/ITestUserFactoryUpgradeabiliy.sol");

const IUserContract = artifacts.require("./IUserContract.sol");

const ProjectInitializator = require("./../ProjectInitializator");

const timeTravel = require('./../util').timeTravel;
const expectThrow = require('./../util').expectThrow;
const getEvent = require('./../util').getEvent;
require("./../assertExtensions");

// Todo: write tests
contract('User Factory', function (accounts) {

    const OWNER = accounts[0];
    const NOT_OWNER = accounts[1];
    const USER_ONE = accounts[2];
    const USER_CREATOR = accounts[3];

    const KYC_VERIFICATION = accounts[4];

    const USER_KYC_STATUS = 0; // Anonimonous

    let userFactoryInstance;

    async function initUserFactory(){
        let userFactory = await UserFactory.new();
        let userFactoryProxy = await UserFactoryProxy.new(userFactory.address);
        userFactoryInstance = await IUserFactory.at(userFactoryProxy.address);

        await userFactoryInstance.init({from: OWNER});
    }

    describe('User Factory Initializaiton', () => {

        it('should set initial values correctly', async () => {
            await initUserFactory();

            let userFactoryOwner = await userFactoryInstance.getOwner();

            assert.equal(userFactoryOwner, OWNER, "The owner is not set correctly");
        });
    });

    describe('Setters', () => {

        beforeEach(async () => {
            await initUserFactory();
        });
        
        describe('User Manager', () => {

            let userManager;

            beforeEach(async () => {
                userManager = await ProjectInitializator.initUserManager(OWNER);
            });

            it('should set user manager correctly', async () => {
                await userFactoryInstance.setUserManagerAddress(userManager.address, {from: OWNER});
                let userManagerAfterSet = await userFactoryInstance.getUserManagerContractAddres();

                assert.equal(userManagerAfterSet, userManager.address, "User Manager is not set correctly");
            });

            it('should throw if input address is invalid', async () => {
                await expectThrow(
                    userFactoryInstance.setUserManagerAddress("0x0", {from: OWNER})
                );
            });

            it('should throw if non-owner try to set user manager', async () => {
                await expectThrow(
                    userFactoryInstance.setUserManagerAddress(userManager.address, {from: NOT_OWNER})
                );
            });
        });

        describe('Implementation', () => {

            let implementation;

            beforeEach(async () => {
                implementation = await ProjectInitializator.initUserContract(OWNER);    
            });

            it('should set implementation correctly', async () => {
                await userFactoryInstance.setImplAddress(implementation.address, {from: OWNER});
                let implementationAfterSet = await userFactoryInstance.getImplAddress();

                assert.equal(implementationAfterSet, implementation.address, "The implementation address is not set correctly");
            });

            it('should throw if input address is invalid', async () => {
                await expectThrow(
                    userFactoryInstance.setImplAddress("0x0", {from: OWNER})
                );
            });

            it('should throw if non-owner try to set mplementation', async () => {
                await expectThrow(
                    userFactoryInstance.setImplAddress(implementation.address, {from: NOT_OWNER})
                );
            });
        });

        describe('KYC Verification Instance', () => {

            let kycInstance;

            beforeEach(async () => {
                kycInstance = await ProjectInitializator.initKYCVerification(OWNER);    
            });

            it('should set KYC verificaiton instance correctly', async () => {
                await userFactoryInstance.setKYCVerificationInstance(kycInstance.address, {from: OWNER});
                let kycAddress = await userFactoryInstance.getKYCVerificationInstance();

                assert.equal(kycAddress, kycInstance.address, "KYC verification instance is not set correctly");
            });

            it('should throw if input address is invalid', async () => {
                await expectThrow(
                    userFactoryInstance.setKYCVerificationInstance("0x0", {from: OWNER})
                );
            });

            it('should throw if non-owner try to set KYC verification instance', async () => {
                await expectThrow(
                    userFactoryInstance.setKYCVerificationInstance(kycInstance.address, {from: NOT_OWNER})
                );
            });
        });

        describe('User Creator', () => {
            it('should set user creator correctly', async () => {
                await userFactoryInstance.setUserCreator(USER_CREATOR, {from: OWNER});
                let userCreator = await userFactoryInstance.getUserCreator();

                assert.equal(userCreator, USER_CREATOR, "User creator is not set correctly");
            });

            it('should throw if input address is invalid', async () => {
                await expectThrow(
                    userFactoryInstance.setUserCreator("0x0", {from: OWNER})
                );
            });

            it('should throw if non-owner try to set user creator', async () => {
                await expectThrow(
                    userFactoryInstance.setUserCreator(USER_CREATOR, {from: NOT_OWNER})
                );
            });
        });

        describe('Data Contract', () => {

            let dataInstance;

            beforeEach(async () => {
                dataInstance = await ProjectInitializator.initDataContract(OWNER);    
            });

            it('should set data contract correctly', async () => {
                await userFactoryInstance.setDataContract(dataInstance.address, {from: OWNER});
                let dataContract = await userFactoryInstance.getDataContract();

                assert.equal(dataContract, dataInstance.address, "Data contract is not set correctly");
            });

            it('should throw if input address is invalid', async () => {
                await expectThrow(
                    userFactoryInstance.setDataContract("0x0", {from: OWNER})
                );
            });

            it('should throw if non-owner try to set data contract', async () => {
                await expectThrow(
                    userFactoryInstance.setDataContract(dataInstance.address, {from: NOT_OWNER})
                );
            });
        });
    });

    describe('Create New User', () => {

        let dataContract;
        const NOT_EXISTING_USER = "0x0000000000000000000000000000000000000000";

        beforeEach(async () => {
            let userContract = await ProjectInitializator.initUserContract(OWNER);
            dataContract = await ProjectInitializator.initDataContract(OWNER);

            await initUserFactory();

            await dataContract.setUserFactory(userFactoryInstance.address, {from: OWNER});
            await userFactoryInstance.setDataContract(dataContract.address, {from: OWNER});

            await userFactoryInstance.setImplAddress(userContract.address, {from: OWNER});
            await userFactoryInstance.setUserCreator(USER_CREATOR, {from: OWNER});
        });

        it('should create a new user', async () => {
            let dataUserBeforeCreate = await dataContract.getNodeData(USER_ONE);
            let userAddressBeforeCreate = dataUserBeforeCreate[0];

            await userFactoryInstance.createNewUser(USER_ONE, USER_KYC_STATUS, {from: USER_CREATOR});
            
            let createdUser = await userFactoryInstance.getUser(USER_ONE);

            let dataUserAfterCreate = await dataContract.getNodeData(USER_ONE);
            let userAddressAfterCreate = dataUserAfterCreate[0];

            assert.equal(userAddressBeforeCreate, NOT_EXISTING_USER, "User exists before create");
            assert.isTrue(createdUser != NOT_EXISTING_USER, "User is not created successfuly");
            assert.equal(userAddressAfterCreate, USER_ONE, "User is not added to data contract successfuly");
        });

        it('should throw if non-user creator try to create a new user', async () => {
            await expectThrow(
                userFactoryInstance.createNewUser(USER_ONE, USER_KYC_STATUS, {from: NOT_OWNER})
            );
        });

        it('should throw on attempt to create a new user, when he already exists', async () => {
            await userFactoryInstance.createNewUser(USER_ONE, USER_KYC_STATUS, {from: USER_CREATOR});

            await expectThrow(
                userFactoryInstance.createNewUser(USER_ONE, USER_KYC_STATUS, {from: USER_CREATOR})
            );
        });

        it('should throw if input user address parameter is invalid', async () => {
            await expectThrow(
                userFactoryInstance.createNewUser("0x0", USER_KYC_STATUS, {from: USER_CREATOR})
            );
        });
    });

    describe('Get User', () => {

        beforeEach(async () => {
            await initUserFactory();
        });

        it('should throw if requested user does not exist', async () => {
            await expectThrow(
                userFactoryInstance.getUser(USER_ONE)
            );           
        });

        it('should throw if input user address is invalid', async () => {
            await expectThrow(
                userFactoryInstance.getUser("0x0")
            );
        });
    });

    describe('Ownership', () => {
        const NEW_OWNER = accounts[6];

		beforeEach(async () => {
			await initUserFactory();
		});

		it('should transfer ownership successfuly', async () => {
			await userFactoryInstance.transferOwnership(NEW_OWNER, {from: OWNER});
			let userFactoryOwner = await userFactoryInstance.getOwner();

			assert.strictEqual(NEW_OWNER, userFactoryOwner, "Ownership is not transfered");
		});

		it('should not transfer ownership if the method caller is not the OWNER', async () => {
			await expectThrow(
				userFactoryInstance.transferOwnership(NEW_OWNER, {from: NOT_OWNER})
			);
		});

		it('should not transfer ownership if new owner\'s address is invalid', async () => {
			await expectThrow(
				userFactoryInstance.transferOwnership("0x0", {from: OWNER})
			);
		});
    });

    describe('Upgradeability', () => {

        let newImplementationInstance;

        const TRANSACTION_VOLUME = 10;
        const NOT_EXISTING_USER = "0x0000000000000000000000000000000000000000";

        beforeEach(async () => {
            await initUserFactory();

            let userContract = await ProjectInitializator.initUserContract(OWNER);
            let dataContract = await ProjectInitializator.initDataContract(OWNER);

            await dataContract.setUserFactory(userFactoryInstance.address, {from: OWNER});
            await userFactoryInstance.setDataContract(dataContract.address, {from: OWNER});
           
            await userFactoryInstance.setImplAddress(userContract.address, {from: OWNER});
            await userFactoryInstance.setUserCreator(USER_CREATOR, {from: OWNER});
            await userFactoryInstance.createNewUser(USER_ONE, USER_KYC_STATUS, {from: USER_CREATOR});

            newImplementationInstance = await TestUserFactoryUpgradeabiliy.new();
        });

        it('should keep the data state after upgrade', async () => {
            let createdUser = await userFactoryInstance.getUser(USER_ONE);

            await userFactoryInstance.upgradeImplementation(newImplementationInstance.address, {from: OWNER});
            let userFactoryUpgradedInstance = await ITestUserFactoryUpgradeabiliy.at(userFactoryInstance.address);
           
            let userOneAddressAfterFactoryUpgrade = await userFactoryUpgradedInstance.getUser(USER_ONE);

            assert.equal(createdUser, userOneAddressAfterFactoryUpgrade, "The data state after upgrade is not keeped");
        });

        it('should add additional functionality', async () => {
            await userFactoryInstance.upgradeImplementation(newImplementationInstance.address, {from: OWNER});
            let userFactoryUpgradedInstance = await ITestUserFactoryUpgradeabiliy.at(userFactoryInstance.address);
            
            await userFactoryUpgradedInstance.deleteUser(USER_ONE);
            let deletedUser = await userFactoryUpgradedInstance.getUser(USER_ONE);

            assert.equal(deletedUser, NOT_EXISTING_USER, "User exists after delete");
        });

        it('should throw if non-owner try to upgrade', async () => {
            await expectThrow(
                userFactoryInstance.upgradeImplementation(newImplementationInstance.address, {from: NOT_OWNER})
            );
        });
    });
});