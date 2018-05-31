const RefundVault = artifacts.require("../../contracts/InitialCoinOffering/CrowdsaleRefund/RefundVault.sol");

const expectThrow = require('./../util').expectThrow;
require('./../assertExtensions');

contract('RefundVault', function (accounts) {

    const WEI_IN_ETHER = 1000000000000000000; // 1 ether

    const OWNER = accounts[0];
    const WALLET = accounts[1];
    const INVESTOR = accounts[2];
    const NOT_OWNER = accounts[3];

    const DEDUCTION = 3; // 3% of the investor deposit

    let vaultInstance;

    const STATE = {
        Active: 0, 
        Refunding: 1, 
        Closed: 2
    }

    beforeEach(async function () {
        vaultInstance = await RefundVault.new(WALLET, { from: OWNER });
    });
    
    describe('RefundVault Initialization', () => {
        it('should set initial values correctly', async () => {
            vaultInstance = await RefundVault.new(WALLET, { from: OWNER });

            let wallet = await vaultInstance.wallet.call();
            let state = await vaultInstance.state.call();
            let owner = await vaultInstance.owner.call();

            assert.equal(WALLET, wallet, "Wallet is not set correctly");
            assert.equal(state, STATE.Active, "State is not set correctly");
            assert.equal(OWNER, owner, "The expected owner is not set");
        });

        it('should throw if wallet input address is invalid', async () => {
            await expectThrow(
                RefundVault.new("0x0", { from: OWNER })
            )
        });
    });

    describe('Ownership', () => {

		const NEW_OWNER = accounts[4];

		it('should transfer ownership successfuly', async () => {
			await vaultInstance.transferOwnership(NEW_OWNER, {from: OWNER});
			let vaultOwner = await vaultInstance.owner.call();

			assert.strictEqual(NEW_OWNER, vaultOwner, "Ownership is not transfered");
		});

		it('should not transfer ownership if the method caller is not the owner', async () => {
			await expectThrow(
				vaultInstance.transferOwnership(NEW_OWNER, {from: NOT_OWNER})
			);
		});

		it('should not transfer ownership if new owner\'s address is invalid', async () => {
			await expectThrow(
				vaultInstance.transferOwnership("0x0", {from: OWNER})
			);
		});
	});

    describe('Deposit', () => {
        it('should accept deposit', async function () {
        
            let investorDepositBeforeDepositing = await vaultInstance.deposited(INVESTOR);

            await vaultInstance.deposit(INVESTOR, {from: OWNER, value: WEI_IN_ETHER});
            
            let investorDepositAfterDepositing = await vaultInstance.deposited(INVESTOR);
            
            assert.bigNumberEQbigNumber(investorDepositBeforeDepositing, investorDepositAfterDepositing.minus(WEI_IN_ETHER));
        });

        it('should throw when non-owner try to process deposit', async () => {
            await expectThrow(
                vaultInstance.deposit(INVESTOR, {from: NOT_OWNER, value: WEI_IN_ETHER})
            )
        });
        
        it('should throw if try to deposit when the state is not active', async () => {
            await vaultInstance.enableRefunds({from: OWNER});

            await expectThrow(
                vaultInstance.deposit(INVESTOR, {from: OWNER, value: WEI_IN_ETHER})
            )
        });
    });

    describe('Refund', () => {

        it('should refund deposit', async function () {
            const DEDUCTED_VALUE = (WEI_IN_ETHER * DEDUCTION) / 100;
            const INVESTOR_REFUND_WHIT_DEDUCATION = WEI_IN_ETHER - DEDUCTED_VALUE;

            await vaultInstance.deposit(INVESTOR, {rom: OWNER, value: WEI_IN_ETHER});
    
            await vaultInstance.enableRefunds({from: OWNER});
    
            let investorBalanceBeforeRefund = await web3.eth.getBalance(INVESTOR);
            let walletBalanceBeforeRefund = await await web3.eth.getBalance(WALLET);

            let investorDepositBeforeRefund = await vaultInstance.deposited(INVESTOR);

            await vaultInstance.refund(INVESTOR, {from: OWNER});
            
            let investorBalanceAfterRefund = await web3.eth.getBalance(INVESTOR);
            let walletBalanceAfterRefund = await await web3.eth.getBalance(WALLET);

            let investorDepositAfterRefund = await vaultInstance.deposited(INVESTOR);

            let deductedValue = await vaultInstance.totalDeductedValue.call();

            assert.bigNumberEQbigNumber(investorBalanceBeforeRefund, investorBalanceAfterRefund.minus(INVESTOR_REFUND_WHIT_DEDUCATION));
            assert.bigNumberEQbigNumber(walletBalanceBeforeRefund, walletBalanceAfterRefund.minus(DEDUCTED_VALUE));

            assert.bigNumberEQNumber(investorDepositBeforeRefund, WEI_IN_ETHER);
            assert.bigNumberEQNumber(investorDepositAfterRefund, 0);
            assert.bigNumberEQNumber(deductedValue, DEDUCTED_VALUE); // 3% from the investor deposit goes to the wallet
        });

        it('should throw when trying to refund deposit during the active state', async function () {
            await expectThrow(
                vaultInstance.refund(INVESTOR)
            );
        });
    });

    describe('Enable Refunds', () => {
        it('should enable refunds', async () => {
            await vaultInstance.enableRefunds({from: OWNER});
            let state = await vaultInstance.state.call();

            assert.equal(state, STATE.Refunding, "State is incorrect");
        });
    
        it('shoud throw if non-owner try to enable refunds', async function () {
            await expectThrow(
                vaultInstance.enableRefunds({from: NOT_OWNER})
            );
        });

        it('should throw if trying to enable refunds when the state is not active', async () => {
            await vaultInstance.close({from: OWNER});

            await expectThrow(
                vaultInstance.enableRefunds({from: OWNER})
            )
        });
    });
    
    describe('Close', () => {

        it('should process close', async function () {
            await vaultInstance.deposit(INVESTOR, {rom: OWNER, value: WEI_IN_ETHER});
    
            let walletBalanceBeforeClose = web3.eth.getBalance(WALLET);
            await vaultInstance.close({from: OWNER});
            let walletBalanceAfterClose = web3.eth.getBalance(WALLET);

            let state = await vaultInstance.state.call();

            assert.bigNumberEQbigNumber(walletBalanceBeforeClose, walletBalanceAfterClose.minus(WEI_IN_ETHER));

            assert.equal(state, STATE.Closed, "State is incorrect");
        });
    
        it('should throw if non-owner try to process close', async function () {
            await expectThrow(
                vaultInstance.close({from: NOT_OWNER})
            );
        });

        it('should throw if trying to close when the state is not active', async () => {
            await vaultInstance.enableRefunds({from: OWNER});

            await expectThrow(
                vaultInstance.close({from: OWNER})
            );
        });
    });
});