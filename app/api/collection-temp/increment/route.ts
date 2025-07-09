import { NextRequest, NextResponse } from "next/server"
import fs from 'fs'
import path from 'path'

const COLLECTION_FILE_PATH = path.join(process.cwd(), 'temp-collection.json')

// Temporary file-based storage for testing
function readCollectionData() {
  try {
    if (fs.existsSync(COLLECTION_FILE_PATH)) {
      const data = fs.readFileSync(COLLECTION_FILE_PATH, 'utf8')
      return JSON.parse(data)
    }
    return null
  } catch (error) {
    console.error('Error reading collection data:', error)
    return null
  }
}

function writeCollectionData(data: any) {
  try {
    fs.writeFileSync(COLLECTION_FILE_PATH, JSON.stringify(data, null, 2))
    return true
  } catch (error) {
    console.error('Error writing collection data:', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const { collectionMint } = await request.json()

    if (!collectionMint) {
      return NextResponse.json(
        {
          success: false,
          error: "Collection mint address is required",
        },
        { status: 400 }
      )
    }

    console.log('📈 Incrementing collection mint count for:', collectionMint)

    // Read current data
    const collectionData = readCollectionData()
    
    if (!collectionData) {
      return NextResponse.json(
        {
          success: false,
          error: "Collection not found",
        },
        { status: 404 }
      )
    }

    // Increment total minted
    collectionData.totalMinted = (collectionData.totalMinted || 0) + 1
    collectionData.updatedAt = new Date().toISOString()

    // Write updated data
    const success = writeCollectionData(collectionData)

    if (success) {
      console.log('✅ Collection mint count updated to:', collectionData.totalMinted)
      return NextResponse.json({
        success: true,
        message: "Collection mint count updated",
        totalMinted: collectionData.totalMinted,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update collection",
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Error updating collection mint count:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    )
  }
}
