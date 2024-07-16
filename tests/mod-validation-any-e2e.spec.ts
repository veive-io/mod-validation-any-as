import { LocalKoinos } from "@roamin/local-koinos";
import { Contract, Provider, Signer, Transaction, utils } from "koilib";
import path from "path";
import { randomBytes } from "crypto";
import { beforeAll, afterAll, it, expect } from "@jest/globals";
import * as modAbi from "../build/modvalidationany-abi.json";
import * as accountAbi from "@veive/account-as/dist/account-abi.json";
import * as dotenv from "dotenv";

dotenv.config();

jest.setTimeout(600000);

const localKoinos = new LocalKoinos();
const provider = localKoinos.getProvider() as unknown as Provider;

const account1Sign = new Signer({
  privateKey: randomBytes(32).toString("hex"),
  provider,
});

const account2Sign = new Signer({
  privateKey: randomBytes(32).toString("hex"),
  provider,
});

const modSign = new Signer({
  privateKey: randomBytes(32).toString("hex"),
  provider,
});

const tokenSign = new Signer({
  privateKey: randomBytes(32).toString("hex"),
  provider,
});

const account1Contract = new Contract({
  id: account1Sign.getAddress(),
  abi: accountAbi,
  provider,
}).functions;

const modContract = new Contract({
  id: modSign.getAddress(),
  abi: modAbi,
  provider,
}).functions;

const tokenContract = new Contract({
  id: tokenSign.getAddress(),
  abi: utils.tokenAbi,
  provider,
}).functions;

beforeAll(async () => {
  // start local-koinos node
  await localKoinos.startNode();
  await localKoinos.startBlockProduction();

  // deploy smart-account
  await localKoinos.deployContract(
    account1Sign.getPrivateKey("wif"),
    path.join(__dirname, "../node_modules/@veive/account-as/dist/release/Account.wasm"),
    accountAbi,
    {},
    {
      authorizesCallContract: true,
      authorizesTransactionApplication: false,
      authorizesUploadContract: false,
    }
  );

  // deploy mod contract
  await localKoinos.deployContract(
    modSign.getPrivateKey("wif"),
    path.join(__dirname, "../build/release/ModValidationAny.wasm"),
    modAbi
  );

  // deploy token account
  await localKoinos.deployContract(
    tokenSign.getPrivateKey("wif"),
    path.join(__dirname, "../node_modules/@koinosbox/contracts/assembly/token/release/token.wasm"),
    utils.tokenAbi
  );

  // mint some tokens to user
  const tx2 = new Transaction({
    signer: tokenSign,
    provider,
  });
  await tx2.pushOperation(tokenContract["mint"], {
    to: account1Sign.address,
    value: "123",
  });

  await tx2.send();
  await tx2.wait();
});

afterAll(() => {
  // stop local-koinos node
  localKoinos.stopNode();
});

it("install module", async () => {
  // install validator
  const { operation: install_module } = await account1Contract["install_module"]({
    module_type_id: 2,
    contract_id: modSign.address
  }, { onlyOperation: true });

  const tx = new Transaction({
    signer: account1Sign,
    provider
  });

  const { operation: exec } = await account1Contract["execute_user"]({
    operation: {
      contract_id: install_module.call_contract.contract_id,
      entry_point: install_module.call_contract.entry_point,
      args: install_module.call_contract.args
    }
  }, { onlyOperation: true });

  await tx.pushOperation(exec);
  const receipt = await tx.send();
  await tx.wait();

  expect(receipt).toBeDefined();
  expect(receipt.logs).toContain("[mod-validation-any] called on_install");

  const { result } = await account1Contract["get_modules"]();
  expect(result.value[0]).toStrictEqual(modSign.address);
});

it("account1 tries a transfer with unlegit allowance", async () => {
  // prepare fake transfer operation
  const { operation: fakeTransfer } = await tokenContract['transfer']({
    from: account1Sign.address,
    to: account2Sign.address,
    value: "1",
  }, { onlyOperation: true });

  // allow operation
  const { operation: allow } = await modContract['allow']({
    user: account1Sign.address,
    operation: {
      contract_id: fakeTransfer.call_contract.contract_id,
      entry_point: fakeTransfer.call_contract.entry_point,
      args: fakeTransfer.call_contract.args
    }
  }, { onlyOperation: true });

  // prepare real transfer operation
  const { operation: transfer } = await tokenContract['transfer']({
    from: account1Sign.address,
    to: account2Sign.address,
    value: "100",
  }, { onlyOperation: true })

  // send operations
  const tx = new Transaction({
    signer: account1Sign,
    provider
  });
  await tx.pushOperation(allow);
  await tx.pushOperation(transfer);

  let error = undefined;
  try {
    await tx.send();
  } catch (e) {
    error = e;
  }

  // expect fail check
  expect(JSON.parse(error.message).logs).toContain(`[mod-validation-any] fail ${transfer.call_contract.entry_point}`);

  // expect unaltered balances
  const { result: r1 } = await tokenContract["balanceOf"]({
    owner: account1Sign.address
  });
  expect(r1).toStrictEqual({
    value: "123",
  });

  const { result: r2 } = await tokenContract["balanceOf"]({
    owner: account2Sign.address
  });
  expect(r2).toStrictEqual({
    value: "0",
  });
});

it("account1 tries a transfer with legit allowance", async () => {
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

  expect(receipt).toBeDefined();
  console.log(receipt);

  expect(receipt.logs).toContain('[mod-validation-any] skip allow');
  expect(receipt.logs).toContain(`[mod-validation-any] allowing ${transfer.call_contract.entry_point}`);

  // check balances
  const { result: r1 } = await tokenContract["balanceOf"]({
    owner: account1Sign.address
  });
  expect(r1).toStrictEqual({
    value: "122",
  });

  const { result: r2 } = await tokenContract["balanceOf"]({
    owner: account2Sign.address
  });
  expect(r2).toStrictEqual({
    value: "1",
  });
});

it("add skip entry_point", async () => {
  // prepare operation to obtain entry_point
  const { operation: transfer } = await tokenContract['transfer']({
    from: account1Sign.address,
    to: account2Sign.address,
    value: "1",
  }, { onlyOperation: true });

  // set skip entry point
  const { operation: set_config } = await modContract['add_skip_entry_point']({
    entry_point: transfer.call_contract.entry_point
  }, { onlyOperation: true });

  const tx = new Transaction({
    signer: account1Sign,
    provider,
  });

  await tx.pushOperation(set_config);
  const receipt = await tx.send();
  await tx.wait();

  expect(receipt).toBeDefined();

  const { result } = await modContract['get_skip_entry_points']();
  expect(result.value).toStrictEqual([transfer.call_contract.entry_point]);
});

it("operation skipped", async () => {
  // prepare operation
  const { operation: transfer } = await tokenContract['transfer']({
    from: account1Sign.address,
    to: account2Sign.address,
    value: "1",
  }, { onlyOperation: true });

  // validate operation
  const { operation: validate } = await modContract['is_valid_operation']({
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

  await tx.pushOperation(validate);
  const receipt = await tx.send();
  await tx.wait();

  expect(receipt).toBeDefined();
  expect(receipt.logs).toContain(`[mod-validation-any] skip ${transfer.call_contract.entry_point.toString()}`);
});