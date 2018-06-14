const RefundVault = artifacts.require("./InitialCoinOffering/CrowdsaleRefund/RefundVault.sol");
const ICOTokenExtended = artifacts.require("./InitialCoinOffering/ICOTokenExtended.sol");
const ICOCappedRefundableCrowdsale = artifacts.require("./InitialCoinOffering/ICOCappedRefundableCrowdsale.sol");

const Vesting = artifacts.require("./Vesting/Vesting.sol");

const ProjectInitializator = require("./../ProjectInitializator");

const expectThrow = require('./../util').expectThrow;
const timeTravel = require('./../util').timeTravel;
const web3FutureTime = require('./../util').web3FutureTime;
const transactionGasCost = require('./../util').getTransactionGasCost;
require('./../assertExtensions');

contract('ICOCappedRefundableCrowdsale', function (accounts) {
	let crowdsaleInstance;
	let startTime;
	let endTime;

	const WEI_IN_ETHER = 1000000000000000000; // 1 ether
	const WEI_IN_TOKEN = 1000000000000000000; // 1 token 

	const OWNER = accounts[0];
	const USER_ONE = accounts[1];
	const INVESTOR = accounts[2];
	const NOT_OWNER = accounts[3];
	const LISTER = accounts[5];

	const DAY = 24 * 60 * 60;
	const WEEK = 7 * DAY;
	const CROWDSALE_DURATION = 7 * WEEK;

	const REGULAR_RATE = 100; // 0,01 eth = 1 token
	const SPECIAL_PUBLICSALES_RATE = 120;
	

	const HARD_CAP = 80000 * WEI_IN_ETHER; // 80000 ethers
	const SOFT_CAP = 1600 * WEI_IN_ETHER; // 2% of the hard cap

	const INVESTOR_RATE = 150;

	let vaultInstance;
	let vestingInstance;

	let contracts;

	async function initHookOperator(){
		let hookOperatorInstance = await ProjectInitializator.initHookOperator(OWNER);

		return hookOperatorInstance;
	}

	async function initCrowdsale(hookOperatorAddress){
		startTime = await web3FutureTime(web3);
		endTime = startTime + CROWDSALE_DURATION;

		vestingInstance = await Vesting.new(OWNER, endTime, {from: OWNER});	
		
		let crowdsaleContract = await ICOCappedRefundableCrowdsale.new(startTime, endTime, HARD_CAP, SOFT_CAP, vestingInstance.address, hookOperatorAddress, {
			from: OWNER
		});

		await timeTravel(web3, DAY);

		return crowdsaleContract;
	}

	async function prepareCrowdsale(){
		contracts = await ProjectInitializator.initWithAddress(OWNER);

		let userManager = contracts.userManagerContract;		
		let hookOperator = contracts.hookOperatorContract;

		let crowdsaleContract = await initCrowdsale(hookOperator.address);

		let crowdsaleTokenAddress = await crowdsaleContract.token.call();

		await hookOperator.setICOToken(crowdsaleTokenAddress, {from: OWNER});

		await userManager.setCrowdsaleContract(crowdsaleContract.address);
		await crowdsaleContract.setUserManagerContract(userManager.address);

		return crowdsaleContract;
	}
	
	describe("Initializing Crowsale", () => {

		it("should set initial values correctly", async function () {
			let hookOperator = await initHookOperator();
			crowdsaleInstance = await initCrowdsale(hookOperator.address);

			let crowdsaleStartTime = await crowdsaleInstance.startTime.call();
			let crowdsaleEndTime = await crowdsaleInstance.endTime.call();
			let crowdsaleWallet = await crowdsaleInstance.wallet.call();
			let crowdsaleRate = await crowdsaleInstance.rate.call();
			let crowdsaleHardCap = await crowdsaleInstance.cap.call();
			let crowdsaleSoftCap = await crowdsaleInstance.goal.call();
			let crowdsaleOwner = await crowdsaleInstance.owner.call();
			let tokenAddress = await crowdsaleInstance.token.call();
			let tokenInstance = await ICOTokenExtended.at(tokenAddress);
			let tokenOwner = await tokenInstance.owner.call();
			let tokenHookOperatorAddress = await tokenInstance.hookOperator.call();

			assert(crowdsaleStartTime.eq(startTime), "The start time is incorrect");
			assert(crowdsaleEndTime.eq(endTime), "The end time is incorrect");
			assert(crowdsaleRate.eq(REGULAR_RATE), "The rate is incorrect");
			assert(crowdsaleHardCap.eq(HARD_CAP), "The cap is incorrect");
			assert(crowdsaleSoftCap.eq(SOFT_CAP), "The goal is incorrect");
			assert.strictEqual(OWNER, crowdsaleOwner, "The expected OWNER is not set");
			assert.strictEqual(crowdsaleWallet, vestingInstance.address, "The start time is incorrect");
			assert.strictEqual(tokenOwner, crowdsaleInstance.address, "Token owner is incorrect");
			assert.strictEqual(tokenHookOperatorAddress, hookOperator.address, "Hook Operator address is not set correctly in token contract");

			assert(tokenAddress.length > 0, "Token length is 0");
			assert(tokenAddress != "0x0");
		});

		it('should not initialize crowdsale if the hard cap is less than soft cap', async () => {

			const OVER_SOFT_CAP = HARD_CAP * 2;
			let hookOperator = await initHookOperator();

			await expectThrow(
				ICOCappedRefundableCrowdsale.new(startTime, endTime, HARD_CAP, OVER_SOFT_CAP, vestingInstance.address, hookOperator.address, {
					from: OWNER
				}));
		});
	});

	describe('Ownership', () => {

		const NEW_OWNER = accounts[6];

		beforeEach(async () => {
			let hookOperator = await initHookOperator();
			crowdsaleInstance = await initCrowdsale(hookOperator.address);
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

	describe('Whitelisting', () => {

		const INVESTORS = [
			accounts[6],
			accounts[7]
		];

		beforeEach(async () => {
			let hookOperator = await initHookOperator();
			crowdsaleInstance = await initCrowdsale(hookOperator.address);

			await crowdsaleInstance.setLister(LISTER, {from: OWNER});
		});

		it('should set lister', async () => {
			const NEW_LISTER = accounts[9];

			await crowdsaleInstance.setLister(NEW_LISTER, {from: OWNER});

			let lister = await crowdsaleInstance.lister.call();

			assert.equal(lister, NEW_LISTER, "Lister is not set successfully");
		});

		it('should throw if non-owner try to set lister', async () => {
			await expectThrow(
				crowdsaleInstance.setLister(LISTER, {from: NOT_OWNER})
			)
		});

		it('should set an investor as a presales special user', async () => {
			await crowdsaleInstance.setPreSalesSpecialUser(INVESTOR, INVESTOR_RATE, {from: LISTER});

			let investorRate = await crowdsaleInstance.preSalesSpecialUsers(INVESTOR);

			assert.bigNumberEQNumber(investorRate, INVESTOR_RATE);
		});

		it('should set multiple investors as presales specials users', async () => {
			await crowdsaleInstance.setMultiplePreSalesSpecialUsers(INVESTORS, INVESTOR_RATE, {from: LISTER});

			let firstInvestorRate = await crowdsaleInstance.preSalesSpecialUsers(INVESTORS[0]);
			let secondInvestorRate = await crowdsaleInstance.preSalesSpecialUsers(INVESTORS[1]);

			assert.bigNumberEQNumber(firstInvestorRate, INVESTOR_RATE);
			assert.bigNumberEQNumber(secondInvestorRate, INVESTOR_RATE);
		});

		it('should add an investor as a publicsales special user', async () => {
			await crowdsaleInstance.addPublicSalesSpecialUser(INVESTOR, {from: LISTER});

			let isInvestorAdded = await crowdsaleInstance.publicSalesSpecialUsers(INVESTOR);

			assert.isTrue(isInvestorAdded, SPECIAL_PUBLICSALES_RATE);
		});

		it('should remove an investor from publicsales special users list', async () => {
			await crowdsaleInstance.addPublicSalesSpecialUser(INVESTOR, {from: LISTER});
			let investorRateBeforeRemove = await crowdsaleInstance.publicSalesSpecialUsers(INVESTOR);

			await crowdsaleInstance.removePublicSalesSpecialUser(INVESTOR, {from: LISTER});
			let investorRateAfterRemove = await crowdsaleInstance.publicSalesSpecialUsers(INVESTOR);

			assert.isTrue(investorRateBeforeRemove);
			assert.isTrue(!investorRateAfterRemove);
		});

		it('should throw if non-lister try to set presales special users list', async () => {
			await expectThrow(
				crowdsaleInstance.setPreSalesSpecialUser(INVESTOR, INVESTOR_RATE, {from: NOT_OWNER})
			);

			await expectThrow(
				crowdsaleInstance.setMultiplePreSalesSpecialUsers(INVESTORS, INVESTOR_RATE, {from: NOT_OWNER})
			);
		});

		it('should throw if non-lister try to set publicsales special users list', async () => {
			await expectThrow(
				crowdsaleInstance.addPublicSalesSpecialUser(INVESTOR, {from: NOT_OWNER})
			);

			await expectThrow(
				crowdsaleInstance.removePublicSalesSpecialUser(INVESTOR, {from: NOT_OWNER})
			);
		});
	});

	describe('Token purchase', () => {

		beforeEach(async () => {
			crowdsaleInstance = await prepareCrowdsale();

			await ProjectInitializator.createVerifiedUsers(OWNER, [USER_ONE]);
		});

		it('should deposit investor\'s ethers after the purchase', async () => {
			let vault = await crowdsaleInstance.vault.call();
			vaultInstance = await RefundVault.at(vault);

			let walletBalanceBeforePurchase = await web3.eth.getBalance(vestingInstance.address);

			await crowdsaleInstance.buyTokens(USER_ONE, {
				value: WEI_IN_ETHER,
				from: USER_ONE
			});		

			let walletBalanceAfterPurchase = await web3.eth.getBalance(vestingInstance.address);
			let buyerDeposit = await vaultInstance.deposited(USER_ONE);

			assert.bigNumberEQbigNumber(walletBalanceAfterPurchase, walletBalanceBeforePurchase);

			assert.bigNumberEQNumber(buyerDeposit, WEI_IN_ETHER);
		});

		it("should throw when the purchase is outside the crowdsale period", async function () {
			const weiSent = WEI_IN_ETHER;

			await timeTravel(web3, CROWDSALE_DURATION);
			
			await expectThrow(
				crowdsaleInstance.buyTokens(USER_ONE, {
					value: weiSent,
					from: USER_ONE
				})
			);
		});

		it("should throw on the try to buy tokens when the hard cap is reached", async function () {
			const weiSent = 1390 * WEI_IN_ETHER;

			let userFactoryContract = ProjectInitializator.getContracts().userFactoryContract;


			/*
				We pass 64 in generateUsers function for the following reasons:
					1) Skipping the numbers, which mod 10 = 0 -> 6 users
					2) We are sending 1390 ethers, because when we reach 9000 ethers, 
						the crowsale converts to public sales period and the rate grows to 115. 
						That means 1 600 ethers is the max amount of ethers(100 rate) we can send for 2% of the hard cap.
						When the rate grows up to 115, the max amount of ethers we can send is ~1390
						For the first N users whose reach 9000eth, we can send to 1600 eth, for the rest - 1390
			*/
			let users = await generateUsers(64);
			await ProjectInitializator.createVerifiedUsers(OWNER, users);

			// Reach hard cap
			for (let i = 0; i < users.length; i++) {
				await crowdsaleInstance.buyTokens(users[i], {
					value: weiSent,
					from: OWNER
				});		
			}

			await expectThrow(
				crowdsaleInstance.buyTokens(USER_ONE, {
					value: weiSent,
					from: USER_ONE
				})
			);
		});
		
		async function generateUsers(usersCount){

			let users = [];

			for (let i = 1; i < usersCount; i++) {
				/* 
					The check usage:
					 When we have i = 1, the generated solidity address is 0x1 => 1
					 When we have i = 10, the generated solidity address is 0x10 => 1
					 We need to generate unique addresses. When i % 10 == 0, that means the address is already generated one
				 */
				if(i % 10 != 0) {
					users.push(`0x${i}`);
					// await purchaseCallback(`0x${i}`);
				}
			}

			return users;
		}
	});

	describe('Refundability', () => {

		const INVESTOR_CONTRIBUTION = WEI_IN_ETHER * 5; // 5 ethers
		const DEDUCTION = 3; // 3% from investor's contribution
		const DEDUCTED_VALUE = (INVESTOR_CONTRIBUTION * 3) / 100;
		const REFUNDS_WHIT_DEDUCTED_VALUE = INVESTOR_CONTRIBUTION - DEDUCTED_VALUE;
		
		beforeEach(async () => {
			crowdsaleInstance = await prepareCrowdsale();

			await ProjectInitializator.createVerifiedUsers(OWNER, [INVESTOR, USER_ONE]);

			await crowdsaleInstance.buyTokens(INVESTOR, {from: INVESTOR, value: INVESTOR_CONTRIBUTION});
		});
	
		it('should refund after the end if the soft cap is not reached', async () => {
			timeTravel(web3, CROWDSALE_DURATION);

			await crowdsaleInstance.finalize({from: OWNER});

			let investorBalanceBeforeClaim = await web3.eth.getBalance(INVESTOR);

			let claimTx = await crowdsaleInstance.claimRefund({from: INVESTOR});
			let claimTxGasCost = await transactionGasCost(claimTx['tx']);

			let investorBalanceAfterClaim = await web3.eth.getBalance(INVESTOR);
			let investorBalanceAfterClaimWithDeduction = investorBalanceAfterClaim.minus(REFUNDS_WHIT_DEDUCTED_VALUE);

			assert.bigNumberEQbigNumber(investorBalanceBeforeClaim, investorBalanceAfterClaimWithDeduction.plus(claimTxGasCost));
		});

		it('should not get refunds twice', async () => {
			await timeTravel(web3, CROWDSALE_DURATION);

			await crowdsaleInstance.finalize({from: OWNER});
			await crowdsaleInstance.claimRefund({from: INVESTOR});

			let investorBalanceBeforeSecondClaim = await web3.eth.getBalance(INVESTOR);
			
			let secondClaimTx = await crowdsaleInstance.claimRefund({from: INVESTOR});
			let secondClaimGasCost = await transactionGasCost(secondClaimTx['tx']);

			let investorBalanceAfterClaim = await web3.eth.getBalance(INVESTOR);

			assert.bigNumberEQbigNumber(investorBalanceBeforeSecondClaim, investorBalanceAfterClaim.plus(secondClaimGasCost));
		});
	
		it('should throw if trying to refund when crowdsale is not finalized', async () => {
			await expectThrow(
				crowdsaleInstance.claimRefund({from: INVESTOR})
			);
		});
	
		it('should throw if trying to refund after the end when soft cap is reached', async () => {
			await crowdsaleInstance.buyTokens(USER_ONE, {from: USER_ONE, value: SOFT_CAP});
			
			timeTravel(web3, CROWDSALE_DURATION);
			
			await crowdsaleInstance.finalize({from: OWNER});

			await expectThrow(
				crowdsaleInstance.claimRefund({from: USER_ONE})
			);
		});
		
	});

	describe('Finalization', () => {

		const STATE = {
			Refunding: 1,
			Close: 2
		}

		beforeEach(async function () {
			crowdsaleInstance = await prepareCrowdsale();

			let vault = await crowdsaleInstance.vault.call();
			vaultInstance = await RefundVault.at(vault);
		});

		describe('Refund Over Deposits', () => {

			const REGULAR_RATE = 100000; // 100 rate

			const OVER_DEPOSIT_RECIPIENT = accounts[9];
			const IS_OVER_DEPOSIT_RECIPIENT = true;

			/*
				Rate = 100 [ 0.01 eth = 1 token ]
				User exchange amount = 1 600 ethers
				Total tokens supply = 1 600 * 100
				2% limit = ( Total tokens supply * 2 ) / 100 = 3 200
				Over deposit = Total tokens supply - 2% limit = 156 800
				Ethers to refund = Over deposit / rate
			*/

			const USER_ETHS_TO_EXCHANGE = 1600 * WEI_IN_ETHER;
			const USER_TOKENS_BALANCE_AFTER_REFUND = 3200 * WEI_IN_TOKEN;
			const OVER_DEPOSIT = 156800 * WEI_IN_TOKEN;  
			const ETHERS_TO_REFUND = 1568 * WEI_IN_ETHER;

			let tokenInstance;

			beforeEach(async () => {
				await ProjectInitializator.createVerifiedUsers(OWNER, [USER_ONE]);

				await crowdsaleInstance.buyTokens(USER_ONE, {
					value: USER_ETHS_TO_EXCHANGE,
					from: USER_ONE
				});

				await timeTravel(web3, CROWDSALE_DURATION);
			});

			it('should refund over deposits if soft cap is reached and crowdsale is finalized', async () => {
				await crowdsaleInstance.finalize();

				await prepareOverDepositRefund();

				await tokenInstance.setRefunder(vestingInstance.address, {from: OWNER});
				await tokenInstance.setExchangeOracle(contracts.exchangeOracleContract.address, {from: OWNER});

				let userETHBalanceBeforeRefund = await web3.eth.getBalance(USER_ONE);

				await vestingInstance.refundOverDeposits(USER_ONE, REGULAR_RATE, {from: OWNER});

				let userETHBalanceAfterRefund = await web3.eth.getBalance(USER_ONE);

				let userTokensBalance = await tokenInstance.balanceOf(USER_ONE);
				let overDepositRecipientTokensBalance = await tokenInstance.balanceOf(OVER_DEPOSIT_RECIPIENT);


				assert.bigNumberEQbigNumber(userETHBalanceBeforeRefund, userETHBalanceAfterRefund.minus(ETHERS_TO_REFUND));
				assert.bigNumberEQNumber(userTokensBalance, USER_TOKENS_BALANCE_AFTER_REFUND);
				assert.bigNumberEQNumber(overDepositRecipientTokensBalance, OVER_DEPOSIT);
			});
			
			it('should throw if try to refund deposits before crowdsale finalization', async () => {
				await prepareOverDepositRefund();

				await expectThrow(
					tokenInstance.setRefunder(vestingInstance.address, {from: OWNER})
				)

				await expectThrow(
					tokenInstance.setExchangeOracle(contracts.exchangeOracleContract.address, {from: OWNER})
				);

				await expectThrow(
					vestingInstance.refundOverDeposits(USER_ONE, REGULAR_RATE, {from: OWNER})
				);
			});

			async function prepareOverDepositRefund(){
				let tokenAddress = await crowdsaleInstance.token.call();
				tokenInstance = await ICOTokenExtended.at(tokenAddress);
				
				let hookOperatorInstance = contracts.hookOperatorContract;
				await hookOperatorInstance.setOverBalanceLimitHolder(OVER_DEPOSIT_RECIPIENT, IS_OVER_DEPOSIT_RECIPIENT, {from: OWNER});

				await vestingInstance.setTokenInstance(tokenAddress, {from: OWNER});
				await vestingInstance.setOverDepositTokensRecipient(OVER_DEPOSIT_RECIPIENT, {from: OWNER});
				await vestingInstance.setHookOperator(hookOperatorInstance.address, {from: OWNER});
			}
		});

		describe('Funds forwarding', () => {

			it("should forward the funds to the wallet if soft cap is reached", async function () {
				const weiSent = SOFT_CAP;

				await ProjectInitializator.createVerifiedUsers(OWNER, [USER_ONE]);

				await crowdsaleInstance.buyTokens(USER_ONE, {
					value: weiSent,
					from: USER_ONE
				});

				await timeTravel(web3, CROWDSALE_DURATION);
	
				const initialBalance = await web3.eth.getBalance(vestingInstance.address);
				await crowdsaleInstance.finalize({from: OWNER});
				const finalBalance = await web3.eth.getBalance(vestingInstance.address);

				let state = await vaultInstance.state.call();

				assert.bigNumberEQbigNumber(initialBalance, finalBalance.minus(SOFT_CAP));

				assert.bigNumberEQNumber(state, STATE.Close);
			});
		});

		describe('Funds claiming', () => {

			it("should allow refunding if soft cap is not reached", async function () {
				await timeTravel(web3, CROWDSALE_DURATION);

				await crowdsaleInstance.finalize({from: OWNER});

				let state = await vaultInstance.state.call();

				assert.bigNumberEQNumber(state, STATE.Refunding);
			});
		});

		describe('Token ownership ', () => {
			it('should transfer ownership correctly', async () => {
				let tokenAddress = await crowdsaleInstance.token.call();
				let tokenInstance = await ICOTokenExtended.at(tokenAddress);

				await timeTravel(web3, CROWDSALE_DURATION);

				await crowdsaleInstance.finalize({from: OWNER});

				let tokenOwner = await tokenInstance.owner.call();

				assert.equal(tokenOwner, OWNER, "Ownership is not transfered successfuly");
			});
		});
	});
});