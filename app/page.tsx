"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InfoIcon, MousePointer } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function CybersecurityDemo() {
  const [showData, setShowData] = useState(false)
  const [mouseData, setMouseData] = useState({ clicks: 0, movements: 0 })
  const [keyPresses, setKeyPresses] = useState(0)
  const [batteryInfo, setBatteryInfo] = useState<string | null>(null)
  const [deviceMemory, setDeviceMemory] = useState<string | null>(null)
  const [networkInfo, setNetworkInfo] = useState<string | null>(null)
  const [timeOnPage, setTimeOnPage] = useState(0)
  const [visitorCount, setVisitorCount] = useState<number | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const [userData, setUserData] = useState({
    ipAddress: "Loading...",
    userAgent: "Loading...",
    screenResolution: "Loading...",
    language: "Loading...",
    referrer: "Loading...",
    dateTime: "Loading...",
    cookies: "Loading...",
    timezone: "Loading...",
    platform: "Loading...",
  })

  useEffect(() => {
    // Collect basic user data as soon as the page loads
    logUserData()

    // Start timer for time on page
    timerRef.current = setInterval(() => {
      setTimeOnPage((prev) => prev + 1)
    }, 1000)

    // Add event listeners for advanced tracking - enabled by default
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("click", handleMouseClick)
    window.addEventListener("keydown", handleKeyPress)

    // Try to get battery info
    if ("getBattery" in navigator) {
      // @ts-ignore - TypeScript doesn't recognize getBattery by default
      navigator
        .getBattery()
        .then((battery: any) => {
          setBatteryInfo(`${Math.round(battery.level * 100)}% (${battery.charging ? "Charging" : "Not charging"})`)
        })
        .catch(() => {
          setBatteryInfo("Not available")
        })
    } else {
      setBatteryInfo("API not supported")
    }

    // Try to get device memory
    if ("deviceMemory" in navigator) {
      // @ts-ignore - TypeScript doesn't recognize deviceMemory by default
      setDeviceMemory(`${navigator.deviceMemory} GB`)
    } else {
      setDeviceMemory("API not supported")
    }

    // Try to get network info
    if ("connection" in navigator) {
      // @ts-ignore - TypeScript doesn't recognize connection by default
      const conn = navigator.connection
      if (conn) {
        setNetworkInfo(`${conn.effectiveType || "Unknown"} (${conn.saveData ? "Data saver on" : "Data saver off"})`)
      } else {
        setNetworkInfo("Limited information available")
      }
    } else {
      setNetworkInfo("API not supported")
    }

    return () => {
      // Clean up
      if (timerRef.current) clearInterval(timerRef.current)
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("click", handleMouseClick)
      window.removeEventListener("keydown", handleKeyPress)
    }
  }, [])

  const handleMouseMove = () => {
    setMouseData((prev) => ({ ...prev, movements: prev.movements + 1 }))
  }

  const handleMouseClick = () => {
    setMouseData((prev) => ({ ...prev, clicks: prev.clicks + 1 }))
  }

  const handleKeyPress = () => {
    setKeyPresses((prev) => prev + 1)
  }

  const logUserData = async () => {
    // Collect basic client-side data
    const data = {
      userAgent: navigator.userAgent,
      language: navigator.language || "Not available",
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      referrer: document.referrer || "Direct visit",
      dateTime: new Date().toLocaleString(),
      cookies: document.cookie ? document.cookie : "No cookies found",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Unknown",
      platform: navigator.platform || "Unknown",
    }

    // Update state with collected data
    setUserData((prev) => ({
      ...prev,
      ...data,
    }))

    try {
      // Get IP address using a free API
      const response = await fetch("https://api.ipify.org?format=json")
      const ipData = await response.json()
      setUserData((prev) => ({ ...prev, ipAddress: ipData.ip }))

      // Log data to server
      const logResponse = await fetch("/api/log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          ipAddress: ipData.ip,
        }),
      })

      const logData = await logResponse.json()
      if (logData.visitorCount) {
        setVisitorCount(logData.visitorCount)
      }
    } catch (error) {
      console.error("Error fetching IP:", error)
      setUserData((prev) => ({ ...prev, ipAddress: "Could not retrieve" }))
    }
  }

  const handleShowData = () => {
    setShowData(true)
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl text-center text-slate-800">
              Cybersecurity Demonstration
            </CardTitle>
            {visitorCount !== null && (
              <p className="text-center text-sm text-muted-foreground">
                You are visitor #{visitorCount} in this session
              </p>
            )}
          </CardHeader>
          <CardContent>
            <Alert className="bg-blue-50 border-l-4 border-blue-500 mb-6">
              <InfoIcon className="h-4 w-4 text-blue-500" />
              <AlertDescription>
                This is an educational demonstration to show how websites can collect information about visitors. This
                is <strong>not</strong> storing any information permanently - it&apos;s only showing what information is
                automatically sent to websites you visit.
              </AlertDescription>
            </Alert>

            {!showData ? (
              <Button onClick={handleShowData} className="w-full md:w-auto">
                Show What Data Was Collected
              </Button>
            ) : (
              <Tabs defaultValue="basic" className="mt-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="basic">Basic Data</TabsTrigger>
                  <TabsTrigger value="interactive">Interaction Data</TabsTrigger>
                </TabsList>

                <TabsContent value="basic">
                  <div className="border rounded-md p-4 bg-gray-50">
                    <h2 className="text-xl font-semibold mb-4">Data Collected When You Visited This Page:</h2>
                    <div className="space-y-3">
                      <DataItem label="IP Address" value={userData.ipAddress} />
                      <DataItem label="Browser & OS" value={userData.userAgent} />
                      <DataItem label="Platform" value={userData.platform} />
                      <DataItem label="Screen Resolution" value={userData.screenResolution} />
                      <DataItem label="Language" value={userData.language} />
                      <DataItem label="Timezone" value={userData.timezone} />
                      <DataItem label="Referrer" value={userData.referrer} />
                      <DataItem label="Date & Time" value={userData.dateTime} />
                      <DataItem label="Cookies" value={userData.cookies} />
                      <DataItem label="Time on Page" value={`${timeOnPage} seconds`} />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="interactive">
                  <div className="border rounded-md p-4 bg-gray-50">
                    <div className="flex items-center gap-2 mb-4">
                      <MousePointer className="h-5 w-5 text-blue-500" />
                      <h2 className="text-xl font-semibold">Interaction Tracking Data</h2>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-medium text-lg border-b pb-2">User Behavior</h3>
                      <DataItem label="Mouse Movements" value={mouseData.movements.toString()} />
                      <DataItem label="Mouse Clicks" value={mouseData.clicks.toString()} />
                      <DataItem label="Key Presses" value={keyPresses.toString()} />

                      <h3 className="font-medium text-lg border-b pb-2 mt-4">Device Information</h3>
                      <DataItem label="Battery Status" value={batteryInfo || "Not available"} />
                      <DataItem label="Device Memory" value={deviceMemory || "Not available"} />
                      <DataItem label="Network Info" value={networkInfo || "Not available"} />

                      <div className="mt-4 p-3 bg-blue-50 rounded-md">
                        <p className="text-sm text-blue-700">
                          <strong>Note:</strong> This data can be used to create a behavioral profile. Combined with
                          other information, it can help identify you across websites, even without cookies.
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

function DataItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center py-2 border-b border-gray-200 last:border-0">
      <span className="font-semibold text-gray-700 md:w-1/3">{label}:</span>
      <span className="text-gray-600 break-all">{value}</span>
    </div>
  )
}
