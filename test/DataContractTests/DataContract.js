const DataContract = artifacts.require("./Data/DataContract.sol");
const DataContractProxy = artifacts.require("./Data/DataContractProxy.sol");
const IDataContract = artifacts.require("./Data/IDataContract.sol");

let LinkedList = artifacts.require("./LinkedList/LinkedList.sol");

const DataContractTest = artifacts.require("./TestPurpose/DataContract/TestDataUpgradeability.sol");
const IDataContractTest = artifacts.require("./TestPurpose/DataContract/ITestDataUpgradeability.sol");

const expectThrow = require('./../util').expectThrow;
const timeTravel = require('./../util').timeTravel;
const web3FutureTime = require('./../util').web3FutureTime;
const web3Now = require('./../util').web3Now;
require('./../assertExtensions');

contract('DataContract', function (accounts) {

	const WEI_IN_ETHER = 1000000000000000000;

	const OWNER = accounts[0];
	const USER_ONE = accounts[1];
    const USER_TWO = accounts[2];
    const USER_THREE = accounts[3];
    const NOT_OWNER = accounts[4];

    const USER_MANAGER_ADDRESS = accounts[5];
    const USER_FACTORY = accounts[6];

	const DAY = 24 * 60 * 60;

    const TAX_PERCENTAGE = 2; // 2%
    const TAXATION_PERIOD = DAY; 
    
    const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

    let dataInstance;

    async function initDataContract() {
        let linkedListInstance = await LinkedList.new();
        DataContract.link("LinkedList", linkedListInstance.address);
        
        let dataContract = await DataContract.new();
        let dataContractProxy = await DataContractProxy.new(dataContract.address);
        dataInstance = await IDataContract.at(dataContractProxy.address);

        await dataInstance.init({from: OWNER});
    }

    describe('Initializing DataContract', () => {
        
        it('should set initial values correctly', async () => {
            await initDataContract();

            let dataOwner = await dataInstance.getOwner();

            assert.strictEqual(OWNER, dataOwner, "The expected owner is not set");
        });
    });

    describe('Setters', () => {

        beforeEach(async () => {
            await initDataContract();
        });

        describe('Set User Manager', () => {
        
            it('should set user manager correctly', async () => {
                await dataInstance.setUserManager(USER_MANAGER_ADDRESS, {from: OWNER});
    
                let userManager = await dataInstance.getUserManager();
    
                assert.strictEqual(USER_MANAGER_ADDRESS, userManager, "User manager is not set correctly");
            });
    
            it('should throw if non-owner try to set user manager', async () => {
                await expectThrow(
                    dataInstance.setUserManager(USER_MANAGER_ADDRESS, {from: NOT_OWNER})
                );
            });
    
            it('should throw when invalid user manager is used (zero address)', async () => {
                await expectThrow(
                    dataInstance.setUserManager(ZERO_ADDRESS, {from: OWNER})
                );
            });
        });

        describe('Set User Factory', () => {
            it('should set user factory correctly', async () => {
                await dataInstance.setUserFactory(USER_FACTORY, {from: OWNER});
    
                let userFactory = await dataInstance.getUserFactory();
    
                assert.strictEqual(USER_FACTORY, userFactory, "User Factory is not set correctly");
            });
    
            it('should throw if non-owner try to set user factory', async () => {
                await expectThrow(
                    dataInstance.setUserFactory(USER_FACTORY, {from: NOT_OWNER})
                );
            });
    
            it('should throw when invalid user factory is used (zero address)', async () => {
                await expectThrow(
                    dataInstance.setUserFactory(ZERO_ADDRESS, {from: OWNER})
                );
            });
        });
    
        describe('Set Tax Percentage', () => {
    
            beforeEach(async () => {
                await dataInstance.setUserManager(USER_MANAGER_ADDRESS, {from: OWNER});
            });
    
            it('should set tax percentage correctly', async () => {
                await dataInstance.setTaxPercentage(TAX_PERCENTAGE, {from: USER_MANAGER_ADDRESS})
    
                let taxPercentage = await dataInstance.getTaxPercentage();
    
                assert.bigNumberEQNumber(taxPercentage, TAX_PERCENTAGE, "Tax percentage is not set correctly");
            });
    
            it('should throw if non-owner try to set taxpercentage', async () => {
                await expectThrow(
                    dataInstance.setTaxPercentage(TAX_PERCENTAGE, {from: NOT_OWNER})
                );
            });
        });
    
        describe('Set Taxation Period in Seconds', () => {
            
            beforeEach(async () => {
                await dataInstance.setUserManager(USER_MANAGER_ADDRESS, {from: OWNER});
            });
    
            it('should set taxation period correctly', async () => {
               await dataInstance.setTaxationPeriodInSeconds(TAXATION_PERIOD, {from: USER_MANAGER_ADDRESS})
    
               let taxationPeriod = await dataInstance.getTaxationPeriodInSeconds();
    
               assert.bigNumberEQNumber(taxationPeriod, TAXATION_PERIOD, "Taxation period is not set correctly");
            });
    
            it('should throw if non-owner try to set taxation period', async () => {
                await expectThrow(
                    dataInstance.setTaxationPeriodInSeconds(TAXATION_PERIOD, {from: NOT_OWNER})
                );
            });
        });
    });

    describe("Add", () => {
        
        beforeEach(async () => {
            await initDataContract();

            await dataInstance.setUserFactory(USER_FACTORY, {from: OWNER});
        });

        it("should add new user", async () => {
            await dataInstance.add(USER_ONE, {from: USER_FACTORY});
            let userAddress = await dataInstance.peek(USER_ONE);
            
            assert.strictEqual(userAddress, USER_ONE, "User wasn't added to the linked list");
        });

        it("should add correct head", async () => {
            await dataInstance.add(USER_ONE, {from: USER_FACTORY});
            await dataInstance.add(USER_TWO, {from: USER_FACTORY});

            let head = await dataInstance.getHead();

            assert.strictEqual(head, USER_ONE, `The returned head is invalid. It should be ${USER_ONE} instead of ${head}`);
        });

        it("should throw when non hook operator tries to add a new user", async () => {
            await expectThrow(
                dataInstance.add(USER_ONE, {from: NOT_OWNER})
            );
        });

        it("should throw when invalid user is used (zero address)", async () => {
            await expectThrow(
                dataInstance.add(ZERO_ADDRESS, {from: USER_FACTORY})
            ); 
        });
    });

    describe("Move to End", () => {
        
        beforeEach(async () => {
            await initDataContract();

            await dataInstance.setUserManager(USER_MANAGER_ADDRESS, {from: OWNER});
            await dataInstance.setUserFactory(USER_FACTORY, {from: OWNER});
        });

        it("should move a user to the end of linked list", async () => {
            await dataInstance.add(USER_ONE, {from: USER_FACTORY});
            await dataInstance.add(USER_TWO, {from: USER_FACTORY});
            await dataInstance.add(USER_THREE, {from: USER_FACTORY});

            let currentTail = await dataInstance.getTail();
            let currentHead = await dataInstance.getHead();

            assert.strictEqual(currentTail, USER_THREE, "The tail is invalid");
            assert.strictEqual(currentHead, USER_ONE, "The head is invalid");

            await dataInstance.moveToEnd(USER_ONE, {from: USER_MANAGER_ADDRESS});

            let updatedTail = await dataInstance.getTail();
            let updatedHead = await dataInstance.getHead();

            assert.strictEqual(updatedTail, USER_ONE, `The tail is invalid. It should be ${USER_ONE} but it returned ${updatedTail}`);
            assert.strictEqual(updatedHead, USER_TWO, `The head is invalid. It should be ${USER_TWO} but it returned ${updatedHead}`);
        });

        it("should move node situated between other 2 users ", async () => {
            await dataInstance.add(USER_ONE, {from: USER_FACTORY});
            await dataInstance.add(USER_TWO, {from: USER_FACTORY});
            await dataInstance.add(USER_THREE, {from: USER_FACTORY});

            let currentTail = await dataInstance.getTail();
            assert.strictEqual(currentTail, USER_THREE, "Invalid current tail");

            let secondNodeData = await dataInstance.getNodeData(USER_TWO); 
            let nextNode = secondNodeData[2];
            assert.strictEqual(nextNode, USER_THREE, "Next node is invalid");

            await dataInstance.moveToEnd(USER_TWO, {from: USER_MANAGER_ADDRESS});

            let seconNodeMovedData = await dataInstance.getNodeData(USER_TWO); 
            let nextNodeMoved = seconNodeMovedData[2];
            assert.strictEqual(nextNodeMoved, ZERO_ADDRESS, "Node not moved");

            let updatedTail = await dataInstance.getTail();
            assert.strictEqual(updatedTail, USER_TWO, "Invalid updated tail");
        });

        it("should move all users from the first to last", async () => {
            await dataInstance.add(USER_ONE, {from: USER_FACTORY});
            await dataInstance.add(USER_TWO, {from: USER_FACTORY});
            await dataInstance.add(USER_THREE, {from: USER_FACTORY});

            // Check for valid length
            let listLength = await dataInstance.getLinkedListLength();
            assert.strictEqual(listLength.toString(), "3", "Linked list length is invalid");

            // Check for valid current head
            let currentHead = await dataInstance.getHead();
            assert.strictEqual(currentHead, USER_ONE, "Current head is invalid");

            // Check for valid current tail
            let currentTail = await dataInstance.getTail();
            assert.strictEqual(currentTail, USER_THREE, "Current tail is invalid");

            // Check for valid nodes
            let userOneData = await dataInstance.getNodeData(USER_ONE);
            assert.strictEqual(userOneData[0], USER_ONE, "Invalid user data address");
            assert.strictEqual(userOneData[1], ZERO_ADDRESS, "Invalid previous node. Should be the zero address");
            assert.strictEqual(userOneData[2], USER_TWO, "Invalid next node. Should be the second node address");

            let userTwoData = await dataInstance.getNodeData(USER_TWO);
            assert.strictEqual(userTwoData[0], USER_TWO, "Invalid user data address");
            assert.strictEqual(userTwoData[1], USER_ONE, "Invalid previous node. Should be the first node address");
            assert.strictEqual(userTwoData[2], USER_THREE, "Invalid next node. Should be the third node address");

            let userThreeData = await dataInstance.getNodeData(USER_THREE);
            assert.strictEqual(userThreeData[0], USER_THREE, "Invalid user data address");
            assert.strictEqual(userThreeData[1], USER_TWO, "Invalid previous node. Should be the second node address");
            assert.strictEqual(userThreeData[2], ZERO_ADDRESS, "Invalid next node. Should be the zero address");

            // Moves the first node
            await dataInstance.moveToEnd(USER_ONE, {from: USER_MANAGER_ADDRESS});

            // Check for updated linked list head
            let firstTimeUpdatedHead = await dataInstance.getHead();
            assert.strictEqual(firstTimeUpdatedHead, USER_TWO, "Invalid updated head");

            // Check for updated linked list tail
            let firstTimeUpdatedTail = await dataInstance.getTail();
            assert.strictEqual(firstTimeUpdatedTail, USER_ONE, "Invalid updated tail");

            // Check for valid nodes after we have moved the first one
            let movedUserOneData = await dataInstance.getNodeData(USER_ONE);
            assert.strictEqual(movedUserOneData[1], USER_THREE, "Invalid previous node. Should be the third node address");
            assert.strictEqual(movedUserOneData[2], ZERO_ADDRESS, "Invalid next node. Should be the zero address");

            let movedUserTwoData = await dataInstance.getNodeData(USER_TWO);
            assert.strictEqual(movedUserTwoData[1], ZERO_ADDRESS, "Invalid previous node. Should be the zero address");

            let movedUserThreeData = await dataInstance.getNodeData(USER_THREE);
            assert.strictEqual(movedUserThreeData[2], USER_ONE, "Invalid next node. Should be the move first node");

            // Make a second move. We're moving the second node
            await dataInstance.moveToEnd(USER_TWO, {from: USER_MANAGER_ADDRESS});

            // Check for updated linked list head. It should pointing to the third node address
            let secondTimeUpdatedHead = await dataInstance.getHead();
            assert.strictEqual(secondTimeUpdatedHead, USER_THREE, "Invalid updated tail. Should be the third node address");

            // Check for updated linked list tail. It should pointing to the second node address
            let secondTimeUpdatedTail = await dataInstance.getTail();
            assert.strictEqual(secondTimeUpdatedTail, USER_TWO, "Invalid updated tail. Should be the second node address");

            // Check for valid nodes after we have moved the second one
            movedUserThreeData = await dataInstance.getNodeData(USER_THREE);
            assert.strictEqual(movedUserThreeData[1], ZERO_ADDRESS, "Invalid previous node. Should be the zero address");

            movedUserOneData = await dataInstance.getNodeData(USER_ONE);
            assert.strictEqual(movedUserOneData[2], USER_TWO, "Invalid next node. Should be the moved second node address");

            movedUserTwoData = await dataInstance.getNodeData(USER_TWO);
            assert.strictEqual(movedUserTwoData[1], USER_ONE, "Invalid previous node. Should be the first node address");
            assert.strictEqual(movedUserTwoData[2], ZERO_ADDRESS, "Invalid next node. Should be the zero address");

            // Make a third move. We're moving the third node
            await dataInstance.moveToEnd(USER_THREE, {from: USER_MANAGER_ADDRESS});

            // Check for updated linked list head. It should pointing to the first node address
            let thirdTimeUpdatedHead = await dataInstance.getHead();
            assert.strictEqual(thirdTimeUpdatedHead, USER_ONE, "Invalid updated head. Should be the first node address");

            // Check for updated linked list tail. It should pointing to the third node address
            let thirdTimeUpdatedTail = await dataInstance.getTail();
            assert.strictEqual(thirdTimeUpdatedTail, USER_THREE, "Invalid updated tail. Should be the third node address");

            // Check for valid nodes after we have moved the second one
            movedUserOneData = await dataInstance.getNodeData(USER_ONE);
            assert.strictEqual(movedUserOneData[1], ZERO_ADDRESS, "Invalid previous node. Should be the zero address");

            movedUserTwoData = await dataInstance.getNodeData(USER_TWO);
            assert.strictEqual(movedUserTwoData[2], USER_THREE, "Invalid next node. Should be the moved third node address");

            movedUserThreeData = await dataInstance.getNodeData(USER_THREE);
            assert.strictEqual(movedUserThreeData[1], USER_TWO, "Invalid previous node. Should be the second node address");
            assert.strictEqual(movedUserThreeData[2], ZERO_ADDRESS, "Invalid next node. Should be the zero address");
        });

        it("should throw when we want to move user which doesn't exist in the linked list", async () => {
            await expectThrow(
                dataInstance.moveToEnd(USER_ONE, {from: USER_MANAGER_ADDRESS})
            );
        });

        it("should throw when non user manager tries to move the a user", async () => {
            await dataInstance.add(USER_ONE, {from: USER_FACTORY});
            await dataInstance.add(USER_TWO, {from: USER_FACTORY});
            await dataInstance.add(USER_THREE, {from: USER_FACTORY});

            await expectThrow(
                dataInstance.moveToEnd(USER_ONE, {from: NOT_OWNER})
            );
        });

        it("should throw when there is only 1 user and we're trying to move it", async () => {
            await dataInstance.add(USER_ONE, {from: USER_FACTORY});

            await expectThrow(
                dataInstance.moveToEnd(USER_ONE, {from: USER_MANAGER_ADDRESS})
            );
        });

        it("should throw when we're trying to move the last user", async () => {
            await dataInstance.add(USER_ONE, {from: USER_FACTORY});
            await dataInstance.add(USER_TWO, {from: USER_FACTORY});

            await expectThrow(
                dataInstance.moveToEnd(USER_TWO, {from: USER_MANAGER_ADDRESS})
            );
        }); 
    });

    describe('Ownership', () => {
		
		let NEW_OWNER = accounts[5];

		beforeEach(async () => {
			await initDataContract();
		});

		it('should transfer ownership successfuly', async () => {
			await dataInstance.transferOwnership(NEW_OWNER, {from: OWNER});
			let dataOwner = await dataInstance.getOwner();

			assert.strictEqual(NEW_OWNER, dataOwner, "Ownership is not transfered");
		});

		it('should throw if non-owner try to transfer ownership', async () => {
			await expectThrow(
				dataInstance.transferOwnership(NEW_OWNER, {from: NOT_OWNER})
			);
		});

		it('should throw if new owner\'s address is zero', async () => {
			await expectThrow(
				dataInstance.transferOwnership(ZERO_ADDRESS, {from: OWNER})
			);
		});
	});

    describe('Upgradeability', () => {

        let newImplementationInstance;

        beforeEach(async () => {
            await initDataContract();

            let linkedListInstance = await LinkedList.new();
            
            DataContractTest.link("LinkedList", linkedListInstance.address);
            newImplementationInstance = await DataContractTest.new({from: OWNER});
        });

        it('should keep the data state after upgrade', async () => {
            await dataInstance.setUserFactory(USER_FACTORY, {from: OWNER});
            await dataInstance.add(USER_ONE, {from: USER_FACTORY});

            await dataInstance.upgradeImplementation(newImplementationInstance.address, {from: OWNER});
            let upgradedDataContract = await IDataContractTest.at(dataInstance.address);

            let userAddress = await upgradedDataContract.peek(USER_ONE);

            assert.strictEqual(userAddress, USER_ONE, "The contract state was not saved on upgrade");
        });

        it('should add new functionality', async () => {
            const DEFAULT_TAX_PERCENTAGE = 10;
            const PERCENTAGE_DELIMITER = 5;

            await dataInstance.upgradeImplementation(newImplementationInstance.address, {from: OWNER});

            let upgradedDataContract = await IDataContractTest.at(dataInstance.address);

            await upgradedDataContract.setTaxPercentage(DEFAULT_TAX_PERCENTAGE);
            await upgradedDataContract.setPercentageDelimiter(PERCENTAGE_DELIMITER);

            let newImplementationTaxPercentage = await upgradedDataContract.getTaxPercentage();


            assert.bigNumberEQNumber(newImplementationTaxPercentage, DEFAULT_TAX_PERCENTAGE / PERCENTAGE_DELIMITER, "The upgrade is not update the contract logic");
        });

        it('should throw if non-owner try to upgrade', async () => {
            await expectThrow(
                dataInstance.upgradeImplementation(newImplementationInstance.address, {from: NOT_OWNER})
            );
        });
    });
});