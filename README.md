### Veive SCA Any Operation Validator Module

This package provides the interface and implementation for an "any operation" validator module that adds functionality to the Veive smart account on the Koinos blockchain. It is inspired by the ERC-7579 standard.

ERC-7579 defines a standard interface for modular smart accounts. In this context, a module represents a pluggable unit that adds specific functionality to a smart account. The any operation validator module specifically handles the task of validating any operation by comparing it against pre-authorized allowances.

## How It Works

The `ModValidAnyOp` module allows users to pre-authorize specific operations and validate them during execution. Here’s how it works:

1. **Allowance Creation**:
   - Users can create allowances (pre-authorizations) for specific operations using the `allow` method. These allowances are stored and tied to the transaction ID to ensure they are used only within the same transaction.

2. **Operation Validation**:
   - When an operation is executed, the module checks the stored allowances to validate the operation. It compares the contract ID, entry point, and arguments of the operation, as well as the transaction ID, to ensure the operation is authorized.

3. **Skip Entry Points**:
   - The module can be configured to skip validation for specific entry points. This is useful when certain operations should bypass the validation logic of this module.

## Installation

To install the package, use npm or yarn:

```bash
npm install @veive/mod-valid-any-op
```

## Usage

### Importing the Package

First, import the necessary components from the package:

```typescript
import { ModValidAnyOp } from '@veive/mod-valid-any-op';
```

### Example Implementation

Create a validation module by extending `ModValidAnyOp`:

```typescript
import { ModValidAnyOp } from '@veive/mod-valid-any-op';

class MyOperationValidationModule extends ModValidAnyOp {
  // Your implementation here
}
```

### Default Return Values for Validation Methods

The `is_valid_operation` method returns `true` by default because all installed validation modules must approve an operation for it to be considered valid. Conversely, the `is_valid_signature` method returns `false` by default because the signature validation process stops as soon as one module approves the signature.

### Example Usage

Here is an example of how to use the `ModValidAnyOp` module to prepare, allow, and execute an operation:

```typescript
// prepare operation
const { operation: transfer } = await tokenContract['transfer']({
  from: account1Sign.address,
  to: account2Sign.address,
  value: "1",
}, { onlyOperation: true });

// allow operation
const { operation: allow } = await modContract['allow']({
  user: account1Sign.address,
  operation: {
    contract_id: transfer.call_contract.contract_id,
    entry_point: transfer.call_contract.entry_point,
    args: transfer.call_contract.args
  }
}, { onlyOperation: true });

const tx = new Transaction({
    signer: account1Sign,
    provider,
});

await tx.pushOperation(allow);
await tx.pushOperation(transfer);
const receipt = await tx.send();
await tx.wait();
```

## Scripts

### Build

To compile the package, run:

```bash
yarn build
```

### Dist

To create a dist, run:

```bash
yarn dist
```

### Test

To test:

```bash
yarn jest
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request on the [GitHub repository](https://github.com/veiveprotocol).

## License

This project is licensed under the MIT License. See the LICENSE file for details.