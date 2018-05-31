const util = {
	expectThrow: async promise => {
		try {
			let result = await promise;
			console.log(result);
		} catch (error) {
			const invalidJump = error.message.search('invalid JUMP') >= 0
			const invalidOpcode = error.message.search('invalid opcode') >= 0
			const outOfGas = error.message.search('out of gas') >= 0
			const revert = error.message.search('revert') >= 0
			assert(invalidJump || invalidOpcode || outOfGas || revert, "Expected throw, got '" + error + "' instead")
			return
		}
		assert.fail('Expected throw not received')
	},

	web3Now: (web3) => {
		return web3.eth.getBlock(web3.eth.blockNumber).timestamp;
	},

	web3FutureTime: (web3) => {
		return web3.eth.getBlock(web3.eth.blockNumber).timestamp + 60 * 60;
	},

	timeTravel: (web3, seconds) => {
		return new Promise((resolve, reject) => {
			web3.currentProvider.sendAsync({
				jsonrpc: "2.0",
				method: "evm_increaseTime",
				params: [seconds], // 86400 seconds in a day
				id: new Date().getTime()
			}, (err, result) => {
				if (err) {
					reject(err);
				}
				web3.currentProvider.sendAsync({
					jsonrpc: "2.0",
					method: "evm_mine",
					id: new Date().getTime()
				}, function (err, result) {
					if (err) {
						reject(err);
					}
					resolve(result);
				});

			});
		})
	},

    balanceOf: (web3, account) => {
        return new Promise((resolve, reject) => web3.eth.getBalance(account, (e, balance) => (e ? reject(e) : resolve(balance))))
    },

    getParamFromTxEvent: (transaction, paramName, contractFactory, eventName) => {
        assert.isObject(transaction)
        let logs = transaction.logs
        if (eventName != null) {
            logs = logs.filter((l) => l.event === eventName)
        }
        assert.equal(logs.length, 1, 'too many logs found!')
        let param = logs[0].args[paramName]
        if (contractFactory != null) {
            let contract = contractFactory.at(param)
            assert.isObject(contract, `getting ${paramName} failed for ${param}`)
            return contract
        } else {
            return param
        }
    },

    assertThrowsAsynchronously: async (test, error) => {
        try {
            await test();
        } catch (e) {
            if (!error || e instanceof error)
                return "everything is fine";
        }
        throw new Error("Missing rejection" + (error ? " with " + error.name : ""));
    },

    balanceOf: (web3, account) => {
        return new Promise((resolve, reject) => web3.eth.getBalance(account, (e, balance) => (e ? reject(e) : resolve(balance))))
    },

	getEvent: async function (filter, count) {
		return new Promise(function (resolve, reject) {
			count = count ? count : 1;
	
			var results = [];
	
			filter.watch(function (error, result) {
				if (error) {
					reject(error);
				} else {
					count--;
					results.push(result);
				}
	
				if (count <= 0) {
					resolve(results);
					filter.stopWatching();
				}
			});
		});
	},

	getTransactionGasCost: async function (tx) {
		let transaction = await web3.eth.getTransactionReceipt(tx);
		let amount = transaction.gasUsed;
		let price = await web3.eth.getTransaction(tx).gasPrice;
	  
		return price * amount;
	}
}


module.exports = util;