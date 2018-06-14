pragma solidity ^0.4.21;

import "./ICOTokenExtended.sol";

import "./../../node_modules/zeppelin-solidity/contracts/crowdsale/FinalizableCrowdsale.sol";
import "./../../node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol";
import "./../../node_modules/zeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "./../../node_modules/zeppelin-solidity/contracts/math/SafeMath.sol";
import "./WhitelistedCrowdsale/WhitelistedCrowdsale.sol";
import "./../UserManager/IUserManager.sol";

contract ICOCrowdsale is Ownable, FinalizableCrowdsale, WhitelistedCrowdsale {
    using SafeMath for uint256;

    IUserManager public userManagerContract;

    uint256 public preSalesEndDate;
    uint256 public totalMintedBountyTokens;
    bool public isPresalesNotEndedInAdvance = true;

    uint256 public constant MIN_CONTRIBUTION_AMOUNT = 50 finney; // 0.05 ETH
    uint256 public constant MAX_BOUNTYTOKENS_AMOUNT = 40000 * (10**18); // 10 000 tokens
    uint256 public constant MAX_FUNDS_RAISED_DURING_PRESALE = 9000 ether;
    
    /*
        The limit below allows a user to have maximum tokens balance of 2%(160 000 tokens) of the hard cap(80 000 ethers)
        It only applies through crowdsale period
    */
    uint256 public constant MAX_USER_TOKENS_BALANCE = 160000 * (10**18); // 160 000 tokens

    // 0.01 eth = 1 token
    uint256 public constant REGULAR_RATE = 100;
    uint256 public constant PUBLIC_SALES_SPECIAL_USERS_RATE = 120; // 20% bonus

    uint256 public constant DEFAULT_CROWDSALE_DURATION = 7 weeks;
    uint256 public constant DEFAULT_PRESALES_DURATION = 3 weeks;
    uint256 public constant MAX_PRESALES_EXTENSION= 12 weeks;

    /*
        The public sales periods ends:
            PUBLIC_SALES_1_PERIOD_END = 1 weeks / Public sales 1 period starts from private sales period and expires one week after the private sales end
            PUBLIC_SALES_2_PERIOD_END = 2 weeks / Public sales 2 period starts from public sales 1 period and expires on the 2-nd week after the private sales end
            PUBLIC_SALES_3_PERIOD_END = 3 weeks / Public sales 3 period starts from public sales 2 period and expires on the 3-th week after the private sales end
    */
    uint256 public constant PUBLIC_SALES_1_PERIOD_END = 1 weeks;
    uint256 public constant PUBLIC_SALES_2_PERIOD_END = 2 weeks;
    uint256 public constant PUBLIC_SALES_3_PERIOD_END = 3 weeks;

    uint256 public constant PUBLIC_SALES_1_RATE = 115; // 15% bonus
    uint256 public constant PUBLIC_SALES_2_RATE = 110; // 10% bonus
    uint256 public constant PUBLIC_SALES_3_RATE = 105; // 5% bonus

    event LogBountyTokenMinted(address minter, address beneficiary, uint256 amount);
    event LogPrivatesaleExtend(uint extensionTime);

    constructor(uint256 startTime, uint256 endTime, address wallet, address hookOperatorAddress) public
        FinalizableCrowdsale()
        Crowdsale(startTime, endTime, REGULAR_RATE, wallet)
    {
        require((endTime.sub(startTime)) == DEFAULT_CROWDSALE_DURATION);

        // Set default presales end date
        preSalesEndDate = startTime.add(DEFAULT_PRESALES_DURATION);
        

        ICOTokenExtended icoToken = ICOTokenExtended(token);
        icoToken.setHookOperator(hookOperatorAddress);
    }

    function createTokenContract() internal returns (MintableToken) {

        ICOTokenExtended icoToken = new ICOTokenExtended();

        icoToken.pause();

        return icoToken;
    }

    function finalization() internal {
        super.finalization();

        ICOTokenExtended icoToken = ICOTokenExtended(token);

        icoToken.transferOwnership(owner);
    }

    // The extensionTime is in seconds
    function extendPreSalesPeriodWith(uint extensionTime) public onlyOwner {
        require(extensionTime <= MAX_PRESALES_EXTENSION);
        
        preSalesEndDate = preSalesEndDate.add(extensionTime);

        emit LogPrivatesaleExtend(extensionTime);
    }

    function buyTokens(address beneficiary) public payable {
        require(msg.value >= MIN_CONTRIBUTION_AMOUNT);
        require(beneficiary != address(0));
        require(validPurchase());

        uint256 weiAmount = msg.value;

        // calculate token amount to be created
        uint256 tokens = getTokenAmount(weiAmount, beneficiary);

        // Check for maximum user's tokens amount overflow
        uint256 beneficiaryBalance = token.balanceOf(beneficiary);
        require(beneficiaryBalance.add(tokens) <= MAX_USER_TOKENS_BALANCE);

        // // update state
        weiRaised = weiRaised.add(weiAmount);

        if(weiRaised >= MAX_FUNDS_RAISED_DURING_PRESALE && isPresalesNotEndedInAdvance){
            preSalesEndDate = now;
            isPresalesNotEndedInAdvance = false;
        }

        token.mint(beneficiary, tokens);

        userManagerContract.markUserAsFounder(beneficiary);

        emit TokenPurchase(msg.sender, beneficiary, weiAmount, tokens);

        forwardFunds();
    }

    function getTokenAmount(uint256 weiAmount, address beneficiaryAddress) internal view returns(uint256 tokenAmount) {
        uint256 crowdsaleRate = getRate(beneficiaryAddress);

        return weiAmount.mul(crowdsaleRate);
    }

    function getRate(address beneficiary) internal view returns(uint256) {

        if(now <= preSalesEndDate && weiRaised < MAX_FUNDS_RAISED_DURING_PRESALE){
            if(preSalesSpecialUsers[beneficiary] > 0){
                return preSalesSpecialUsers[beneficiary];
            }

            return REGULAR_RATE;
        }

        if(publicSalesSpecialUsers[beneficiary]){
            return PUBLIC_SALES_SPECIAL_USERS_RATE;
        }

        if(now <= preSalesEndDate.add(PUBLIC_SALES_1_PERIOD_END)) {
            return PUBLIC_SALES_1_RATE;
        }

        if(now <= preSalesEndDate.add(PUBLIC_SALES_2_PERIOD_END)) {
            return PUBLIC_SALES_2_RATE;
        }

        if(now <= preSalesEndDate.add(PUBLIC_SALES_3_PERIOD_END)) {
            return PUBLIC_SALES_3_RATE;
        }

        return REGULAR_RATE;
    }

    function createBountyToken(address beneficiary, uint256 amount) public onlyOwner returns(bool) {
        require(!hasEnded());
        require(totalMintedBountyTokens.add(amount) <= MAX_BOUNTYTOKENS_AMOUNT);

        totalMintedBountyTokens = totalMintedBountyTokens.add(amount);
        token.mint(beneficiary, amount);
        emit LogBountyTokenMinted(msg.sender, beneficiary, amount);

        return true;
    }

    function setUserManagerContract(address userManagerInstance) public onlyOwner {
        require(userManagerInstance != address(0));

        userManagerContract = IUserManager(userManagerInstance);
    }
}