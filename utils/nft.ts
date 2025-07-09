import { type Connection, Keypair, PublicKey, Transaction, SystemProgram } from "@solana/web3.js"
import {
  MPL_TOKEN_METADATA_PROGRAM_ID,
} from "@metaplex-foundation/mpl-token-metadata"
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  createMintToCheckedInstruction,
  getAssociatedTokenAddress,
  getMinimumBalanceForRentExemptMint,
} from "@solana/spl-token"
import { NFT_METADATA } from "@/config/solana"

// Find the metadata PDA for a mint
export const findMetadataPda = async (mint: PublicKey): Promise<PublicKey> => {
  const [pda] = await PublicKey.findProgramAddress(
    [Buffer.from("metadata"), new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID).toBuffer(), mint.toBuffer()],
    new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID),
  )
  return pda
}

// Create an NFT mint transaction
export const createNftMintTransaction = async (
  connection: Connection,
  payer: PublicKey,
  recipient: PublicKey = payer,
): Promise<{ transaction: Transaction; mint: Keypair }> => {
  // Generate a new keypair for the mint
  const mint = Keypair.generate()

  // Calculate the rent for the mint
  const lamports = await getMinimumBalanceForRentExemptMint(connection)

  // Get the associated token account for the recipient
  const associatedToken = await getAssociatedTokenAddress(
    mint.publicKey,
    recipient,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  )

  // Find the metadata PDA
  const metadataPda = await findMetadataPda(mint.publicKey)

  // Create the transaction
  const transaction = new Transaction()

  // Add instructions to create the mint account
  transaction.add(
    SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: mint.publicKey,
      space: 82,
      lamports,
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeMintInstruction(
      mint.publicKey,
      0, // 0 decimals for NFT
      payer,
      payer,
      TOKEN_PROGRAM_ID,
    ),
    createAssociatedTokenAccountInstruction(
      payer,
      associatedToken,
      recipient,
      mint.publicKey,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    ),
    createMintToCheckedInstruction(
      mint.publicKey,
      associatedToken,
      payer,
      1, // Mint exactly 1 token
      0, // 0 decimals
      [],
      TOKEN_PROGRAM_ID,
    ),
  )

  // Add metadata instruction
  let metadataInstruction;

  // transaction.add(metadataInstruction)

  // Get the latest blockhash
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
  transaction.recentBlockhash = blockhash
  transaction.lastValidBlockHeight = lastValidBlockHeight
  transaction.feePayer = payer

  return { transaction, mint }
}
