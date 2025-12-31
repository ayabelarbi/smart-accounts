// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {IEntryPoint} from "lib/account-abstraction/contracts/interfaces/IEntryPoint.sol";
import {MyAccount} from "./MyAccount.sol";

import {Create2} from "@openzeppelin/contracts/utils/Create2.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract MyAccountFactory {
    MyAccount public immutable MY_ACCOUNT_IMPLEMENTATION;
    IEntryPoint public immutable ENTRY_POINT;

    event AccountCreated(address account, bytes32 salt);

    constructor(IEntryPoint _entryPoint) {
        ENTRY_POINT = _entryPoint;
        MY_ACCOUNT_IMPLEMENTATION = new MyAccount(address(_entryPoint));
    }

    function createAccount(
        address[] calldata owners,
        uint256 threshold,
        address[] calldata guardians,
        uint256 guardianThreshold,
        uint256 salt
    ) public returns (MyAccount account) {
        address addr = getAddress(owners, threshold, guardians, guardianThreshold, salt);

        if (addr.code.length > 0) {
            return MyAccount(payable(addr));
        }

        account = MyAccount(
            payable(
                new ERC1967Proxy{salt: bytes32(salt)}(
                    address(MY_ACCOUNT_IMPLEMENTATION),
                    abi.encodeCall(
                        MyAccount.initialize,
                        (owners, threshold, guardians, guardianThreshold)
                    )
                )
            )
        );

        emit AccountCreated(address(account), bytes32(salt));
    }

    function getAddress(
        address[] calldata owners,
        uint256 threshold,
        address[] calldata guardians,
        uint256 guardianThreshold,
        uint256 salt
    ) public view returns (address) {
        bytes memory initData = abi.encodeCall(
            MyAccount.initialize,
            (owners, threshold, guardians, guardianThreshold)
        );

        bytes32 bytecodeHash = keccak256(
            abi.encodePacked(
                type(ERC1967Proxy).creationCode,
                abi.encode(address(MY_ACCOUNT_IMPLEMENTATION), initData)
            )
        );

        return Create2.computeAddress(bytes32(salt), bytecodeHash, address(this));
    }
}
