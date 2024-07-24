## **Mod Validation Any**

### **Overview**

`ModValidationAny` is a comprehensive validation module within the Veive protocol, designed specifically for the Koinos blockchain. This module employs an allowance mechanism to pre-authorize operations, ensuring that only actions explicitly approved by the user are executed. By leveraging this mechanism, `ModValidationAny` provides robust control over transaction execution, preventing unauthorized actions and potential replay attacks. Notably, this module is also applicable for validating internal operations, ensuring that even operations triggered within a contract are authorized.

### **Functional Description**

#### **Purpose and Functionality**

The `ModValidationAny` module serves as a pivotal component in the Veive ecosystem by validating operations against a set of pre-authorized allowances. This functionality is crucial for both external and internal operations, ensuring comprehensive security and control. Key features include:

- **Allowance Mechanism**: Users can pre-authorize specific operations using the `allow` method, which stores details such as the operation's contract ID, entry point, arguments, and transaction ID. This mechanism prevents unauthorized transactions and ensures that each allowance is tied to a specific transaction, preventing reuse. This feature is particularly important for managing internal operations, where contracts may invoke additional operations.

- **Validation Process**: During execution, `ModValidationAny` checks if the incoming operation matches any stored allowances. It verifies transaction ID, contract ID, entry point, and arguments. If a match is found, the corresponding allowance is removed, ensuring that it cannot be reused, thus preventing replay attacks. This process includes verifying allowances for operations that may be internally triggered by other contracts, ensuring a comprehensive validation scope.

- **Scope Management**: The default scope for `ModValidationAny` is set to "any," meaning it can validate any operation unless a more specific scope is defined. This flexibility allows for the module's application across a broad range of scenarios, from general validation to specific contract operations.

### **Technical Implementation**

#### **Key Components and Methods**

1. **Storage Objects**
   - `allowances_storage`: This object stores all allowances, defined as `modvalidationany.allowances_storage`. It includes all authorized operations and their respective details.
   - `account_id`: Stores the account ID associated with the module, ensuring that only authorized accounts can manage or interact with it.

2. **Methods**
   - **`is_valid_operation`**:
     - **Purpose**: Validates an operation by checking against existing allowances.
     - **Implementation**: The method first checks if the operation itself is an "allow" operation, skipping validation to prevent recursive validation loops. It then iterates through the stored allowances to find a match, verifying transaction ID, contract ID, entry point, and arguments. If a match is found, the allowance is removed to prevent reuse, ensuring that each allowance is single-use and linked to a specific transaction. This validation covers both user-initiated operations and internal operations triggered within smart contracts.

   - **`allow`**:
     - **Purpose**: Registers an operation as pre-authorized.
     - **Implementation**: Verifies the authorization of the caller using `System.checkAuthority`. Upon authorization, the operation details and transaction ID are recorded in `allowances_storage`, creating a unique allowance. This step is crucial for both external and internal operations, allowing users to pre-authorize complex transaction flows.

   - **`get_allowances`**:
     - **Purpose**: Retrieves all allowances associated with the account.
     - **Implementation**: Returns a list of allowances currently stored, providing an overview of all pre-authorized operations.

   - **`on_install`**:
     - **Purpose**: Initializes the module upon installation.
     - **Implementation**: Captures the caller’s ID as `account_id`, ensuring that only the correct account can manage the module's allowances.

   - **`manifest`**:
     - **Purpose**: Provides metadata and configuration settings for the module.
     - **Implementation**: Returns details such as the module’s name, description, type ID, and the default scope, which is "any".

   - **Private Methods**:
     - **`_get_account_id`**: Retrieves the stored account ID.
     - **`_remove_allowance`**: Removes an allowance entry from `allowances_storage` by index, ensuring that allowances cannot be reused.

### **Scopes and Context**

The default scope for `ModValidationAny` is "any," allowing it to validate any operation in the absence of more specific scope definitions. This flexibility means the module can serve as a universal validator, covering a wide range of scenarios without the need for granular scope definitions. It ensures that any operation, whether user-initiated or internally triggered within a contract, is subject to validation.

### **Usage**

#### **Installation**

To install the `ModValidationAny` module, ensure you have the Veive protocol set up on your Koinos blockchain environment. Install the module using yarn:

```bash
yarn add @veive/mod-validation-any-as
```

Deploy the module contract on the Koinos blockchain and install it on the desired account using the `install_module` method provided by the Veive account interface. During installation, the `on_install` method is called to set the necessary configurations and link the module to the account.

#### **Example**

Here is an example of how to use `ModValidationAny`:

```javascript
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

#### **Scripts**

##### Build

To compile the package, run:

```bash
yarn build
```

##### Dist

To create a distribution, run:

```bash
yarn dist
```

##### Test

To test the package, use:

```bash
yarn jest
```

### **Contributing**

Contributions are welcome! Please open an issue or submit a pull request on the [GitHub repository](https://github.com/veiveprotocol/mod-validation-any-as).

### **License**

This project is licensed under the MIT License. See the LICENSE file for details.