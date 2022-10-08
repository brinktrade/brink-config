const _ = require('lodash')
const ethers = require('ethers')
const verifierConstants = require('@brinkninja/verifiers/constants')

const deterministicAddresses = {
  ...require('@brinkninja/core/constants'),
  ...require('@brinkninja/adapters/constants'),
  ...require('@brinkninja/1inch-adapter/constants'),
  ...require('@brinkninja/nft-adapter/constants'),
  ...require('@brinkninja/univ3-adapter/constants'),
  ...verifierConstants,
  UNISWAP_V2_FACTORY: '0x5c69bee701ef814a2b6a3edd4b1652cb9cc5aa6f',
  UNISWAP_V2_ROUTER_02: '0x7a250d5630b4cf539739df2c5dacb4c659f2488d',
  UNISWAP_V3_FACTORY: '0x1f98431c8ad98523631ae4a59f267346ea31f984'
}

const {
  LIMIT_SWAP_VERIFIER,
  NFT_LIMIT_SWAP_VERIFIER,
  NFT_APPROVAL_SWAP_VERIFIER,
  CANCEL_VERIFIER,
  TRANSFER_VERIFIER,
  NFT_TRANSFER_VERIFIER,
  LIMIT_APPROVAL_SWAP_VERIFIER
} = verifierConstants

const tokenTypes = {
  ERC20: 'ERC20',
  ERC721: 'ERC721',
  ERC1155: 'ERC1155'
}

const VERIFIERS = [
  createVerifierDef('LimitSwapVerifier', LIMIT_SWAP_VERIFIER, 'ethToToken', 6),
  createVerifierDef('LimitSwapVerifier', LIMIT_SWAP_VERIFIER, 'tokenToEth', 6),
  createVerifierDef('LimitSwapVerifier', LIMIT_SWAP_VERIFIER, 'tokenToToken', 7),
  createVerifierDef('NftLimitSwapVerifier', NFT_LIMIT_SWAP_VERIFIER, 'tokenToNft', 6),
  createVerifierDef('NftLimitSwapVerifier', NFT_LIMIT_SWAP_VERIFIER, 'nftToToken', 7),
  createVerifierDef('NftLimitSwapVerifier', NFT_LIMIT_SWAP_VERIFIER, 'nftToNft', 6),
  createVerifierDef('NftApprovalSwapVerifier', NFT_APPROVAL_SWAP_VERIFIER, 'tokenToNft', 6),
  createVerifierDef('NftApprovalSwapVerifier', NFT_APPROVAL_SWAP_VERIFIER, 'nftToToken', 7),
  createVerifierDef('TransferVerifier', TRANSFER_VERIFIER, 'tokenTransfer', 6),
  createVerifierDef('TransferVerifier', TRANSFER_VERIFIER, 'ethTransfer', 5),
  createVerifierDef('NftTransferVerifier', NFT_TRANSFER_VERIFIER, 'nftTransfer', 7),
  createVerifierDef('CancelVerifier', CANCEL_VERIFIER, 'cancel', 2),
  createVerifierDef('LimitApprovalSwapVerifier', LIMIT_APPROVAL_SWAP_VERIFIER, 'tokenToToken', 7),
  createVerifierDef('LimitApprovalSwapVerifier', LIMIT_APPROVAL_SWAP_VERIFIER, 'tokenToEth', 6)
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

function createVerifierDef (contractName, contractAddress, functionName, numSignedParams) {
  const artifact = require(`@brinkninja/verifiers/artifacts/contracts/Verifiers/${contractName}.sol/${contractName}.json`)
  const fnDef = _.find(artifact.abi, { name: functionName })

  const interface = new ethers.utils.Interface(artifact.abi)
  const functionSignature = ethers.utils.FunctionFragment.from(fnDef).format()
  const functionSignatureHash = interface.getSighash(functionSignature)

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

module.exports = config
