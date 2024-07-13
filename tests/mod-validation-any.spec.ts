import { LocalKoinos } from "@roamin/local-koinos";
import { Contract, Provider, Signer, Transaction, utils } from "koilib";
import path from "path";
import { randomBytes } from "crypto";
import { beforeAll, afterAll, it, expect } from "@jest/globals";
import * as dotenv from "dotenv";
import * as modAbi from "../build/modvalidationany-abi.json";

dotenv.config();

jest.setTimeout(600000);

const localKoinos = new LocalKoinos();
const provider = localKoinos.getProvider() as unknown as Provider;

const modSign = new Signer({
    privateKey: randomBytes(32).toString("hex"),
    provider,
});

const modContract = new Contract({
    id: modSign.getAddress(),
    abi: modAbi,
    provider,
}).functions;

const account1Sign = new Signer({
    privateKey: randomBytes(32).toString("hex"),
    provider,
});

const account2Sign = new Signer({
    privateKey: randomBytes(32).toString("hex"),
    provider,
});

const tokenAccount = new Signer({
    privateKey: randomBytes(32).toString("hex"),
    provider,
});

const tokenContract = new Contract({
    id: tokenAccount.getAddress(),
    abi: utils.tokenAbi,
    provider,
}).functions;

beforeAll(async () => {
    // start local-koinos node
    await localKoinos.startNode();
    await localKoinos.startBlockProduction();

    // deploy mod contract
    await localKoinos.deployContract(
        modSign.getPrivateKey("wif"),
        path.join(__dirname, "../build/release/ModValidationAny.wasm"),
        modAbi
    );

    // deploy token contract
    await localKoinos.deployContract(
        tokenAccount.getPrivateKey("wif"),
        path.join(__dirname, "../node_modules/@koinosbox/contracts/assembly/token/release/token.wasm"),
        utils.tokenAbi
    );
});

afterAll(() => {
    // stop local-koinos node
    localKoinos.stopNode();
});

it("allow operation", async () => {
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

    await tx.pushOperation(allow);
    await tx.pushOperation(validate);
    const receipt = await tx.send();
    await tx.wait();

    expect(receipt).toBeDefined();

    const { result } = await modContract['get_allowances']();
    expect(result).toBeUndefined();
});

it("doesn't allow operation", async () => {
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

    // validate operation
    const { operation: validate } = await modContract['is_valid_operation']({
        operation: {
            contract_id: transfer.call_contract.contract_id,
            entry_point: 1, //wrong parameter
            args: transfer.call_contract.args
        }
    }, { onlyOperation: true });

    const tx = new Transaction({
        signer: account1Sign,
        provider,
    });

    await tx.pushOperation(allow);
    await tx.pushOperation(validate);
    const receipt = await tx.send();
    await tx.wait();

    expect(receipt).toBeDefined();

    const { result } = await modContract['get_allowances']();
    expect(result.value.length).toStrictEqual(1);
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
    expect(receipt.logs).toContain(`[mod-valid-any-op] skip ${transfer.call_contract.entry_point.toString()}`);
});