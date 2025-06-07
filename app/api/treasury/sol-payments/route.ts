import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, signature, amount, questId, treasuryWallet } = await request.json()

    // Validate input
    if (!walletAddress || !signature || !amount || !questId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Log the SOL payment for tracking
    console.log("💰 SOL Payment to Treasury:", {
      from: walletAddress,
      to: treasuryWallet || "A9GT8pYUR5F1oRwUsQ9ADeZTWq7LJMfmPQ3TZLmV6cQP",
      amount: `${amount} SOL`,
      signature,
      questId,
      timestamp: new Date().toISOString()
    })

    // In a production environment, you would:
    // 1. Store this payment record in Firebase
    // 2. Verify the transaction on-chain
    // 3. Update treasury balance tracking
    // 4. Send notifications if needed

    // For now, we'll just acknowledge the payment
    return NextResponse.json({
      success: true,
      message: "SOL payment recorded successfully",
      data: {
        walletAddress,
        signature,
        amount,
        questId,
        treasuryWallet: treasuryWallet || "A9GT8pYUR5F1oRwUsQ9ADeZTWq7LJMfmPQ3TZLmV6cQP",
        recordedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error("Error recording SOL payment:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get("wallet")

    // Return treasury wallet info
    const treasuryInfo: {
      treasuryWallet: string;
      purpose: string;
      paymentAmount: string;
      description: string;
      userPayments?: string;
    } = {
      treasuryWallet: "A9GT8pYUR5F1oRwUsQ9ADeZTWq7LJMfmPQ3TZLmV6cQP",
      purpose: "Login streak quest SOL payments",
      paymentAmount: "0.01 SOL",
      description: "SOL payments for daily login streak quests go to this treasury wallet"
    }

    if (walletAddress) {
      // In production, you would fetch payment history for this wallet
      treasuryInfo.userPayments = `Payment history for ${walletAddress} would be shown here`
    }

    return NextResponse.json({
      success: true,
      data: treasuryInfo
    })

  } catch (error) {
    console.error("Error getting treasury info:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
