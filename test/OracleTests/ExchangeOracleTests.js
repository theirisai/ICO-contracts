const ExchangeOracle = artifacts.require("./ExchangeOracle.sol");
const util = require('./../util');
const expectThrow = util.expectThrow;

const BigNumber = require('./../bigNumber');
BigNumber.config({ DECIMAL_PLACES: 25 });

contract('Exchange Oracle', function(accounts) {

    let ExchangeOracleInstance;

    const _owner = accounts[0];
    const _notOwner = accounts[1];

    const _initialRate = 100000; // 100 rate
    const _newRate = 50000; // 50 rate
    const _newMinWeiAmount = 2000;

    describe("creating contract", () => {
        it("should be able to deploy IrisAI Oracle Contract", async function() {
            ExchangeOracleInstance = undefined;
            ExchangeOracleInstance = await ExchangeOracle.new(_initialRate, {
                from: _owner
            });

            assert.isDefined(ExchangeOracleInstance, "Could not deploy IrisAI Oracle contract");
        })
    })

    describe("constructor", () => {
        beforeEach(async function() {
            ExchangeOracleInstance = await ExchangeOracle.new(_initialRate, {
                from: _owner
            });
        })

        it("should have set the owner of the contract", async function() {
            const ExchangeOracleOwner = await ExchangeOracleInstance.owner.call();
            assert.strictEqual(ExchangeOracleOwner, _owner, "The contract owner was not set correctly");
        });

        it("should have set the initial rate correctly", async function() {
            const rate = await ExchangeOracleInstance.rate.call();
            assert(rate.eq(_initialRate), "The initial rate was not set correctly");
        });

        it("should have been set as oracle", async function() {
            const isOracle = await ExchangeOracleInstance.isIrisOracle.call();
            assert.isTrue(isOracle, "The initial oracle is not a real Oracle");
        });

    });

    describe("changing rate", () => {
        beforeEach(async function() {
            ExchangeOracleInstance = await ExchangeOracle.new(_initialRate, {
                from: _owner
            });
        });

        it("should change the rate correctly", async function() {
            await ExchangeOracleInstance.setRate(_newRate, {
                from: _owner
            });
            const rate = await ExchangeOracleInstance.rate.call();
            assert(rate.eq(_newRate), "The initial rate was not set correctly");
        });

        it("should throw if non-owner tries to change", async function() {
            await expectThrow(ExchangeOracleInstance.setRate(_newRate, {
                from: _notOwner
            }));
        });

        it("should emit event on change", async function() {
            const expectedEvent = 'LogRateChanged';
            let result = await ExchangeOracleInstance.setRate(_newRate, {
                from: _owner
            });

            assert.lengthOf(result.logs, 1, "There should be 1 event emitted from setRate!");
            assert.strictEqual(result.logs[0].event, expectedEvent, `The event emitted was ${result.logs[0].event} instead of ${expectedEvent}`);
        });

        it("should throw if newRate is equally to zero", async function() {
            await expectThrow(ExchangeOracleInstance.setRate(0, {
                from: _owner
            })); 
        });
    });

    describe("changing minWeiAmount", () => {
        beforeEach(async function() {
            ExchangeOracleInstance = await ExchangeOracle.new(_initialRate, {
                from: _owner
            });
        });

        it("should change the minWeiAmount correctly", async function() {
            await ExchangeOracleInstance.setMinWeiAmount(_newMinWeiAmount, {
                from: _owner
            });
            const minWeiAmount = await ExchangeOracleInstance.minWeiAmount.call();
            assert(minWeiAmount.eq(_newMinWeiAmount), "The initial minWeiAmount was not set correctly");
        });

        it("should throw if non-owner tries to change", async function() {
            await expectThrow(ExchangeOracleInstance.setMinWeiAmount(_newRate, {
                from: _notOwner
            }));
        });

        it('should throw if the mod of new wei amount is different than 0', async () => {
            await expectThrow(ExchangeOracleInstance.setMinWeiAmount(_newRate - 1, {
                from: _notOwner
            }));
        });

        it("should emit event on change", async function() {
            const expectedEvent = 'LogMinWeiAmountChanged';
            let result = await ExchangeOracleInstance.setMinWeiAmount(_newMinWeiAmount, {
                from: _owner
            });

            assert.lengthOf(result.logs, 1, "There should be 1 event emitted from setMinWeiAmount!");
            assert.strictEqual(result.logs[0].event, expectedEvent, `The event emitted was ${result.logs[0].event} instead of ${expectedEvent}`);
        });
    });

    describe('tokens amount in wei', () => {

        const _given_rate = 980; // 0.98 rate ( 10 ethers = 9,8 tokens )
        const _offensiveTokensAmount = new BigNumber('123123123123123123123'); // ~123 tokens / 100 rate = ~123...12,31 ethers ( mod = 31 )
        const _prettyTokensAmount = new BigNumber('100000000000000000000'); // 100 tokens / 100 rate = 1 ether ( mod = 0 )
        
        let minWeiAmount;

        beforeEach(async function() {
            ExchangeOracleInstance = await ExchangeOracle.new(_initialRate, {
                from: _owner
            });

            minWeiAmount = await ExchangeOracleInstance.minWeiAmount.call();
        });

        describe('calculating wei for given tokens amount at basis rate', () => {
            it('should calculate wei for offensive tokens amount', async () => {
                let calculatedWei = await ExchangeOracleInstance.calcWeiForTokensAmount(_offensiveTokensAmount.toString(10));
                
                assert.equal(
                    calculatedWei.toString(10), 
                    _offensiveTokensAmount.div(_initialRate).multipliedBy(minWeiAmount).plus(1).toFixed(0) // 1,23...23 ethers ( we add 1 wei, because we have mod of 23 => 0.23 wei and we need to round it )
                );
            });
    
            it('should calculate wei for pretty tokens amount', async () => {
                let calculatedWei = await ExchangeOracleInstance.calcWeiForTokensAmount(_prettyTokensAmount.toString(10));
    
                assert.equal(
                    calculatedWei.toString(10), 
                    _prettyTokensAmount.div(_initialRate).multipliedBy(minWeiAmount).toString(10) // 1 ether
                );
            });
        });

        describe('converting tokens amount in wei at given rate', () => {

            it('should convert offensive tokens amount in wei', async () => {
                let calculatedWei = await ExchangeOracleInstance.convertTokensAmountInWeiAtRate(_offensiveTokensAmount.toString(10), _given_rate);

                assert.equal(
                    calculatedWei.toString(10), 
                    _offensiveTokensAmount.div(_given_rate).multipliedBy(minWeiAmount).plus(1).toFixed(0, 1) // ~125 ethers
                );
            });
    
            it('should convert pretty tokens amount in wei', async () => {
                let calculatedWei = await ExchangeOracleInstance.convertTokensAmountInWeiAtRate(_prettyTokensAmount.toString(10), _given_rate);

                assert.equal(
                    calculatedWei.toString(10), 
                    _prettyTokensAmount.div(_given_rate).multipliedBy(minWeiAmount).toFixed(0)// ~102 ethers
                );
            });
        });
    
    });

    describe("working with paused contract", () => {
        beforeEach(async function() {
            ExchangeOracleInstance = await ExchangeOracle.new(_initialRate, {
                from: _owner
            });
        })

        it("should throw if try to get the rate of paused contract", async function() {
            await ExchangeOracleInstance.pause({
                from: _owner
            });

            await expectThrow(ExchangeOracleInstance.rate.call());
        });

        it("should throw if try to change the rate of paused contract", async function() {
            await ExchangeOracleInstance.pause({
                from: _owner
            });

            await expectThrow(ExchangeOracleInstance.setRate(_newRate, {
                from: _owner
            }));
        });

        it("should throw if try to change the minWeiAmount of paused contract", async function() {
            await ExchangeOracleInstance.pause({
                from: _owner
            });

            await expectThrow(ExchangeOracleInstance.setMinWeiAmount(_newMinWeiAmount, {
                from: _owner
            }));
        });

        it('should throw if try to calculate wei for given tokens at basis rate when contract is paused', async () => {
            await ExchangeOracleInstance.pause({
                from: _owner
            });

            await expectThrow(ExchangeOracleInstance.calcWeiForTokensAmount(_newMinWeiAmount, {
                from: _owner
            }));
        });

        it('should throw if try to convert tokens in wei at given rate when contract is paused', async () => {
            await ExchangeOracleInstance.pause({
                from: _owner
            });

            await expectThrow(ExchangeOracleInstance.convertTokensAmountInWeiAtRate(_newMinWeiAmount, _newRate, {
                from: _owner
            }));
        });
    })
});