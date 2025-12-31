// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "forge-std/console2.sol";

import {MyAccountFactory} from "../src/MyAccountFactory.sol";
import {MyPaymaster} from "../src/MyPaymaster.sol";
import {MyMFERS} from "../src/MyMFERS.sol";

contract DeployMyMFERS is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        console2.log("Deployer:", deployer);

        vm.startBroadcast(deployerKey);

        // Deployer == owner
        MyMFERS myMFERS = new MyMFERS(deployer);

        console2.log("NFT Contract deployed:", address(myMFERS));

        vm.stopBroadcast();
        console2.log("=== DONE ===");
    }
}
