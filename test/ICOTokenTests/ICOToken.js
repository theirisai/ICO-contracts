const ICOToken = artifacts.require("./ICOToken.sol");
const expectThrow = require('./../util').expectThrow;
const timeTravel = require('./../util').timeTravel;
require('./../assertExtensions');

contract('ICOToken', function (accounts) {

	let tokenInstance;

	const OWNER = accounts[0];
	const NOT_OWNER = accounts[1];
	const USER_ONE = accounts[2];

	const NAME = "AIUR Token";
	const DECIMALS = 18;
	const SYMBOL = "AIUR";

	const INITIAL_TOTAL_SUPPLY = 0;

	describe("ICO Token Creation", () => {
		beforeEach(async function () {
			tokenInstance = await ICOToken.new({
				from: OWNER
			});
		})

		it("should set owner correctly", async function () {
			let tokenOwner = await tokenInstance.owner.call();

			assert.strictEqual(OWNER, tokenOwner, "The expected owner is not set");
		})

		it("should not have totalSupply", async function () {
			let tokenTotalSupply = await tokenInstance.totalSupply.call();

			assert(tokenTotalSupply.eq(INITIAL_TOTAL_SUPPLY), `The contract has initial supply of : ${tokenTotalSupply.toNumber()}`);
		})

		it("should set the name correctly", async function () {
			let tokenName = await tokenInstance.name.call();

			assert.strictEqual(NAME, tokenName, `The contract name is incorrect : ${NAME}`);
		})

		it("should set the symbol correctly", async function () {
			let tokenSymbol = await tokenInstance.symbol.call();

			assert.strictEqual(SYMBOL, tokenSymbol, `The contract symbol is incorrect : ${SYMBOL}`);
		})

		it("should set the desimals correctly", async function () {
			let tokenDecimals = await tokenInstance.decimals.call();

			assert(tokenDecimals.eq(DECIMALS), `The contract decimals are incorrect : ${tokenDecimals.toNumber()}`);
		});

		it('should initialize the token as unpaused one', async () => {
			let isUnPaused = !(await tokenInstance.paused.call());

			await assert.isTrue(isUnPaused, "The token\'s pause state is incorrect");
		});
	});

	describe('Ownership', () => {
		const NEW_OWNER = accounts[2];

		beforeEach(async () => {
			tokenInstance = await ICOToken.new({
				from: OWNER
			});
		});

		it('should transfer Ownership successfuly', async () => {
			await tokenInstance.transferOwnership(NEW_OWNER, {from: OWNER});
			let tokenOwner = await tokenInstance.owner.call();

			assert.strictEqual(NEW_OWNER, tokenOwner, "Ownership is not transfered");
		});

		it('should not transfer Ownership if the method caller is not the owner', async () => {
			await expectThrow(
				tokenInstance.transferOwnership(NEW_OWNER, {from: NOT_OWNER})
			);
		});

		it('should not transfer Ownership if new owner\'s address is invalid', async () => {
			await expectThrow(
				tokenInstance.transferOwnership("0x0", {from: OWNER})
			);
		});
	});

	describe('Pause', () => {

		const INITIAL_TOKENS_AMOUNT = 10000000000000000000; // 10 tokens

		beforeEach(async () => {
			tokenInstance = await ICOToken.new({
				from: OWNER
			});

			await tokenInstance.mint(USER_ONE, INITIAL_TOKENS_AMOUNT, {from: OWNER});
		});

		it('should process transfer when the token is unpaused', async () => {
			let isUnPaused = !(await tokenInstance.paused.call());
			await tokenInstance.transfer(OWNER, INITIAL_TOKENS_AMOUNT, {from: USER_ONE})

			let ownerBalance = await tokenInstance.balanceOf(OWNER);
			let userOneBalance = await tokenInstance.balanceOf(USER_ONE);

			assert.bigNumberEQNumber(ownerBalance, INITIAL_TOKENS_AMOUNT);
			assert.bigNumberEQNumber(userOneBalance, 0);

			assert.isTrue(isUnPaused, "The token is paused");
		});

		it('should not process transfer when the token is paused', async () => {
			await tokenInstance.pause({from: OWNER});
			let isPaused = await tokenInstance.paused.call();

			assert.isTrue(isPaused, "The token is not paused");

			await expectThrow(
				tokenInstance.transfer(OWNER, INITIAL_TOKENS_AMOUNT, {from: USER_ONE})
			);	
		});
	});
});