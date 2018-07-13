const ICOCrowdsale = artifacts.require("./InitialCoinOffering/ICOCrowdsale.sol");
const ICOToken = artifacts.require("./InitialCoinOffering/ICOTokenExtended.sol");

const IUserContract = artifacts.require("./../User/IUserContract.sol");

const ProjectInitializator = require("./../ProjectInitializator");

const expectThrow = require('./../util').expectThrow;
const timeTravel = require('./../util').timeTravel;
const web3FutureTime = require('./../util').web3FutureTime;
const web3Now = require('./../util').web3Now;
require('./../assertExtensions');

contract('ICOCrowdsale', function (accounts) {

	let crowdsaleInstance;
	let startTime;
	let endTime;

	const WEI_IN_ETHER = 1000000000000000000;

	const OWNER = accounts[0];
	const USER_ONE = accounts[1];
	const LISTER = accounts[2];
	const NOT_OWNER = accounts[3];
	const WALLET = accounts[4];

	const DAY = 24 * 60 * 60;
	const WEEK = 7 * DAY;
	const CROWDSALE_DURATION = 11 * WEEK;
	const DEFAULT_PRESALES_DURATION = 7 * WEEK;

	const REGULAR_RATE = 100;
	const PRESALES_SPECIAL_USERS_RATE = 150 // 50% bonus
	const PUBLICSALES_SPECIAL_USERS_RATE = 120; // 20% bonus
	const PUBLICSALES_1_PERIOD_RATE = 115; // 15% bonus
	const PUBLICSALES_2_PERIOD_RATE = 110; // 10% bonus
	const PUBLICSALES_3_PERIOD_RATE = 105; // 5% bonus

	let contracts;
	let hookOperatorAddress;

	async function initHookOperator(){
		contracts = await ProjectInitializator.initWithAddress(OWNER);
		let hookOperatorContract = contracts.hookOperatorContract;

		return hookOperatorContract;
	}

	describe("Initializing Crowsale", () => {

		beforeEach(async function() {
			let hookOperatorContract = await initHookOperator();
			hookOperatorAddress = hookOperatorContract.address;
		});

		it("should set initial values correctly", async function () {
			await timeTravel(web3, DAY);
			startTime = web3FutureTime(web3);
			endTime = startTime + CROWDSALE_DURATION;

			crowdsaleInstance = await ICOCrowdsale.new(startTime, endTime, WALLET, hookOperatorAddress, {
				from: OWNER
			});

			let crowdsaleStartTime = await crowdsaleInstance.startTime.call();
			let crowdsaleEndTime = await crowdsaleInstance.endTime.call();
			let crowdsaleRate = await crowdsaleInstance.rate.call();
			let crowdsaleWallet = await crowdsaleInstance.wallet.call();
			let crowdsaleOwner = await crowdsaleInstance.owner.call();
			let tokenAddress = await crowdsaleInstance.token.call();
			let tokenInstance = await ICOToken.at(tokenAddress);
			let tokenOwner = await tokenInstance.owner.call();
			let tokenHookOperatorAddress = await tokenInstance.hookOperator.call();

			assert(crowdsaleStartTime.eq(startTime), "The start time is incorrect");
			assert(crowdsaleEndTime.eq(endTime), "The end time is incorrect");
			assert(crowdsaleRate.eq(REGULAR_RATE), "The rate is incorrect");
			assert.strictEqual(WALLET, crowdsaleWallet, "The start time is incorrect");
			assert.strictEqual(OWNER, crowdsaleOwner, "The expected owner is not set");
			assert.strictEqual(tokenOwner, crowdsaleInstance.address, "Token owner is incorrect");
			assert.strictEqual(tokenHookOperatorAddress, hookOperatorAddress, "Hook Operator address is not set correctly in token contract");

			assert(tokenAddress.length > 0, "Token length is 0");
			assert(tokenAddress != "0x0");
		});
	});

	describe('Ownership', () => {
		
		let NEW_OWNER = accounts[4];

		beforeEach(async () => {
			let hookOperatorContract = await initHookOperator();

			hookOperatorAddress = hookOperatorContract.address;

			startTime = web3FutureTime(web3);
			endTime = startTime + CROWDSALE_DURATION;

			crowdsaleInstance = await ICOCrowdsale.new(startTime, endTime, WALLET, hookOperatorAddress, {
				from: OWNER
			});
		});

		it('should transfer ownership successfuly', async () => {
			await crowdsaleInstance.transferOwnership(NEW_OWNER, {from: OWNER});
			let crowdsaleOwner = await crowdsaleInstance.owner.call();

			assert.strictEqual(NEW_OWNER, crowdsaleOwner, "Ownership is not transfered");
		});

		it('should not transfer ownership if the method caller is not the owner', async () => {
			await expectThrow(
				crowdsaleInstance.transferOwnership(NEW_OWNER, {from: NOT_OWNER})
			);
		});

		it('should not transfer ownership if new owner\'s address is invalid', async () => {
			await expectThrow(
				crowdsaleInstance.transferOwnership("0x0", {from: OWNER})
			);
		});
	});

	describe('Set User Manager Contract', () => {

		let userManagerInstance;

		beforeEach(async function() {
			let hookOperatorContract = await initHookOperator();
			hookOperatorAddress = hookOperatorContract.address;

			userManagerInstance = await ProjectInitializator.initUserManager(OWNER);

			await timeTravel(web3, DAY);
			startTime = web3FutureTime(web3);
			endTime = startTime + CROWDSALE_DURATION;

			crowdsaleInstance = await ICOCrowdsale.new(startTime, endTime, WALLET, hookOperatorAddress, {
				from: OWNER
			});
		});

		it('should set user manager contract correctly', async () => {
			await crowdsaleInstance.setUserManagerContract(userManagerInstance.address);
			
			userManagerContract = await crowdsaleInstance.userManagerContract.call();

			assert.equal(userManagerContract, userManagerInstance.address, "User manager contract is not set correctly");
		});

		it('should throw if non-owner try to set user manager contract', async () => {
			await expectThrow(
				crowdsaleInstance.setUserManagerContract(userManagerInstance.address, {from: NOT_OWNER})
			);
		});

		it('should throw if user manager contract input address is invalid', async () => {
			await expectThrow(
				crowdsaleInstance.setUserManagerContract("0x0", {from: OWNER})
			);
		});
	});

	async function prepareCrowdsale(){
		let hookOperatorContract = await initHookOperator();
		hookOperatorAddress = hookOperatorContract.address;

		let userManager = contracts.userManagerContract;

		startTime = web3FutureTime(web3);
		endTime = startTime + CROWDSALE_DURATION;			

		let crowdsaleContract = await ICOCrowdsale.new(startTime, endTime, WALLET, hookOperatorAddress, {
			from: OWNER
		});

		await crowdsaleContract.setLister(LISTER, {from: OWNER});

		let crowdsaleTokenAddress = await crowdsaleContract.token.call();
		let crowdsaleToken = await ICOToken.at(crowdsaleTokenAddress);

		await hookOperatorContract.setICOToken(crowdsaleTokenAddress, {from: OWNER});
		
		await crowdsaleContract.setUserManagerContract(userManager.address);
		await userManager.setCrowdsaleContract(crowdsaleContract.address);

		await timeTravel(web3, DAY);

		return {
			crowdsaleContract, 
			crowdsaleToken
		}
	}

	describe("Token Creation", () => {

		let tokenInstance;
		const TOKEN_NAME = "AIUR Token";
		const TOKEN_SYMBOL = "AIUR";
		const TOKEN_DECIMALS = 18;

		beforeEach(async function () {
			let preparedCrowdsale = await prepareCrowdsale();

			crowdsaleInstance = preparedCrowdsale.crowdsaleContract;
			tokenInstance = preparedCrowdsale.crowdsaleToken;
		});

		it("should create the token with correct name", async function () {
			let tokenName = await tokenInstance.name.call();

			assert.strictEqual(TOKEN_NAME, tokenName, "The token is with incorrect name");
		});

		it("should create the token with correct symbol", async function () {
			let tokenSymbol = await tokenInstance.symbol.call();

			assert.strictEqual(TOKEN_SYMBOL, tokenSymbol, "The token is with incorrect symbol");
		});

		it("should create the token with correct decimals amount", async function () {
			let tokenDecimals = await tokenInstance.decimals.call();

			assert(tokenDecimals.eq(TOKEN_DECIMALS), "The token is with incorrect decimals amount");
		});

		it("should create the token paused", async function () {
			let paused = await tokenInstance.paused.call();

			assert.isTrue(paused, "The token was not created paused");
		});

		it("should create the token owned by the crowdsale", async function () {
			let OWNER = await tokenInstance.owner.call();

			assert.equal(OWNER, crowdsaleInstance.address, "The token was with the crowdsale as owner");
		});

		it('should create the token with correcly set hook operator', async () => {
			let tokenHookOperator = await tokenInstance.hookOperator.call();

			assert.equal(hookOperatorAddress, tokenHookOperator, "Hook operator is not set correctly");
		});
	});

	describe("Crowdsale Periods", () => {
		let tokenInstance;

		beforeEach(async function () {
			let preparedCrowdsale = await prepareCrowdsale();

			crowdsaleInstance = preparedCrowdsale.crowdsaleContract;
			tokenInstance = preparedCrowdsale.crowdsaleToken;

			await ProjectInitializator.createVerifiedUsers(OWNER, [USER_ONE]);
		});

		it('should extend presales period with a week', async () => {
			let presalesEndBeforeExtension = await crowdsaleInstance.preSalesEndDate.call();
			await crowdsaleInstance.extendPreSalesPeriodWith(WEEK, {from: OWNER});
			let presalesEndAfterExtension = await crowdsaleInstance.preSalesEndDate.call();

			assert.bigNumberEQbigNumber(presalesEndBeforeExtension, presalesEndAfterExtension.minus(WEEK));
		});

		it('should buy tokens on presales rate when extending presales period', async () => {
			const weiSent = 1 * WEI_IN_ETHER;
			
			await crowdsaleInstance.extendPreSalesPeriodWith(WEEK, {from: OWNER});
			
			await timeTravel(web3, DEFAULT_PRESALES_DURATION + DAY);

			await crowdsaleInstance.buyTokens(USER_ONE, {
				value: weiSent,
				from: USER_ONE
			});

			let userOneBalance = await tokenInstance.balanceOf.call(USER_ONE);

			assert.bigNumberEQNumber(userOneBalance, REGULAR_RATE * weiSent);
		});

		it('should throw on try to extend presales period with more than 12 weeks', async () => {
			await expectThrow(
				crowdsaleInstance.extendPreSalesPeriodWith(WEEK * 13, {from: OWNER})
			);
		});

		it('should throw if non-owner thy to extend presales period', async () => {
			await expectThrow(
				crowdsaleInstance.extendPreSalesPeriodWith(WEEK, {from: NOT_OWNER})
			);
		});

		it("should convert to presales period regular rate", async function () {
			const weiSent = 1 * WEI_IN_ETHER;

			await crowdsaleInstance.buyTokens(USER_ONE, {
				value: weiSent,
				from: USER_ONE
			});

			let userOneBalance = await tokenInstance.balanceOf.call(USER_ONE);

			assert.bigNumberEQNumber(userOneBalance, REGULAR_RATE * weiSent);
		});

		it("should convert to presales period whitelist rate", async function () {
			const weiSent = 1 * WEI_IN_ETHER;

			await crowdsaleInstance.setPreSalesSpecialUser(USER_ONE, PRESALES_SPECIAL_USERS_RATE, {from: LISTER});

			await crowdsaleInstance.buyTokens(USER_ONE, {
				value: weiSent,
				from: USER_ONE
			})

			let userOneBalance = await tokenInstance.balanceOf.call(USER_ONE);

			assert.bigNumberEQNumber(userOneBalance, PRESALES_SPECIAL_USERS_RATE * weiSent);
		});

		it('should convert to publicsales 1 period if reach presales maximum funds raised', async () => {
			let weiSent = 4000 * WEI_IN_ETHER; // max ethers for max tokens

			/*
				Presales maximum funds raised is 20 000eth
				Maximum ethers amount that a user can send to buy tokens is 4 000eth
				Users count for reaching presales maximum funds raised: 20 000 / 4 000 = 5
			*/
			let users = generateUsers(5);
			await ProjectInitializator.createVerifiedUsers(OWNER, users);

			for (let i = 0; i < users.length; i++) {
				await crowdsaleInstance.buyTokens(users[i], {
					value: weiSent,
					from: OWNER
				});
			}

			let presalesEndDate = await crowdsaleInstance.preSalesEndDate.call();
			assert.isTrue(presalesEndDate == web3Now(web3));

			weiSent = 1 * WEI_IN_ETHER;
			/*
				Buy tokens after the presales maximum funds raised reach 
			*/
			await crowdsaleInstance.buyTokens(USER_ONE, {
				value: weiSent,
				from: USER_ONE
			});

			let userOneBalance = await tokenInstance.balanceOf.call(USER_ONE);

			assert.bigNumberEQNumber(userOneBalance, PUBLICSALES_1_PERIOD_RATE * weiSent);
		});

		function generateUsers(usersCount){
			let users = [];

			for (let i = 1; i <= usersCount; i++) {
				/* 
					The check usage:
					 When we have i = 1, the generated solidity address is 0x1 => 1
					 When we have i = 10, the generated solidity address is 0x10 => 
					 We need to generate unique addresses. When i % 10 == 0, that means the address is already generated one
				 */
				if(i % 10 != 0) {
					users.push(`0x${i}`);
				}
			}

			return users;
		}

		it("should convert to publicsales period invite-only rate", async function () {
			await timeTravel(web3, DEFAULT_PRESALES_DURATION); // 3 WEEK - end of the presale period and beginning of the publicsale
			const weiSent = 1 * WEI_IN_ETHER;

			await crowdsaleInstance.addPublicSalesSpecialUser(USER_ONE, {from: LISTER});

			await crowdsaleInstance.buyTokens(USER_ONE, {
				value: weiSent,
				from: USER_ONE
			});

			let userOneBalance = await tokenInstance.balanceOf.call(USER_ONE);

			assert.bigNumberEQNumber(userOneBalance, PUBLICSALES_SPECIAL_USERS_RATE * weiSent);
		});

		it("should convert to publicsales first period rate", async function () {
			await timeTravel(web3, DEFAULT_PRESALES_DURATION); // the first week of publicsale period - end of the presale period and beginning of the publicsale
			const weiSent = 1 * WEI_IN_ETHER;

			await crowdsaleInstance.buyTokens(USER_ONE, {
				value: weiSent,
				from: USER_ONE
			});

			let userOneBalance = await tokenInstance.balanceOf.call(USER_ONE);

			assert.bigNumberEQNumber(userOneBalance, PUBLICSALES_1_PERIOD_RATE * weiSent);
		});

		it("should convert to publicsales second period rate", async function () {
			await timeTravel(web3, DEFAULT_PRESALES_DURATION + WEEK); // the second week of publicsale period
			const weiSent = 1 * WEI_IN_ETHER;

			await crowdsaleInstance.buyTokens(USER_ONE, {
				value: weiSent,
				from: USER_ONE
			});

			let userOneBalance = await tokenInstance.balanceOf.call(USER_ONE);

			assert.bigNumberEQNumber(userOneBalance, PUBLICSALES_2_PERIOD_RATE * weiSent);
		})

		it("should convert to publicsales third period rate", async function () {
			await timeTravel(web3, DEFAULT_PRESALES_DURATION + (2 * WEEK)); // the third week of publicsale period
			const weiSent = 1 * WEI_IN_ETHER;

			await crowdsaleInstance.buyTokens(USER_ONE, {
				value: weiSent,
				from: USER_ONE
			});

			let userOneBalance = await tokenInstance.balanceOf.call(USER_ONE);

			assert.bigNumberEQNumber(userOneBalance, PUBLICSALES_3_PERIOD_RATE * weiSent);
		});
		
		it("should convert to regular rate", async function () {
			await timeTravel(web3, DEFAULT_PRESALES_DURATION + (3 * WEEK)); // the fourth week of publicsale period
			const weiSent = 1 * WEI_IN_ETHER;

			await crowdsaleInstance.buyTokens(USER_ONE, {
				value: weiSent,
				from: USER_ONE
			})

			let userOneBalance = await tokenInstance.balanceOf.call(USER_ONE);

			assert.bigNumberEQNumber(userOneBalance, REGULAR_RATE * weiSent);
		});
	});

	describe('Buy Tokens', () => {

		let tokenInstance;
		const WEI_SENT = 10 * WEI_IN_ETHER; // 10 ethers
		const MIN_WEI_AMOUNT = 0.05 * WEI_IN_ETHER; // 0.05 eth = 5 tokens
		const WHITELIST_RATE = 130;

		beforeEach(async function () {
			let preparedCrowdsale = await prepareCrowdsale();

			crowdsaleInstance = preparedCrowdsale.crowdsaleContract;
			tokenInstance = preparedCrowdsale.crowdsaleToken;

			await ProjectInitializator.createVerifiedUsers(OWNER, [USER_ONE, OWNER]);
		});

		it('should process tokens purchase from non-whitelisted address to himself', async () => {
			let ownerBalanceBeforeBuy = await tokenInstance.balanceOf.call(OWNER);

			await crowdsaleInstance.buyTokens(OWNER, {
				value: WEI_SENT,
				from: OWNER
			});

			let ownerOneBalanceAfterBuy = await tokenInstance.balanceOf.call(OWNER);
		
			assert.bigNumberEQbigNumber(ownerBalanceBeforeBuy, ownerOneBalanceAfterBuy.minus(REGULAR_RATE * WEI_SENT));			
		});

		it('should process tokens purchase from whitelisted address to himself', async () => {
			await crowdsaleInstance.setLister(OWNER, {from: OWNER});
			await crowdsaleInstance.setPreSalesSpecialUser(USER_ONE, WHITELIST_RATE, {from: OWNER});

			let userOneBalanceBeforeBuy = await tokenInstance.balanceOf.call(USER_ONE);

			await crowdsaleInstance.buyTokens(USER_ONE, {
				value: WEI_SENT,
				from: USER_ONE
			});

			let userOneBalanceAfterBuy = await tokenInstance.balanceOf.call(USER_ONE);
		
			assert.bigNumberEQbigNumber(userOneBalanceBeforeBuy, userOneBalanceAfterBuy.minus(WHITELIST_RATE * WEI_SENT));			
		});

		it('should process tokens purchase from non-whitelisted address to whitelisted one', async () => {
			await crowdsaleInstance.setLister(OWNER, {from: OWNER});
			await crowdsaleInstance.setPreSalesSpecialUser(USER_ONE, WHITELIST_RATE, {from: OWNER});

			let userOneBalanceBeforeBuy = await tokenInstance.balanceOf.call(USER_ONE);

			await crowdsaleInstance.buyTokens(USER_ONE, {
				value: WEI_SENT,
				from: OWNER
			});

			let userOneBalanceAfterBuy = await tokenInstance.balanceOf.call(USER_ONE);
		
			assert.bigNumberEQbigNumber(userOneBalanceBeforeBuy, userOneBalanceAfterBuy.minus(WHITELIST_RATE * WEI_SENT));			
		});

		it('should process tokens purchase from whitelisted address to non-whitelisted one', async () => {
			await crowdsaleInstance.setLister(OWNER, {from: OWNER});
			await crowdsaleInstance.setPreSalesSpecialUser(USER_ONE, WHITELIST_RATE, {from: OWNER});

			let ownerBalanceBeforeBuy = await tokenInstance.balanceOf.call(OWNER);

			await crowdsaleInstance.buyTokens(OWNER, {
				value: WEI_SENT,
				from: USER_ONE
			});

			let ownerOneBalanceAfterBuy = await tokenInstance.balanceOf.call(OWNER);
		
			assert.bigNumberEQbigNumber(ownerBalanceBeforeBuy, ownerOneBalanceAfterBuy.minus(REGULAR_RATE * WEI_SENT));			
		});

		it('should process tokens buying on fallback function call', async () => {
			let userOneBalanceBeforeBuy = await tokenInstance.balanceOf.call(USER_ONE);

			await crowdsaleInstance.sendTransaction({from: USER_ONE, value: WEI_SENT});

			let userOneBalanceAfterBuy = await tokenInstance.balanceOf.call(USER_ONE);
		
			assert.bigNumberEQbigNumber(userOneBalanceBeforeBuy, userOneBalanceAfterBuy.minus(REGULAR_RATE * WEI_SENT));			
		});

		it('should mark beneficiary user as a founder on tokens purchase', async () => {
			let userFactory = contracts.userFactoryContract;
			let userContractAddress = await userFactory.getUserContract(USER_ONE);
			let userContract = await IUserContract.at(userContractAddress);

			let isFounderBeforePurchase = await userContract.isFounderUser();

			await crowdsaleInstance.buyTokens(USER_ONE, {
				value: WEI_SENT,
				from: USER_ONE
			});

			let isFounderAfterPurchase = await userContract.isFounderUser();

			assert.isFalse(isFounderBeforePurchase, "User is marked as founder in advance");
			assert.isTrue(isFounderAfterPurchase, "User is not marked as founder correctly");
		});

		it('should forward buyer ethers to the wallet after the purchase', async () => {
			let walletBalanceBeforeBuy = await web3.eth.getBalance(WALLET);

			await crowdsaleInstance.buyTokens(USER_ONE, {
				value: WEI_SENT,
				from: USER_ONE
			});

			let walletBalanceAfterBuy = await await web3.eth.getBalance(WALLET);

			assert.bigNumberEQbigNumber(walletBalanceBeforeBuy, walletBalanceAfterBuy.minus(WEI_SENT));
		});

		it("should throw on wei below min amount", async function () {
			const weiSent = MIN_WEI_AMOUNT / 2;
			
			await expectThrow(
				crowdsaleInstance.buyTokens(USER_ONE, {
					value: weiSent,
					from: USER_ONE
				})
			);
		});

		it("should throw on invalid beneficiary input address", async function () {
			await expectThrow(
				crowdsaleInstance.buyTokens("0x0", {
					value: MIN_WEI_AMOUNT,
					from: USER_ONE
				})
			);
		});

		it("should throw on invalid purchase(outside the crowdsale period)", async function () {
			await timeTravel(web3, CROWDSALE_DURATION);
			
			await expectThrow(
				crowdsaleInstance.buyTokens(USER_ONE, {
					value: MIN_WEI_AMOUNT,
					from: USER_ONE
				})
			);
		});

		it('should throw when the user\'s balance is going to be over the user max tokens balance limit', async () => {
			const weiSent = 4001 * WEI_IN_ETHER; // 4 001 ethers; the tokens limit per user is 400 000

			await expectThrow(
				crowdsaleInstance.buyTokens(USER_ONE, {
					value: weiSent,
					from: USER_ONE
				})
			);
		});
	});

	describe("Bounty Token", () => {

		let tokenInstance;
		let bonusTokens = 500 * WEI_IN_ETHER;
		const EXCHANGE_USER = accounts[9];

		beforeEach(async function () {
			let preparedCrowdsale = await prepareCrowdsale();

			crowdsaleInstance = preparedCrowdsale.crowdsaleContract;
			tokenInstance = preparedCrowdsale.crowdsaleToken;

			await ProjectInitializator.createVerifiedUsers(OWNER, [USER_ONE]);
		});

		it("should give bounty tokens to kyc user", async function () {
			await giveBountyTokensTo(USER_ONE);	
		});
		
		it("should give bounty tokens to exchange user", async function () {
			await ProjectInitializator.createExchangedUsers(OWNER, [EXCHANGE_USER]);
			
			await giveBountyTokensTo(EXCHANGE_USER);		
		});

		async function giveBountyTokensTo(bountyTokensReceiver){
			await crowdsaleInstance.createBountyToken(bountyTokensReceiver, bonusTokens, {
				from: OWNER
			});

			let systemBountyTokensAmount = await crowdsaleInstance.totalMintedBountyTokens.call();
			let receiverBalance = await tokenInstance.balanceOf.call(bountyTokensReceiver);

			assert.bigNumberEQNumber(systemBountyTokensAmount, bonusTokens);
			assert.bigNumberEQNumber(receiverBalance, bonusTokens);
		}

		it('should not create bounty tokens if crowdsale event has ended', async () => {
			await timeTravel(web3, endTime + 1);

			await expectThrow(crowdsaleInstance.createBountyToken(USER_ONE, bonusTokens, {
				from: OWNER
			}));
		});

		it("should not process method call from non-owner", async function () {
			await expectThrow(crowdsaleInstance.createBountyToken(USER_ONE, bonusTokens, {
				from: NOT_OWNER
			}))
		});

		it('should not mint more bounty tokens than the limit', async () => {
			bonusTokens = 100001 * WEI_IN_ETHER; // the limit is 100 000

			await expectThrow(crowdsaleInstance.createBountyToken(USER_ONE, bonusTokens, {
				from: OWNER
			}));
		});

		it('should not exceed bounty tokens limit', async () => {
			bonusTokens = 50001 * WEI_IN_ETHER; // 50 000 tokens

			await crowdsaleInstance.createBountyToken(USER_ONE, bonusTokens, {from: OWNER});

			await expectThrow(crowdsaleInstance.createBountyToken(USER_ONE, bonusTokens, {
				from: OWNER
			}));
		});
	})

	describe('Finalization', () => {

		beforeEach(async function () {
			let preparedCrowdsale = await prepareCrowdsale();

			crowdsaleInstance = preparedCrowdsale.crowdsaleContract;
			tokenInstance = preparedCrowdsale.crowdsaleToken;

			await timeTravel(web3, endTime + DAY); // It moves the now time 1 day after the crowdsale end data
		});

		it("should transfer ownership of the token correctly", async function () {
			let initialOwner = await tokenInstance.owner.call();

			await crowdsaleInstance.finalize({from: OWNER});

			let afterOwner = await tokenInstance.owner.call();

			assert(initialOwner != afterOwner, "The owner has not changed");

			assert.equal(afterOwner, OWNER, "The owner was not set to the crowdsale OWNER");
		});

		it("should pause the token", async function () {
			await crowdsaleInstance.finalize({from: OWNER});
			
			let paused = await tokenInstance.paused.call();
			
			assert.isTrue(paused, "The token contract is unpaused");
		});

		it("should mint tokens when it is paused", async function () {
			const MINT_TOKENS_AMOUNT = "10000000000000000000"; // 10 tokens
			await crowdsaleInstance.finalize({from: OWNER});
			
			await ProjectInitializator.createVerifiedUsers(OWNER, [USER_ONE]);

			await tokenInstance.addMinter(OWNER);
			let userOneBalanceBeforeMint = await tokenInstance.balanceOf.call(USER_ONE);
			await tokenInstance.mint(USER_ONE, MINT_TOKENS_AMOUNT, {from: OWNER});
			let userOneAfterBeforeMint = await tokenInstance.balanceOf.call(USER_ONE);

			assert.bigNumberEQbigNumber(userOneBalanceBeforeMint, userOneAfterBeforeMint.minus(MINT_TOKENS_AMOUNT));
		});

	});
});