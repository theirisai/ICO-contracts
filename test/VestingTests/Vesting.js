const Vesting = artifacts.require("../../contracts/Vesting/Vesting.sol");

const ProjectInitializator = require("./../ProjectInitializator.js");

const expectThrow = require('./../util').expectThrow;
const timeTravel = require('./../util').timeTravel;
const web3FutureTime = require('./../util').web3FutureTime;
const getTransactionGasCost = require('./../util').getTransactionGasCost;

require("./../assertExtensions");

contract('Vesting', function (accounts) {

    const WEI_IN_ETHER = 1000000000000000000; // 1 ether
    const WEI_IN_TOKEN = 1000000000000000000; // 1 ether

    const OWNER = accounts[0];
    const WALLET = accounts[1];
    const CLAIMER = accounts[2];
    const NOT_OWNER = accounts[3];

    const DAY = 24 * 60 * 60;
	const WEEK = 7 * DAY;

    let vestingInstance;

    describe('Vesting Initialization', () => {
        it('should set initial values correctly', async () => {
            await timeTravel(web3, DAY);
            startTime = web3FutureTime(web3);
            
            vestingInstance = await Vesting.new(CLAIMER, startTime, {from: OWNER});

            let twentyFivePercentageClaimer = await vestingInstance.twentyFivePercentageClaimer.call();
            let seventyFivePercentageClaimer = await vestingInstance.seventyFivePercentageClaimer.call();
            let isTwentyFivePercentageClaimed = await vestingInstance.isTwentyFivePercentageClaimed.call();
            let twentyFivePercentageClaimStartDate = await vestingInstance.twentyFivePercentageClaimStartDate.call();
            let seventyFivePercentageClaimStartDate = await vestingInstance.seventyFivePercentageClaimStartDate.call();
            let vestingOwner = await vestingInstance.owner.call();

            assert.equal(twentyFivePercentageClaimer, CLAIMER, "Twenty five percentage claimer is not initialized correctly");
            assert.equal(seventyFivePercentageClaimer, CLAIMER, "Seventy five percentage claimer is not initialized correctly");
            assert.isTrue(!isTwentyFivePercentageClaimed, "Twenty five percentage are already claimed");
            assert.equal(vestingOwner, OWNER, "The expected owner is not set");
            
            assert(
                twentyFivePercentageClaimStartDate.eq(
                    web3.toBigNumber(startTime)
                )
            );

            assert(
                seventyFivePercentageClaimStartDate.eq(
                    web3.toBigNumber(startTime + (8 * WEEK)) // two months after the vesting start time
                )
            );
        });

        it('should throw if claimer input address is invalid', async () => {
            await expectThrow(
                Vesting.new("0x0", startTime, {from: OWNER})
            );
        });

        it('should throw if start time input parameter is less than now', async () => {
            await expectThrow(
                Vesting.new(CLAIMER, 0, {from: OWNER})
            );
        });
    });

    describe('Setters', () => {
        
        before(async () => {
            await timeTravel(web3, DAY);
            startTime = web3FutureTime(web3);

            vestingInstance = await Vesting.new(CLAIMER, startTime, {from: OWNER});

            await timeTravel(web3, DAY);
        });

        describe('Seventy Five Percentage Claimer', () => {
            it('should set seventy five percentage claimer correctly', async () => {
                const NEW_CLAIMER = accounts[4];
                await vestingInstance.setSeventyFivePercantageClaimer(NEW_CLAIMER, {from: OWNER});
    
                let seventyFivePercentageClaimer = await vestingInstance.seventyFivePercentageClaimer.call();
    
                assert.equal(seventyFivePercentageClaimer, NEW_CLAIMER, "New claimer is not set correctly");
            });
    
            it('should throw if the new calimer input address is invalid', async () => {
                await expectThrow(
                    vestingInstance.setSeventyFivePercantageClaimer("0x0", {from: OWNER})
                );  
            });
    
            it('should throw if non-owner try to set seventy five percentage', async () => {
                await expectThrow(
                    vestingInstance.setSeventyFivePercantageClaimer(CLAIMER, {from: NOT_OWNER})
                );  
            });
        });

        describe('Token Instance', () => {
            
            let tokenInstance;

            beforeEach(async () => {
                tokenInstance = await ProjectInitializator.initToken(OWNER);
            });
            
            it('should set token instance correctly', async () => {
                await vestingInstance.setTokenInstance(tokenInstance.address, {from: OWNER});

                let vestingTokenInstance = await vestingInstance.tokenInstance.call();

                assert.equal(tokenInstance.address, vestingTokenInstance, "Token is not set correctly");
            });

            it('should throw if non-owner try to set the token instance', async () => {
                await expectThrow(
                    vestingInstance.setTokenInstance(tokenInstance.address, {from: NOT_OWNER})
                );
            });

            it('should throw on invalid input token instance address', async () => {
                await expectThrow(
                    vestingInstance.setTokenInstance("0x0", {from: OWNER})
                );
            });
        });
        
        describe('Set Hook Operator', () => {
            let hookOperator;

            beforeEach(async () => {
                hookOperator = await ProjectInitializator.initHookOperator(OWNER);
            });
            
            it('should set token instance correctly', async () => {
                await vestingInstance.setHookOperator(hookOperator.address, {from: OWNER});

                let vestingHookOperator = await vestingInstance.hookOperator.call();

                assert.equal(hookOperator.address, vestingHookOperator, "Hook operator is not set correctly");
            });

            it('should throw if non-owner try to set the hook operator instance', async () => {
                await expectThrow(
                    vestingInstance.setHookOperator(hookOperator.address, {from: NOT_OWNER})
                );
            });

            it('should throw on invalid input hook operator instance address', async () => {
                await expectThrow(
                    vestingInstance.setHookOperator("0x0", {from: OWNER})
                );
            });
        });

        describe('Set Over Deposited Tokens Recipient', () => {
            const OVER_DEPOSIT_RECIPIENT = accounts[4];
            
            it('should set over deposited recipient correctly', async () => {
                await vestingInstance.setOverDepositTokensRecipient(OVER_DEPOSIT_RECIPIENT, {from: OWNER});

                let vestingOverDeposittRecipient = await vestingInstance.overDepositTokensRecipient.call();

                assert.equal(vestingOverDeposittRecipient, OVER_DEPOSIT_RECIPIENT, "Over depost recipient is not set correctly");
            });

            it('should throw if non-owner try to set the over deposit recipient', async () => {
                await expectThrow(
                    vestingInstance.setOverDepositTokensRecipient(OVER_DEPOSIT_RECIPIENT, {from: NOT_OWNER})
                );
            });

            it('should throw on invalid input over deposit recipient address', async () => {
                await expectThrow(
                    vestingInstance.setOverDepositTokensRecipient("0x0", {from: OWNER})
                );
            });
        });

    });

    describe('Withdraw', () => {

        async function processWithdraw(unlockTimeForWithdrawing, withdrawCallback){
            await timeTravel(web3, unlockTimeForWithdrawing); // two months after the vesting start

            let withdrawerBalanceBeforeWithdraw = await web3.eth.getBalance(CLAIMER);
            await withdrawCallback();
            let withdrawerBalanceAfterWithdraw = await web3.eth.getBalance(CLAIMER);
            
            return {
                BeforeWithdraw: withdrawerBalanceBeforeWithdraw,
                AfterWithdraw: withdrawerBalanceAfterWithdraw
            }
        }

        describe('Withdraw twenty five percentage', () => {

            const VAULT_BALANCE = 5 * WEI_IN_ETHER; // 5 ethers
    
            beforeEach(async () => {
                await timeTravel(web3, DAY);
                startTime = web3FutureTime(web3);
    
                vestingInstance = await Vesting.new(CLAIMER, startTime, {from: OWNER});
    
                await vestingInstance.sendTransaction({from: OWNER, value: VAULT_BALANCE});
            });
    
            it('should withdraw twenty five percentage of contract balance (Owner invoker)', async () => {
                let claimerBalance = await processWithdraw(DAY, async function() {
                    await vestingInstance.withdrawTwentyFivePercantage({from: OWNER});
                });

                let isTwentyFivePercentageWitdrawn = await vestingInstance.isTwentyFivePercentageClaimed.call();

                assert(
                    claimerBalance.BeforeWithdraw.eq(
                        claimerBalance.AfterWithdraw.minus(VAULT_BALANCE / 4)
                    )
                );
                assert.isTrue(isTwentyFivePercentageWitdrawn, "Withdraw is not successful");
            });
    
            it('should withdraw twenty five percentage of contract balance (Claimer invoker)', async () => {
                let gasCost;

                let claimerBalance = await processWithdraw(DAY, async function() {
                    let tx = await vestingInstance.withdrawTwentyFivePercantage({from: CLAIMER});
                    gasCost = await getTransactionGasCost(tx['tx']);
                });

                let isTwentyFivePercentageWitdrawn = await vestingInstance.isTwentyFivePercentageClaimed.call();

                assert(
                    claimerBalance.BeforeWithdraw.eq(
                        claimerBalance.AfterWithdraw.minus(VAULT_BALANCE / 4).plus(gasCost)
                    )
                );
                assert.isTrue(isTwentyFivePercentageWitdrawn, "Withdraw is not successful");
            });
    
            it('should throw if non-claimer try to withdraw', async () => {
                await expectThrow(
                    vestingInstance.withdrawTwentyFivePercantage({from: NOT_OWNER})
                );
            });
    
            it('should throw if twenty five percentage has been already withdrawn', async () => {
                await timeTravel(web3, DAY);
    
                await vestingInstance.withdrawTwentyFivePercantage({from: OWNER});
    
                await expectThrow(
                    vestingInstance.withdrawTwentyFivePercantage({from: OWNER})
                );
            });
    
            it('should throw if try to withdraw before the allowed time', async () => {
                await expectThrow(
                    vestingInstance.withdrawTwentyFivePercantage({from: OWNER})
                );
            });
        });
    
        describe('Withdraw seventy five percentage', () => {
    
            const VAULT_BALANCE = 5 * WEI_IN_ETHER; // 5 ethers
            const SEVENTY_FIVE_PERCENTAGE = (VAULT_BALANCE / 4) * 3; // 75% if total balance
            let seventyFivePercentageStartTime;
    
            beforeEach(async () => {
                await timeTravel(web3, DAY);
                startTime = web3FutureTime(web3);
                seventyFivePercentageStartTime = startTime + 8 * WEEK;
    
                vestingInstance = await Vesting.new(CLAIMER, startTime, {from: OWNER});
    
                await vestingInstance.sendTransaction({from: OWNER, value: VAULT_BALANCE});
    
                await timeTravel(web3, DAY);
            });
    
            it('should withdraw seventy five percentage of contract balance when the rest ethers is not withdrawn (Owner invoker)', async () => {
                let claimerBalance = await processWithdraw(seventyFivePercentageStartTime, async function() {
                    await vestingInstance.withdrawSeventyFivePercantage({from: OWNER});
                });

                assert(
                    claimerBalance.BeforeWithdraw.eq(
                        claimerBalance.AfterWithdraw.minus(SEVENTY_FIVE_PERCENTAGE)
                    )
                );
            });
    
            it('should withdraw seventy five percentage of contract balance when the rest ethers is not withdrawn (Claimer invoker)', async () => {
                let gasCost;

                let claimerBalance = await processWithdraw(seventyFivePercentageStartTime, async function() {
                    let tx = await vestingInstance.withdrawSeventyFivePercantage({from: CLAIMER});
                    gasCost = await getTransactionGasCost(tx['tx']);
                });

                assert(
                    claimerBalance.BeforeWithdraw.eq(
                        claimerBalance.AfterWithdraw.minus(SEVENTY_FIVE_PERCENTAGE).plus(gasCost)
                    )
                );
            });
    
            it('should withdraw the whole balance when 25% is already withdrawn', async () => {
                await vestingInstance.withdrawTwentyFivePercantage({from: OWNER});
    
                let vestingInstanceBalance = await web3.eth.getBalance(vestingInstance.address);
    
                let claimerBalance = await processWithdraw(seventyFivePercentageStartTime, async function() {
                    await vestingInstance.withdrawSeventyFivePercantage({from: OWNER});
                });

                assert(
                    vestingInstanceBalance.eq(
                        web3.toBigNumber(SEVENTY_FIVE_PERCENTAGE)
                    )
                );

                assert(
                    claimerBalance.BeforeWithdraw.eq(
                        claimerBalance.AfterWithdraw.minus(SEVENTY_FIVE_PERCENTAGE)
                    )
                );
            });
    
            it('should throw if non-claimer try to withdraw', async () => {
                await timeTravel(web3, startTime + 8 * WEEK);
    
                await expectThrow(
                    vestingInstance.withdrawSeventyFivePercantage({from: NOT_OWNER})
                );
            });
    
            it('should throw if try to withdraw before the allowed time', async () => {
                await expectThrow(
                    vestingInstance.withdrawSeventyFivePercantage({from: OWNER})
                );
            });
        });
    });

    

    describe('Refund Over Deposits ', () => {

        let tokenInstance;

        const USER_ONE = accounts[4];
        const SYSTEM = accounts[5];

        const REGULAR_RATE = 100;

        const INITIAL_TOKENS_AMOUNT = 2000 * WEI_IN_ETHER; // 2000 tokens/ The limit is 1 600
        const TOTAL_SUPPLY = 78000 * WEI_IN_ETHER; // Total supply + initial tokens = total sypply of 80000 tokens

        const BALANCE_PERCENTAGE_LIMIT = 2; // A user can have to 2% from the total supply(1 600)

        const MAX_USER_BALANCE = 1600 * WEI_IN_ETHER; // It is calculated as follow: (TOTAL_SUPPLY * BALANCE_PERCENTAGE_LIMIT) / 100

        /*
            100 tokens = 1 eth (Regular rate)
            We have 2 000 tokens and the balance limit is 1 600
            The rest of the tokens is equivalent to 4 ethers
        */
        const REFUNDED_ETHERS = 4 * WEI_IN_ETHER; // 4 ethers

        /*
            We have 2 000 tokens and the balance limit is 1 600
            That means that the tokens amount wich will be refunded to us is: 2 000 - 1 600

        */
        const REFUNDED_TOKENS = 400 * WEI_IN_TOKEN; // 400 tokens

        beforeEach(async () => {
            let isOverBalanceLimitHolder = true;

            await timeTravel(web3, DAY);
            startTime = web3FutureTime(web3);

            vestingInstance = await Vesting.new(CLAIMER, startTime, {from: OWNER});

            let contracts = await ProjectInitializator.initWithAddress(OWNER);
            
            tokenInstance = contracts.icoTokenContract;
            await tokenInstance.setRefunder(vestingInstance.address, {from: OWNER});

            let hookOperatorInstance = contracts.hookOperatorContract;

            hookOperatorInstance.setBalancePercentageLimit(BALANCE_PERCENTAGE_LIMIT, {from: OWNER});
            hookOperatorInstance.setOverBalanceLimitHolder(SYSTEM, isOverBalanceLimitHolder, {from: OWNER});

            await ProjectInitializator.createVerifiedUsers(OWNER, [USER_ONE, SYSTEM]);

            tokenInstance.mint(USER_ONE, INITIAL_TOKENS_AMOUNT, {from: OWNER});
            tokenInstance.mint(SYSTEM, TOTAL_SUPPLY, {from: OWNER});

            await vestingInstance.setTokenInstance(tokenInstance.address, {from: OWNER});
            await vestingInstance.setOverDepositTokensRecipient(SYSTEM, {from: OWNER});
            await vestingInstance.setHookOperator(hookOperatorInstance.address, {from: OWNER});

            await vestingInstance.sendTransaction({from: OWNER, value: INITIAL_TOKENS_AMOUNT});
        });

        it('should refund ethers to an investitor if his tokens balance is over the limit', async () => {
            let userETHBalanceBeforeRefund = await web3.eth.getBalance(USER_ONE);

            await vestingInstance.refundOverDeposits(USER_ONE, REGULAR_RATE, {from: OWNER});

            let userETHBalanceAfterRefund = await web3.eth.getBalance(USER_ONE);

            let userTokensBalance = await tokenInstance.balanceOf(USER_ONE);
            let systemTokensBalance = await tokenInstance.balanceOf(SYSTEM);

            assert.bigNumberEQbigNumber(userETHBalanceBeforeRefund, userETHBalanceAfterRefund.minus(REFUNDED_ETHERS));
            assert.bigNumberEQNumber(userTokensBalance, MAX_USER_BALANCE);
            assert.bigNumberEQNumber(systemTokensBalance, TOTAL_SUPPLY + REFUNDED_TOKENS);
        });

        it('should throw if non-owner try to refund over deposits', async () => {
            await expectThrow(
                vestingInstance.refundOverDeposits(USER_ONE, REGULAR_RATE, {from: NOT_OWNER})
            );
        });

        it('should throw on invalid input investitor address', async () => {
            await expectThrow(
                vestingInstance.refundOverDeposits("0x0", REGULAR_RATE, {from: OWNER})
            );
        });

        it('should throw if investor balance is in the limit', async () => {
            await expectThrow(
                vestingInstance.refundOverDeposits(OWNER, REGULAR_RATE, {from: OWNER})
            );
        });

        it('should throw if input rate is less than 1/2 of the oracle rate', async () => {
            let invalidRate = REGULAR_RATE / 3;

            await expectThrow(
                vestingInstance.refundOverDeposits(USER_ONE, invalidRate, {from: OWNER})
            );
        });
    });
});