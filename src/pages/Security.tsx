import { useEffect, useRef, useState } from "react";
import AppHeader from "@/components/AppHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getPassById, markPassUsed, markPassDenied, type VisitorPass } from "@/lib/visitor-store";
import { Badge } from "@/components/ui/badge";
import { Search, ShieldCheck, ShieldX, User, Home, CalendarDays, Clock, ScanLine } from "lucide-react";
import QrScanner from "qr-scanner";

QrScanner.WORKER_PATH = "/qr-scanner-worker.min.js";

const Security = () => {
  const [passId, setPassId] = useState("");
  const [result, setResult] = useState<VisitorPass | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scannerSupported, setScannerSupported] = useState(false);
  const [useFallbackScanner, setUseFallbackScanner] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);
  const detectorRef = useRef<any>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const hasBarcodeDetector =
      typeof window !== "undefined" &&
      "BarcodeDetector" in window &&
      typeof (window as any).BarcodeDetector === "function";

    const hasQrScanner = typeof QrScanner !== "undefined";

    setScannerSupported(hasBarcodeDetector || hasQrScanner);
    setUseFallbackScanner(!hasBarcodeDetector && hasQrScanner);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (qrScannerRef.current) {
        qrScannerRef.current.destroy();
        qrScannerRef.current = null;
      }
    };
  }, []);

  const lookupPass = async (value: string) => {
    setNotFound(false);
    let id = value.trim();
    try {
      const parsed = JSON.parse(id);
      if (parsed.id) id = parsed.id;
    } catch {
      // use as-is
    }

    const pass = await getPassById(id);
    if (pass) {
      setResult(pass);
    } else {
      setResult(null);
      setNotFound(true);
    }
  };

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    lookupPass(passId);
  };

  const stopScanner = () => {
    scanningRef.current = false;
    setScannerActive(false);
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (qrScannerRef.current) {
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
  };

  const scanFrame = async () => {
    if (!scanningRef.current || !videoRef.current || !detectorRef.current) {
      return;
    }

    try {
      const results = await detectorRef.current.detect(videoRef.current);
      if (results?.length) {
        const rawValue = results[0].rawValue;
        setPassId(rawValue);
        stopScanner();
        lookupPass(rawValue);
        return;
      }
    } catch (error) {
      // continue scanning even if a frame fails
    }

    frameRef.current = requestAnimationFrame(scanFrame);
  };

  const checkCameraPermission = async () => {
    try {
      // Check if we're on HTTPS (required for camera access)
      if (typeof window !== 'undefined' && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        return 'https-required';
      }

      // Check if MediaDevices API is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return 'not-supported';
      }

      const result = await navigator.permissions.query({ name: "camera" as PermissionName });
      return result.state;
    } catch (error) {
      // Fallback for browsers that don't support permissions API
      return "unknown";
    }
  };

  const startScanner = async () => {
    console.log("🔄 Starting scanner...");
    setScanError(null);

    // Check camera permission first
    const permissionState = await checkCameraPermission();
    console.log("📷 Camera permission state:", permissionState);

    if (permissionState === "denied") {
      setScanError("Camera access is blocked. Please enable camera permissions in your browser settings and refresh the page.");
      return;
    }
    if (permissionState === "https-required") {
      setScanError("Camera access requires HTTPS. Please access this site using https:// instead of http://.");
      return;
    }
    if (permissionState === "not-supported") {
      setScanError("Camera access is not supported in this browser. Please try a modern browser like Chrome, Safari, or Firefox.");
      return;
    }

    if (!scannerSupported) {
      setScanError("Camera scanning is not supported in this browser.");
      return;
    }

    // Ensure video element is ready
    if (!videoRef.current) {
      setScanError("Video element not ready. Please try again.");
      return;
    }

    console.log("🎥 Video element ready:", !!videoRef.current);
    console.log("🔧 Using fallback scanner:", useFallbackScanner);

    try {
      if (useFallbackScanner) {
        // Use qr-scanner library as fallback
        console.log("📱 Initializing QR scanner...");
        qrScannerRef.current = new QrScanner(
          videoRef.current,
          (result) => {
            console.log("✅ QR code detected:", result.data);
            setPassId(result.data);
            stopScanner();
            lookupPass(result.data);
          },
          {
            onDecodeError: (error) => {
              // Ignore decode errors, just continue scanning
              console.debug("❌ QR decode error:", error);
            },
            highlightScanRegion: true,
            highlightCodeOutline: true,
            preferredCamera: "environment",
          }
        );

        console.log("▶️ Starting QR scanner...");
        await qrScannerRef.current.start();
        scanningRef.current = true;
        setScannerActive(true);
        console.log("✅ QR scanner started successfully");
      } else {
        // Use native BarcodeDetector API
        console.log("🔍 Using native BarcodeDetector API");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        console.log("📹 Camera stream obtained");
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          console.log("🎬 Video element playing");
        }

        detectorRef.current = new (window as any).BarcodeDetector({
          formats: ["qr_code"],
        });
        scanningRef.current = true;
        setScannerActive(true);
        frameRef.current = requestAnimationFrame(scanFrame);
        console.log("✅ BarcodeDetector scanner started");
      }
    } catch (error: any) {
      console.error("❌ Camera access error:", error);
      let errorMessage = "Unable to access the camera.";

      if (error.name === "NotAllowedError") {
        errorMessage = "Camera access denied. Please click 'Allow' when prompted, or check your browser settings to enable camera access for this site.";
      } else if (error.name === "NotFoundError") {
        errorMessage = "No camera found on this device. Please connect a camera and try again.";
      } else if (error.name === "NotReadableError") {
        errorMessage = "Camera is already in use by another application. Please close other apps using the camera and try again.";
      } else if (error.name === "OverconstrainedError") {
        errorMessage = "Camera does not support the required settings. Please try a different camera or device.";
      } else if (error.name === "NotSupportedError" || !navigator.mediaDevices) {
        errorMessage = "Camera access is not supported in this browser. Please try a modern browser like Chrome, Safari, or Firefox.";
      } else if (typeof window !== 'undefined' && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        errorMessage = "Camera access requires HTTPS. Please access this site using https:// instead of http://.";
      } else {
        errorMessage += " Please check your browser settings and try again.";
      }

      setScanError(errorMessage);
      stopScanner();
    }
  };

  const handleApproveEntry = async () => {
    if (!result) return;
    await markPassUsed(result.id);
    setResult({ ...result, status: "used" });
  };

  const handleDenyEntry = async () => {
    if (!result) return;
    await markPassDenied(result.id);
    setResult({ ...result, status: "denied" });
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="container max-w-2xl py-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <ScanLine className="h-7 w-7 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            Security Check-In
          </h1>
          <p className="mt-1 text-muted-foreground">
            Enter or scan the visitor's pass ID to verify entry.
          </p>
        </div>

        <div className="mb-8 rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Scan QR Code</p>
              <p className="text-sm text-muted-foreground">
                Use your device camera to scan the visitor pass QR code first.
                {useFallbackScanner && (
                  <span className="block text-xs mt-1 text-blue-600">
                    Using enhanced scanner for better compatibility
                  </span>
                )}
                {scannerActive && (
                  <span className="block text-xs mt-1 text-green-600">
                    Scanner active - point camera at QR code
                  </span>
                )}
              </p>
            </div>
            <Button
              variant={scannerActive ? "destructive" : "secondary"}
              className="gap-2"
              onClick={scannerActive ? stopScanner : startScanner}
            >
              {scannerActive ? "Stop scanner" : "Start scanner"}
            </Button>
            {!scannerActive && (
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    // Check basic requirements first
                    if (typeof window !== 'undefined' && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
                      alert("Camera access requires HTTPS. Please access this site using https:// instead of http://.");
                      return;
                    }

                    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                      alert("Camera access is not supported in this browser. Please try a modern browser.");
                      return;
                    }

                    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                    console.log("Camera test successful");
                    stream.getTracks().forEach(track => track.stop());
                    alert("Camera access test passed!");
                  } catch (error: any) {
                    console.error("Camera test failed:", error);
                    let message = "Camera access test failed: ";

                    if (error.name === "NotAllowedError") {
                      message += "Permission denied. Please allow camera access.";
                    } else if (error.name === "NotFoundError") {
                      message += "No camera found.";
                    } else if (error.name === "NotReadableError") {
                      message += "Camera is already in use.";
                    } else {
                      message += error.message || "Unknown error";
                    }

                    alert(message);
                  }
                }}
              >
                Test Camera
              </Button>
            )}
          </div>

          {scanError && (
            <div className="mb-4 rounded-xl bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <p className="font-medium mb-2">{scanError}</p>
              <details className="text-xs">
                <summary className="cursor-pointer hover:text-destructive/80">
                  How to enable camera access
                </summary>
                <div className="mt-2 space-y-1 text-muted-foreground">
                  <p><strong>HTTPS Required:</strong> Camera access only works on secure sites (https://)</p>
                  <p><strong>Chrome:</strong> Click the camera icon in the address bar → Allow</p>
                  <p><strong>Safari:</strong> Safari → Preferences → Websites → Camera → Allow</p>
                  <p><strong>Firefox:</strong> Click the camera icon in the address bar → Allow</p>
                  <p><strong>Mobile:</strong> Tap "Allow" when prompted, or check app settings</p>
                  <p className="mt-2">
                    <button
                      onClick={() => window.location.reload()}
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      Refresh page after enabling permissions
                    </button>
                  </p>
                </div>
              </details>
            </div>
          )}

          <div className="relative overflow-hidden rounded-2xl border border-border bg-black">
            <video
              ref={videoRef}
              className="h-72 w-full object-cover bg-black"
              muted
              playsInline
              autoPlay
            />

            {!scannerActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white">
                <div className="text-center">
                  <ScanLine className="mx-auto mb-2 h-8 w-8 text-white/60" />
                  <p className="text-sm">Camera scanner ready</p>
                  <p className="text-xs text-white/60 mt-1">Click "Start scanner" to begin</p>
                </div>
              </div>
            )}

            {scannerActive && (
              <>
                {/* Scanning animation overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 flex h-48 w-48 -translate-x-1/2 -translate-y-1/2 items-center justify-center">
                    <div className="absolute inset-0 rounded-lg border-2 border-white/50"></div>
                    <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-white"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-white"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-white"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-white"></div>
                    <div
                      className="absolute left-0 h-0.5 w-full bg-red-500"
                      style={{ animation: 'scanLine 2s ease-in-out infinite' }}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="border-t border-border px-4 py-3 text-sm text-muted-foreground bg-background/80 backdrop-blur-sm">
              {scannerActive
                ? "Point the camera at the QR code until it is detected."
                : "Scanner is ready. Tap the button above to begin."}
            </div>
          </div>
        </div>

        <form
          onSubmit={handleLookup}
          className={`mb-8 flex gap-3 ${scannerActive ? "hidden" : ""}`}
        >
          <Input
            placeholder="Paste pass ID, security code, or scanned QR data…"
            value={passId}
            onChange={(e) => setPassId(e.target.value)}
            className="flex-1"
            required
          />
          <Button type="submit" className="gap-2">
            <Search className="h-4 w-4" />
            Verify
          </Button>
        </form>

        {notFound && (
          <div className="animate-fade-in rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
            <ShieldX className="mx-auto mb-2 h-10 w-10 text-destructive" />
            <p className="font-medium text-destructive">Pass not found</p>
            <p className="text-sm text-muted-foreground mt-1">
              The ID does not match any visitor pass. Deny entry.
            </p>
          </div>
        )}

        {result && (
          <div className="animate-fade-in rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {result.status === "pending" ? (
                  <ShieldCheck className="h-6 w-6 text-success" />
                ) : (
                  <ShieldX className="h-6 w-6 text-destructive" />
                )}
                <h2 className="font-display text-xl font-semibold text-card-foreground">
                  {result.status === "pending"
                    ? "Valid Pass"
                    : result.status === "denied"
                    ? "Pass Denied"
                    : "Pass Already Used"}
                </h2>
              </div>
              <Badge
                variant="outline"
                className={`capitalize ${
                  result.status === "pending"
                    ? "border-success/30 text-success"
                    : "border-destructive/30 text-destructive"
                }`}
              >
                {result.status}
              </Badge>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-accent" />
                <span className="font-medium">Visitor:</span>
                <span>{result.visitorName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-accent" />
                <span className="font-medium">Visiting:</span>
                <span>{result.residentName} — {result.residentUnit}</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-accent" />
                <span>{result.expectedDate}</span>
                <Clock className="h-4 w-4 ml-2 text-accent" />
                <span>{result.expectedTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Purpose:</span>
                <span>{result.purpose}</span>
              </div>
            </div>

            {result.status === "pending" && (
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={handleApproveEntry}
                  className="w-full gap-2 bg-success hover:bg-success/90 text-success-foreground"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Approve Entry
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDenyEntry}
                  className="w-full gap-2"
                >
                  <ShieldX className="h-4 w-4" />
                  Deny Entry
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Security;
