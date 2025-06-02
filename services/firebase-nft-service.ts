import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { NFTRecord } from "@/types/firebase"

export class FirebaseNFTService {
  private readonly COLLECTION = "nfts"

  // Record NFT mint
  async recordNFTMint(nftData: Omit<NFTRecord, "id" | "mintedAt">): Promise<NFTRecord> {
    const nftRef = doc(db, this.COLLECTION, nftData.mintAddress)

    const nftRecord: Omit<NFTRecord, "id"> = {
      ...nftData,
      mintedAt: serverTimestamp() as any,
      isVerified: true,
      isTransferred: false,
    }

    await setDoc(nftRef, nftRecord)

    return { id: nftData.mintAddress, ...nftRecord } as NFTRecord
  }

  // Get NFT by mint address
  async getNFTByMintAddress(mintAddress: string): Promise<NFTRecord | null> {
    const nftRef = doc(db, this.COLLECTION, mintAddress)
    const nftSnap = await getDoc(nftRef)

    if (nftSnap.exists()) {
      return { id: nftSnap.id, ...nftSnap.data() } as NFTRecord
    }
    return null
  }

  // Get NFTs by owner
  async getNFTsByOwner(walletAddress: string): Promise<NFTRecord[]> {
    const q = query(
      collection(db, this.COLLECTION),
      where("ownerWallet", "==", walletAddress),
      orderBy("mintedAt", "desc"),
    )

    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as NFTRecord,
    )
  }

  // Check if wallet has minted NFT
  async hasWalletMinted(walletAddress: string): Promise<boolean> {
    const q = query(collection(db, this.COLLECTION), where("ownerWallet", "==", walletAddress), limit(1))

    const querySnapshot = await getDocs(q)
    return !querySnapshot.empty
  }

  // Get recent NFT mints
  async getRecentMints(limitCount = 10): Promise<NFTRecord[]> {
    const q = query(collection(db, this.COLLECTION), orderBy("mintedAt", "desc"), limit(limitCount))

    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as NFTRecord,
    )
  }

  // Get total NFT count
  async getTotalNFTCount(): Promise<number> {
    const querySnapshot = await getDocs(collection(db, this.COLLECTION))
    return querySnapshot.size
  }

  // Get NFTs by referral code
  async getNFTsByReferralCode(referralCode: string): Promise<NFTRecord[]> {
    const q = query(
      collection(db, this.COLLECTION),
      where("referralCode", "==", referralCode),
      orderBy("mintedAt", "desc"),
    )

    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as NFTRecord,
    )
  }
}

// Create singleton instance
export const firebaseNFTService = new FirebaseNFTService()
