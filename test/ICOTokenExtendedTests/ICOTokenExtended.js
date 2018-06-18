const ICOTokenExtended = artifacts.require("../../contracts/InitialCoinOffering/ICOTokenExtended.sol");

const HookOperator = artifacts.require("./HookOperator/HookOperator.sol");
const HookOperatorProxy = artifacts.require("./HookOperator/HookOperatorProxy.sol");
const IHookOperator = artifacts.require("./HookOperator/IHookOperator.sol");

const TestHookOperator = artifacts.require("../../contracts/TestPurpose/TestHookOperator.sol");

const ProjectInitializator = require("./../ProjectInitializator");

const expectThrow = require('./../util').expectThrow;

const BigNumber = require('./../bigNumber');
BigNumber.config({ DECIMAL_PLACES: 25 });

require("../assertExtensions.js");

contract('ICOTokenExtended', function (accounts) {
						  
	const WEI_IN_ETHER = 1000000000000000000; // 1 ether
	const WEI_IN_TOKEN = 1000000000000000000; // 1 token
	
	const OWNER = accounts[0];
	const POOL_ADDRESS = accounts[1];
	const NOT_OWNER = accounts[2];
	const MINTER = accounts[3];

	const USER_ONE = accounts[4];
	const USER_TWO = accounts[5];

	const TAX_AMOUNT = 8 * WEI_IN_TOKEN; // => 8 tokens
	const INITIAL_TOKENS_AMOUNT = 100 * WEI_IN_TOKEN; // => 100 tokens

	const USER_KYC_STATUS = 2; // Verified

	let hookOperatorContract;
	let icoTokenContract;

	describe('Constructor', () => {

		it('should has set owner as a minter', async () => {
			icoTokenContract = await ICOTokenExtended.new({from: OWNER});
			
			let isMinter = await icoTokenContract.minters(OWNER, {from: OWNER});

			assert.isTrue(isMinter, "Owner has not been set as a minter");
		});
	});

	describe('Ownership', () => {

		const NEW_OWNER = accounts[6];

		beforeEach(async () => {
			icoTokenContract = await ICOTokenExtended.new({from: OWNER});
		});

		it('should transfer ownership successfully', async () => {
			await icoTokenContract.transferOwnership(NEW_OWNER, {from: OWNER});
			let tokenOwner = await icoTokenContract.owner.call();

			assert.strictEqual(NEW_OWNER, tokenOwner, "Ownership is not transfered");
		});

		it('should not transfer ownership if the method caller is not the OWNER', async () => {
			await expectThrow(
				icoTokenContract.transferOwnership(NEW_OWNER, {from: NOT_OWNER})
			);
		});

		it('should not transfer ownership if new owner\'s address is invalid', async () => {
			await expectThrow(
				icoTokenContract.transferOwnership("0x0", {from: OWNER})
			);
		});
	});

	describe('Setters', () => {

		before(async () => {
			icoTokenContract = await ICOTokenExtended.new({from: OWNER});
		});

		describe('Set owner', () => {
			it('should has set owner correctly', async () => {
				let tokenOwner = await icoTokenContract.owner.call();
	
				assert.strictEqual(OWNER, tokenOwner, "The expected owner is not set");
			});
		});

		describe('Set Hook Operator', () => {
			it('should set hook operator address correctly', async () => {
				hookOperatorContract = await ProjectInitializator.initHookOperator(OWNER);
				
				await icoTokenContract.setHookOperator(hookOperatorContract.address, {from: OWNER});

				let icoTokenHookOperator = await icoTokenContract.hookOperator.call();
	
				await assert.equal(hookOperatorContract.address, icoTokenHookOperator, "Hook operator in not set correctly");
			});
	
			it('should update hook operator address', async () => {
				let hookOperatorBeforeUpdate = await icoTokenContract.hookOperator();
	
				hookOperatorContract = await ProjectInitializator.initHookOperator(OWNER);

				await icoTokenContract.setHookOperator(hookOperatorContract.address, {from: OWNER});
	
				let hookOperatorAfterUpdate = await icoTokenContract.hookOperator({from: OWNER});
	
				await assert.notEqual(
					hookOperatorBeforeUpdate, hookOperatorAfterUpdate, 
					"Hook operator has not any change after update"
				);
	
				await assert.equal(
					hookOperatorContract.address, hookOperatorAfterUpdate, 
					"Hook operator is not updated correctly"
				);
			});
	
			it('should not be set by non-owner', async () => {
				await expectThrow(icoTokenContract.setHookOperator(hookOperatorContract.address, {from: NOT_OWNER}));
			});
	
			it('should not be set if the "hookOperatorAddress" is an invalid address', async () => {
				await expectThrow(icoTokenContract.setHookOperator("0x0", {from: OWNER}));
			});
		});

		describe('Set Exchange Oracle', () => {

			let exchangeOracleInstance;

			beforeEach(async () => {
				let rate = 100;
				
				exchangeOracleInstance = await ProjectInitializator.initExchangeOracle(OWNER, rate);
			});
			
			it('should set exchange oracle address correctly', async () => {
				await icoTokenContract.setExchangeOracle(exchangeOracleInstance.address, {from: OWNER});

				let oracleAddress = await icoTokenContract.aiurExchangeOracle.call();

				assert.equal(exchangeOracleInstance.address, oracleAddress, "Exchange oracle is not set correctly");
			});

			it('should throw if non-owner try to set exchange oracle address', async () => {
				await expectThrow(
					icoTokenContract.setExchangeOracle(exchangeOracleInstance.address, {from: NOT_OWNER})
				);
			});

			it('should throw if input exchange oracle address is invalid', async () => {
				await expectThrow(
					icoTokenContract.setExchangeOracle("0x0", {from: OWNER})
				);
			});
		});

		describe('Set Refunder', () => {
			
			const REFUNDER = accounts[6];

			it('should set refunder correctly', async () => {
				await icoTokenContract.setRefunder(REFUNDER, {from: OWNER});

				let refunder = await icoTokenContract.refunder.call();

				assert.equal(REFUNDER, refunder, "Refunder is not set correctly");
			});

			it('should throw if non-owner try to set refunder', async () => {
				await expectThrow(
					icoTokenContract.setRefunder(REFUNDER, {from: NOT_OWNER})
				);
			});

			it('should throw if input refunder address is invalid', async () => {
				await expectThrow(
					icoTokenContract.setRefunder("0x0", {from: OWNER})
				);
			});
		});
	});

	describe('Primary Functions', () => {

		let contracts;
		let userFactoryContract;
		const IS_OVER_BALANCE_LIMIT_HOLDER = true;

		beforeEach(async () =>{
			icoTokenContract = await ICOTokenExtended.new({from: OWNER});

			contracts = await ProjectInitializator.initWithAddress(OWNER);
			hookOperatorContract = contracts.hookOperatorContract;

			await icoTokenContract.setHookOperator(hookOperatorContract.address, {from: OWNER});

			await hookOperatorContract.setICOToken(icoTokenContract.address, {from: OWNER});
		});

		describe('Add minter', () => {

			it('should add a minter', async () => {
				await icoTokenContract.addMinter(MINTER, {from: OWNER});
				let isMinterAdded = await icoTokenContract.minters(MINTER, {from: OWNER});
	
				assert.isTrue(isMinterAdded, "Minter is not added successfuly");
			});
	
			it('should not add minter if the method caller is not the owner', async () => {
				await expectThrow(
					icoTokenContract.addMinter(MINTER, {from: NOT_OWNER})
				);
			});

			it('should not add minter if it\'s address is invalid', async () => {
				await expectThrow(
					icoTokenContract.addMinter("0x0", {from: OWNER})
				);
			});
		});

		describe('Mint', () => {

			const MINTABLE_USERS = [
				USER_ONE,
				USER_TWO
			];

			it('should process tokens minting to kyc user when the function caller is owner', async () => {
				await ProjectInitializator.createVerifiedUsers(OWNER, MINTABLE_USERS);

				await mintTokens(OWNER);
			});

			it('should process tokens minting to exchange user when the function caller is owner', async () => {
				await ProjectInitializator.createExchangedUsers(OWNER, MINTABLE_USERS);

				await mintTokens(OWNER);
			});

			it('should process tokens minting to kyc user when the function caller is minter', async () => {
				await ProjectInitializator.createVerifiedUsers(OWNER, MINTABLE_USERS);

				await icoTokenContract.addMinter(MINTER, {from: OWNER});

				await mintTokens(MINTER);
			});

			it('should process tokens minting to exchange user when the function caller is minter', async () => {
				await ProjectInitializator.createExchangedUsers(OWNER, MINTABLE_USERS);

				await icoTokenContract.addMinter(MINTER, {from: OWNER});

				await mintTokens(MINTER);
			});
	
			async function mintTokens(MINTER) {
				
				let userOneBalanceBeforeMint = await icoTokenContract.balanceOf(USER_ONE);
				let userTwoBalanceBeforeMint = await icoTokenContract.balanceOf(USER_TWO);
	
				for (let i = 0; i < MINTABLE_USERS.length; i++) {
					await icoTokenContract.mint(MINTABLE_USERS[i], INITIAL_TOKENS_AMOUNT, {from: MINTER});
				}
	
				let userOneBalanceAfterMint = await icoTokenContract.balanceOf(USER_ONE);
				let userTwoBalanceAfterMint = await icoTokenContract.balanceOf(USER_TWO);

				let totalSupply = await icoTokenContract.totalSupply();

				assert.bigNumberEQbigNumber(userOneBalanceBeforeMint, userOneBalanceAfterMint.minus(INITIAL_TOKENS_AMOUNT));
				assert.bigNumberEQbigNumber(userTwoBalanceBeforeMint, userTwoBalanceAfterMint.minus(INITIAL_TOKENS_AMOUNT));

				assert.bigNumberEQNumber(totalSupply, INITIAL_TOKENS_AMOUNT * 2);
			}

			it('should not mint tokens if the method caller is not a minter', async () => {
				await expectThrow(
					icoTokenContract.mint(USER_ONE, INITIAL_TOKENS_AMOUNT, {from: NOT_OWNER})
				);
			});

			it('should not mint tokens if the "to" parameter is invalid address', async () => {
				await expectThrow(
					icoTokenContract.mint("0x0", INITIAL_TOKENS_AMOUNT, {from: OWNER})
				);
			});

		});

		describe('Transfer', () => {

			it('should process tokens transfer between kyc user and exchange one', async () => {
				await ProjectInitializator.createVerifiedUsers(OWNER, [OWNER]);
				await ProjectInitializator.createExchangedUsers(OWNER, [USER_ONE]);

				await transfer(OWNER, USER_ONE);
			});

			it('should process tokens transfer between two kyc users', async () => {
				await ProjectInitializator.createVerifiedUsers(OWNER, [OWNER, POOL_ADDRESS]);

				await transfer(OWNER, POOL_ADDRESS);
			});

			it('should process tokens transfer between exchange user and kyc one', async () => {
				await ProjectInitializator.createVerifiedUsers(OWNER, [OWNER]);
				await ProjectInitializator.createExchangedUsers(OWNER, [USER_ONE]);

				await transfer(USER_ONE, OWNER);
			});

			it('should process tokens transfer between two exchange users', async () => {
				await ProjectInitializator.createExchangedUsers(OWNER, [USER_ONE, USER_TWO]);

				await transfer(USER_ONE, USER_TWO);
			});

			async function transfer(from, to){
				await hookOperatorContract.setOverBalanceLimitHolder(to, IS_OVER_BALANCE_LIMIT_HOLDER, {from: OWNER});

				await icoTokenContract.mint(from, INITIAL_TOKENS_AMOUNT, {from: OWNER});
				await icoTokenContract.transfer(to, INITIAL_TOKENS_AMOUNT, {from: from});
			
				let fromBalance = await icoTokenContract.balanceOf(from);
				let toBalance = await icoTokenContract.balanceOf(to);

				assert.bigNumberEQNumber(fromBalance, 0);
				assert.bigNumberEQNumber(toBalance, INITIAL_TOKENS_AMOUNT);
			}

			it('should not transfer tokens if "To" parameter is invalid address', async () => {
				await expectThrow(
					icoTokenContract.transfer("0x0", INITIAL_TOKENS_AMOUNT, {from: OWNER})
				);
			});

		});

		describe('Transfer From', () => {

			beforeEach(async () => {
				await ProjectInitializator.createVerifiedUsers(OWNER, [OWNER, POOL_ADDRESS]);
				await ProjectInitializator.createExchangedUsers(OWNER, [USER_ONE, USER_TWO]);

				await icoTokenContract.mint(OWNER, INITIAL_TOKENS_AMOUNT, {from: OWNER});
				await icoTokenContract.mint(USER_ONE, INITIAL_TOKENS_AMOUNT, {from: OWNER});

				await icoTokenContract.approve(POOL_ADDRESS, INITIAL_TOKENS_AMOUNT, {from: OWNER});
				await icoTokenContract.approve(USER_TWO, INITIAL_TOKENS_AMOUNT, {from: USER_ONE});
			});

			it('should transfer tokens from exchange user to kyc one', async () => {
				await processTransferFrom(USER_ONE, POOL_ADDRESS, USER_TWO);
			});

			it('should transfer tokens from exchange user to exchange one', async () => {
				await processTransferFrom(USER_ONE, USER_TWO, USER_TWO);
			});

			it('should transfer tokens from kyc user to exchange one', async () => {
				await processTransferFrom(OWNER, USER_TWO, POOL_ADDRESS);
			});

			it('should transfer tokens from kyc user to kyc one', async () => {
				await processTransferFrom(OWNER, POOL_ADDRESS, POOL_ADDRESS);
			});

			async function processTransferFrom(from, to, transferCaller){
				await hookOperatorContract.setOverBalanceLimitHolder(to, IS_OVER_BALANCE_LIMIT_HOLDER, {from: OWNER});

				await icoTokenContract.transferFrom(from, to, INITIAL_TOKENS_AMOUNT, {from: transferCaller});
	 
				let fromBalance = await icoTokenContract.balanceOf(from);
				let toBalance = await icoTokenContract.balanceOf(to);
	
				assert.bigNumberEQNumber(fromBalance, 0);
				assert.bigNumberEQNumber(toBalance, INITIAL_TOKENS_AMOUNT);
			}

			it('should not transfer tokens from if "From" parameter is invalid address', async () => {
				await expectThrow(
					icoTokenContract.transferFrom("0x0", POOL_ADDRESS, INITIAL_TOKENS_AMOUNT, {from: OWNER})
				);
			});

			it('should not transfer tokens from if "To" parameter is invalid address ', async () => {
				await expectThrow(
					icoTokenContract.transferFrom(OWNER, "0x0", INITIAL_TOKENS_AMOUNT, {from: OWNER})
				);
			});

		});
		
		describe('Burn', () => {

			beforeEach(async () => {
				await ProjectInitializator.createVerifiedUsers(OWNER, [OWNER]);
				await icoTokenContract.mint(OWNER, INITIAL_TOKENS_AMOUNT, {from: OWNER});
			})

			it('should process tokens burn', async () => {
				let ownerBalanceBeforeBurn = await icoTokenContract.balanceOf(OWNER, {from: OWNER});
				let totalSupplyBeforeBurn = await icoTokenContract.totalSupply();
				
				await icoTokenContract.burn(INITIAL_TOKENS_AMOUNT, {from: OWNER});

				let ownerBalanceAfterBurn = await icoTokenContract.balanceOf(OWNER, {from: OWNER});
				let totalSupplyAfterBurn = await icoTokenContract.totalSupply();

				assert.bigNumberEQNumber(ownerBalanceBeforeBurn, INITIAL_TOKENS_AMOUNT);
				assert.bigNumberEQNumber(ownerBalanceAfterBurn, 0);

				assert.bigNumberEQNumber(totalSupplyBeforeBurn, INITIAL_TOKENS_AMOUNT);
				assert.bigNumberEQNumber(totalSupplyAfterBurn, 0);
			});
		});

		describe('Transfer Over Balance Funds', () => {
			let tokenInstance;

			const OVER_BALANCE_HOLDER = accounts[6];
										   
			const RATE = 135000; // 135 rate
			const MIN_WEI_AMOUNT = 1000;

			const INITIAL_TOKENS_AMOUNT = new BigNumber('2000123456789123456789'); // 2000.23456789123456789 tokens / The limit is 1 600
			const TOTAL_SUPPLY = new BigNumber('77999876543210876543211'); // Total supply + initial tokens = total supply of 80000 tokens
	
			const BALANCE_PERCENTAGE_LIMIT = 2; // A user can have to 2% from the total supply(1 600)
	
			const MAX_USER_BALANCE = 1600 * WEI_IN_ETHER; // It is calculated as follow: (TOTAL_SUPPLY * BALANCE_PERCENTAGE_LIMIT) / 100

			/*
				We have ~ 2 000.23 tokens and the balance limit is 1 600
				That means that the tokens amount which will be refunded to us is: 2 000.23 - 1 600

			*/
			const REFUNDED_TOKENS = new BigNumber('400123456789123456789'); // 400.123456789123456789 tokens

			/*
				135 tokens = 1 eth (Rate)
				Ethers, which will be refunded to user are calculated as follow: REFUNDED_TOKENS / (RATE * MIN_WEI_AMOUNT) + 1
				Because division in ethereum rounds down the result we add "+ 1"
			*/							 
			const REFUNDED_ETHERS = (REFUNDED_TOKENS.div(RATE)).multipliedBy(MIN_WEI_AMOUNT).plus(1).toFixed(0, 1); // 2.963877457697210792 ethers

			beforeEach(async () => {
				let exchangeOracleInstance = contracts.exchangeOracleContract;
				await exchangeOracleInstance.setRate(RATE, {from: OWNER});

				hookOperatorContract = contracts.hookOperatorContract;
				let userFactoryContract = contracts.userFactoryContract;
	
				await hookOperatorContract.setBalancePercentageLimit(BALANCE_PERCENTAGE_LIMIT, {from: OWNER});
				await hookOperatorContract.setOverBalanceLimitHolder(OVER_BALANCE_HOLDER, IS_OVER_BALANCE_LIMIT_HOLDER, {from: OWNER});
				await hookOperatorContract.setICOToken(icoTokenContract.address, {from: OWNER});

				await icoTokenContract.setHookOperator(hookOperatorContract.address, {from: OWNER});
				await icoTokenContract.setExchangeOracle(exchangeOracleInstance.address, {from: OWNER});
				await icoTokenContract.setRefunder(OWNER, {from: OWNER});

				await ProjectInitializator.createVerifiedUsers(OWNER, [OVER_BALANCE_HOLDER]);
				await icoTokenContract.mint(OVER_BALANCE_HOLDER, TOTAL_SUPPLY.toString(10), {from: OWNER});
			});

			it('should refund ethers to a kyc user if his tokens balance is over the limit', async () => {
				await ProjectInitializator.createVerifiedUsers(OWNER, [USER_ONE]);
				await icoTokenContract.mint(USER_ONE, INITIAL_TOKENS_AMOUNT.toString(10), {from: OWNER});
				
				await transferOverBalance(USER_ONE);
			});
	
			it('should refund ethers to an exchange user if his tokens balance is over the limit', async () => {
				await ProjectInitializator.createExchangedUsers(OWNER, [USER_ONE]);
				await icoTokenContract.mint(USER_ONE, INITIAL_TOKENS_AMOUNT.toString(10), {from: OWNER});

				await transferOverBalance(USER_ONE);
			});

			async function transferOverBalance(overBalancer){
				let userETHBalanceBeforeTransfer = await web3.eth.getBalance(overBalancer);
				
				await icoTokenContract.transferOverBalanceFunds(overBalancer, OVER_BALANCE_HOLDER, RATE, {value: REFUNDED_ETHERS, from: OWNER});
	
				let userETHBalanceAfterTransfer = await web3.eth.getBalance(overBalancer);
	
				let userTokensBalance = await icoTokenContract.balanceOf(overBalancer);
				let holderTokensBalance = await icoTokenContract.balanceOf(OVER_BALANCE_HOLDER);

				assert.bigNumberEQbigNumber(userETHBalanceBeforeTransfer, userETHBalanceAfterTransfer.minus(REFUNDED_ETHERS));
				assert.bigNumberEQNumber(userTokensBalance, MAX_USER_BALANCE);
				assert.bigNumberEQNumber(holderTokensBalance, TOTAL_SUPPLY.plus(REFUNDED_TOKENS));
			}

			it('should throw if tokens holder is over balance limit holder', async () => {
				await expectThrow(
					icoTokenContract.transferOverBalanceFunds(OVER_BALANCE_HOLDER, USER_ONE, RATE, {value: REFUNDED_ETHERS, from: OWNER})
				);
			});

			it('should throw if tokens holder balance is in the limit', async () => {
				await expectThrow(
					icoTokenContract.transferOverBalanceFunds(USER_TWO, OVER_BALANCE_HOLDER, RATE, {value: REFUNDED_ETHERS, from: OWNER})
				);
			});

			it('should throw if tokens receiver balance will go beyond the limit', async () => {
				const USER_TWO_INITIAL_TOKENS = 1300 * WEI_IN_TOKEN; // 1 300 tokens / balance limit is max 1 600 tokens per user
				await ProjectInitializator.createExchangedUsers(OWNER, [USER_TWO]);

				await icoTokenContract.mint(USER_TWO, USER_TWO_INITIAL_TOKENS, {from: OWNER});

				await expectThrow(
					icoTokenContract.transferOverBalanceFunds(USER_TWO, USER_TWO, RATE, {value: REFUNDED_ETHERS, from: OWNER})
				);
			});

			it('should throw if ethers which we send for refund is not equal to the calculated', async () => {
				let lessEthersSend = "3999999999999999999"; // 400 ethers - 1 wei

				await expectThrow(
					icoTokenContract.transferOverBalanceFunds(USER_ONE, OVER_BALANCE_HOLDER, RATE, {value: lessEthersSend, from: OWNER})
				);
			});

			it('should throw if non-refunder try to refund over balance', async () => {
				await expectThrow(
					icoTokenContract.transferOverBalanceFunds(USER_ONE, OVER_BALANCE_HOLDER, RATE, {value: REFUNDED_ETHERS, from: NOT_OWNER})
				);
			});

			it('should throw if input from address is invalid', async () => {
				await expectThrow(
					icoTokenContract.transferOverBalanceFunds("0x0", OVER_BALANCE_HOLDER, RATE, {value: REFUNDED_ETHERS, from: OWNER})
				);
			});

			it('should throw if input to address is invalid', async () => {
				await expectThrow(
					icoTokenContract.transferOverBalanceFunds(USER_ONE, "0x0", RATE, {value: REFUNDED_ETHERS, from: OWNER})
				);
			});

			it('should throw if input rate is bigger than 1/2 of the oracle rate', async () => {
				let invalidRate = RATE * 2
				await expectThrow(
					icoTokenContract.transferOverBalanceFunds(USER_ONE, OVER_BALANCE_HOLDER, invalidRate, {value: REFUNDED_ETHERS, from: OWNER})
				);
			});

		});
	});

	describe('Taxation', () => {

		const TAXABLE_USERS = [ USER_ONE, USER_TWO ];

		beforeEach(async () =>{
			icoTokenContract = await ICOTokenExtended.new({from: OWNER});

			hookOperatorContract = await TestHookOperator.new({from: OWNER});
			await hookOperatorContract.setICOToken(icoTokenContract.address);

			await icoTokenContract.setHookOperator(hookOperatorContract.address);

			await mintToTaxableUsers();
		});

		async function mintToTaxableUsers(){

			for (let i = 0; i < TAXABLE_USERS.length; i++) {
				await icoTokenContract.mint(TAXABLE_USERS[i], INITIAL_TOKENS_AMOUNT, {from: OWNER});
			}
		}

		it('should process taxTransfer successfully', async () => {
			await hookOperatorContract.runTaxation(TAXABLE_USERS, TAX_AMOUNT, POOL_ADDRESS, {from: OWNER});		

			let poolBalance = await icoTokenContract.balanceOf(POOL_ADDRESS, {from: OWNER});

			let userOneBalance = await icoTokenContract.balanceOf(USER_ONE, {from: OWNER});
			let userTwoBalance = await icoTokenContract.balanceOf(USER_TWO, {from: OWNER});

			assert.bigNumberEQNumber(poolBalance, TAX_AMOUNT * TAXABLE_USERS.length);
			assert.bigNumberEQNumber(userOneBalance, INITIAL_TOKENS_AMOUNT - TAX_AMOUNT);
			assert.bigNumberEQNumber(userTwoBalance, INITIAL_TOKENS_AMOUNT - TAX_AMOUNT);
		});	

		it('should not process taxTransfer if the method caller is not the hook operator', async () => {
			await expectThrow(
				icoTokenContract.taxTransfer(USER_ONE, POOL_ADDRESS, TAX_AMOUNT, {from: NOT_OWNER})
			);
		});

		it('should not process taxTransfer if "from" parameter is an invalid address', async () => {
			await expectThrow(
				hookOperatorContract.runTaxation([ "0x0" ], TAX_AMOUNT, POOL_ADDRESS, {from: OWNER})
			);
		});

		it('should not process taxTransfer if "to" parameter is an invalid address', async () => {
			await expectThrow(
				hookOperatorContract.runTaxation(TAXABLE_USERS, TAX_AMOUNT, "0x0", {from: OWNER})
			);
		});

		it('should not process taxTransfer if the taxable users tokens are less than the tax price', async () => {
			let overPricedTax = TAX_AMOUNT * 50;

			await expectThrow(
				hookOperatorContract.runTaxation(TAXABLE_USERS, overPricedTax, POOL_ADDRESS, {from: OWNER})
			);
		});
	});
});