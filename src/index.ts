import find from 'lodash/find'
import ethers from 'ethers'
import verifierConstants from '@brinkninja/verifiers/constants'
import verifierV2Constants from '@brinkninja/verifiers-v2/constants'
import startegiesConstants from '@brinkninja/strategies/constants'
import { AbiFunction } from 'abitype'
import { FunctionFragment } from 'ethers/lib/utils'

import coreConstants from '@brinkninja/core/constants'
import adaptersConstants from '@brinkninja/adapters/constants'
import oneInchAdapterConstants from '@brinkninja/1inch-adapter/constants'
import nftAdapterConstants from '@brinkninja/nft-adapter/constants'
import univ3AdapterConstants from '@brinkninja/univ3-adapter/constants'
import strategiesAdapterConstants from '@brinkninja/strategy-adapters/constants'

const deprecatedVerifiers = [
  'LIMIT_SWAP_VERIFIER',
  'NFT_LIMIT_SWAP_VERIFIER',
  'LIMIT_APPROVAL_SWAP_VERIFIER',
  'NFT_APPROVAL_SWAP_VERIFIER'
]

const deterministicAddresses = {
  ...coreConstants,
  ...adaptersConstants,
  ...oneInchAdapterConstants,
  ...nftAdapterConstants,
  ...univ3AdapterConstants,
  ...strategiesAdapterConstants,
  ...filterDeprecatedVerifiers(verifierConstants),
  ...verifierV2Constants,
  ...startegiesConstants,
  UNISWAP_V2_FACTORY: '0x5c69bee701ef814a2b6a3edd4b1652cb9cc5aa6f',
  UNISWAP_V2_ROUTER_02: '0x7a250d5630b4cf539739df2c5dacb4c659f2488d',
  UNISWAP_V3_FACTORY: '0x1f98431c8ad98523631ae4a59f267346ea31f984'
}

const {
  CANCEL_VERIFIER,
  TRANSFER_VERIFIER,
  NFT_TRANSFER_VERIFIER,
  LIMIT_APPROVAL_SWAP_VERIFIER
} = verifierConstants

const { APPROVAL_SWAPS_V1 } = verifierV2Constants

const tokenTypes = {
  ERC20: 'ERC20',
  ERC721: 'ERC721',
  ERC1155: 'ERC1155'
}

const VERIFIERS = [
  createVerifierDef(
    'verifiers',
    'TransferVerifier',
    TRANSFER_VERIFIER,
    'tokenTransfer',
    6
  ),
  createVerifierDef(
    'verifiers',
    'TransferVerifier',
    TRANSFER_VERIFIER,
    'ethTransfer',
    5
  ),
  createVerifierDef(
    'verifiers',
    'NftTransferVerifier',
    NFT_TRANSFER_VERIFIER,
    'nftTransfer',
    7
  ),
  createVerifierDef(
    'verifiers',
    'CancelVerifier',
    CANCEL_VERIFIER,
    'cancel',
    2
  ),
  createVerifierDef(
    'verifiers-v2',
    'ApprovalSwapsV1',
    APPROVAL_SWAPS_V1,
    'tokenToToken',
    7
  ),
  createVerifierDef(
    'verifiers-v2',
    'ApprovalSwapsV1',
    APPROVAL_SWAPS_V1,
    'tokenToNft',
    6
  ),
  createVerifierDef(
    'verifiers-v2',
    'ApprovalSwapsV1',
    APPROVAL_SWAPS_V1,
    'nftToToken',
    7
  ),
  createVerifierDef(
    'verifiers-v2',
    'ApprovalSwapsV1',
    APPROVAL_SWAPS_V1,
    'tokenToERC1155',
    8
  ),
  createVerifierDef(
    'verifiers-v2',
    'ApprovalSwapsV1',
    APPROVAL_SWAPS_V1,
    'ERC1155ToToken',
    8
  ),
  createVerifierDef(
    'verifiers-v2',
    'ApprovalSwapsV1',
    APPROVAL_SWAPS_V1,
    'ERC1155ToERC1155',
    9
  )
]

let config = {
  mainnet: {
    ...deterministicAddresses,
    VERIFIERS,
    CHAIN_ID: 1,
    NETWORK: 'mainnet',
    ETHERSCAN_DOMAIN: 'etherscan.io',
    WETH9: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
  },
  localhost: {
    ...deterministicAddresses,
    VERIFIERS,
    CHAIN_ID: 1,
    NETWORK: 'hardhat',
    ETHERSCAN_DOMAIN: 'local.etherscan.io',
    WETH9: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
  },
  goerli: {
    ...deterministicAddresses,
    VERIFIERS,
    CHAIN_ID: 5,
    NETWORK: 'goerli',
    ETHERSCAN_DOMAIN: 'goerli.etherscan.io',
    WETH9: '0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6'
  },
  rinkeby: {
    ...deterministicAddresses,
    VERIFIERS,
    CHAIN_ID: 4,
    NETWORK: 'rinkeby',
    ETHERSCAN_DOMAIN: 'rinkeby.etherscan.io',
    WETH9: '0xc778417E063141139Fce010982780140Aa0cD5Ab'
  },
  ropsten: {
    ...deterministicAddresses,
    VERIFIERS,
    CHAIN_ID: 3,
    NETWORK: 'ropsten',
    ETHERSCAN_DOMAIN: 'ropsten.etherscan.io',
    WETH9: '0xc778417E063141139Fce010982780140Aa0cD5Ab'
  },
  kovan: {
    ...deterministicAddresses,
    VERIFIERS,
    CHAIN_ID: 42,
    NETWORK: 'kovan',
    ETHERSCAN_DOMAIN: 'kovan.etherscan.io',
    WETH9: '0xd0A1E359811322d97991E03f863a0C30C2cF029C'
  }
}

function createVerifierDef(
  pkgName: string,
  contractName: string,
  contractAddress: string,
  functionName: string,
  numSignedParams: number
) {
  const artifact = require(`@brinkninja/${pkgName}/artifacts/contracts/Verifiers/${contractName}.sol/${contractName}.json`)
  const fnDef: AbiFunction = find(artifact.abi, { name: functionName })

  const abiInterface = new ethers.utils.Interface(artifact.abi)
  const functionSignature = ethers.utils.FunctionFragment.from(
    fnDef as unknown as FunctionFragment
  ).format()
  const functionSignatureHash = abiInterface.getSighash(functionSignature)

  const paramTypes = fnDef.inputs.map((input, i) => {
    let paramDef = {
      name: input.name,
      type: input.type,
      signed: i < numSignedParams
    }

    if (input.internalType) {
      for (let t in tokenTypes) {
        if (input.internalType.toLowerCase().indexOf(t.toLowerCase()) > -1) {
          paramDef.type = t
        }
      }
    }

    return paramDef
  })
  return {
    functionName,
    functionSignature,
    functionSignatureHash,
    contractName,
    contractAddress,
    paramTypes
  }
}

function filterDeprecatedVerifiers(verifierConstantsMapping: {
  [key: string]: string
}) {
  let filteredMapping: { [key: string]: string } = {}
  for (let verifierConst in verifierConstantsMapping) {
    if (!deprecatedVerifiers.includes(verifierConst)) {
      filteredMapping[verifierConst] = verifierConstantsMapping[verifierConst]
    }
  }
  return filteredMapping
}

export default config