// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract Vault is Ownable {
    using ECDSA for bytes32;

    event Transfer(address indexed token, address indexed to, uint256 amount);
    VaultFactory private factory;

    address temporaryKey;

    function updateKey(address _key) public onlyOwner {
        _updateKey(_key);
    }

    function _updateKey(address _key) private {
        temporaryKey = _key;
    }

    constructor(address _key, address owner) {
        temporaryKey = _key;
        _transferOwnership(owner);
        factory = VaultFactory(msg.sender);
    }

    function getFactory() public view returns (address) {
        return address(factory);
    }

    function withdraw() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    function withdrawToken(address _token) public onlyOwner {
        IERC20 token = IERC20(_token);
        token.transfer(owner(), token.balanceOf(address(this)));
    }

    function transfer(
        address addr,
        uint256 amount,
        bytes memory signature
    ) public payable {
        require(factory.isTerminal(msg.sender), "unauthorized");
        bytes32 signedMessageHash = keccak256(abi.encodePacked(addr, amount))
            .toEthSignedMessageHash();

        require(
            signedMessageHash.recover(signature) == temporaryKey,
            "invalid signature"
        );
        _updateKey(address(0));

        IERC20(addr).transfer(msg.sender, amount);
        emit Transfer(addr, msg.sender, amount);
    }

    function call(
        address payable addr,
        bytes memory data,
        bytes memory signature,
        address tokenAddress,
        uint256 amount
    ) public payable {
        require(factory.isTerminal(msg.sender), "unauthorized");

        bytes32 signedMessageHash = keccak256(
            abi.encodePacked(addr, msg.value, data)
        ).toEthSignedMessageHash();

        require(
            signedMessageHash.recover(signature) == temporaryKey,
            "invalid signature"
        );
        _updateKey(address(0));

        // You can send ether and specify a custom gas amount
        (bool success, ) = addr.call{value: msg.value}(data);
        require(success, "call not successful");
        emit Transfer(tokenAddress, msg.sender, amount);
    }
}

contract VaultFactory is Ownable {
    // Add the library methods
    using EnumerableSet for EnumerableSet.AddressSet;

    // Declare a set state variable
    EnumerableSet.AddressSet private terminals;

    // vault owners. One per owner
    mapping(address => address) private vaults;

    function deploy(address key) public {
        require(vaults[msg.sender] == address(0), "vault already exists");
        Vault vault = new Vault(key, msg.sender);
        vaults[msg.sender] = address(vault);
    }

    function addTerminal(address terminal) public onlyOwner {
        terminals.add(terminal);
    }

    function remove(address terminal) public onlyOwner {
        terminals.remove(terminal);
    }

    function isTerminal(address terminal) public view returns (bool) {
        return terminals.contains(terminal);
    }

    function getVault(address owner) public view returns (address) {
        return vaults[owner];
    }
}
