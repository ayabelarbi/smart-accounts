// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {MyAccountFactory} from "../src/MyAccountFactory.sol";
import {IEntryPoint} from "lib/account-abstraction/contracts/interfaces/IEntryPoint.sol";

contract DeployMyAccount is Script {
    address constant ENTRYPOINT_V07 = 0x0000000071727De22E5E9d8BAf0edAc6f37da032;


    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);
        address factoryAddr = vm.envAddress("MY_ACCOUNT_FACTORY");

        console2.log("Deployer:", deployer);
        console2.log("EntryPoint v0.7:", ENTRYPOINT_V07);

   
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

        // ----------------------------
        // Deploy + counterfactual addr
        // ----------------------------
        vm.startBroadcast(deployerKey);

        MyAccountFactory factory = MyAccountFactory(factoryAddr);

        address predicted = factory.getAddress(owners, threshold, guardians, guardianThreshold, salt);
        console2.log("Predicted account:", predicted);

        address created = address(factory.createAccount(owners, threshold, guardians, guardianThreshold, salt));
        console2.log("createAccount returned:", created);

        // Factory uses CREATE2, so created should equal predicted
        if (created != predicted) {
            console2.log("ERROR: mismatch!");
            revert("deployed address != predicted address");
        }

        vm.stopBroadcast();

        console2.log("Success: counterfactual address matches deployment");
    }
}
