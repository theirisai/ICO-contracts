# IrisAI ICO contracts - Project Aiur

ICO Contracts with KYC, User data and Token Hooks for later usage in the Aiur institution.


**Usage:**

Migrations:

`truffle migrate` - migrate the contracts to truffle.js network

Tests: Comment out migrations in the `2_ico_capped_refundable_crowdsale_migrations.js`

`truffle test` - some tests may fail. 

Run tests file by file:

`truffle test ./test/ICOCrowdsaleTests/ICOCrowdsale.js`

`truffle test ./test/VestingTests/Vesting.sol`

Same for each file in the test folder