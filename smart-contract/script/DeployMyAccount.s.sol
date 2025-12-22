// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "forge-std/Script.sol";

import {IEntryPoint} from "lib/account-abstraction/contracts/interfaces/IEntryPoint.sol";
import {MyAccountFactory} from "../src/MyAccountFactory.sol";
import {MyAccount} from "../src/MyAccount.sol";
import {MyPaymaster} from "../src/MyPaymaster.sol";

contract DeployMyAccount is Script {
    // Sepolia EntryPoint v0.7 address
    address constant SEPOLIA_ENTRYPOINT =
        0x0000000071727De22E5E9d8BAf0edAc6f37da032;

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        uint256 owner2Key = vm.envUint("OWNER2");
        uint256 owner3Key = vm.envUint("OWNER3");


        address deployer = vm.addr(deployerKey);
        address owner2 = vm.addr(owner2Key);
        address owner3 = vm.addr(owner3Key);

        // --- owners ---
        // MVP default: 1 owner = deployer
        /*         address [] memory owners = new address[](1);
        owners[0] = deployer; */

        // If you want 3 owners, uncomment this block and set env vars:
        
        address [] memory owners = new address[](3);
        owners[0] = deployer;
        owners[1] = owner2;
        owners[2] = owner3;

        uint256 threshold = _envOr("OWNER_THRESHOLD", 1);

        // --- guardians ---
        // We set 3 guardians for the 3-owner setup; adjust as needed.
        address [] memory guardians = new address[](2);
        guardians[0] = vm.envAddress("GUARDIAN1");
        guardians[1] = vm.envAddress("GUARDIAN2");
        uint256 guardianThreshold = _envOr("GUARDIAN_THRESHOLD", 0);
       

        uint256 salt = _envOr("SALT", 0);

        vm.startBroadcast(deployerKey);

        // 1) Deploy Factory (also deploys MyAccount implementation internally)
        IEntryPoint entryPoint = IEntryPoint(SEPOLIA_ENTRYPOINT);
        MyAccountFactory factory = new MyAccountFactory(entryPoint);

        // 2) Predict account address (counterfactual)
        address predicted = factory.getAddress(
            owners,
            threshold,
            guardians,
            guardianThreshold,
            salt
        );
        console2.log("Deployer:", deployer);
        console2.log("Factory:", address(factory));
        console2.log("Predicted MyAccount (counterfactual):", predicted);

        // 3) Deploy account (idempotent: returns existing if already deployed)
        MyAccount account = factory.createAccount(
            owners,
            threshold,
            guardians,
            guardianThreshold,
            salt
        );
        console2.log("Created/Existing MyAccount:", address(account));

        // 4) Deploy Paymaster + deposit to EntryPoint (optional but recommended for AA demo)
        // verifyingSigner is not used in your "blind" version, but keep it sensible.
        address verifyingSigner = deployer;
        MyPaymaster paymaster = new MyPaymaster(entryPoint, verifyingSigner);
        console2.log("Paymaster:", address(paymaster));

        uint256 paymasterDepositEth = _envOr(
            "PAYMASTER_DEPOSIT_ETH",
            0.05 ether
        );
        paymaster.deposit{value: paymasterDepositEth}();
        console2.log("Paymaster deposited to EntryPoint:", paymasterDepositEth);

        // 5) Optionally fund the account with ETH (optional for demo)
        uint256 fundAccountEth = _envOr("FUND_ACCOUNT_ETH", 0);
        if (fundAccountEth > 0) {
            (bool ok, ) = payable(address(account)).call{value: fundAccountEth}(
                ""
            );
            require(ok, "fund account failed");
            console2.log("Funded account with:", fundAccountEth);
        }

        vm.stopBroadcast();

        // Final print
        console2.log("=== DONE ===");
        console2.log("EntryPoint:", SEPOLIA_ENTRYPOINT);
        console2.log("Factory:", address(factory));
        console2.log("Account:", address(account));
        console2.log("Paymaster:", address(paymaster));
    }

    function _envOr(
        string memory key,
        uint256 defaultVal
    ) internal returns (uint256) {
        // forge doesn't have a native envOr, so we catch failures.
        try vm.envUint(key) returns (uint256 v) {
            return v;
        } catch {
            return defaultVal;
        }
    }
}
