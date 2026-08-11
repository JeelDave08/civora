import { useLoadScript, GoogleMap } from "@react-google-maps/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"

const libraries: "places"[] = ["places"]

export function MapPage() {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: "YOUR_API_KEY_HERE", // Replace with actual API key
    libraries,
  })

  return (
    <div className="space-y-8 h-[calc(100vh-140px)] flex flex-col">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-heading">City Map</h1>
        <p className="mt-1 text-muted-foreground">Interactive map of city infrastructure and services.</p>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader>
          <CardTitle>Live Infrastructure Map</CardTitle>
          <CardDescription>View all active projects, incidents, and city assets.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 p-0 m-6 mt-0 rounded-2xl overflow-hidden border border-border">
          {isLoaded ? (
            <GoogleMap
              zoom={13}
              center={{ lat: 40.7128, lng: -74.0060 }}
              mapContainerClassName="w-full h-full"
              options={{
                disableDefaultUI: true,
                zoomControl: true,
                styles: [
                  {
                    featureType: "all",
                    elementType: "geometry.fill",
                    stylers: [{ weight: "2.00" }],
                  },
                  {
                    featureType: "all",
                    elementType: "geometry.stroke",
                    stylers: [{ color: "#9c9c9c" }],
                  },
                  {
                    featureType: "all",
                    elementType: "labels.text",
                    stylers: [{ visibility: "on" }],
                  },
                  {
                    featureType: "landscape",
                    elementType: "all",
                    stylers: [{ color: "#f2f2f2" }],
                  },
                ],
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
