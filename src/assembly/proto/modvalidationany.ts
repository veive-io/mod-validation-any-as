import { Writer, Reader } from "as-proto";

export namespace modvalidationany {
  export class account_id {
    static encode(message: account_id, writer: Writer): void {
      const unique_name_value = message.value;
      if (unique_name_value !== null) {
        writer.uint32(10);
        writer.bytes(unique_name_value);
      }
    }

    static decode(reader: Reader, length: i32): account_id {
      const end: usize = length < 0 ? reader.end : reader.ptr + length;
      const message = new account_id();

      while (reader.ptr < end) {
        const tag = reader.uint32();
        switch (tag >>> 3) {
          case 1:
            message.value = reader.bytes();
            break;

          default:
            reader.skipType(tag & 7);
            break;
        }
      }

      return message;
    }

    value: Uint8Array | null;

    constructor(value: Uint8Array | null = null) {
      this.value = value;
    }
  }

  export class allowances_storage {
    static encode(message: allowances_storage, writer: Writer): void {
      const unique_name_allowances = message.allowances;
      for (let i = 0; i < unique_name_allowances.length; ++i) {
        writer.uint32(10);
        writer.fork();
        allowance.encode(unique_name_allowances[i], writer);
        writer.ldelim();
      }
    }

    static decode(reader: Reader, length: i32): allowances_storage {
      const end: usize = length < 0 ? reader.end : reader.ptr + length;
      const message = new allowances_storage();

      while (reader.ptr < end) {
        const tag = reader.uint32();
        switch (tag >>> 3) {
          case 1:
            message.allowances.push(allowance.decode(reader, reader.uint32()));
            break;

          default:
            reader.skipType(tag & 7);
            break;
        }
      }

      return message;
    }

    allowances: Array<allowance>;

    constructor(allowances: Array<allowance> = []) {
      this.allowances = allowances;
    }
  }

  export class config_storage {
    static encode(message: config_storage, writer: Writer): void {
      const unique_name_skip_entry_points = message.skip_entry_points;
      if (unique_name_skip_entry_points.length !== 0) {
        for (let i = 0; i < unique_name_skip_entry_points.length; ++i) {
          writer.uint32(8);
          writer.uint32(unique_name_skip_entry_points[i]);
        }
      }
    }

    static decode(reader: Reader, length: i32): config_storage {
      const end: usize = length < 0 ? reader.end : reader.ptr + length;
      const message = new config_storage();

      while (reader.ptr < end) {
        const tag = reader.uint32();
        switch (tag >>> 3) {
          case 1:
            message.skip_entry_points.push(reader.uint32());
            break;

          default:
            reader.skipType(tag & 7);
            break;
        }
      }

      return message;
    }

    skip_entry_points: Array<u32>;

    constructor(skip_entry_points: Array<u32> = []) {
      this.skip_entry_points = skip_entry_points;
    }
  }

  export class operation {
    static encode(message: operation, writer: Writer): void {
      const unique_name_contract_id = message.contract_id;
      if (unique_name_contract_id !== null) {
        writer.uint32(10);
        writer.bytes(unique_name_contract_id);
      }

      if (message.entry_point != 0) {
        writer.uint32(16);
        writer.uint32(message.entry_point);
      }

      const unique_name_args = message.args;
      if (unique_name_args !== null) {
        writer.uint32(26);
        writer.bytes(unique_name_args);
      }
    }

    static decode(reader: Reader, length: i32): operation {
      const end: usize = length < 0 ? reader.end : reader.ptr + length;
      const message = new operation();

      while (reader.ptr < end) {
        const tag = reader.uint32();
        switch (tag >>> 3) {
          case 1:
            message.contract_id = reader.bytes();
            break;

          case 2:
            message.entry_point = reader.uint32();
            break;

          case 3:
            message.args = reader.bytes();
            break;

          default:
            reader.skipType(tag & 7);
            break;
        }
      }

      return message;
    }

    contract_id: Uint8Array | null;
    entry_point: u32;
    args: Uint8Array | null;

    constructor(
      contract_id: Uint8Array | null = null,
      entry_point: u32 = 0,
      args: Uint8Array | null = null
    ) {
      this.contract_id = contract_id;
      this.entry_point = entry_point;
      this.args = args;
    }
  }

  export class allowance {
    static encode(message: allowance, writer: Writer): void {
      const unique_name_tx_id = message.tx_id;
      if (unique_name_tx_id !== null) {
        writer.uint32(10);
        writer.bytes(unique_name_tx_id);
      }

      const unique_name_caller = message.caller;
      if (unique_name_caller !== null) {
        writer.uint32(18);
        writer.bytes(unique_name_caller);
      }

      const unique_name_operation = message.operation;
      if (unique_name_operation !== null) {
        writer.uint32(26);
        writer.fork();
        operation.encode(unique_name_operation, writer);
        writer.ldelim();
      }
    }

    static decode(reader: Reader, length: i32): allowance {
      const end: usize = length < 0 ? reader.end : reader.ptr + length;
      const message = new allowance();

      while (reader.ptr < end) {
        const tag = reader.uint32();
        switch (tag >>> 3) {
          case 1:
            message.tx_id = reader.bytes();
            break;

          case 2:
            message.caller = reader.bytes();
            break;

          case 3:
            message.operation = operation.decode(reader, reader.uint32());
            break;

          default:
            reader.skipType(tag & 7);
            break;
        }
      }

      return message;
    }

    tx_id: Uint8Array | null;
    caller: Uint8Array | null;
    operation: operation | null;

    constructor(
      tx_id: Uint8Array | null = null,
      caller: Uint8Array | null = null,
      operation: operation | null = null
    ) {
      this.tx_id = tx_id;
      this.caller = caller;
      this.operation = operation;
    }
  }

  export class allow_args {
    static encode(message: allow_args, writer: Writer): void {
      const unique_name_operation = message.operation;
      if (unique_name_operation !== null) {
        writer.uint32(18);
        writer.fork();
        operation.encode(unique_name_operation, writer);
        writer.ldelim();
      }
    }

    static decode(reader: Reader, length: i32): allow_args {
      const end: usize = length < 0 ? reader.end : reader.ptr + length;
      const message = new allow_args();

      while (reader.ptr < end) {
        const tag = reader.uint32();
        switch (tag >>> 3) {
          case 2:
            message.operation = operation.decode(reader, reader.uint32());
            break;

          default:
            reader.skipType(tag & 7);
            break;
        }
      }

      return message;
    }

    operation: operation | null;

    constructor(operation: operation | null = null) {
      this.operation = operation;
    }
  }

  export class get_allowances_result {
    static encode(message: get_allowances_result, writer: Writer): void {
      const unique_name_value = message.value;
      for (let i = 0; i < unique_name_value.length; ++i) {
        writer.uint32(10);
        writer.fork();
        allowance.encode(unique_name_value[i], writer);
        writer.ldelim();
      }
    }

    static decode(reader: Reader, length: i32): get_allowances_result {
      const end: usize = length < 0 ? reader.end : reader.ptr + length;
      const message = new get_allowances_result();

      while (reader.ptr < end) {
        const tag = reader.uint32();
        switch (tag >>> 3) {
          case 1:
            message.value.push(allowance.decode(reader, reader.uint32()));
            break;

          default:
            reader.skipType(tag & 7);
            break;
        }
      }

      return message;
    }

    value: Array<allowance>;

    constructor(value: Array<allowance> = []) {
      this.value = value;
    }
  }
}
