import { NextRequest, NextResponse } from "next/server"
import fs from 'fs'
import path from 'path'

const COLLECTION_FILE_PATH = path.join(process.cwd(), 'temp-collection.json')
const COLLECTION_DOC_ID = "main_collection"

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

export async function GET() {
  try {
    console.log('📖 Reading collection data from temp file...')
    const collectionData = readCollectionData()

    if (collectionData) {
      console.log('✅ Collection found:', collectionData.collectionMint)
      return NextResponse.json({
        success: true,
        collection: { id: COLLECTION_DOC_ID, ...collectionData },
      })
    } else {
      console.log('📭 No collection found')
      return NextResponse.json({
        success: true,
        collection: null,
      })
    }
  } catch (error) {
    console.error("Error fetching collection:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const collectionData = await request.json()
    console.log('💾 Storing collection data:', collectionData)

    // Validate required fields
    if (!collectionData.collectionMint || !collectionData.createdBy || !collectionData.transactionSignature) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
        },
        { status: 400 }
      )
    }

    // Check if collection already exists
    const existingCollection = readCollectionData()

    if (existingCollection) {
      console.log('⚠️ Collection already exists')
      return NextResponse.json(
        {
          success: false,
          error: "Collection already exists",
        },
        { status: 409 }
      )
    }

    // Store collection data
    const collectionRecord = {
      ...collectionData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const success = writeCollectionData(collectionRecord)

    if (success) {
      console.log('✅ Collection stored successfully')
      return NextResponse.json({
        success: true,
        collection: { id: COLLECTION_DOC_ID, ...collectionRecord },
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to store collection",
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Error storing collection:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    )
  }
}
