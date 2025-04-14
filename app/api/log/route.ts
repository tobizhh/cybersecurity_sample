import { type NextRequest, NextResponse } from "next/server"

// In-memory storage for visitor data (not persistent across server restarts)
// This is for demonstration purposes only
const visitors: any[] = []

// Function to calculate browser usage percentages
function calculateBrowserStats() {
  if (visitors.length === 0) return {}

  const browsers: Record<string, number> = {}

  visitors.forEach((visitor) => {
    // Extract browser name from user agent
    let browserName = "Unknown"

    if (visitor.userAgent.includes("Chrome") && !visitor.userAgent.includes("Edg")) {
      browserName = "Chrome"
    } else if (visitor.userAgent.includes("Firefox")) {
      browserName = "Firefox"
    } else if (visitor.userAgent.includes("Safari") && !visitor.userAgent.includes("Chrome")) {
      browserName = "Safari"
    } else if (visitor.userAgent.includes("Edg")) {
      browserName = "Edge"
    } else if (visitor.userAgent.includes("Opera") || visitor.userAgent.includes("OPR")) {
      browserName = "Opera"
    }

    browsers[browserName] = (browsers[browserName] || 0) + 1
  })

  // Convert to percentages
  const total = visitors.length
  const percentages: Record<string, string> = {}

  for (const browser in browsers) {
    const percentage = (browsers[browser] / total) * 100
    percentages[browser] = `${percentage.toFixed(1)}%`
  }

  return percentages
}

// Function to get unique values and their counts
function getUniqueValueCounts(key: string) {
  if (visitors.length === 0) return {}

  const counts: Record<string, number> = {}

  visitors.forEach((visitor) => {
    const value = visitor[key] || "Unknown"
    counts[value] = (counts[value] || 0) + 1
  })

  return counts
}

// Function to log analytics to console
function logAnalytics() {
  console.log("\n===== VISITOR ANALYTICS =====")
  console.log(`Total Visitors: ${visitors.length}`)

  // Browser statistics
  console.log("\n--- Browser Usage ---")
  const browserStats = calculateBrowserStats()
  for (const browser in browserStats) {
    console.log(`${browser}: ${browserStats[browser]}`)
  }

  // IP addresses
  console.log("\n--- IP Addresses ---")
  const ipCounts = getUniqueValueCounts("ipAddress")
  for (const ip in ipCounts) {
    console.log(`${ip}: ${ipCounts[ip]} visits`)
  }

  // Screen resolutions
  console.log("\n--- Screen Resolutions ---")
  const resolutionCounts = getUniqueValueCounts("screenResolution")
  for (const resolution in resolutionCounts) {
    console.log(`${resolution}: ${resolutionCounts[resolution]} visitors`)
  }

  // Languages
  console.log("\n--- Languages ---")
  const languageCounts = getUniqueValueCounts("language")
  for (const language in languageCounts) {
    console.log(`${language}: ${languageCounts[language]} visitors`)
  }

  // Timezones (as location approximation)
  console.log("\n--- Locations (Timezones) ---")
  const timezoneCounts = getUniqueValueCounts("timezone")
  for (const timezone in timezoneCounts) {
    console.log(`${timezone}: ${timezoneCounts[timezone]} visitors`)
  }

  console.log("\n============================")
}

export async function POST(request: NextRequest) {
  try {
    // Get visitor data from request
    const visitorData = await request.json()

    // Add server-side information
    const enhancedData = {
      ...visitorData,
      timestamp: new Date().toISOString(),
      ip: request.headers.get("x-forwarded-for") || "unknown",
      path: request.nextUrl.pathname,
      userAgent: request.headers.get("user-agent") || visitorData.userAgent || "unknown",
    }

    // Store visitor data in memory (not persistent)
    visitors.push(enhancedData)

    // Log individual visitor
    console.log("New visitor:", {
      ip: enhancedData.ipAddress,
      browser: enhancedData.userAgent.substring(0, 50) + "...",
      time: enhancedData.timestamp,
    })

    // Log analytics after each new visitor
    logAnalytics()

    return NextResponse.json({
      status: "logged",
      message: "Visitor data logged successfully",
      visitorCount: visitors.length,
    })
  } catch (error) {
    console.error("Error logging visitor data:", error)
    return NextResponse.json({ error: "Failed to log visitor data" }, { status: 500 })
  }
}

// Add a GET endpoint to view analytics
export async function GET() {
  logAnalytics()

  return NextResponse.json({
    visitorCount: visitors.length,
    browsers: calculateBrowserStats(),
    resolutions: getUniqueValueCounts("screenResolution"),
    languages: getUniqueValueCounts("language"),
    locations: getUniqueValueCounts("timezone"),
  })
}
