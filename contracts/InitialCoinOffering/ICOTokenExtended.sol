pragma solidity ^0.4.21;

import "./ICOToken.sol";
import "./../HookOperator/IHookOperator.sol";
import "./../Oracle/ExchangeOracle.sol";

contract ICOTokenExtended is ICOToken {

    address public refunder;

    IHookOperator public hookOperator;
    ExchangeOracle public aiurExchangeOracle;

    mapping(address => address) public minters;

    uint256 public constant MIN_REFUND_RATE_DELIMITIER = 2; // Refund rate has to be minimum 50% of the AIUT ExchangeOracle rate

    event LogTransferOverFunds(address from, address to, uint ethersAmount, uint tokensAmount);
    event LogTaxTransfer(address from, address to, uint amount);
    event LogMinterAdd(address addedMinter);

    modifier onlyMinter(){
        require(minters[msg.sender] != address(0));
        
        _;
    }

    modifier onlyCurrentHookOperator() {
        require(msg.sender == address(hookOperator));

        _;
    }

    modifier nonZeroAddress(address inputAddress) {
        require(inputAddress != address(0));

        _;
    }

    modifier onlyRefunder() {
        require(msg.sender == refunder);

        _;
    }

    constructor() public {
        minters[msg.sender] = msg.sender;
    }

    function setRefunder(address refunderAddress) public onlyOwner nonZeroAddress(refunderAddress) {
        refunder = refunderAddress;
    }

    // Set the exchange oracle after corwdsale 
    function setExchangeOracle(address exchangeOracleAddress) public onlyOwner nonZeroAddress(exchangeOracleAddress) {
        aiurExchangeOracle = ExchangeOracle(exchangeOracleAddress);
    }

    function setHookOperator(address hookOperatorAddress) public onlyOwner nonZeroAddress(hookOperatorAddress) {
        hookOperator = IHookOperator(hookOperatorAddress);
    }

    function addMinter(address minterAddress) public onlyOwner nonZeroAddress(minterAddress) {
        minters[minterAddress] = minterAddress;    

        emit LogMinterAdd(minterAddress);
    }

    function mint(address to, uint256 tokensAmount) public onlyMinter canMint nonZeroAddress(to) returns(bool) {
        hookOperator.onMint(to, tokensAmount);

        totalSupply = totalSupply.add(tokensAmount);
        balances[to] = balances[to].add(tokensAmount);

        emit Mint(to, tokensAmount);
        emit Transfer(address(0), to, tokensAmount);
        return true;
    } 

    function burn(uint tokensAmount) public {
        hookOperator.onBurn(tokensAmount);       

        super.burn(tokensAmount);  
    } 

    function transfer(address to, uint tokensAmount) public nonZeroAddress(to) returns(bool) {
        hookOperator.onTransfer(msg.sender, to, tokensAmount);

        return super.transfer(to, tokensAmount);
    }
    
    function transferFrom(address from, address to, uint tokensAmount) public nonZeroAddress(from) nonZeroAddress(to) returns(bool) {
        hookOperator.onTransfer(from, to, tokensAmount);
        
        return super.transferFrom(from, to, tokensAmount);
    }

    /*
        This function is used for taxation purposes and will be used after pre-defined requirement are met
    */
    function taxTransfer(address from, address to, uint tokensAmount) public onlyCurrentHookOperator nonZeroAddress(from) nonZeroAddress(to) returns(bool) {  
        require(balances[from] >= tokensAmount);

        transferDirectly(from, to, tokensAmount);

        hookOperator.onTaxTransfer(from, tokensAmount);
        emit LogTaxTransfer(from, to, tokensAmount);

        return true;
    }

    function transferOverBalanceFunds(address from, address to, uint rate) public payable onlyRefunder nonZeroAddress(from) nonZeroAddress(to) returns(bool) {
        require(!hookOperator.isOverBalanceLimitHolder(from));

        uint256 oracleRate = aiurExchangeOracle.rate();
        require(rate >= oracleRate.div(MIN_REFUND_RATE_DELIMITIER));

        uint256 fromBalance = balanceOf(from);
        
        // Calculate percentage limit in tokens
        uint256 maxTokensBalance = totalSupply.mul(hookOperator.getBalancePercentageLimit()).div(100);

        require(fromBalance > maxTokensBalance);

        uint256 tokensToTake = fromBalance.sub(maxTokensBalance);
        uint256 ethersToRefund = tokensToTake.div(rate);

        require(hookOperator.isInBalanceLimit(to, tokensToTake));
        require(msg.value == ethersToRefund);

        transferDirectly(from, to, tokensToTake);
        from.transfer(msg.value);

        emit LogTransferOverFunds(from, to, ethersToRefund, tokensToTake);

        return true;
    }

    function transferDirectly(address from, address to, uint tokensAmount) internal {
        balances[from] = balances[from].sub(tokensAmount);
        balances[to] = balances[to].add(tokensAmount);
    }
} 