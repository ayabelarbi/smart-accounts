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

    IEntryPoint public immutable ENTRY_POINT;
    address public verifyingSigner;

    constructor(
        IEntryPoint _entryPoint,
        address _verifyingSigner
    ) Ownable(msg.sender) {
        ENTRY_POINT = _entryPoint;
        verifyingSigner = _verifyingSigner;
    }

    // Required by EntryPoint: Paymaster must have ETH deposited
    function deposit() public payable {
        ENTRY_POINT.depositTo{value: msg.value}(address(this));
    }

    // It Validates blindly the userOp hash signed by the verifyingSigner
    function validatePaymasterUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 /*maxCost*/
    )
        external
        view
        override
        returns (bytes memory context, uint256 validationData)
    {
        if (msg.sender != address(ENTRY_POINT)) revert("Not EntryPoint");

        /* 
        // v0.7 paymasterAndData layout:
        // [ paymaster (20) | verificationGasLimit (16) | postOpGasLimit (16) | paymasterData (N) ]
        if (userOp.paymasterAndData.length < 20 + 16 + 16) {
            return ("", SIG_VALIDATION_FAILED);
        }

        bytes calldata paymasterData = userOp.paymasterAndData[52:]; // 20+16+16 = 52

        if (paymasterData.length == 0) return ("", SIG_VALIDATION_FAILED);

        bytes32 hash = MessageHashUtils.toEthSignedMessageHash(userOpHash);
        if (verifyingSigner != ECDSA.recover(hash, paymasterData)) {
            return ("", SIG_VALIDATION_FAILED);
        } */

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
