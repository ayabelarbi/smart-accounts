# EIP 4337 In depth 

## Hindsight  
### Security implications of EOAs versus Smart Contract Accounts
DIfference between smart contract accounts, account abstraction and EOA. 


### The role of EntryPoint contracts in ERC-4337


## Implementation 
This implementation uses the entryPoint V0.7 



## Source 
[Eip4337 contracts and interfaces](https://github.com/eth-infinitism/account-abstraction/tree/releases/v0.7/contracts)

[ERC-4337 Specification](https://eips.ethereum.org/EIPS/eip-4337)






## Foundry

**Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.**

Foundry consists of:

- **Forge**: Ethereum testing framework (like Truffle, Hardhat and DappTools).
- **Cast**: Swiss army knife for interacting with EVM smart contracts, sending transactions and getting chain data.
- **Anvil**: Local Ethereum node, akin to Ganache, Hardhat Network.
- **Chisel**: Fast, utilitarian, and verbose solidity REPL.

## Documentation

https://book.getfoundry.sh/

## Usage

### Build

```shell
$ forge build
```

### Test

```shell
$ forge test
```

### Format

```shell
$ forge fmt
```

### Gas Snapshots

```shell
$ forge snapshot
```

### Anvil

```shell
$ anvil
```

### Deploy

```shell
$ forge script script/Counter.s.sol:CounterScript --rpc-url <your_rpc_url> --private-key <your_private_key>
```

### Cast

```shell
$ cast <subcommand>
```

### Help

```shell
$ forge --help
$ anvil --help
$ cast --help
```
