const RefundableCrowdsale = artifacts.require("../../contracts/TestPurpose/TestRefundableCrowdsale.sol");
const RefundVault = artifacts.require("../../contracts/InitialCoinOffering/CrowdsaleRefund/RefundVault.sol");

const expectThrow = require('./../util').expectThrow;
const timeTravel = require('./../util').timeTravel;
const web3FutureTime = require('./../util').web3FutureTime;
require('./../assertExtensions');

contract('RefundableCrowdsale', function (accounts) {

    const WEI_IN_ETHER = 100000000000000000 // 1 ether

    const OWNER = accounts[0];
    const WALLET = accounts[1];
    const INVESTOR = accounts[2];

    const DAY = 24 * 60 * 60;
	const WEEK = 7 * DAY;
	const CROWDSALE_DURATION = 7 * WEEK;

    const RATE = 100;
    const SOFT_CAP = 800 * WEI_IN_ETHER;

    let startTime;
    let endTime;

    let crowdsaleInstance;
    let vaultInstance;   

    describe('RefundableCrowdsale Initialization', () => {

        beforeEach(async () => {
            await timeTravel(web3, DAY);
            
            startTime = web3FutureTime(web3);
            endTime = startTime + CROWDSALE_DURATION;
           
            crowdsaleInstance = await RefundableCrowdsale.new(startTime, endTime, RATE, WALLET, SOFT_CAP, {from: OWNER});
        });

        it('should set initial values correctly', async () => {
            let owner = await crowdsaleInstance.owner.call();
            let softCap = await crowdsaleInstance.goal.call();
            let vaultAddress = await crowdsaleInstance.vault.call();

            assert.equal(OWNER, owner, "The expected owner is not set");

            assert.bigNumberEQNumber(softCap, SOFT_CAP);

            assert(vaultAddress.length > 0, "Token length is 0");
			assert(vaultAddress != "0x0");
        });

        it('should throw with zero soft cap', async function () {
            await expectThrow(
                RefundableCrowdsale.new(startTime, endTime, RATE, WALLET, 0, {from: OWNER})
            );
        });
    });

    describe('Forwarding', () => {

        beforeEach(async () => {
            startTime = web3FutureTime(web3);
            endTime = startTime + CROWDSALE_DURATION;
           
            crowdsaleInstance = await RefundableCrowdsale.new(startTime, endTime, RATE, WALLET, SOFT_CAP, {from: OWNER});
           
            let vault = await crowdsaleInstance.vault.call();
            vaultInstance = await RefundVault.at(vault);
    
            await timeTravel(web3, DAY);
        });

        it('should forward investor\'s ethers deposit on token purchase', async () => {
            let investorDepositBeforePurchase = await vaultInstance.deposited(INVESTOR);

            await crowdsaleInstance.buyTokens(INVESTOR, {from: INVESTOR, value: WEI_IN_ETHER});

            let investorDepositAfterPurchase = await vaultInstance.deposited(INVESTOR);

            assert.bigNumberEQbigNumber(investorDepositBeforePurchase, investorDepositAfterPurchase.minus(WEI_IN_ETHER));
        });
    });

    describe('Claim refunds', () => {

        beforeEach(async () => {
            startTime = web3FutureTime(web3);
            endTime = startTime + CROWDSALE_DURATION;
           
            crowdsaleInstance = await RefundableCrowdsale.new(startTime, endTime, RATE, WALLET, SOFT_CAP, {from: OWNER});
           
            let vault = await crowdsaleInstance.vault.call();
            vaultInstance = await RefundVault.at(vault);
    
            await timeTravel(web3, DAY);
        });

        it('should allow refund after the end if the soft cap is not reached', async () => {
            await crowdsaleInstance.buyTokens(INVESTOR, {from: INVESTOR, value: WEI_IN_ETHER});

            timeTravel(web3, CROWDSALE_DURATION);

            await crowdsaleInstance.finalize({from: OWNER});

            let investorBalanceBeforeClaim = await web3.eth.getBalance(INVESTOR);
            let investorDepositBeforeClaim = await vaultInstance.deposited(INVESTOR);

            await crowdsaleInstance.claimRefund({from: INVESTOR});

            let investorBalanceAfterClaim = await web3.eth.getBalance(INVESTOR);
            let investorDepositAfterClaim = await vaultInstance.deposited(INVESTOR);

            assert(
                investorBalanceAfterClaim.gt(
                    investorBalanceBeforeClaim
                )
            );

            assert.bigNumberEQNumber(investorDepositBeforeClaim, WEI_IN_ETHER);
            assert.bigNumberEQNumber(investorDepositAfterClaim, 0);
        });

        it('should throw if trying to refund when crowdsale is not finalized', async () => {
            await crowdsaleInstance.buyTokens(INVESTOR, {from: INVESTOR, value: WEI_IN_ETHER});

            await expectThrow(
                crowdsaleInstance.claimRefund({from: INVESTOR})
            );
        });

        it('should throw if trying to refund after the end when soft cap is reached', async () => {
            await crowdsaleInstance.buyTokens(INVESTOR, {from: INVESTOR, value: SOFT_CAP});
            
            timeTravel(web3, CROWDSALE_DURATION);
            
            await crowdsaleInstance.finalize({from: OWNER});

            await expectThrow(
                crowdsaleInstance.claimRefund({from: INVESTOR})
            );
        });
    });

    describe('Finalization', () => {

        const STATE = {
            Refunding: 1
        }

        beforeEach(async () => {
            startTime = web3FutureTime(web3);
            endTime = startTime + CROWDSALE_DURATION;
           
            crowdsaleInstance = await RefundableCrowdsale.new(startTime, endTime, RATE, WALLET, SOFT_CAP, {from: OWNER});
           
            let vault = await crowdsaleInstance.vault.call();
            vaultInstance = await RefundVault.at(vault);
    
            await timeTravel(web3, DAY);
        });
        
        it('should forward funds to the wallet after the end if the soft cap is reached', async () => {
            let walletBalances = await processFinalization(SOFT_CAP);

            assert.bigNumberEQbigNumber(
                walletBalances.BeforeFinalization, 
                walletBalances.AfterFinalization.minus(SOFT_CAP)
            );
        });

        it('should allow refunding after the end if the soft cap is not reached', async () => {
            let walletBalances = await processFinalization(SOFT_CAP / 2);

            let crowdsaleState = await vaultInstance.state.call();

            assert.bigNumberEQbigNumber(
                walletBalances.BeforeFinalization,
                walletBalances.AfterFinalization
            );
           
            assert.bigNumberEQNumber(crowdsaleState, STATE.Refunding);
        });

        async function processFinalization(ethersAmount){
            await crowdsaleInstance.buyTokens(INVESTOR, {from: INVESTOR, value: ethersAmount});

            timeTravel(web3, CROWDSALE_DURATION);

            let walletBalanceBeforeFinalization = await web3.eth.getBalance(WALLET);
            await crowdsaleInstance.finalize();
            let walletBalanceAfterFinalization = await web3.eth.getBalance(WALLET);

            return{
                BeforeFinalization: walletBalanceBeforeFinalization,
                AfterFinalization: walletBalanceAfterFinalization
            }
        }
    });

    describe('Is Soft Cap Reach', () => {

        beforeEach(async () => {
            startTime = web3FutureTime(web3);
            endTime = startTime + CROWDSALE_DURATION;
           
            crowdsaleInstance = await RefundableCrowdsale.new(startTime, endTime, RATE, WALLET, SOFT_CAP, {from: OWNER});

            await timeTravel(web3, DAY);
        });

        it('should return that soft cap is not reached', async () => {
            let isSoftCapReached = await crowdsaleInstance.goalReached();

            assert.isTrue(!isSoftCapReached, "Soft cap is reached");
        });
    });
});
