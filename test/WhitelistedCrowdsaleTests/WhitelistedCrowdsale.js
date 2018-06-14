const WhitelistedCrowdsale = artifacts.require("./InitialCoinOffering/WhitelistedCrowdsale/WhitelistedCrowdsale.sol");
const expectThrow = require('./../util').expectThrow;
require('./../assertExtensions');

contract('WhitelistedCrowdsale', function (accounts) {

    const OWNER = accounts[0];
    const LISTER = accounts[1];
    const NOT_OWNER = accounts[2];
    const USER_ONE = accounts[3];

    const USER_ONE_RATE = 150;

    let whitelistedCrowdsaleInstance;

    describe('Creating Whitelisted Crowdsale', () => {

        beforeEach(async function () {
			whitelistedCrowdsaleInstance = await WhitelistedCrowdsale.new({
				from: OWNER
			});
		})

        it('should set owner correctly', async () => {
            let contractOwner = await whitelistedCrowdsaleInstance.owner.call();

            assert.equal(OWNER, contractOwner, "Owner is not set correctly");
        });
    });

    function generateUsers(usersCount) {
        let users = [];
        
        for (let i = 1; i < usersCount + 1; i++) {
            if (i % 10 != 0) {
                users.push(`0x${i}`);
            }
        }

        return users;
    }

    describe('Pre Sales Special User', () => {

        async function proccessWhiteListUserRateSet(userRate) {
            let userRateBeforeSet = await whitelistedCrowdsaleInstance.preSalesSpecialUsers(USER_ONE);

            await whitelistedCrowdsaleInstance.setPreSalesSpecialUser(USER_ONE, userRate, {from: LISTER});

            let userRateAfterSet = await whitelistedCrowdsaleInstance.preSalesSpecialUsers(USER_ONE);

            return {
                RateBeforeSet: userRateBeforeSet,
                RateAftereSet: userRateAfterSet
            }
        }

        beforeEach(async () => {
            whitelistedCrowdsaleInstance = await WhitelistedCrowdsale.new({
				from: OWNER
            });
            
            await whitelistedCrowdsaleInstance.setLister(LISTER, {from: OWNER});
        });
        
        describe('Single user', () => {
            it('should add a user', async () => {
                let userRates = await proccessWhiteListUserRateSet(USER_ONE_RATE);
    
                assert.bigNumberEQNumber(userRates.RateBeforeSet, 0);
                assert.bigNumberEQNumber(userRates.RateAftereSet, USER_ONE_RATE);
            });
    
            it('should remove a user', async () => {
                await whitelistedCrowdsaleInstance.setPreSalesSpecialUser(USER_ONE, USER_ONE_RATE, {from: LISTER});
    
                let userRates = await proccessWhiteListUserRateSet(0);

                assert.bigNumberEQNumber(userRates.RateBeforeSet, USER_ONE_RATE);
                assert.bigNumberEQNumber(userRates.RateAftereSet, 0);
            });
    
            it('should update a user', async () => {
                let updateRate = 100;
    
                await whitelistedCrowdsaleInstance.setPreSalesSpecialUser(USER_ONE, USER_ONE_RATE, {from: LISTER});
    
                let userRates = await proccessWhiteListUserRateSet(updateRate);
    
                assert.bigNumberEQNumber(userRates.RateBeforeSet, USER_ONE_RATE);
                assert.bigNumberEQNumber(userRates.RateAftereSet, updateRate);
            });
    
            it('should throw if non-owner try to set presales special user', async () => {
                await expectThrow(
                    whitelistedCrowdsaleInstance.setPreSalesSpecialUser(USER_ONE, USER_ONE_RATE, {from: NOT_OWNER})
                );
            });
    
            it('should throw if input user address is invalid', async () => {
                await expectThrow(
                    whitelistedCrowdsaleInstance.setPreSalesSpecialUser("0x0", USER_ONE_RATE, {from: LISTER})
                );
            });
        });

        describe('Multiple users', () => {

            it('should add multiple presales users', async () => {
                const USERS = generateUsers(2);
                const USER_RATE = 150;

                let tx = await whitelistedCrowdsaleInstance.setMultiplePreSalesSpecialUsers(USERS, USER_RATE, {from: LISTER});

                let firstAddedUserRate = await whitelistedCrowdsaleInstance.preSalesSpecialUsers.call(USERS[0]);
                let secondAddedUserRate = await whitelistedCrowdsaleInstance.preSalesSpecialUsers.call(USERS[1]);

                assert.bigNumberEQNumber(firstAddedUserRate, USER_RATE);
                assert.bigNumberEQNumber(secondAddedUserRate, USER_RATE);
            });

            it('should throw when the passed users count is over the limit', async () => {
                // We need 201 users to over the limit, but generateUsers skips the multiples of ten numbers,
                // that is why we use 223 which is equivalent to 201
                const USERS = generateUsers(223);
                const USER_RATE = 150;

                await expectThrow(
                    whitelistedCrowdsaleInstance.setMultiplePreSalesSpecialUsers(USERS, USER_RATE, {from: LISTER})
                );
            });
        });
        
    });

    describe('Public Sales Special Users List', () => {
        describe('Add Public Sales Special User', () => {

            beforeEach(async () => {
                whitelistedCrowdsaleInstance = await WhitelistedCrowdsale.new({
                    from: OWNER
                });
                
                await whitelistedCrowdsaleInstance.setLister(LISTER, {from: OWNER});
            });
    
            it('should add a user', async () => {
                let userOneRateBeforeAdding = await whitelistedCrowdsaleInstance.publicSalesSpecialUsers(USER_ONE);
    
                await whitelistedCrowdsaleInstance.addPublicSalesSpecialUser(USER_ONE, {from: LISTER});
    
                let userOneRateAfterAdding = await whitelistedCrowdsaleInstance.publicSalesSpecialUsers(USER_ONE);
    
                await assert.isTrue(!userOneRateBeforeAdding, "Invalid rate status before adding");
                await assert.isTrue(userOneRateAfterAdding, "Invalid rate status after adding");
            });
          
            it('should throw if non-owner try to add publicsales special user', async () => {
                await expectThrow(
                    whitelistedCrowdsaleInstance.addPublicSalesSpecialUser(USER_ONE, {from: NOT_OWNER})
                );
            });
    
            it('should throw if the input user address is invalid', async () => {
                await expectThrow(
                    whitelistedCrowdsaleInstance.addPublicSalesSpecialUser("0x0", {from: LISTER})
                );
            });
        });

        describe('Add Multiple Public Sales Special Users', () => {
            it('should add multiple public sales users', async () => {
                const USERS = generateUsers(2);

                let tx = await whitelistedCrowdsaleInstance.addMultiplePublicSalesSpecialUser(USERS, {from: LISTER});

                let firstAddedUserRate = await whitelistedCrowdsaleInstance.publicSalesSpecialUsers.call(USERS[0]);
                let secondAddedUserRate = await whitelistedCrowdsaleInstance.publicSalesSpecialUsers.call(USERS[1]);

                assert.isTrue(firstAddedUserRate, "User is not set as public sales special one");
                assert.isTrue(secondAddedUserRate, "User is not set as public sales special one");
            });

            it('should throw when the passed users count is over the limit', async () => {
                // We need 201 users to over the limit, but generateUsers skips the multiples of ten numbers,
                // that is why we use 223 which is equivalent to 201
                const USERS = generateUsers(223);
                const USER_RATE = 150;

                await expectThrow(
                    whitelistedCrowdsaleInstance.addMultiplePublicSalesSpecialUser(USERS, {from: LISTER})
                );
            });
        });
    
        describe('Remove Public Sales Special User', () => {
    
            beforeEach(async () => {
                whitelistedCrowdsaleInstance = await WhitelistedCrowdsale.new({
                    from: OWNER
                });
                
                await whitelistedCrowdsaleInstance.setLister(LISTER, {from: OWNER});
            });
    
            it('should remove a user', async () => {
    
                await whitelistedCrowdsaleInstance.addPublicSalesSpecialUser(USER_ONE, {from: LISTER});
    
                let userOneRateBeforeRemoving = await whitelistedCrowdsaleInstance.publicSalesSpecialUsers(USER_ONE);
    
                await whitelistedCrowdsaleInstance.removePublicSalesSpecialUser(USER_ONE, {from: LISTER});
    
                let userOneRateAfterRemoving = await whitelistedCrowdsaleInstance.publicSalesSpecialUsers(USER_ONE);
    
                await assert.isTrue(userOneRateBeforeRemoving, "Invalid rate status before removing");
                await assert.isTrue(!userOneRateAfterRemoving, "Invalid rate status after removing");
            });
    
            it('should throw if non-owner try to remove a publicsales special user', async () => {
                await expectThrow(
                    whitelistedCrowdsaleInstance.removePublicSalesSpecialUser(USER_ONE, {from: NOT_OWNER})
                );
            });
    
            it('should throw if input user address is invalid', async () => {
                await expectThrow(
                    whitelistedCrowdsaleInstance.removePublicSalesSpecialUser("0x0", {from: LISTER})
                );
            });
        });
    });

    describe('Lister Set Up', () => {

        beforeEach(async () => {
            whitelistedCrowdsaleInstance = await WhitelistedCrowdsale.new({
				from: OWNER
            });
        });
        
        it('should process lister set up', async () => {
            await whitelistedCrowdsaleInstance.setLister(LISTER, {from: OWNER});
            let setLister = await whitelistedCrowdsaleInstance.lister.call();

            assert.equal(LISTER, setLister, "Lister is not correctly set");            
        });

        it('should throw if non-owner try to set lister', async () => {
            await expectThrow(
                whitelistedCrowdsaleInstance.setLister(LISTER, {from: NOT_OWNER})
            );
        });

        it('should throw if input user address is invalid', async () => {
            await expectThrow(
                whitelistedCrowdsaleInstance.setLister("0x0", {from: LISTER})
            );
        });
    });
});