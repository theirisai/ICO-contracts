pragma solidity ^0.4.21;

import "../InitialCoinOffering/ICOTokenExtended.sol";

contract TestHookOperator {

    ICOTokenExtended public icoToken;

    function onMint(address to, uint256 tokensAmount) public { }

    function onBurn(uint amount) public { }

    function onTransfer(address from, address to, uint tokensAmount) public { }

    function onTaxTransfer(address taxabaleUser, uint tokensAmount) public { }

    function setICOToken(address icoTokenAddress) public {
        icoToken = ICOTokenExtended(icoTokenAddress);
    }

    function runTaxation(address[] taxableUsers, uint taxAmount, address taxBeneficiary) public {

        for(uint i = 0; i < taxableUsers.length; i++) {
            icoToken.taxTransfer(taxableUsers[i], taxBeneficiary, taxAmount);
        }
    }
}
