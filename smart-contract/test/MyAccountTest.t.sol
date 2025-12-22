// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {Test, console} from "lib/forge-std/src/Test.sol";
import {MyAccount} from "../src/MyAccount.sol";
import {MyAccountFactory} from "../src/MyAccountFactory.sol";
import {MyPaymaster} from "../src/MyPaymaster.sol";
import {IPaymaster} from "lib/account-abstraction/contracts/interfaces/IEntryPoint.sol";
import {IEntryPoint} from "lib/account-abstraction/contracts/interfaces/IEntryPoint.sol";
import {PackedUserOperation} from "lib/account-abstraction/contracts/interfaces/PackedUserOperation.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract MyAccountTest is Test {
    MyAccountFactory public factory;
    MyAccount public account;
    IEntryPoint public entryPoint;

    address public owner1;
    uint256 public owner1Key;
    address public beneficiary = address(0xdead);

    function setUp() public {
        // 1. Setup EntryPoint (Mock or actual deploy)
        // entrypoint from sepolia
        entryPoint = IEntryPoint(0x0000000071727De22E5E9d8BAf0edAc6f37da032);
        factory = new MyAccountFactory(entryPoint);

        (owner1, owner1Key) = makeAddrAndKey("owner1");

        // 2. Deploy Account via Factory
        address[] memory owners = new address[](1);
        owners[0] = owner1;
        address[] memory guardians = new address[](0);

        account = factory.createAccount(owners, 1, guardians, 0, 0);

        // Fund the account so it can pay for gas (prefund)
        vm.deal(address(account), 10 ether);
    }

    function test_ValidateAndExecuteUserOp() public {
        assertEq(address(account).balance, 0);

        // 1. Create the call data (What we want the wallet to do)
        bytes memory callData = abi.encodeWithSelector(
            MyAccount.execute.selector,
            beneficiary,
            1 ether,
            ""
        );

        // 2. Construct the PackedUserOperation
        PackedUserOperation memory userOp = PackedUserOperation({
            sender: address(account),
            nonce: 0,
            initCode: "",
            callData: callData,
            accountGasLimits: bytes32(
                abi.encodePacked(uint128(500000), uint128(500000))
            ),
            preVerificationGas: 50000,
            gasFees: bytes32(
                abi.encodePacked(uint128(1 gwei), uint128(1 gwei))
            ),
            paymasterAndData: "",
            signature: ""
        });

        // 3. Sign the UserOp
        bytes32 userOpHash = _getHash(userOp);
        bytes32 ethHash = MessageHashUtils.toEthSignedMessageHash(userOpHash);

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(owner1Key, ethHash);
        bytes memory sig = abi.encodePacked(r, s, v);

        // Mode 0 = SIG_OWNERS
        address[] memory signers = new address[](1);
        signers[0] = owner1;
        bytes[] memory signatures = new bytes[](1);
        signatures[0] = sig;

        bytes memory payload = abi.encode(signers, signatures);
        userOp.signature = abi.encode(uint8(0), payload);

        // 4. Simulate EntryPoint calling validateUserOp
        vm.prank(address(entryPoint));
        uint256 validationData = account.validateUserOp(userOp, userOpHash, 0);

        assertEq(validationData, 0); // 0 is SIG_VALIDATION_SUCCESS

        // 5. Execute the operation
        vm.prank(address(entryPoint));
        account.execute(beneficiary, 1 ether, "");

        assertEq(beneficiary.balance, 1 ether);
    }

    function test_SponsoredUserOp() public {
        // 1. Setup Paymaster
        address paymasterSigner = makeAddr("paymasterSigner");
        MyPaymaster paymaster = new MyPaymaster(entryPoint, paymasterSigner);

        // 2. Fund Paymaster on EntryPoint
        vm.deal(address(this), 10 ether);
        paymaster.deposit{value: 2 ether}();

        // 3. Construct UserOp
        PackedUserOperation memory userOp = _createBaseUserOp();

        // 4. Generate Paymaster Signature (Off-chain simulation)
        bytes32 userOpHash = _getHash(userOp);
        bytes32 ethHash = MessageHashUtils.toEthSignedMessageHash(userOpHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(
            uint256(uint160(paymasterSigner)),
            ethHash
        );
        bytes memory pmSig = abi.encodePacked(r, s, v);

        // 5. Attach Paymaster to UserOp
        // Format: address(paymaster) + signature
        userOp.paymasterAndData = abi.encodePacked(address(paymaster), pmSig);

        // 6. Sign UserOp with Wallet Owner (as before)
        userOp.signature = _signUserOp(userOp, owner1Key);

        // 7. Execute via EntryPoint
        PackedUserOperation[] memory ops = new PackedUserOperation[](1);
        ops[0] = userOp;

        vm.prank(address(0x123)); // Any bundler address
        entryPoint.handleOps(ops, payable(beneficiary));

        // Verify beneficiary got the funds AND account didn't pay (Paymaster paid)
        assertEq(beneficiary.balance, 1 ether);
    }

    // Helper to get UserOp Hash (Simplification of EntryPoint logic)
    function _getHash(
        PackedUserOperation memory userOp
    ) internal view returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    userOp.sender,
                    userOp.nonce,
                    keccak256(userOp.initCode),
                    keccak256(userOp.callData),
                    userOp.accountGasLimits,
                    userOp.preVerificationGas,
                    userOp.gasFees,
                    keccak256(userOp.paymasterAndData)
                )
            );
    }
}
