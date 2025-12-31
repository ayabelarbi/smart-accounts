// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "forge-std/console2.sol";

import {IEntryPoint} from "lib/account-abstraction/contracts/interfaces/IEntryPoint.sol";
import {MyAccountFactory} from "../src/MyAccountFactory.sol";
import {MyPaymaster} from "../src/MyPaymaster.sol";

contract DeployMyAccount is Script {
    // Sepolia EntryPoint v0.7 address
    address constant SEPOLIA_ENTRYPOINT =
        0x0000000071727De22E5E9d8BAf0edAc6f37da032;

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        console2.log("Deployer:", deployer);
        console2.log("EntryPoint:", SEPOLIA_ENTRYPOINT);

        vm.startBroadcast(deployerKey);

        IEntryPoint entryPoint = IEntryPoint(SEPOLIA_ENTRYPOINT);

        // 1) Deploy Factory (also deploys MyAccount implementation internally)
        MyAccountFactory factory = new MyAccountFactory(entryPoint);
        console2.log("Factory deployed:", address(factory));
        console2.log("Account implementation:", address(factory.MY_ACCOUNT_IMPLEMENTATION()));

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
