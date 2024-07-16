import { System, Storage, authority, Base58, Arrays } from "@koinos/sdk-as";
import { modvalidation, ModValidation, MODULE_VALIDATION_TYPE_ID } from "@veive/mod-validation-as";
import { modvalidationany } from "./proto/modvalidationany";

const ALLOWANCES_SPACE_ID = 1;
const CONFIG_SPACE_ID = 2;
const ACCOUNT_SPACE_ID = 3;

/**
 * The ModValidationAny class extends the ModValidation base class and provides implementation
 * for validating any operation within the Veive smart account system on the Koinos blockchain.
 * 
 * This class allows users to pre-authorize specific operations (known as allowances) and validate
 * them during execution by comparing the operation's contract ID, entry point, and arguments against
 * the stored allowances. Additionally, it ensures that the allowance is tied to a specific transaction
 * ID, guaranteeing that it can only be used within the same transaction.
 * 
 * The module is configurable, allowing certain entry points to be skipped from validation.
 * This flexibility is useful for bypassing the validation logic for specific operations.
 */
export class ModValidationAny extends ModValidation {
  callArgs: System.getArgumentsReturn | null;

  contractId: Uint8Array = System.getContractId();

  allowances_storage: Storage.Obj<modvalidationany.allowances_storage> =
    new Storage.Obj(
      this.contractId,
      ALLOWANCES_SPACE_ID,
      modvalidationany.allowances_storage.decode,
      modvalidationany.allowances_storage.encode,
      () => new modvalidationany.allowances_storage()
    );

  config_storage: Storage.Obj<modvalidationany.config_storage> =
    new Storage.Obj(
      this.contractId,
      CONFIG_SPACE_ID,
      modvalidationany.config_storage.decode,
      modvalidationany.config_storage.encode,
      () => new modvalidationany.config_storage()
    );

  account_id: Storage.Obj<modvalidationany.account_id> =
    new Storage.Obj(
      this.contractId,
      ACCOUNT_SPACE_ID,
      modvalidationany.account_id.decode,
      modvalidationany.account_id.encode,
      () => new modvalidationany.account_id()
    );

  /**
   * Validate operation by checking allowance
   * @external
   */
  is_valid_operation(args: modvalidation.is_valid_operation_args): modvalidation.is_valid_operation_result {
    // check if operation is "allow" of this contract
    if (
      Arrays.equal(args.operation!.contract_id!, this.contractId) == true &&
      args.operation!.entry_point == 1090552691
    ) {
      System.log(`[mod-validation-any] skip allow`);
      return new modvalidation.is_valid_operation_result(true);
    }

    // check if operation entry_point is in skip list
    if (
      this.config_storage.get()!.skip_entry_points.includes(args.operation!.entry_point)
    ) {
      System.log(`[mod-validation-any] skip ${args.operation!.entry_point.toString()}`);
      return new modvalidation.is_valid_operation_result(true);
    }

    System.log(`[mod-validation-any] checking ${args.operation!.entry_point.toString()}`);

    const allowances_storage = this.allowances_storage.get();
    if (allowances_storage && allowances_storage.allowances.length > 0) {

      for (let i = 0; i < allowances_storage.allowances.length; i++) {
        const allowance = allowances_storage.allowances[i];

        if (
          Arrays.equal(allowance.tx_id, System.getTransactionField("id")!.bytes_value) == true &&
          Arrays.equal(allowance.operation!.contract_id, args.operation!.contract_id!) == true &&
          allowance.operation!.entry_point == args.operation!.entry_point == true &&
          Arrays.equal(allowance.operation!.args, args.operation!.args!) == true
        ) {
          System.log(`[mod-validation-any] allowing ${args.operation!.entry_point.toString()}`);
          this._remove_allowance(i);
          return new modvalidation.is_valid_operation_result(true);
        }
      }

    }

    System.log(`[mod-validation-any] fail ${args.operation!.entry_point.toString()}`);

    return new modvalidation.is_valid_operation_result(false);
  }

  /**
   * Save operation to allow
   * @external
   */
  allow(args: modvalidationany.allow_args): void {
    // REPLACE WITH is_valid_signature call //
    const isAuthorized = System.checkAuthority(authority.authorization_type.contract_call, args.user!);
    System.require(isAuthorized, `not authorized by ${Base58.encode(args.user!)}`);

    const allowances_storage = this.allowances_storage.get() || new modvalidationany.allowances_storage([]);

    const allowance = new modvalidationany.allowance();
    allowance.tx_id = System.getTransactionField("id")!.bytes_value;
    allowance.operation = args.operation!
    allowance.caller = args.user!;

    allowances_storage.allowances.push(allowance);

    this.allowances_storage.put(allowances_storage);
  }

  /**
   * @external
   * @readonly
   */
  get_allowances(): modvalidationany.get_allowances_result {
    return new modvalidationany.get_allowances_result(this.allowances_storage.get()!.allowances);
  }

  /**
   * remove allowance by index
   */
  _remove_allowance(index: u32): void {
    const new_allowances = new modvalidationany.allowances_storage([]);

    const allowances_storage = this.allowances_storage.get()!;
    for (let i = 0; i < allowances_storage.allowances.length; i++) {
      if (i != index) {
        new_allowances.allowances.push(allowances_storage.allowances[i]);
      }
    }

    this.allowances_storage.put(new_allowances);
  }

  /**
   * Adds an antry point to skip list
   * @external
   */
  add_skip_entry_point(args: modvalidationany.add_skip_entry_point_args): void {
    const config = this.config_storage.get() || new modvalidationany.config_storage();

    // Check for duplicates
    for (let i = 0; i < config.skip_entry_points.length; i++) {
      if (config.skip_entry_points[i] == args.entry_point) {
        System.log("Entry point already exists");
        return;
      }
    }

    // Add new entry
    config.skip_entry_points.push(args.entry_point);
    this.config_storage.put(config);
  }

  /**
   * Removes an antry point from skips
   * @external
   */
  remove_skip_entry_point(args: modvalidationany.remove_skip_entry_point_args): void {
    const config = this.config_storage.get();
    System.require(config != null, "Configuration not found");

    const new_skip_entry_points: u32[] = [];

    for (let i = 0; i < config!.skip_entry_points.length; i++) {
      if (config!.skip_entry_points[i] != args.entry_point) {
        new_skip_entry_points.push(config!.skip_entry_points[i]);
      }
    }

    config!.skip_entry_points = new_skip_entry_points;
    this.config_storage.put(config!);
  }

  /**
   * Reads the skip_entry_points
   * @external
   * @readonly
   */
  get_skip_entry_points(): modvalidationany.get_skip_entry_points_result {
    const config = this.config_storage.get();
    System.require(config != null, "Configuration not found");
    return new modvalidationany.get_skip_entry_points_result(config!.skip_entry_points);
  }

  /**
   * @external
   */
  on_install(args: modvalidation.on_install_args): void {
    const account = new modvalidationany.account_id();
    account.value = System.getCaller().caller;
    this.account_id.put(account);
    System.log('[mod-validation-any] called on_install');
  }

  /**
   * @external
   * @readonly
   */
  manifest(): modvalidation.manifest {
    const result = new modvalidation.manifest();
    result.name = "Any operation validator";
    result.description = "Module to validate any operation";
    result.type_id = MODULE_VALIDATION_TYPE_ID;
    return result;
  }
}
