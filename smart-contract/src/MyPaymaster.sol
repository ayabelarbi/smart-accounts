// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {IPaymaster} from "lib/account-abstraction/contracts/interfaces/IPaymaster.sol";
import {PackedUserOperation} from "lib/account-abstraction/contracts/interfaces/PackedUserOperation.sol";
import {IEntryPoint} from "lib/account-abstraction/contracts/interfaces/IEntryPoint.sol";
import {SIG_VALIDATION_FAILED, SIG_VALIDATION_SUCCESS} from "lib/account-abstraction/contracts/core/Helpers.sol";

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract MyPaymaster is IPaymaster, Ownable {
    using ECDSA for bytes32;

    IEntryPoint public immutable entry_point;
    address public verifyingSigner;

    constructor(IEntryPoint _entryPoint, address _verifyingSigner) Ownable(msg.sender) {
        entry_point = _entryPoint;
        verifyingSigner = _verifyingSigner;
    }

    // Required by EntryPoint: Paymaster must have ETH deposited
    function deposit() public payable {
        entry_point.depositTo{value: msg.value}(address(this));
    }

    function validatePaymasterUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 maxCost
    ) external view override returns (bytes memory context, uint256 validationData) {
        // 1. The Paymaster checks if it's being called by the EntryPoint
        if (msg.sender != address(entry_point)) revert("Not EntryPoint");

        // 2. We expect a signature in the paymasterAndData field
        // paymasterAndData = [address(this) (20 bytes) || signature (rest)]
        bytes calldata paymasterData = userOp.paymasterAndData[20:];
        
        if (paymasterData.length == 0) return ("", SIG_VALIDATION_FAILED);

        // 3. Verify that the 'verifyingSigner' signed this specific userOpHash
        bytes32 hash = MessageHashUtils.toEthSignedMessageHash(userOpHash);
        if (verifyingSigner != hash.recover(paymasterData)) {
            return ("", SIG_VALIDATION_FAILED);
        }

        // Return empty context and success
        return ("", SIG_VALIDATION_SUCCESS);
    }

    function postOp(
        PostOpMode mode,
        bytes calldata context,
        uint256 actualGasCost,
        uint256 actualUserOpFeePerGas
    ) external override {
        // Optional: Perform internal accounting here (e.g., track spending per user)
    }

    function setVerifyingSigner(address _newSigner) external onlyOwner {
        verifyingSigner = _newSigner;
    }
}