import axios from 'axios';
import dotenv from 'dotenv';
import { ethers } from 'ethers';
import {
  Deploy,
  DeployHeader,
  ExecutableDeployItem,
  TransferDeployItem,
  ModuleBytes,
  StoredContractByHash,
  StoredVersionedContractByHash,
  Args,
  CLValue,
  PrivateKey,
  PublicKey,
  KeyAlgorithm,
  Timestamp,
  Duration,
  URef,
  Hash,
} from 'casper-js-sdk';
import { logger } from '../utils/logger';
import { getNodeStatus } from './casperRpcService';

dotenv.config();

const RPC_URL = process.env.CASPER_RPC_URL || 'https://node.testnet.casper.network/rpc';

// Chain names: testnet = "casper-test", mainnet = "casper"
function getChainName(): string {
  const chainId = process.env.CASPER_CHAIN_ID || '1';
  // Chain ID 1 = testnet (casper-test), Chain ID 0 = mainnet (casper)
  return chainId === '1' ? 'casper-test' : 'casper';
}

// Default TTL: 30 minutes (1800000 ms)
const DEFAULT_TTL_MS = 1800000;
// Default gas price
const DEFAULT_GAS_PRICE = 1;

// ============================================================
// Key Management
// ============================================================

let cachedPrivateKey: PrivateKey | null = null;
let cachedPublicKey: PublicKey | null = null;

/**
 * Load the signing private key from environment variable.
 * Supports hex format (without 0x prefix) or PEM format.
 */
export function getSigningKey(): PrivateKey {
  if (cachedPrivateKey) return cachedPrivateKey;

  const pemKey = process.env.CASPER_SIGNING_KEY_PEM;
  const hexKey = process.env.CASPER_SIGNING_KEY_HEX;
  const algorithm = (process.env.CASPER_KEY_ALGORITHM || 'ed25519').toLowerCase();

  const keyAlgorithm = algorithm === 'secp256k1' ? KeyAlgorithm.SECP256K1 : KeyAlgorithm.ED25519;

  if (pemKey) {
    cachedPrivateKey = PrivateKey.fromPem(pemKey, keyAlgorithm);
  } else if (hexKey) {
    cachedPrivateKey = PrivateKey.fromHex(hexKey, keyAlgorithm);
  } else {
    throw new Error(
      'No signing key configured. Set CASPER_SIGNING_KEY_PEM or CASPER_SIGNING_KEY_HEX in .env file.\n' +
      'Generate a key pair with: npx casper-client keygen -a ed25519'
    );
  }

  cachedPublicKey = cachedPrivateKey.publicKey;
  logger.info(`Signing key loaded. Public key: ${cachedPublicKey.toHex()}`);
  return cachedPrivateKey;
}

/**
 * Get the public key associated with the signing key.
 */
export function getSigningPublicKey(): PublicKey {
  if (!cachedPublicKey) {
    getSigningKey();
  }
  return cachedPublicKey!;
}

/**
 * Check if signing key is configured.
 */
export function isSigningKeyConfigured(): boolean {
  return !!(process.env.CASPER_SIGNING_KEY_PEM || process.env.CASPER_SIGNING_KEY_HEX);
}

// ============================================================
// Deploy Submission
// ============================================================

/**
 * Submit a signed deploy to the network.
 * @param deploy - The signed Deploy object
 * @returns The deploy hash
 */
export async function submitDeploy(deploy: Deploy): Promise<string> {
  const deployJson = Deploy.toJSON(deploy);

  try {
    const response = await axios.post(RPC_URL, {
      jsonrpc: '2.0',
      method: 'account_put_deploy',
      params: { deploy: deployJson },
      id: 1,
    }, {
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.data.error) {
      throw new Error(`RPC Error: ${response.data.error.message} (code: ${response.data.error.code})`);
    }

    return response.data.result.deploy_hash;
  } catch (error: any) {
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout: Casper RPC node did not respond within 30 seconds');
    }
    throw error;
  }
}

/**
 * Wait for a deploy to be confirmed on-chain.
 * Polls info_get_deploy until the deploy has execution results.
 * @param deployHash - The deploy hash to wait for
 * @param timeoutMs - Timeout in milliseconds (default: 120000 = 2 min)
 * @returns The deploy info with execution results
 */
export async function waitForDeployConfirmation(
  deployHash: string,
  timeoutMs: number = 120000
): Promise<any> {
  const startTime = Date.now();
  const pollInterval = 5000; // 5 seconds

  while (Date.now() - startTime < timeoutMs) {
    try {
      const response = await axios.post(RPC_URL, {
        jsonrpc: '2.0',
        method: 'info_get_deploy',
        params: { DeployHash: deployHash },
        id: 1,
      }, {
        timeout: 15000,
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.data.error) {
        // Deploy not found yet, keep polling
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        continue;
      }

      const result = response.data.result;
      if (result.execution_results && result.execution_results.length > 0) {
        return result;
      }

      // Deploy accepted but not yet executed, keep polling
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    } catch (error) {
      // Network error, keep polling
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }

  throw new Error(`Deploy ${deployHash} was not confirmed within ${timeoutMs / 1000} seconds. It may still be pending.`);
}

/**
 * Create, sign, and submit a deploy, then wait for confirmation.
 * @param payment - The payment ExecutableDeployItem
 * @param session - The session ExecutableDeployItem
 * @param gasPayment - Gas payment amount in motes (default: 10000000000 = 10 CSPR)
 * @returns The deploy hash and execution result
 */
export async function signAndSubmitDeploy(
  session: ExecutableDeployItem,
  gasPayment: string = '10000000000'
): Promise<{ deployHash: string; result: any }> {
  const signingKey = getSigningKey();
  const publicKey = signingKey.publicKey;
  const chainName = getChainName();

  // Create deploy header
  const header = new DeployHeader(
    chainName,
    [], // no dependencies
    DEFAULT_GAS_PRICE,
    new Timestamp(new Date()),
    new Duration(DEFAULT_TTL_MS),
    publicKey
  );

  // Standard payment
  const payment = ExecutableDeployItem.standardPayment(gasPayment);

  // Create deploy
  const deploy = Deploy.makeDeploy(header, payment, session);

  // Sign deploy
  deploy.sign(signingKey);

  // Submit deploy
  const deployHash = await submitDeploy(deploy);
  logger.info(`Deploy submitted: ${deployHash}`);

  // Wait for confirmation
  const result = await waitForDeployConfirmation(deployHash);

  return { deployHash, result };
}

// ============================================================
// 1. Native CSPR Operations
// ============================================================

/**
 * Transfer CSPR to another account.
 * @param targetPublicKey - Recipient's public key (hex string, 68 chars)
 * @param amount - Amount in CSPR (will be converted to motes)
 * @param transferId - Optional transfer ID (default: random)
 * @param sourcePurse - Optional source purse URef (default: main purse)
 */
export async function transferCspr(
  targetPublicKey: string,
  amount: string,
  transferId?: number,
  sourcePurse?: string
): Promise<{ deployHash: string; result: any }> {
  const targetPubKey = PublicKey.fromHex(targetPublicKey);
  const amountMotes = ethers.parseUnits(amount, 9).toString();
  const id = transferId ?? Math.floor(Math.random() * 1000000);

  let sourceUref: URef | null = null;
  if (sourcePurse) {
    sourceUref = URef.fromString(sourcePurse);
  }

  const transferItem = TransferDeployItem.newTransfer(
    amountMotes,
    targetPubKey,
    sourceUref,
    id
  );

  const session = new ExecutableDeployItem();
  session.transfer = transferItem;

  return signAndSubmitDeploy(session);
}

/**
 * Create a new purse (via session code - requires empty module bytes).
 * Note: Creating a purse requires custom session code or calling a contract.
 * This is a helper that creates a deploy with empty module bytes for purse creation.
 */
export async function createPurse(
  purseName?: string
): Promise<{ deployHash: string; result: any }> {
  // Creating a purse requires system contract call or custom session code
  // Using the system's create_purse via standard deploy
  const args = new Args(new Map());
  if (purseName) {
    args.insert('purse_name', CLValue.newCLString(purseName));
  }

  // Empty module bytes for native operation
  const session = ExecutableDeployItem.newModuleBytes(new Uint8Array(0), args);

  return signAndSubmitDeploy(session);
}

/**
 * Add an associated key to the account.
 * @param accountToAdd - Public key hex of the account to add
 * @param weight - Weight of the key (1-255)
 */
export async function addAssociatedKey(
  accountToAdd: string,
  weight: number
): Promise<{ deployHash: string; result: any }> {
  const pubKey = PublicKey.fromHex(accountToAdd);
  const accountHash = pubKey.accountHash();

  const args = Args.fromMap({
    key: CLValue.newCLByteArray(accountHash.toBytes()),
    weight: CLValue.newCLUint8(weight),
  });

  // This is a system operation via session code
  const session = ExecutableDeployItem.newModuleBytes(new Uint8Array(0), args);

  return signAndSubmitDeploy(session);
}

/**
 * Remove an associated key from the account.
 * @param accountToRemove - Public key hex of the account to remove
 */
export async function removeAssociatedKey(
  accountToRemove: string
): Promise<{ deployHash: string; result: any }> {
  const pubKey = PublicKey.fromHex(accountToRemove);
  const accountHash = pubKey.accountHash();

  const args = Args.fromMap({
    key: CLValue.newCLByteArray(accountHash.toBytes()),
  });

  const session = ExecutableDeployItem.newModuleBytes(new Uint8Array(0), args);

  return signAndSubmitDeploy(session);
}

/**
 * Set action threshold for the account.
 * @param actionType - 'deployment' or 'key_management'
 * @param threshold - New threshold value
 */
export async function setActionThreshold(
  actionType: string,
  threshold: number
): Promise<{ deployHash: string; result: any }> {
  // action_type: 0 = deployment, 1 = key_management
  const actionTypeByte = actionType.toLowerCase() === 'deployment' ? 0 : 1;

  const args = Args.fromMap({
    action_type: CLValue.newCLUint8(actionTypeByte),
    threshold: CLValue.newCLUint8(threshold),
  });

  const session = ExecutableDeployItem.newModuleBytes(new Uint8Array(0), args);

  return signAndSubmitDeploy(session);
}

/**
 * Put a named key on the account.
 * @param name - The name for the key
 * @param key - The key value (URef, Hash, etc.)
 */
export async function putNamedKey(
  name: string,
  keyValue: string
): Promise<{ deployHash: string; result: any }> {
  // Parse the key value - could be a URef, Account, Hash, etc.
  const key = new Hash(ethers.getBytes(keyValue));

  const args = Args.fromMap({
    name: CLValue.newCLString(name),
    key: CLValue.newCLKey(key as any),
  });

  const session = ExecutableDeployItem.newModuleBytes(new Uint8Array(0), args);

  return signAndSubmitDeploy(session);
}

// ============================================================
// 2. Contract Lifecycle Operations
// ============================================================

/**
 * Install a new smart contract (deploy Wasm).
 * @param wasmBytes - The compiled Wasm as Uint8Array
 * @param args - Runtime arguments for the contract init
 */
export async function installContract(
  wasmBytes: Uint8Array,
  args: Map<string, CLValue>
): Promise<{ deployHash: string; result: any }> {
  const runtimeArgs = new Args(args);
  const session = ExecutableDeployItem.newModuleBytes(wasmBytes, runtimeArgs);

  // Contract installation requires more gas
  return signAndSubmitDeploy(session, '50000000000'); // 50 CSPR for contract install
}

/**
 * Upgrade an existing contract at a given contract hash.
 * @param contractHash - The contract hash to upgrade
 * @param wasmBytes - New Wasm bytes
 * @param args - Runtime arguments
 */
export async function upgradeContract(
  contractHash: string,
  wasmBytes: Uint8Array,
  args: Map<string, CLValue>
): Promise<{ deployHash: string; result: any }> {
  // Contract upgrade uses module bytes with the contract hash as an argument
  const runtimeArgs = new Args(args);
  runtimeArgs.insert('contract_hash', CLValue.newCLByteArray(ethers.getBytes(contractHash)));

  const session = ExecutableDeployItem.newModuleBytes(wasmBytes, runtimeArgs);

  return signAndSubmitDeploy(session, '50000000000');
}

/**
 * Call a stored contract by hash.
 * @param contractHash - The contract hash (hex string)
 * @param entryPoint - The entry point name (e.g., "mint", "transfer")
 * @param args - Runtime arguments as a Map
 */
export async function callContract(
  contractHash: string,
  entryPoint: string,
  args: Map<string, CLValue> | Args
): Promise<{ deployHash: string; result: any }> {
  const hashBytes = ethers.getBytes(contractHash);
  const contractHashObj = new Hash(hashBytes) as any;
  const runtimeArgs = args instanceof Args ? args : new Args(args);

  const storedContract = new StoredContractByHash(
    contractHashObj,
    entryPoint,
    runtimeArgs
  );

  const session = new ExecutableDeployItem();
  session.storedContractByHash = storedContract;

  return signAndSubmitDeploy(session);
}

/**
 * Call a stored versioned contract by hash.
 * @param contractHash - The contract hash (hex string)
 * @param version - Contract version
 * @param entryPoint - The entry point name
 * @param args - Runtime arguments
 */
export async function callVersionedContract(
  contractHash: string,
  version: number,
  entryPoint: string,
  args: Map<string, CLValue> | Args
): Promise<{ deployHash: string; result: any }> {
  const hashBytes = ethers.getBytes(contractHash);
  const contractHashObj = new Hash(hashBytes) as any;
  const runtimeArgs = args instanceof Args ? args : new Args(args);

  const storedContract = new StoredVersionedContractByHash(
    contractHashObj,
    entryPoint,
    runtimeArgs,
    version
  );

  const session = new ExecutableDeployItem();
  session.storedVersionedContractByHash = storedContract;

  return signAndSubmitDeploy(session);
}

// ============================================================
// 3. CEP-18 Fungible Token Operations
// ============================================================

/**
 * Mint CEP-18 tokens.
 * @param contractHash - CEP-18 contract hash
 * @param owner - Token owner public key (hex)
 * @param amount - Amount to mint (in token units)
 * @param decimals - Token decimals (default: 9)
 */
export async function cep18Mint(
  contractHash: string,
  owner: string,
  amount: string,
  decimals: number = 9
): Promise<{ deployHash: string; result: any }> {
  const ownerPubKey = PublicKey.fromHex(owner);
  const amountBig = ethers.parseUnits(amount, decimals).toString();

  const args = Args.fromMap({
    owner: CLValue.newCLPublicKey(ownerPubKey),
    amount: CLValue.newCLUInt256(amountBig),
  });

  return callContract(contractHash, 'mint', args);
}

/**
 * Burn CEP-18 tokens.
 * @param contractHash - CEP-18 contract hash
 * @param owner - Token owner public key (hex)
 * @param amount - Amount to burn
 * @param decimals - Token decimals
 */
export async function cep18Burn(
  contractHash: string,
  owner: string,
  amount: string,
  decimals: number = 9
): Promise<{ deployHash: string; result: any }> {
  const ownerPubKey = PublicKey.fromHex(owner);
  const amountBig = ethers.parseUnits(amount, decimals).toString();

  const args = Args.fromMap({
    owner: CLValue.newCLPublicKey(ownerPubKey),
    amount: CLValue.newCLUInt256(amountBig),
  });

  return callContract(contractHash, 'burn', args);
}

/**
 * Transfer CEP-18 tokens.
 * @param contractHash - CEP-18 contract hash
 * @param recipient - Recipient public key (hex)
 * @param amount - Amount to transfer
 * @param decimals - Token decimals
 */
export async function cep18Transfer(
  contractHash: string,
  recipient: string,
  amount: string,
  decimals: number = 9
): Promise<{ deployHash: string; result: any }> {
  const recipientPubKey = PublicKey.fromHex(recipient);
  const amountBig = ethers.parseUnits(amount, decimals).toString();

  const args = Args.fromMap({
    recipient: CLValue.newCLPublicKey(recipientPubKey),
    amount: CLValue.newCLUInt256(amountBig),
  });

  return callContract(contractHash, 'transfer', args);
}

/**
 * Approve a spender for CEP-18 tokens.
 * @param contractHash - CEP-18 contract hash
 * @param spender - Spender public key (hex)
 * @param amount - Amount to approve
 * @param decimals - Token decimals
 */
export async function cep18Approve(
  contractHash: string,
  spender: string,
  amount: string,
  decimals: number = 9
): Promise<{ deployHash: string; result: any }> {
  const spenderPubKey = PublicKey.fromHex(spender);
  const amountBig = ethers.parseUnits(amount, decimals).toString();

  const args = Args.fromMap({
    spender: CLValue.newCLPublicKey(spenderPubKey),
    amount: CLValue.newCLUInt256(amountBig),
  });

  return callContract(contractHash, 'approve', args);
}

/**
 * Increase allowance for CEP-18 tokens.
 */
export async function cep18IncreaseAllowance(
  contractHash: string,
  spender: string,
  amount: string,
  decimals: number = 9
): Promise<{ deployHash: string; result: any }> {
  const spenderPubKey = PublicKey.fromHex(spender);
  const amountBig = ethers.parseUnits(amount, decimals).toString();

  const args = Args.fromMap({
    spender: CLValue.newCLPublicKey(spenderPubKey),
    amount: CLValue.newCLUInt256(amountBig),
  });

  return callContract(contractHash, 'increase_allowance', args);
}

/**
 * Decrease allowance for CEP-18 tokens.
 */
export async function cep18DecreaseAllowance(
  contractHash: string,
  spender: string,
  amount: string,
  decimals: number = 9
): Promise<{ deployHash: string; result: any }> {
  const spenderPubKey = PublicKey.fromHex(spender);
  const amountBig = ethers.parseUnits(amount, decimals).toString();

  const args = Args.fromMap({
    spender: CLValue.newCLPublicKey(spenderPubKey),
    amount: CLValue.newCLUInt256(amountBig),
  });

  return callContract(contractHash, 'decrease_allowance', args);
}

/**
 * Transfer from (approved spender transfers tokens on behalf of owner).
 * @param contractHash - CEP-18 contract hash
 * @param owner - Token owner public key (hex)
 * @param recipient - Recipient public key (hex)
 * @param amount - Amount to transfer
 * @param decimals - Token decimals
 */
export async function cep18TransferFrom(
  contractHash: string,
  owner: string,
  recipient: string,
  amount: string,
  decimals: number = 9
): Promise<{ deployHash: string; result: any }> {
  const ownerPubKey = PublicKey.fromHex(owner);
  const recipientPubKey = PublicKey.fromHex(recipient);
  const amountBig = ethers.parseUnits(amount, decimals).toString();

  const args = Args.fromMap({
    owner: CLValue.newCLPublicKey(ownerPubKey),
    recipient: CLValue.newCLPublicKey(recipientPubKey),
    amount: CLValue.newCLUInt256(amountBig),
  });

  return callContract(contractHash, 'transfer_from', args);
}

// ============================================================
// 4. CEP-47 / CEP-78 NFT Operations
// ============================================================

/**
 * Mint a single NFT (CEP-47).
 * @param contractHash - NFT contract hash
 * @param recipient - Recipient public key (hex)
 * @param tokenId - Token ID (string)
 * @param metadata - Optional metadata (map of key-value pairs)
 */
export async function cep47Mint(
  contractHash: string,
  recipient: string,
  tokenId: string,
  metadata?: Record<string, string>
): Promise<{ deployHash: string; result: any }> {
  const recipientPubKey = PublicKey.fromHex(recipient);

  const args = Args.fromMap({
    recipient: CLValue.newCLPublicKey(recipientPubKey),
    token_id: CLValue.newCLString(tokenId),
  });

  if (metadata) {
    const metadataMap = CLValue.newCLMap(
      CLValue.newCLString('').type,
      CLValue.newCLString('').type
    );
    for (const [key, value] of Object.entries(metadata)) {
      metadataMap.map?.append(
        CLValue.newCLString(key),
        CLValue.newCLString(value)
      );
    }
    args.insert('metadata', metadataMap);
  }

  return callContract(contractHash, 'mint', args);
}

/**
 * Mint multiple NFT copies (CEP-47).
 * @param contractHash - NFT contract hash
 * @param recipient - Recipient public key (hex)
 * @param count - Number of copies to mint
 */
export async function cep47MintCopies(
  contractHash: string,
  recipient: string,
  count: number
): Promise<{ deployHash: string; result: any }> {
  const recipientPubKey = PublicKey.fromHex(recipient);

  const args = Args.fromMap({
    recipient: CLValue.newCLPublicKey(recipientPubKey),
    count: CLValue.newCLUint64(count),
  });

  return callContract(contractHash, 'mint_copies', args);
}

/**
 * Burn an NFT (CEP-47).
 * @param contractHash - NFT contract hash
 * @param owner - Owner public key (hex)
 * @param tokenId - Token ID to burn
 */
export async function cep47Burn(
  contractHash: string,
  owner: string,
  tokenId: string
): Promise<{ deployHash: string; result: any }> {
  const ownerPubKey = PublicKey.fromHex(owner);

  const args = Args.fromMap({
    owner: CLValue.newCLPublicKey(ownerPubKey),
    token_id: CLValue.newCLString(tokenId),
  });

  return callContract(contractHash, 'burn', args);
}

/**
 * Transfer an NFT (CEP-47).
 * @param contractHash - NFT contract hash
 * @param recipient - Recipient public key (hex)
 * @param tokenId - Token ID to transfer
 */
export async function cep47Transfer(
  contractHash: string,
  recipient: string,
  tokenId: string
): Promise<{ deployHash: string; result: any }> {
  const recipientPubKey = PublicKey.fromHex(recipient);

  const args = Args.fromMap({
    recipient: CLValue.newCLPublicKey(recipientPubKey),
    token_id: CLValue.newCLString(tokenId),
  });

  return callContract(contractHash, 'transfer', args);
}

/**
 * Approve NFT transfer (CEP-47).
 * @param contractHash - NFT contract hash
 * @param spender - Approved spender public key (hex)
 * @param tokenId - Token ID to approve
 */
export async function cep47Approve(
  contractHash: string,
  spender: string,
  tokenId: string
): Promise<{ deployHash: string; result: any }> {
  const spenderPubKey = PublicKey.fromHex(spender);

  const args = Args.fromMap({
    spender: CLValue.newCLPublicKey(spenderPubKey),
    token_id: CLValue.newCLString(tokenId),
  });

  return callContract(contractHash, 'approve', args);
}

/**
 * Transfer NFT from approved spender (CEP-47).
 * @param contractHash - NFT contract hash
 * @param owner - Current owner public key (hex)
 * @param recipient - Recipient public key (hex)
 * @param tokenId - Token ID to transfer
 */
export async function cep47TransferFrom(
  contractHash: string,
  owner: string,
  recipient: string,
  tokenId: string
): Promise<{ deployHash: string; result: any }> {
  const ownerPubKey = PublicKey.fromHex(owner);
  const recipientPubKey = PublicKey.fromHex(recipient);

  const args = Args.fromMap({
    owner: CLValue.newCLPublicKey(ownerPubKey),
    recipient: CLValue.newCLPublicKey(recipientPubKey),
    token_id: CLValue.newCLString(tokenId),
  });

  return callContract(contractHash, 'transfer_from', args);
}

/**
 * Set token metadata (CEP-78).
 * @param contractHash - CEP-78 contract hash
 * @param tokenId - Token ID
 * @param metadata - Metadata key-value pairs
 */
export async function cep78SetTokenMetadata(
  contractHash: string,
  tokenId: string,
  metadata: Record<string, string>
): Promise<{ deployHash: string; result: any }> {
  const metadataMap = CLValue.newCLMap(
    CLValue.newCLString('').type,
    CLValue.newCLString('').type
  );

  for (const [key, value] of Object.entries(metadata)) {
    metadataMap.map?.append(
      CLValue.newCLString(key),
      CLValue.newCLString(value)
    );
  }

  const args = Args.fromMap({
    token_id: CLValue.newCLString(tokenId),
    metadata: metadataMap,
  });

  return callContract(contractHash, 'set_token_metadata', args);
}

/**
 * Batch transfer NFTs (CEP-78).
 * @param contractHash - CEP-78 contract hash
 * @param recipient - Recipient public key (hex)
 * @param tokenIds - Array of token IDs
 */
export async function cep78BatchTransfer(
  contractHash: string,
  recipient: string,
  tokenIds: string[]
): Promise<{ deployHash: string; result: any }> {
  const recipientPubKey = PublicKey.fromHex(recipient);

  // Create a list of string CLValues
  const tokenList = CLValue.newCLList(
    CLValue.newCLString('').type,
    tokenIds.map(id => CLValue.newCLString(id))
  );

  const args = Args.fromMap({
    recipient: CLValue.newCLPublicKey(recipientPubKey),
    token_ids: tokenList,
  });

  return callContract(contractHash, 'batch_transfer', args);
}

/**
 * Batch burn NFTs (CEP-78).
 * @param contractHash - CEP-78 contract hash
 * @param owner - Owner public key (hex)
 * @param tokenIds - Array of token IDs to burn
 */
export async function cep78BatchBurn(
  contractHash: string,
  owner: string,
  tokenIds: string[]
): Promise<{ deployHash: string; result: any }> {
  const ownerPubKey = PublicKey.fromHex(owner);

  const tokenList = CLValue.newCLList(
    CLValue.newCLString('').type,
    tokenIds.map(id => CLValue.newCLString(id))
  );

  const args = Args.fromMap({
    owner: CLValue.newCLPublicKey(ownerPubKey),
    token_ids: tokenList,
  });

  return callContract(contractHash, 'batch_burn', args);
}

/**
 * Set admin for NFT contract (CEP-78).
 * @param contractHash - CEP-78 contract hash
 * @param admin - New admin public key (hex)
 */
export async function cep78SetAdmin(
  contractHash: string,
  admin: string
): Promise<{ deployHash: string; result: any }> {
  const adminPubKey = PublicKey.fromHex(admin);

  const args = Args.fromMap({
    admin: CLValue.newCLPublicKey(adminPubKey),
  });

  return callContract(contractHash, 'set_admin', args);
}

// ============================================================
// 5. Staking / Consensus Operations
// ============================================================

/**
 * Bond (self-stake) to become a validator.
 * @param amount - Amount to bond in CSPR
 * @param delegatorRate - Optional delegator rate (0-100)
 */
export async function bond(
  amount: string,
  delegatorRate?: number
): Promise<{ deployHash: string; result: any }> {
  const amountMotes = ethers.parseUnits(amount, 9).toString();

  const argsMap = new Map<string, CLValue>();
  argsMap.set('amount', CLValue.newCLUInt512(amountMotes));

  if (delegatorRate !== undefined) {
    argsMap.set('delegator_rate', CLValue.newCLUint8(delegatorRate));
  }

  const args = new Args(argsMap);

  // Bond is a system operation via session code
  const session = ExecutableDeployItem.newModuleBytes(new Uint8Array(0), args);

  return signAndSubmitDeploy(session);
}

/**
 * Delegate CSPR to a validator.
 * @param validator - Validator public key (hex)
 * @param amount - Amount to delegate in CSPR
 */
export async function delegate(
  validator: string,
  amount: string
): Promise<{ deployHash: string; result: any }> {
  const validatorPubKey = PublicKey.fromHex(validator);
  const amountMotes = ethers.parseUnits(amount, 9).toString();

  const args = Args.fromMap({
    validator: CLValue.newCLPublicKey(validatorPubKey),
    amount: CLValue.newCLUInt512(amountMotes),
  });

  const session = ExecutableDeployItem.newModuleBytes(new Uint8Array(0), args);

  return signAndSubmitDeploy(session);
}

/**
 * Unbond self-staked CSPR.
 * @param amount - Amount to unbond in CSPR
 */
export async function unbond(
  amount: string
): Promise<{ deployHash: string; result: any }> {
  const amountMotes = ethers.parseUnits(amount, 9).toString();

  const args = Args.fromMap({
    amount: CLValue.newCLUInt512(amountMotes),
  });

  const session = ExecutableDeployItem.newModuleBytes(new Uint8Array(0), args);

  return signAndSubmitDeploy(session);
}

/**
 * Undelegate (withdraw delegation from a validator).
 * @param validator - Validator public key (hex)
 * @param amount - Amount to undelegate in CSPR
 */
export async function undelegate(
  validator: string,
  amount: string
): Promise<{ deployHash: string; result: any }> {
  const validatorPubKey = PublicKey.fromHex(validator);
  const amountMotes = ethers.parseUnits(amount, 9).toString();

  const args = Args.fromMap({
    validator: CLValue.newCLPublicKey(validatorPubKey),
    amount: CLValue.newCLUInt512(amountMotes),
  });

  const session = ExecutableDeployItem.newModuleBytes(new Uint8Array(0), args);

  return signAndSubmitDeploy(session);
}

/**
 * Withdraw staking rewards.
 */
export async function withdrawRewards(): Promise<{ deployHash: string; result: any }> {
  const args = new Args(new Map());
  const session = ExecutableDeployItem.newModuleBytes(new Uint8Array(0), args);

  return signAndSubmitDeploy(session);
}

/**
 * Set validator commission rate.
 * @param commissionRate - New commission rate (0-100)
 */
export async function setCommissionRate(
  commissionRate: number
): Promise<{ deployHash: string; result: any }> {
  const args = Args.fromMap({
    commission_rate: CLValue.newCLUint8(commissionRate),
  });

  const session = ExecutableDeployItem.newModuleBytes(new Uint8Array(0), args);

  return signAndSubmitDeploy(session);
}

// ============================================================
// 6. DeFi AMM / Liquidity Operations
// ============================================================

/**
 * Swap tokens on an AMM DEX.
 * @param contractHash - DEX contract hash
 * @param tokenIn - Input token contract hash
 * @param tokenOut - Output token contract hash
 * @param amountIn - Input amount
 * @param minAmountOut - Minimum output amount
 * @param decimals - Token decimals
 */
export async function ammSwap(
  contractHash: string,
  tokenIn: string,
  tokenOut: string,
  amountIn: string,
  minAmountOut: string,
  decimals: number = 9
): Promise<{ deployHash: string; result: any }> {
  const amountInBig = ethers.parseUnits(amountIn, decimals).toString();
  const minAmountOutBig = ethers.parseUnits(minAmountOut, decimals).toString();

  const args = Args.fromMap({
    token_in: CLValue.newCLByteArray(ethers.getBytes(tokenIn)),
    token_out: CLValue.newCLByteArray(ethers.getBytes(tokenOut)),
    amount_in: CLValue.newCLUInt256(amountInBig),
    min_amount_out: CLValue.newCLUInt256(minAmountOutBig),
  });

  return callContract(contractHash, 'swap', args);
}

/**
 * Add liquidity to an AMM pool.
 * @param contractHash - DEX contract hash
 * @param tokenA - Token A contract hash
 * @param tokenB - Token B contract hash
 * @param amountA - Amount of token A
 * @param amountB - Amount of token B
 * @param decimals - Token decimals
 */
export async function addLiquidity(
  contractHash: string,
  tokenA: string,
  tokenB: string,
  amountA: string,
  amountB: string,
  decimals: number = 9
): Promise<{ deployHash: string; result: any }> {
  const amountABig = ethers.parseUnits(amountA, decimals).toString();
  const amountBBig = ethers.parseUnits(amountB, decimals).toString();

  const args = Args.fromMap({
    token_a: CLValue.newCLByteArray(ethers.getBytes(tokenA)),
    token_b: CLValue.newCLByteArray(ethers.getBytes(tokenB)),
    amount_a: CLValue.newCLUInt256(amountABig),
    amount_b: CLValue.newCLUInt256(amountBBig),
  });

  return callContract(contractHash, 'add_liquidity', args);
}

/**
 * Remove liquidity from an AMM pool.
 * @param contractHash - DEX contract hash
 * @param lpToken - LP token contract hash
 * @param lpAmount - Amount of LP tokens to burn
 * @param minAmountA - Minimum amount of token A to receive
 * @param minAmountB - Minimum amount of token B to receive
 * @param decimals - Token decimals
 */
export async function removeLiquidity(
  contractHash: string,
  lpToken: string,
  lpAmount: string,
  minAmountA: string,
  minAmountB: string,
  decimals: number = 9
): Promise<{ deployHash: string; result: any }> {
  const lpAmountBig = ethers.parseUnits(lpAmount, decimals).toString();
  const minAmountABig = ethers.parseUnits(minAmountA, decimals).toString();
  const minAmountBBig = ethers.parseUnits(minAmountB, decimals).toString();

  const args = Args.fromMap({
    lp_token: CLValue.newCLByteArray(ethers.getBytes(lpToken)),
    lp_amount: CLValue.newCLUInt256(lpAmountBig),
    min_amount_a: CLValue.newCLUInt256(minAmountABig),
    min_amount_b: CLValue.newCLUInt256(minAmountBBig),
  });

  return callContract(contractHash, 'remove_liquidity', args);
}

/**
 * Stake LP tokens for farming rewards.
 * @param contractHash - Farming contract hash
 * @param lpToken - LP token contract hash
 * @param amount - Amount of LP tokens to stake
 * @param decimals - Token decimals
 */
export async function stakeLp(
  contractHash: string,
  lpToken: string,
  amount: string,
  decimals: number = 9
): Promise<{ deployHash: string; result: any }> {
  const amountBig = ethers.parseUnits(amount, decimals).toString();

  const args = Args.fromMap({
    lp_token: CLValue.newCLByteArray(ethers.getBytes(lpToken)),
    amount: CLValue.newCLUInt256(amountBig),
  });

  return callContract(contractHash, 'stake_lp', args);
}

/**
 * Claim farming rewards.
 * @param contractHash - Farming contract hash
 */
export async function claimReward(
  contractHash: string
): Promise<{ deployHash: string; result: any }> {
  const args = new Args(new Map());
  return callContract(contractHash, 'claim_reward', args);
}

/**
 * Create a limit order on a DEX.
 * @param contractHash - DEX contract hash
 * @param tokenIn - Input token contract hash
 * @param tokenOut - Output token contract hash
 * @param amountIn - Input amount
 * @param price - Price (output per input)
 * @param decimals - Token decimals
 */
export async function createOrder(
  contractHash: string,
  tokenIn: string,
  tokenOut: string,
  amountIn: string,
  price: string,
  decimals: number = 9
): Promise<{ deployHash: string; result: any }> {
  const amountInBig = ethers.parseUnits(amountIn, decimals).toString();
  const priceBig = ethers.parseUnits(price, decimals).toString();

  const args = Args.fromMap({
    token_in: CLValue.newCLByteArray(ethers.getBytes(tokenIn)),
    token_out: CLValue.newCLByteArray(ethers.getBytes(tokenOut)),
    amount_in: CLValue.newCLUInt256(amountInBig),
    price: CLValue.newCLUInt256(priceBig),
  });

  return callContract(contractHash, 'create_order', args);
}

/**
 * Cancel a DEX order.
 * @param contractHash - DEX contract hash
 * @param orderId - Order ID to cancel
 */
export async function cancelOrder(
  contractHash: string,
  orderId: string
): Promise<{ deployHash: string; result: any }> {
  const args = Args.fromMap({
    order_id: CLValue.newCLString(orderId),
  });

  return callContract(contractHash, 'cancel_order', args);
}

// ============================================================
// 7. General DApp Operations
// ============================================================

/**
 * Increment a counter contract.
 * @param contractHash - Counter contract hash
 */
export async function counterIncrement(
  contractHash: string
): Promise<{ deployHash: string; result: any }> {
  const args = new Args(new Map());
  return callContract(contractHash, 'counter_inc', args);
}

/**
 * Decrement a counter contract.
 * @param contractHash - Counter contract hash
 */
export async function counterDecrement(
  contractHash: string
): Promise<{ deployHash: string; result: any }> {
  const args = new Args(new Map());
  return callContract(contractHash, 'counter_dec', args);
}

/**
 * Write a key-value pair to a dictionary via contract.
 * @param contractHash - Contract hash
 * @param key - Dictionary key
 * @param value - Value to store (string)
 */
export async function dictionaryPut(
  contractHash: string,
  key: string,
  value: string
): Promise<{ deployHash: string; result: any }> {
  const args = Args.fromMap({
    key: CLValue.newCLString(key),
    value: CLValue.newCLString(value),
  });

  return callContract(contractHash, 'dictionary_put', args);
}

/**
 * Remove a key from a dictionary via contract.
 * @param contractHash - Contract hash
 * @param key - Dictionary key to remove
 */
export async function dictionaryRemove(
  contractHash: string,
  key: string
): Promise<{ deployHash: string; result: any }> {
  const args = Args.fromMap({
    key: CLValue.newCLString(key),
  });

  return callContract(contractHash, 'dictionary_remove', args);
}

/**
 * Create a governance proposal.
 * @param contractHash - Governance contract hash
 * @param title - Proposal title
 * @param description - Proposal description
 * @param votingDuration - Voting duration in blocks
 */
export async function createProposal(
  contractHash: string,
  title: string,
  description: string,
  votingDuration: number
): Promise<{ deployHash: string; result: any }> {
  const args = Args.fromMap({
    title: CLValue.newCLString(title),
    description: CLValue.newCLString(description),
    voting_duration: CLValue.newCLUint64(votingDuration),
  });

  return callContract(contractHash, 'create_proposal', args);
}

/**
 * Cast a vote on a governance proposal.
 * @param contractHash - Governance contract hash
 * @param proposalId - Proposal ID
 * @param voteOption - Vote option: "for" or "against"
 */
export async function castVote(
  contractHash: string,
  proposalId: string,
  voteOption: string
): Promise<{ deployHash: string; result: any }> {
  const voteByte = voteOption.toLowerCase().startsWith('for') ? 1 : 0;

  const args = Args.fromMap({
    proposal_id: CLValue.newCLString(proposalId),
    vote: CLValue.newCLUint8(voteByte),
  });

  return callContract(contractHash, 'cast_vote', args);
}

/**
 * Execute a governance proposal.
 * @param contractHash - Governance contract hash
 * @param proposalId - Proposal ID
 */
export async function executeProposal(
  contractHash: string,
  proposalId: string
): Promise<{ deployHash: string; result: any }> {
  const args = Args.fromMap({
    proposal_id: CLValue.newCLString(proposalId),
  });

  return callContract(contractHash, 'execute_proposal', args);
}

/**
 * Save an RWA asset record to the blockchain.
 * @param contractHash - RWA contract hash
 * @param assetId - Asset ID
 * @param ownerHash - Owner account hash (hex)
 * @param documentHash - Document hash (hex)
 * @param metadata - Additional metadata
 */
export async function saveAssetRecord(
  contractHash: string,
  assetId: string,
  ownerHash: string,
  documentHash: string,
  metadata?: string
): Promise<{ deployHash: string; result: any }> {
  const argsMap = new Map<string, CLValue>();
  argsMap.set('asset_id', CLValue.newCLString(assetId));
  argsMap.set('owner_hash', CLValue.newCLByteArray(ethers.getBytes(ownerHash)));
  argsMap.set('document_hash', CLValue.newCLByteArray(ethers.getBytes(documentHash)));

  if (metadata) {
    argsMap.set('metadata', CLValue.newCLString(metadata));
  }

  const args = new Args(argsMap);

  return callContract(contractHash, 'save_asset_record', args);
}

// ============================================================
// Helper Utilities
// ============================================================

/**
 * Parse execution result to extract success/failure info.
 */
export function parseExecutionResult(result: any): {
  success: boolean;
  cost: string;
  errorMessage?: string;
  transfers: any[];
} {
  if (!result || !result.execution_results || result.execution_results.length === 0) {
    return { success: false, cost: '0', transfers: [] };
  }

  const execResult = result.execution_results[0];
  const effect = execResult.result;

  if (effect.Success) {
    return {
      success: true,
      cost: effect.Success.cost || '0',
      transfers: effect.Success.transfers || [],
    };
  } else if (effect.Failure) {
    return {
      success: false,
      cost: effect.Failure.cost || '0',
      errorMessage: effect.Failure.error_message,
      transfers: [],
    };
  }

  return { success: false, cost: '0', transfers: [] };
}

/**
 * Convert motes to CSPR display string.
 */
export function motesToCspr(motes: string | bigint): string {
  return ethers.formatUnits(BigInt(motes), 9);
}

/**
 * Get the signing account's public key as hex string.
 */
export function getSigningPublicKeyHex(): string {
  return getSigningPublicKey().toHex();
}
