const ProjectInitializator = require("../ProjectInitializator");

const timeTravel = require('./../util').timeTravel;

require("./../assertExtensions.js");

contract('HookOperator', function (accounts) {

	let owner = accounts[0]; 
	let offChainService = accounts[1];
	let malicious = accounts[2];
	let userOne = accounts[3];
	
	const INITIAL_TOKENS = 100000000000000000000; // => 100 tokens
	const TRANSFERABLE_TOKENS = 15000000000000000000; // => 15 tokens
	const TAX = 10000000000000000000; // => 10 tokens

	let userManagerContract;
	let hookOperatorContract;
	let icoTokenContract;
	let userFactoryContract;

	xdescribe('Testing Setters', () => {

		let contracts;

		before(async () =>{
			contracts = await ProjectInitializator.initWithAddress(owner);

			hookOperatorContract = contracts.hookOperatorContract;
		});
	
		describe('User manager', () => {
			it('should set user manager correctly', async () => {
				let userManagerInstance = contracts.userManagerContract;

				await hookOperatorContract.setUserManager(userManagerInstance.address, {from: owner});
				let userManager = await hookOperatorContract.getUserManager({from: owner});

				await assert.equal(userManagerInstance.address, userManager, "User manager is not correcly set");
			});
	
			it('should not set user manager if the method caller is not the owner', async () => {
				let userManagerInstance = contracts.userManagerContract;

				await assert.expectRevert(hookOperatorContract.setUserManager(userManagerInstance.address, {from: malicious}));
			});
	
			it('should not process setHookOperatorServiceContract when input parameter is an invalid address', async () => {
				await assert.expectRevert(hookOperatorContract.setUserManager("0x0", {from: owner}));
			});
		});

		describe('Ico token', () => {
			it('should set ico token correctly', async () => {
				let icoTokenInstance = contracts.icoTokenContract;

				await hookOperatorContract.setICOToken(icoTokenInstance.address, {from: owner});
				let hookOperatorIcoToken = await hookOperatorContract.getICOToken({from: owner});

				await assert.equal(icoTokenInstance.address, hookOperatorIcoToken, "Ico token is not correctly set");
			});
	
			it('should not set ico token if the method caller is not the contract owner', async () => {
				let icoTokenInstance = contracts.icoTokenContract;

				await assert.expectRevert(hookOperatorContract.setICOToken(icoTokenInstance.address, {from: malicious}));
			});
	
			it('should not process setICOToken when input parameter is an invalid address', async () => {
				await assert.expectRevert(hookOperatorContract.setICOToken("0x0", {from: owner}));
			});
		});

		describe('KYC Verification', () => {
			it('should set KYC Verification contract correctly', async () => {
				let kycVerificationContract = contracts.kycVerificationContract;

				await hookOperatorContract.setKYCVerficationContract(kycVerificationContract.address, {from: owner});
				let kycVerificationContractAddress = await hookOperatorContract.getKYCVerificationContractAddress();

				assert.equal(kycVerificationContract.address, kycVerificationContractAddress, `KYCVerification is not correctly set. Address should be ${kycVerificationContract.address} but returned ${kycVerificationContractAddress}`);
			});

			it('should not set KYC Verification contract if the method caller is not the contract owner', async () => {
				let kycVerificationContract = contracts.kycVerificationContract;

				assert.expectRevert(hookOperatorContract.setKYCVerficationContract(kycVerificationContract.address, {from: malicious}));
			});

			it('should not process setKYCVerficationContract when input parameter is an invalid address', async () => {
				await assert.expectRevert(hookOperatorContract.setKYCVerficationContract("0x0", {from: owner}));
			});
		});
	});

	xdescribe('Test Token Processes', () => {

		describe('OnTransfer methods', () => {

			let contracts;
			let institutionInstance;
			let curveCalculatorInstance;
			let tokenPoolAddress;

			beforeEach(async () => {
				contracts = await ProjectInitializator.initWithAddress(owner);
				icoTokenContract = contracts.icoTokenContract;
				hookOperatorContract = contracts.hookOperatorContract;
			});

			describe('OnTransfer', () => {
				it('should not process onTransfer if the method caller is not the ico token contract', async () => {
					await assert.expectRevert(hookOperatorContract.onTransfer(malicious, owner, TRANSFERABLE_TOKENS, {from: malicious}));
				});

				it('should not process onTransfer with invalid from address parameter', async () => {
					await assert.expectRevert(hookOperatorContract.onTransfer("0x0", owner, TRANSFERABLE_TOKENS, {from: owner}));
				});

				it('should not process onTransfer with invalid to address parameter', async () => {
					await assert.expectRevert(hookOperatorContract.onTransfer(owner, "0x0", TRANSFERABLE_TOKENS, {from: owner}));
				});

				it('should not process onTransfer with zero tokens amount parameter', async () => {
					await assert.expectRevert(hookOperatorContract.onTransfer(owner, owner, 0, {from: owner}));
				});
			});

			describe('OnTaxTransfer', () => {

			});
		});
		
		describe('OnMint', () => {
			let contracts;
			let icoToken = accounts[9];

			beforeEach(async () => {
				contracts = await ProjectInitializator.initWithAddress(owner);
				hookOperatorContract = contracts.hookOperatorContract;
				userFactoryContract = contracts.userFactoryContract;

				hookOperatorContract.setICOToken(icoToken, {from: owner});
			});
			
			it('should process onMint', async () => {
				let userManagerContract = contracts.userManagerContract;

				let userExistingBeforeOnMint = await userFactoryContract.isUserExisting.call(userOne);
				await hookOperatorContract.onMint(userOne, TRANSFERABLE_TOKENS, {from: icoToken});
				let userExistingAfterOnMint = await userFactoryContract.isUserExisting.call(userOne);

				await assert.equal(userExistingBeforeOnMint, false);
				await assert.equal(userExistingAfterOnMint, true);
			});

			it('should not process onMint if the method caller is not the ico token contract', async () => {
				await assert.expectRevert(
					hookOperatorContract.onMint(owner, TRANSFERABLE_TOKENS, {from: malicious})
				);
			});
		});

		describe('OnBurn', () => {
			
			xit('should process onBurn', async () => {

			});

			it('should not process onBurn if the method caller is not the ico token contract', async () => {
				await assert.expectRevert(
					hookOperatorContract.onBurn(TRANSFERABLE_TOKENS, {from: malicious})
				);
			});
		});	
		
		describe('onTaxTransfer', () => {
			let contracts;

			before(async () =>{
				contracts = await ProjectInitializator.initWithAddress(owner);

				hookOperatorContract = contracts.hookOperatorContract;
			});

			it('should throw if the method caller is not the owner', async () => {
				assert.expectRevert(hookOperatorContract.onTaxTransfer(userOne, TRANSFERABLE_TOKENS, {from: malicious}));
			});

			it('should throw if taxableUser address is not valid', async () => {
				assert.expectRevert(hookOperatorContract.onTaxTransfer("0x0", TRANSFERABLE_TOKENS, {from: owner}));
			});
		});
	});

	describe('Testing kycVerification function', () => {
		let contracts;

		before(async () =>{
			contracts = await ProjectInitializator.initWithAddress(owner);

			hookOperatorContract = contracts.hookOperatorContract;
		});

		it('it should if \"from\" address is invalid', async () => {
			assert.expectRevert(hookOperatorContract.kycVerification("0x0", userOne, TRANSFERABLE_TOKENS, {from: owner}));
		});

		it('it should if \"to\" address is invalid', async () => {
			assert.expectRevert(hookOperatorContract.kycVerification(userOne, "0x0", TRANSFERABLE_TOKENS, {from: owner}));
		});
	});

	xdescribe('Testing Temporary helper functions', () => {
		let contracts;

		before(async () =>{
			contracts = await ProjectInitializator.initWithAddress(owner);

			hookOperatorContract = contracts.hookOperatorContract;
		});

		describe('Testing updateUserRatio', () => {
			it('should throw if invalid contract address is used', async () => {
				assert.expectRevert(hookOperatorContract.updateUserRatio(1, "0x0", {from: owner}));
			});

			it('should throw if the method caller is not the owner', async () => {
				assert.expectRevert(hookOperatorContract.updateUserRatio(1, userOne, {from: malicious}));
			});
		});
	});
});