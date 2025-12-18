https://docs.google.com/document/d/1s_DdkwCvAiy-0yyIPGVhWnFo5Htt9v-x/edit# EIP 4337 In depth 

## Hindsight  
### Security implications of EOAs versus Smart Contract Accounts

Let's define security as the user’s ability to maintain **custody** (control), **safety** (resistance to theft/loss), and **recoverability**(ability to regain control after mistakes) over funds and permissions.

EOAs are an address derived from a secp256k1 public key. They are controlled by a single private key. Validation rule is backed into the protocol: `tx is valid iff ecrecover(sig) == sender and nonce/gas rules are OK`
On a security level, it means that EOAs have a single point of failure. The user lose or have a compromise private key, the  funds are gone. So they are only one protection possible: protect the private key. The user have a full self-custody and responsability of the protocol. 

Smart Contract Accounts, are a programmable smart contract, they are build into the protocol themselves. SCAs can use one or more keys, passkeys, multisig, or other auth methods — the protocol doesn’t constrain the policy. 
On a security level, it means that, they are multiple way to protect against attack: social recovery, guardians. The user can alse combine multiple auth methods to lock the auth process ( device keys + hardware wallet ) 

With Smart Contract Accounts, security is modular. With EOAs, security is rigid and single-key: it relies entirely on self-custody, but does not allow for modular or recoverable security mechanisms.


### The role of EntryPoint contracts in ERC-4337
EntryPoint is the on-chain contract that acts like a “meta-transaction router”:
- It receives UserOperations (not normal transactions)

- It verifies them (via the account contract)

- It executes them

- It handles fees and gas accounting

Ethereum clients (Geth, Nethermind, Erigon, etc.) only know how to validate ECDSA signatures from EOA.  ERC-4337 avoids a hard fork by moving “transaction validity” into a contract flow. So EntryPoint is the compatibility layer that makes SCAs usable like accounts.
![how erc-4337 works](https://miro.medium.com/v2/resize:fit:4800/0*IThEWr1KugkIQHrf.png)

## Implementation 
This implementation uses the [entryPoint V0.7 ](https://github.com/eth-infinitism/account-abstraction/blob/releases/v0.7/README.md)


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
