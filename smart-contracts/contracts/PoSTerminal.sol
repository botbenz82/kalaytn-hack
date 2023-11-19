// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./Vault.sol";

contract PoSTerminal is Ownable {
    function transferAndCall(
        address vaultAddress,
        address tokenAddress,
        uint256 amount,
        bytes memory signature,
        address target,
        bytes memory data
    ) public payable onlyOwner {
        Vault(vaultAddress).transfer(tokenAddress, amount, signature);

        (bool success, ) = target.call{value: msg.value}(data);
        require(success, "call not successful");
    }

    function withdraw() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    function withdrawToken(address _token) public onlyOwner {
        IERC20 token = IERC20(_token);
        token.transfer(owner(), token.balanceOf(address(this)));
    }

    function call(
        address payable addr,
        bytes memory data
    ) public payable onlyOwner {
        (bool success, ) = addr.call{value: msg.value}(data);
        require(success, "call not successful");
    }
}
