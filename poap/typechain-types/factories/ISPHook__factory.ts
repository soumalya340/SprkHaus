/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { ISPHook, ISPHookInterface } from "../ISPHook";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "attester",
        type: "address",
      },
      {
        internalType: "uint64",
        name: "schemaId",
        type: "uint64",
      },
      {
        internalType: "uint64",
        name: "attestationId",
        type: "uint64",
      },
      {
        internalType: "bytes",
        name: "extraData",
        type: "bytes",
      },
    ],
    name: "didReceiveAttestation",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "attester",
        type: "address",
      },
      {
        internalType: "uint64",
        name: "schemaId",
        type: "uint64",
      },
      {
        internalType: "uint64",
        name: "attestationId",
        type: "uint64",
      },
      {
        internalType: "contract IERC20",
        name: "resolverFeeERC20Token",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "resolverFeeERC20Amount",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "extraData",
        type: "bytes",
      },
    ],
    name: "didReceiveAttestation",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "attester",
        type: "address",
      },
      {
        internalType: "uint64",
        name: "schemaId",
        type: "uint64",
      },
      {
        internalType: "uint64",
        name: "attestationId",
        type: "uint64",
      },
      {
        internalType: "bytes",
        name: "extraData",
        type: "bytes",
      },
    ],
    name: "didReceiveRevocation",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "attester",
        type: "address",
      },
      {
        internalType: "uint64",
        name: "schemaId",
        type: "uint64",
      },
      {
        internalType: "uint64",
        name: "attestationId",
        type: "uint64",
      },
      {
        internalType: "contract IERC20",
        name: "resolverFeeERC20Token",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "resolverFeeERC20Amount",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "extraData",
        type: "bytes",
      },
    ],
    name: "didReceiveRevocation",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

export class ISPHook__factory {
  static readonly abi = _abi;
  static createInterface(): ISPHookInterface {
    return new utils.Interface(_abi) as ISPHookInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): ISPHook {
    return new Contract(address, _abi, signerOrProvider) as ISPHook;
  }
}
