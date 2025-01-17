import { System, Storage, authority, Arrays } from "@koinos/sdk-as";
import { modvalidation, ModValidation, MODULE_VALIDATION_TYPE_ID } from "@veive-io/mod-validation-as";
import { modvalidationany } from "./proto/modvalidationany";

export class ModValidationAny extends ModValidation {
  callArgs: System.getArgumentsReturn | null;

  contract_id: Uint8Array = System.getContractId();
  
  allowance_storage: Storage.Map<Uint8Array,modvalidationany.allowances> = new Storage.Map(
    this.contract_id,
    0,
    modvalidationany.allowances.decode,
    modvalidationany.allowances.encode,
    () => new modvalidationany.allowances()
  );

  /**
   * Validate operation by checking allowance
   * @external
   */
  is_valid_operation(args: modvalidation.is_valid_operation_args): modvalidation.is_valid_operation_result {
    // check if operation is "allow" of this contract
    if (
      Arrays.equal(args.operation!.contract_id!, this.contract_id) == true &&
      args.operation!.entry_point == 1090552691
    ) {
      System.log(`[mod-validation-any] skip allow`);
      return new modvalidation.is_valid_operation_result(true);
    }

    System.log(`[mod-validation-any] checking ${args.operation!.entry_point.toString()}`);

    const caller = System.getCaller().caller;

    const allowances_storage = this.allowance_storage.get(caller);
    if (allowances_storage && allowances_storage.value.length > 0) {

      for (let i = 0; i < allowances_storage.value.length; i++) {
        const allowance = allowances_storage.value[i];

        if (
          Arrays.equal(allowance.tx_id, System.getTransactionField("id")!.bytes_value) == true &&
          Arrays.equal(allowance.operation!.contract_id, args.operation!.contract_id!) == true &&
          allowance.operation!.entry_point == args.operation!.entry_point == true &&
          Arrays.equal(allowance.operation!.args, args.operation!.args!) == true
        ) {
          System.log(`[mod-validation-any] allowing ${args.operation!.entry_point.toString()}`);
          this._remove_allowance(caller, i);
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
    const is_authorized = System.checkAuthority(authority.authorization_type.contract_call, args.user!);
    System.require(is_authorized, `not authorized by the account`);

    const allowances_storage = this.allowance_storage.get(args.user!) || new modvalidationany.allowances([]);

    const allowance = new modvalidationany.allowance();
    allowance.tx_id = System.getTransactionField("id")!.bytes_value;
    allowance.operation = args.operation!
    allowance.caller = args.user!;

    allowances_storage.value.push(allowance);
    this.allowance_storage.put(args.user!, allowances_storage);

    System.log(`[mod-validation-any] pre-allow ${args.operation!.entry_point}`);
  }

  /**
   * @external
   * @readonly
   */
  get_allowances(args: modvalidationany.get_allowances_args): modvalidationany.get_allowances_result {
    return new modvalidationany.get_allowances_result(this.allowance_storage.get(args.user!)!.value);
  }

  /**
   * @external
   */
  on_install(args: modvalidation.on_install_args): void {
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
    result.scopes = [
      new modvalidation.scope(1)
    ];
    return result;
  }
  /**
   * remove allowance by index
   */
  _remove_allowance(user: Uint8Array, index: u32): void {
    const new_allowances = new modvalidationany.allowances([]);

    const allowances_storage = this.allowance_storage.get(user)!;
    for (let i = 0; i < allowances_storage.value.length; i++) {
      if (i != index) {
        new_allowances.value.push(allowances_storage.value[i]);
      }
    }

    this.allowance_storage.put(user, new_allowances);
  }
}
