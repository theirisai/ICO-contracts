const ProjectInitializator = require("../ProjectInitializator");

const IUserContract = artifacts.require("./IUserContract.sol");

const expectThrow = require('./../util').expectThrow;
const timeTravel = require('./../util').timeTravel;
const web3Now = require('./../util').web3Now;

require("./../assertExtensions");

contract('UserManager', function (accounts) {

    const owner = accounts[0];
    const nonOwner = accounts[9];

    const userOneAddress = accounts[1];
    const userTwoAddress = accounts[2];
	const userThreeAddress = accounts[3];
	const userFourAddress = accounts[4];
	const userFiveAddress = accounts[5];
	
	const USER_MANAGER = accounts[7];
	const HOOK_OPERATOR = accounts[8];

	let hookOperatorContract;
	let userManagerContract;
	let _dataContract;
	let userFactoryContract;

	describe('Testing Setters', () => {
		let contracts;

		before(async () => {
			contracts = await ProjectInitializator.initWithAddress(owner);

			hookOperatorContract = contracts.hookOperatorContract;
			userManagerContract = contracts.userManagerContract;
			_dataContract = contracts.dataContract;
			userFactoryContract = contracts.userFactoryContract;
		});

		describe('Testing Data Contract setter', () => {
			it('should set data contract', async () => {
				await userManagerContract.setDataContract(_dataContract.address, {from: owner});

				let dataContractAddress = await userManagerContract.getDataContractAddress();
				assert.equal(dataContractAddress, _dataContract.address, `Data should be ${_dataContract.address} but returned ${dataContractAddress}`);
			});

			it('should not set data contract if the method caller is not the contract owner', async () => {
				await expectThrow(userManagerContract.setDataContract(_dataContract.address, {from: nonOwner}));
			});

			it('should not process setDataContract when input parameter is an invalid address', async () => {
				await expectThrow(userManagerContract.setDataContract("0x0", {from: owner}));
			});

			it('should set tax percentage', async () => {
				await userManagerContract.setTaxPercentage(2, {from: owner});

				let taxPercentage = await _dataContract.getTaxPercentage();
				assert.equal(taxPercentage, 2, `Tax percentage should be 2 but returned ${taxPercentage}`);
			});

			it('should throw if the method caller is not the contract owner', async () => {
				await expectThrow(userManagerContract.setTaxPercentage(2, {from: nonOwner}));
			});

			it('should set taxation period', async () => {
				await userManagerContract.setTaxationPeriod(2000, {from: owner});

				let taxPeriod = await _dataContract.getTaxationPeriodInSeconds();
				assert.equal(taxPeriod, 2000, `Tax period should be 2000 but returned ${taxPeriod}`);
			});

			it('should throw if the method caller is not the contract owner', async () => {
				await expectThrow(userManagerContract.setTaxationPeriod(2000, {from: nonOwner}));
			});
		});

		describe('Testing User Factory setter', () => {
			it('should set User Factory Contract', async () => {
				await userManagerContract.setUserFactoryContract(userFactoryContract.address, {from: owner});

				let userFactoryContractAddress = await userManagerContract.getUserFactoryContractAddress();
				assert.equal(userFactoryContractAddress, userFactoryContract.address, `User Factory contract address should be ${userFactoryContract.address} but returned ${userFactoryContractAddress}`);
			});

			it('should not set user factory contract if the method caller is not the contract owner', async () => {
				await expectThrow(userManagerContract.setUserFactoryContract(userFactoryContract.address, {from: nonOwner}));
			});

			it('should not process setUserFactoryContract when input parameter is an invalid address', async () => {
				await expectThrow(userManagerContract.setUserFactoryContract("0x0", {from: owner}));
			});
		});

		describe('Testing Hook Operator setter', () => {
			it('should set hook operator contract', async () => {
				await userManagerContract.setHookOperatorContract(hookOperatorContract.address, {from: owner});

				let hookOperatorContractAddress = await userManagerContract.getHookOperatorContractAddress();
				assert.equal(hookOperatorContractAddress, hookOperatorContract.address, `Hook Operator contract address should be ${hookOperatorContract.address} but returned ${hookOperatorContractAddress}`);
			});

			it('should not set hook operator contract if the method caller is not the contract owner', async () => {
				await expectThrow(userManagerContract.setHookOperatorContract(hookOperatorContract.address, {from: nonOwner}));
			});

			it('should not process setHookOperatorContract when input parameter is an invalid address', async () => {
				await expectThrow(userManagerContract.setHookOperatorContract("0x0", {from: owner}));
			});
		});

		describe('Testing user manager functions', () => {
			const userCreator = accounts[3];
			const userManager = accounts[4];

        	const USER_KYC_STATUS = {
            	ANONIMNOUS: 0,
            	SEMI_VERIFIED: 1,
            	VERIFIED: 2,
            	UNDEFINED: 3
			}
			
			beforeEach(async () => {
				contracts = await ProjectInitializator.initWithAddress(owner);

				hookOperatorContract = contracts.hookOperatorContract;
				userManagerContract = contracts.userManagerContract;
				_dataContract = contracts.dataContract;
				userFactoryContract = contracts.userFactoryContract;

            	await userFactoryContract.setUserManagerAddress(userManagerContract.address, {from: owner});
				await userFactoryContract.setUserCreator(userCreator, {from: owner});
				
				await userFactoryContract.createNewUser(userOneAddress, USER_KYC_STATUS.VERIFIED, {from: userCreator}); 
				await hookOperatorContract.setOverBalanceLimitHolder(userOneAddress, true, {from: owner});

				await userManagerContract.setHookOperatorContract(hookOperatorContract.address, {from: owner});
			});

			it("isUserKYCVerified should return correct value", async () => {
				let userVerifiedStatus = await userManagerContract.isUserKYCVerified(userOneAddress);

				assert.equal(userVerifiedStatus, USER_KYC_STATUS.VERIFIED, `User should have KYC status ${USER_KYC_STATUS.VERIFIED} but it has KYC status ${userVerifiedStatus}`);
			});

			it("isUserKYCVerified should throw if invalid address is used", async () => {
				await expectThrow(userManagerContract.isUserKYCVerified("0x0"));
			});

			it("isBlacklisted should return correct value", async () => {
				let isUserBlacklisted = await userManagerContract.isBlacklisted(userOneAddress);

				assert.equal(isUserBlacklisted, false, `isUserBlacklisted should be falseb but returned ${isUserBlacklisted}`);
			});

			it("isBlacklisted should throw if invalid address is used", async () => {
				await expectThrow(userManagerContract.isBlacklisted("0x0"));
			});

			it("isBannedUser should return correct value", async () => {
				let isUserBanned = await userManagerContract.isBannedUser(userOneAddress);

				assert.equal(isUserBanned, false, `isUserBanned should be false but returned ${isUserBanned}`);
			});

			it("isBannedUser should throw if invalid address is used", async () => {
				await expectThrow(userManagerContract.isBannedUser("0x0"));
			});

			it("should update user ratio", async () => {
				let hookOperatorContractAddress = accounts[7];
				await userManagerContract.setHookOperatorContract(hookOperatorContractAddress, {from: owner});

				let userAddress = await userFactoryContract.getUser(userOneAddress);
				let userInstance = await IUserContract.at(userAddress);
				
				let userData = await userInstance.getUserData();
				let userCurrentRatio = userData[0];

				assert.equal(userCurrentRatio, 0, `User generation ratio should be 0 but returned ${userCurrentRatio}`);

				await userManagerContract.updateGenerationRatio(2, userOneAddress, {from: hookOperatorContractAddress});

				let updatedUserData = await userInstance.getUserData();
				let updatedUserRatio = updatedUserData[0];

				assert.equal(updatedUserRatio, 2, `User ratio should be updated to 2 but returned ${updatedUserRatio}`);
			});

			it("should not update user ratio", async () => {
				let hookOperatorContractAddress = accounts[7];
				await userManagerContract.setHookOperatorContract(hookOperatorContractAddress, {from: owner});

				let userAddress = await userFactoryContract.getUser(userOneAddress);
				let userInstance = await IUserContract.at(userAddress);
				
				let userData = await userInstance.getUserData();
				let userCurrentRatio = userData[0];

				assert.equal(userCurrentRatio, 0, `User generation ratio should be 0 but returned ${userCurrentRatio}`);

				await expectThrow(userManagerContract.updateGenerationRatio(2, userOneAddress, {from: nonOwner}));
			});

			it("should update last transaction time", async () => {

				let hookOperatorContractAddress = accounts[7];
				await userManagerContract.setHookOperatorContract(hookOperatorContractAddress, {from: owner});

				let userAddress = await userFactoryContract.getUser(userOneAddress);
				let userInstance = await IUserContract.at(userAddress);
				
				let userData = await userInstance.getUserData();
				let userLastTransactionTime = userData[2];

				assert.equal(userLastTransactionTime, 0);

				await userManagerContract.updateLastTransactionTime(userOneAddress, {from: hookOperatorContractAddress});

				let updatedUserData = await userInstance.getUserData();
				let updatedLastTransactionTime = updatedUserData[2];

				assert.isAbove(updatedLastTransactionTime, userLastTransactionTime, `Updated last transaction time should be ${updatedLastTransactionTime} but returned ${userLastTransactionTime}`);
			});

			it("should return correct policy", async () => {
				let isUserPolicyCorrect = await userManagerContract.isUserPolicyCorrect(userOneAddress);

				assert.equal(isUserPolicyCorrect, true, `isUserPolicyCorrect should return true but returned ${isUserPolicyCorrect}`);
			});
		});
	});
});