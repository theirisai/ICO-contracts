(function() {
    assert.expectRevert = async function(promise) {
        try {
            let result = await promise;
        } catch (error) {
            const revert = error.message.search('revert') >= 0;
            assert(revert, "Expected throw, got '" + error + "' instead");
            return;
        }
        assert.fail('Expected throw not received');
    }

    assert.expectEvent = async function(promise, eventParameters) {
        let tx = await promise;

        let eventParamsNames = Object.keys(eventParameters);

        eventParamsNames.forEach(function(parameter){
            assert.deepEqual(tx.logs[0].args[parameter], eventParameters[parameter]);
        });

        return tx;
    }

    assert.bigNumberEQNumber = function(bigNumber, number, errorMessage) {
        assert(
            bigNumber.eq(
                web3.toBigNumber(number)
            ), errorMessage
        );
    }

    assert.bigNumberEQbigNumber = function(firstBigNumber, secondBigNumber, errorMessage) {
        assert(
            firstBigNumber.eq(
                secondBigNumber
            ), errorMessage
        );
    }
})();
