const IUserContract = artifacts.require("./IUserContract.sol");
const UserContract = artifacts.require("./UserContract.sol");
const UserContractProxy = artifacts.require("./UserContractProxy.sol");

const ProjectInitializator = require("../ProjectInitializator");

const expectThrow = require('./../util').expectThrow;
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

	describe('Testing Setters', () => {

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

				await assert.equal(userManagerInstance.address, userManager, "User manager is not correctly set");
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

				await hookOperatorContract.setKYCVerificationContract(kycVerificationContract.address, {from: owner});
				let kycVerificationContractAddress = await hookOperatorContract.getKYCVerificationContractAddress();

				assert.equal(kycVerificationContract.address, kycVerificationContractAddress, `KYCVerification is not correctly set. Address should be ${kycVerificationContract.address} but returned ${kycVerificationContractAddress}`);
			});

			it('should not set KYC Verification contract if the method caller is not the contract owner', async () => {
				let kycVerificationContract = contracts.kycVerificationContract;

				assert.expectRevert(hookOperatorContract.setKYCVerificationContract(kycVerificationContract.address, {from: malicious}));
			});

			it('should not process setKYCVerificationContract when input parameter is an invalid address', async () => {
				await assert.expectRevert(hookOperatorContract.setKYCVerificationContract("0x0", {from: owner}));
			});
		});

		describe('Balance Percentage Limit', () => {
            const LIMIT = 2; // 2% of total supply

            it('should set balance percentage limit correctly', async () => {
                await hookOperatorContract.setBalancePercentageLimit(LIMIT);
                let limit = await hookOperatorContract.getBalancePercentageLimit();

                assert.bigNumberEQNumber(limit, LIMIT);
            });

            it('should throw if non-owner try to set balance percentage limit', async () => {
                await expectThrow(
                    hookOperatorContract.setBalancePercentageLimit(LIMIT, {from: malicious})
                );          
            });

            it('should throw if limit is 0', async () => {
                await expectThrow(
                    hookOperatorContract.setBalancePercentageLimit(0, {from: malicious})
                );  
            });

            it('should throw if limit is 100 or higher', async () => {
                await expectThrow(
                    hookOperatorContract.setBalancePercentageLimit(100, {from: malicious})
                );  
            });
        });

        describe('Over Balance Limit Holder', () => {
            const OVER_BALANCE_LIMIT_HOLDER = accounts[3];
            const IS_OVER_BALANCE_LIMIT_HOLDER = true;

            it('should add over balance limit holder', async () => {
                await hookOperatorContract.setOverBalanceLimitHolder(OVER_BALANCE_LIMIT_HOLDER, IS_OVER_BALANCE_LIMIT_HOLDER, {from: owner});
                let isOverBalanceLimitHolder = await hookOperatorContract.isOverBalanceLimitHolder(OVER_BALANCE_LIMIT_HOLDER);

                assert.isTrue(isOverBalanceLimitHolder, "Over balance limit holder is not added successfully");
            });

            it('should remove over balance limit holder', async () => {
                await hookOperatorContract.setOverBalanceLimitHolder(OVER_BALANCE_LIMIT_HOLDER, IS_OVER_BALANCE_LIMIT_HOLDER, {from: owner});
                let isOverBalanceLimitHolderAdded = await hookOperatorContract.isOverBalanceLimitHolder(OVER_BALANCE_LIMIT_HOLDER);

                await hookOperatorContract.setOverBalanceLimitHolder(OVER_BALANCE_LIMIT_HOLDER, false, {from: owner});
                let isOverBalanceLimitHolderRemoved = !(await hookOperatorContract.isOverBalanceLimitHolder(OVER_BALANCE_LIMIT_HOLDER)); 

                assert.isTrue(isOverBalanceLimitHolderAdded, "Over balance limit holder is not added successfully");
                assert.isTrue(isOverBalanceLimitHolderRemoved, "Over balance limit holder is not removed successfully");
            });

            it('should throw if non-owner try to set over balance limit holder', async () => {
                await expectThrow(
                    hookOperatorContract.setOverBalanceLimitHolder(OVER_BALANCE_LIMIT_HOLDER, IS_OVER_BALANCE_LIMIT_HOLDER, {from: malicious})
                );
            });

            it('should throw if input address is invalid', async () => {
                await expectThrow(
                    hookOperatorContract.setOverBalanceLimitHolder("0x0", IS_OVER_BALANCE_LIMIT_HOLDER, {from: owner})
                );
            });
        });
	});

	describe('Test Token Processes', () => {

		describe('OnTransfer methods', () => {

			let contracts;
			let institutionInstance;
			let curveCalculatorInstance;
			let tokenPoolAddress;
			let userFactoryContract;
			let kycVerificationContract;
			let userManagerContract;

			const userOneAddress = accounts[1];
			const userTwoAddress = accounts[2];

			const userCreator = accounts[3];
			const userManager = accounts[4];
			
			const icoToken = accounts[8];
			const kycAdmin = accounts[9];

			const initialTokens = 1000000000000000000; // 10 tokens
			const tokensToSend = 1000000000000000000; // 1 tokens

        	const USER_KYC_STATUS = {
            	ANONYMOUS: 0,
            	SEMI_VERIFIED: 1,
            	VERIFIED: 2,
            	UNDEFINED: 3
        	}

			beforeEach(async () => {
				contracts = await ProjectInitializator.initWithAddress(owner);
				icoTokenContract = await contracts.icoTokenContract;
				hookOperatorContract = await contracts.hookOperatorContract;
				userFactoryContract = await contracts.userFactoryContract;
				kycVerificationContract = await contracts.kycVerificationContract;
				userManagerContract = await contracts.userManagerContract;

				await hookOperatorContract.setICOToken(icoToken, {from: owner});

            	await kycVerificationContract.setKYCUserOwner(kycAdmin, {from: owner});

            	await userFactoryContract.setKYCVerificationInstance(kycVerificationContract.address, {from: owner});
            	await userFactoryContract.setUserManagerAddress(userManagerContract.address, {from: owner});
				await userFactoryContract.setUserCreator(userCreator, {from: owner});
				
				await userFactoryContract.createNewUser(userOneAddress, USER_KYC_STATUS.VERIFIED, {from: userCreator}); 
				await hookOperatorContract.setOverBalanceLimitHolder(userOneAddress, true, {from: owner});

				await userFactoryContract.createNewUser(userTwoAddress, USER_KYC_STATUS.VERIFIED, {from: userCreator}); 
				await hookOperatorContract.setOverBalanceLimitHolder(userTwoAddress, true, {from: owner});
			});

			describe('OnTransfer', () => {
				it('should not process onTransfer if the method caller is not the ico token contract', async () => {
					await assert.expectRevert(hookOperatorContract.onTransfer(malicious, owner, TRANSFERABLE_TOKENS, {from: malicious}));
				});

				it('should not process onTransfer with invalid from address parameter', async () => {
					await assert.expectRevert(hookOperatorContract.onTransfer("0x0", owner, TRANSFERABLE_TOKENS, {from: icoToken}));
				});

				it('should not process onTransfer with invalid to address parameter', async () => {
					await assert.expectRevert(hookOperatorContract.onTransfer(owner, "0x0", TRANSFERABLE_TOKENS, {from: icoToken}));
				});

				it('should not process onTransfer with zero tokens amount parameter', async () => {
					await assert.expectRevert(hookOperatorContract.onTransfer(owner, owner, 0, {from: icoToken}));
				});

				it('should throw onTransfer if user is blacklisted', async () => {
					await hookOperatorContract.onMint(userOneAddress, initialTokens, {from: icoToken});
					await hookOperatorContract.onMint(userTwoAddress, initialTokens, {from: icoToken});

					let userContract = await userFactoryContract.getUserContract(userOneAddress);
            		let userInstance = await IUserContract.at(userContract);

            		let isBlacklisted = await userInstance.isUserBlacklisted();
            		assert.equal(isBlacklisted, false, `At the beginning isBlacklisted should be false but it returned ${isBlacklisted}`);

					await hookOperatorContract.onTransfer(userOneAddress, userTwoAddress, tokensToSend, {from: icoToken});

					await kycVerificationContract.setUserBlacklistedStatus(userOneAddress, true, {from: kycAdmin});

            		let isBlacklistedAfterUpdate = await userInstance.isUserBlacklisted();
					assert.equal(isBlacklistedAfterUpdate, true, `isBlacklisted should be true but it returned ${isBlacklistedAfterUpdate}`);
					
					await expectThrow(hookOperatorContract.onTransfer(userOneAddress, userTwoAddress, tokensToSend, {from: icoToken}));
				});

				it('should throw onTransfer if user is banned', async () => {
					await hookOperatorContract.onMint(userOneAddress, initialTokens, {from: icoToken});
					await hookOperatorContract.onMint(userTwoAddress, initialTokens, {from: icoToken});

					let userContract = await userFactoryContract.getUserContract(userOneAddress);
            		let userInstance = await IUserContract.at(userContract);

            		let isBanned = await userInstance.isUserBanned();
            		assert.equal(isBanned, false, `At the beginning isBanned should be false but it returned ${isBanned}`);

					await hookOperatorContract.onTransfer(userOneAddress, userTwoAddress, tokensToSend, {from: icoToken});

					await kycVerificationContract.banUser(userOneAddress, {from: kycAdmin});

            		let isBannedAfterUpdate = await userInstance.isUserBanned();
					assert.equal(isBannedAfterUpdate, true, `isBlacklisted should be true but it returned ${isBannedAfterUpdate}`);
					
					await expectThrow(hookOperatorContract.onTransfer(userOneAddress, userTwoAddress, tokensToSend, {from: icoToken}));
				});

				it('should throw onMint if user is banned', async () => {
					let userContract = await userFactoryContract.getUserContract(userOneAddress);
            		let userInstance = await IUserContract.at(userContract);

            		let isBanned = await userInstance.isUserBanned();
					assert.equal(isBanned, false, `At the beginning isBanned should be false but it returned ${isBanned}`);
					
					await kycVerificationContract.banUser(userOneAddress, {from: kycAdmin});

            		let isBannedAfterUpdate = await userInstance.isUserBanned();
					assert.equal(isBannedAfterUpdate, true, `isBanned should be true but it returned ${isBannedAfterUpdate}`);

					await expectThrow(hookOperatorContract.onMint(userOneAddress, initialTokens, {from: icoToken}));
				});

				it('should throw if "from" user is invalid', async () => {
					let userContract = await userFactoryContract.getUserContract(userOneAddress);
					userInstance = await IUserContract.at(userContract);

					await userInstance.updateUserPolicy(
						true, // TermsAndConditions,
						true, // AML,
						false, // Constitution,
						true, // CommonLicenseAgreement,
					{from: userCreator});

                    await assert.expectRevert(hookOperatorContract.onTransfer(userOneAddress, userTwoAddress, TRANSFERABLE_TOKENS, {from: icoToken}));
                });

                it('should throw if "to" user is invalid', async () => {
					let userContract = await userFactoryContract.getUserContract(userTwoAddress	);
					userInstance = await IUserContract.at(userContract);

					await userInstance.updateUserPolicy(
						true, // TermsAndConditions,
						true, // AML,
						false, // Constitution,
						true, // CommonLicenseAgreement,
					{from: userCreator});

                    await assert.expectRevert(hookOperatorContract.onTransfer(userOneAddress, userTwoAddress, TRANSFERABLE_TOKENS, {from: icoToken}));
                });
			});

			describe('OnTaxTransfer', () => {

			});
		});
		
		describe('OnMint', () => {
			let contracts;
			let icoToken = accounts[9];
			const KYC_VERIFIED_STATUS = 2;

			beforeEach(async () => {
				contracts = await ProjectInitializator.initWithAddress(owner);
				hookOperatorContract = contracts.hookOperatorContract;
				userFactoryContract = contracts.userFactoryContract;

				await userFactoryContract.createNewUser(userOne, KYC_VERIFIED_STATUS, {from: owner}); 

				await hookOperatorContract.setICOToken(icoToken, {from: owner});
			});

			it('should throw if input mintable address is invalid', async () => {
				let userContract = await userFactoryContract.getUserContract(userOne);
                userInstance = await IUserContract.at(userContract);

                await userInstance.updateUserPolicy(
                    true, // TermsAndConditions,
                    true, // AML,
                    false, // Constitution,
                    true, // CommonLicenseAgreement,
				{from: owner});
				
                await expectThrow(hookOperatorContract.onMint(userOne, TRANSFERABLE_TOKENS, {from: icoToken}));
            });
				

			it('should not process onMint if the method caller is not the ico token contract', async () => {
				await assert.expectRevert(
					hookOperatorContract.onMint(userOne, TRANSFERABLE_TOKENS, {from: malicious})
				);
			});
		});

		describe('OnBurn', () => {
			
			it('should process onBurn', async () => {

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

	describe('Testing Temporary helper functions', () => {
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