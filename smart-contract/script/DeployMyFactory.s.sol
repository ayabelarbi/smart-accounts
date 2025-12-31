// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "forge-std/console2.sol";

import {IEntryPoint} from "lib/account-abstraction/contracts/interfaces/IEntryPoint.sol";
import {MyAccountFactory} from "../src/MyAccountFactory.sol";
import {MyPaymaster} from "../src/MyPaymaster.sol";

contract DeployMyFactory is Script {
    // Sepolia EntryPoint v0.7 address
    address constant SEPOLIA_ENTRYPOINT =
        0x0000000071727De22E5E9d8BAf0edAc6f37da032;

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        console2.log("Deployer:", deployer);
        console2.log("EntryPoint:", SEPOLIA_ENTRYPOINT);

        vm.startBroadcast(deployerKey);

        address[] memory owners = new address[](3);
        address[] memory guardians = new address[](3);

        owners[0] = deployer;
        owners[1] = vm.envAddress("OWNER2");
        owners[2] = vm.envAddress("OWNER3");

        guardians[0] = vm.envAddress("GUARDIAN1");
        guardians[1] = vm.envAddress("GUARDIAN2");
        guardians[2] = vm.envAddress("GUARDIAN3");

        uint256 threshold = 1; // Starting with 1 owner required

        uint256 guardianThreshold = 1;
        uint256 salt = vm.envUint("SALT"); // ex: 12345


        IEntryPoint entryPoint = IEntryPoint(SEPOLIA_ENTRYPOINT);

        // 1) Deploy Factory (also deploys MyAccount implementation internally)
        MyAccountFactory factory = new MyAccountFactory(entryPoint);
        console2.log("Factory deployed:", address(factory));
        console2.log("Account implementation:", address(factory.MY_ACCOUNT_IMPLEMENTATION()));


        address predicted = factory.getAddress(owners, threshold, guardians, guardianThreshold, salt);
        console2.log("Predicted account:", predicted);

        address created = address(factory.createAccount(owners, threshold, guardians, guardianThreshold, salt));
        console2.log("createAccount returned:", created);

        // Factory uses CREATE2, so created should equal predicted
        if (created != predicted) {
            console2.log("ERROR: mismatch!");
            revert("deployed address != predicted address");
        }


        // 2) (Optional) Deploy Paymaster + deposit
        // If you want sponsored txs in your MVP, keep this.
        bool deployPaymaster = _envOrBool("DEPLOY_PAYMASTER", true);
        if (deployPaymaster) {
            address verifyingSigner = deployer; // not used in "blind" mode, but fine
            MyPaymaster paymaster = new MyPaymaster(entryPoint, verifyingSigner);
            console2.log("Paymaster deployed:", address(paymaster));

            uint256 paymasterDepositEth = _envOrUint("PAYMASTER_DEPOSIT_ETH", 0.01 ether);
            paymaster.deposit{value: paymasterDepositEth}();
            console2.log("Paymaster deposited:", paymasterDepositEth);
        }

        vm.stopBroadcast();

        console2.log("=== DONE ===");
    }

    function _envOrUint(string memory key, uint256 defaultVal) internal returns (uint256) {
        try vm.envUint(key) returns (uint256 v) {
            return v;
        } catch {
            return defaultVal;
        }
    }

    function _envOrBool(string memory key, bool defaultVal) internal returns (bool) {
        try vm.envBool(key) returns (bool v) {
            return v;
        } catch {
            return defaultVal;
        }
    }
}
