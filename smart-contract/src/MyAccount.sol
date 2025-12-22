// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {IAccount} from "lib/account-abstraction/contracts/interfaces/IAccount.sol";
import {PackedUserOperation} from "lib/account-abstraction/contracts/interfaces/PackedUserOperation.sol";
import {SIG_VALIDATION_FAILED, SIG_VALIDATION_SUCCESS} from "lib/account-abstraction/contracts/core/Helpers.sol";
import {IEntryPoint} from "lib/account-abstraction/contracts/interfaces/IEntryPoint.sol";

import {UUPSUpgradeable} from "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract MyAccount is IAccount, Initializable, UUPSUpgradeable {
    using ECDSA for bytes32;
    IEntryPoint private immutable MY_ENTRY_POINT;

    uint8 private constant SIG_OWNERS = 0;
    uint8 private constant SIG_SESSION = 1;

    address[] public owners;
    uint256 public threshold; // starts at 1, can be set to 2 for demo
    uint256 public guardianThreshold;

    mapping(address => bool) public isOwner;
    mapping(address => bool) public isGuardian;
    mapping(bytes32 => mapping(address => bool)) public guardianApproved;
    mapping(bytes32 => uint256) public guardianApprovalCount;

    mapping(address => SessionKey) public sessionKeys;
    // Used to manage multiple owners
    struct SessionKey {
        uint48 expiresAt;
        bool oneTime;
        bool used;
    }

    /*///////////////////////////////////////////////////////////////////
     *                        ERRORS AND EVENTS
    ////////////////////////////////////////////////////////////////////*/
    error MyAccount__NotFromEntryPoint();
    error MyAccount__NotFromEntryPointOrOwner();
    error MyAccount__CallFailed(bytes);
    error DuplicateSigner();
    error SessionKeyInvalid();
    error NotGuardian();
    error NotEnoughGuardianApprovals();

    error NotOwner();
    error CannotRemoveLastOwner();
    error ThresholdOutOfBound();
    error OnlySelf();
    error NoOwners();
    error GuardianAddressEmpty();

    event MyAccountInitialized(
        IEntryPoint indexed entryPoint,
        address indexed owner
    );
    event OwnerAdded(address indexed owner);
    event OwnerRemoved(address indexed owner);
    event ThresholdChanged(uint256 threshold);

    event SessionKeySet(address indexed key, uint48 expiresAt, bool oneTime);
    event SessionKeyRevoked(address indexed key);
    event SessionKeyUsed(address indexed key);

    event GuardianSet(address indexed guardian, bool allowed);
    event RecoveryApproved(
        bytes32 indexed recoveryHash,
        address indexed guardian
    );
    event RecoveryExecuted(bytes32 indexed recoveryHash);

    constructor(address _myEntryPoint) {
        MY_ENTRY_POINT = IEntryPoint(_myEntryPoint);
        _disableInitializers();
    }

    receive() external payable {}

    /*///////////////////////////////////////////////////////////////////
     *                        MODIFIERS
    ////////////////////////////////////////////////////////////////////*/
    modifier requireFromEntryPoint() {
        if (msg.sender != address(MY_ENTRY_POINT)) {
            revert MyAccount__NotFromEntryPoint();
        }
        _;
    }

    modifier requireFromEntryPointOrOwner() {
        if (msg.sender != address(MY_ENTRY_POINT) && !isOwner[msg.sender]) {
            revert MyAccount__NotFromEntryPointOrOwner();
        }
        _;
    }

    modifier onlySelf() {
        if (msg.sender != address(this)) revert OnlySelf();
        _;
    }

    /*///////////////////////////////////////////////////////////////////
     *                        EXTERNAL FUNCTIONS
    ////////////////////////////////////////////////////////////////////*/
    /********************************************************************
        INITIALIZER WITH MULTIPLE OWNERS AND GUARDIANS
    *********************************************************************/
    function initialize(
        address[] calldata initialOwners,
        uint256 initialThreshold,
        address[] calldata initialGuardians,
        uint256 _guardianThreshold
    ) external initializer {
        if (initialOwners.length < 1) revert NoOwners();

        for (uint256 i = 0; i < initialOwners.length; i++) {
            address o = initialOwners[i];
            require(o != address(0), "owner=0");
            require(!isOwner[o], "dup owner");
            isOwner[o] = true;
            owners.push(o);
            emit OwnerAdded(o);
        }

        if (initialThreshold < 1 || initialThreshold > owners.length)
            revert ThresholdOutOfBound();
        threshold = initialThreshold;
        emit ThresholdChanged(threshold);

        for (uint256 i = 0; i < initialGuardians.length; i++) {
            address g = initialGuardians[i];
            if (g == address(0)) revert GuardianAddressEmpty();
            isGuardian[g] = true;
            emit GuardianSet(g, true);
        }
        guardianThreshold = _guardianThreshold;

        emit MyAccountInitialized(MY_ENTRY_POINT, msg.sender);
    }

    /********************************************************************
        Tx EXECUTION LOGIC
    *********************************************************************/
    function execute(
        address dest,
        uint256 value,
        bytes calldata functionData
    ) external requireFromEntryPointOrOwner {
        (bool success, bytes memory result) = dest.call{value: value}(
            functionData
        );
        if (!success) {
            revert MyAccount__CallFailed(result);
        }
    }

    function executeBatch(
        address[] calldata dest,
        uint256[] calldata value,
        bytes[] calldata data
    ) external requireFromEntryPointOrOwner {
        if (dest.length != value.length && dest.length != data.length) {
            revert MyAccount__CallFailed("bad batch");
        }

        for (uint256 i = 0; i < dest.length; i++) {
            (bool ok, bytes memory res) = dest[i].call{value: value[i]}(
                data[i]
            );
            if (!ok) revert MyAccount__CallFailed(res);
        }
    }

    /********************************************************************
        OWNER MANAGEMENT 
    *********************************************************************/
    function addOwner(address newOwner) external onlySelf {
        if (newOwner == address(0)) revert NotOwner();
        require(!isOwner[newOwner], "dup owner");
        isOwner[newOwner] = true;
        owners.push(newOwner);
        emit OwnerAdded(newOwner);
    }

    function removeOwner(address owner) external onlySelf {
        if (!isOwner[owner]) revert NotOwner();
        if (owners.length == 1) revert CannotRemoveLastOwner();

        isOwner[owner] = false;

        // swap & pop
        for (uint256 i = 0; i < owners.length; i++) {
            if (owners[i] == owner) {
                owners[i] = owners[owners.length - 1];
                owners.pop();
                break;
            }
        }

        if (threshold > owners.length) threshold = owners.length;
        emit OwnerRemoved(owner);
        emit ThresholdChanged(threshold);
    }

    function revokeSessionKey(address key) external onlySelf {
        delete sessionKeys[key];
        emit SessionKeyRevoked(key);
    }

    // A signature is valid, if it's the MinimalAccount owner
    function validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external requireFromEntryPoint returns (uint256 validationData) {
        validationData = _validateSignature(userOp, userOpHash);
        _payPrefund(missingAccountFunds);
    }

    /********************************************************************
        RECOVERY LOGIC
    *********************************************************************/
    function approveRecovery(bytes32 recoveryHash) external {
        if (!isGuardian[msg.sender]) revert NotGuardian();
        if (!guardianApproved[recoveryHash][msg.sender]) {
            guardianApproved[recoveryHash][msg.sender] = true;
            guardianApprovalCount[recoveryHash] += 1;
            emit RecoveryApproved(recoveryHash, msg.sender);
        }
    }

    function executeRecovery(
        address[] calldata newOwners,
        uint256 newThreshold
    ) external {
        bytes32 h = keccak256(abi.encode(newOwners, newThreshold));
        if (guardianApprovalCount[h] < guardianThreshold)
            revert NotEnoughGuardianApprovals();

        // clear old owners
        for (uint256 i = 0; i < owners.length; i++) {
            isOwner[owners[i]] = false;
        }
        delete owners;

        // set new owners
        require(newOwners.length >= 1, "no owners");
        for (uint256 i = 0; i < newOwners.length; i++) {
            address o = newOwners[i];
            require(o != address(0), "owner=0");
            require(!isOwner[o], "dup owner");
            isOwner[o] = true;
            owners.push(o);
        }

        if (newThreshold < 1 || newThreshold > owners.length)
            revert ThresholdOutOfBound();
        threshold = newThreshold;
        emit RecoveryExecuted(h);
        emit ThresholdChanged(newThreshold);
    }

    /*///////////////////////////////////////////////////////////////////     
    *                        INTERNAL FUNCTIONS
    ////////////////////////////////////////////////////////////////////*/
    function _onlyOwner() internal view {
        //directly from EOA owner, or through the account itself (which gets redirected through execute())
        if (isOwner[msg.sender] || msg.sender == address(this)) {
            return;
        }   
        revert NotOwner();
    }
    
    function _validateSignature(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) internal returns (uint256 validationData) {
        bytes32 digest = MessageHashUtils.toEthSignedMessageHash(userOpHash);

        // signature is abi.encode(mode, payload...)
        (uint8 mode, bytes memory rest) = abi.decode(
            userOp.signature,
            (uint8, bytes)
        );

        if (mode == SIG_OWNERS) {
            (address[] memory signers, bytes[] memory sigs) = abi.decode(
                rest,
                (address[], bytes[])
            );
            if (signers.length != sigs.length) return SIG_VALIDATION_FAILED;
            if (signers.length < threshold) return SIG_VALIDATION_FAILED;

            // uniqueness check (fine for small N)
            for (uint256 i = 0; i < signers.length; i++) {
                address s = signers[i];
                if (!isOwner[s]) return SIG_VALIDATION_FAILED;

                for (uint256 j = i + 1; j < signers.length; j++) {
                    if (signers[j] == s) revert DuplicateSigner();
                }

                address recovered = digest.recover(sigs[i]);
                if (recovered != s) return SIG_VALIDATION_FAILED;
            }
            return SIG_VALIDATION_SUCCESS;
        }

        if (mode == SIG_SESSION) {
            (address sk, bytes memory sig) = abi.decode(rest, (address, bytes));
            SessionKey storage k = sessionKeys[sk];

            if (k.expiresAt < block.timestamp) return SIG_VALIDATION_FAILED;
            if (k.oneTime && k.used) return SIG_VALIDATION_FAILED;

            address recovered = digest.recover(sig);
            if (recovered != sk) return SIG_VALIDATION_FAILED;

            if (k.oneTime) {
                k.used = true;
                emit SessionKeyUsed(sk);
            }
            return SIG_VALIDATION_SUCCESS;
        }

        return SIG_VALIDATION_FAILED;
    }

    function _payPrefund(uint256 missingAccountFunds) internal {
        if (missingAccountFunds != 0) {
            (bool success, ) = payable(msg.sender).call{
                value: missingAccountFunds,
                gas: type(uint256).max
            }("");
            (success);
        }
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal view override {
        (newImplementation);
        _onlyOwner();
    }

    /*///////////////////////////////////////////////////////////////////     
    *                        GETTERS / SETTERS
    ////////////////////////////////////////////////////////////////////*/
    function getEntryPoint() external view returns (address) {
        return address(MY_ENTRY_POINT);
    }

    function setThreshold(uint256 newThreshold) external onlySelf {
        if (newThreshold < 1 || newThreshold > owners.length)
            revert ThresholdOutOfBound();
        threshold = newThreshold;
        emit ThresholdChanged(newThreshold);
    }

    function setSessionKey(
        address key,
        uint48 expiresAt,
        bool oneTime
    ) external onlySelf {
        sessionKeys[key] = SessionKey(expiresAt, oneTime, false);
        emit SessionKeySet(key, expiresAt, oneTime);
    }

    function setGuardian(address g, bool allowed) external onlySelf {
        isGuardian[g] = allowed;
        emit GuardianSet(g, allowed);
    }
}
