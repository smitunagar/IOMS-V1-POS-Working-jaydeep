'use client';

import React, { useRef, useEffect, useState } from 'react';
import { SuggestExpiryDateInput } from '@/ai/flows/ingredient-types';
import { suggestExpiryDate } from '@/ai/flows/suggest-expiry-date';
import * as inventoryService from '@/server/lib/inventoryService'; // Assuming an inventory service exists
import { useToast } from '@/shared/hooks/use-toast';
// import { useAuth } from '@/features/auth/AuthContext';      
import { QRCodeCanvas } from 'qrcode.react';

const BarcodeScannerPage: React.FC = () => {
  // References for video element and ZXing code reader
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReader = useRef<any | null>(null);
  // const { currentUser } = useAuth(); // Get currentUser from AuthContext if needed
  // State variables for scanner functionality
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isZxingLoaded, setIsZxingLoaded] = useState<boolean>(false);
  const [autoLoginError, setAutoLoginError] = useState<string | null>(null);

  // States for product details and inventory actions
  const { toast } = useToast(); // Hook for displaying toast notifications
  const [productDetails, setProductDetails] = useState<any | null>(null);
  const [productLoading, setProductLoading] = useState<boolean>(false);
  const [productError, setProductError] = useState<string | null>(null);

  // State for manual barcode input
  const [manualBarcodeInput, setManualBarcodeInput] = useState<string>('');

  // State for quantity input
  const [quantity, setQuantity] = useState<number>(1);
  const [weight, setWeight] = useState<string>("1 pcs");
  
  // State for expiry date functionality
  const [expiryDate, setExpiryDate] = useState<string>("");
  const [suggestedExpiryDate, setSuggestedExpiryDate] = useState<string>("");
  const [shelfLifeDays, setShelfLifeDays] = useState<number>(0);
  const [storageRecommendation, setStorageRecommendation] = useState<string>("");
  const [confidence, setConfidence] = useState<string>("");
  const [isSuggestingExpiry, setIsSuggestingExpiry] = useState<boolean>(false);
  const [expiryAgreement, setExpiryAgreement] = useState<'agree' | 'disagree' | null>(null);

  // Effect hook to load the ZXing library dynamically
  useEffect(() => {
    const zxingScript = document.createElement('script');
    zxingScript.src = "https://unpkg.com/@zxing/library@latest/umd/index.min.js";
    zxingScript.async = true;

    zxingScript.onload = () => {
      // Check if ZXing is available on the window object
      if (typeof window !== 'undefined' && (window as any).ZXing) {
        if ((window as any).ZXing.BrowserCodeReader) {
          // Configure ZXing to locate its worker file if necessary (for development setup)
          (window as any).ZXing.BrowserCodeReader.setLocateFile = (path: string, prefix: string) => {
            if (path.endsWith('zxing.min.js')) {
              return `/zxing.min.js`; // Adjust path if worker is served differently
            }
            return prefix + path;
          };
        } else {
          console.warn("window.ZXing.BrowserCodeReader not found, worker location might not be configurable.");
        }
        
        // Initialize the ZXing BrowserMultiFormatReader
        codeReader.current = new (window as any).ZXing.BrowserMultiFormatReader();
        setIsZxingLoaded(true);
        setErrorMessage(null); // Clear any previous loading errors
      } else {
        setErrorMessage("ZXing library failed to load or is not available on window.ZXing.");
        console.error("ZXing library (window.ZXing) not found after script load.");
      }
    };

    zxingScript.onerror = () => {
      setErrorMessage("Failed to load ZXing library script. Please check your network connection.");
      console.error("ZXing script loading failed.");
      setIsZxingLoaded(false);
    };

    // Append the ZXing script to the document body
    document.body.appendChild(zxingScript);

    // Cleanup function: reset scanner and remove script on component unmount
    return () => {
      if (codeReader.current) {
        codeReader.current.reset();
      }
      if (document.body.contains(zxingScript)) {
        document.body.removeChild(zxingScript);
      }
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  // Function to fetch product details from the database
  const fetchProductDetails = async (barcode: string) => {
  setProductLoading(true);
  setProductDetails(null);
  setProductError(null);
  setScannedResult(null);

  try {
    const res = await fetch(`/api/products?barcode=${encodeURIComponent(barcode)}`);
    if (!res.ok) {
      throw new Error('Product not found');
    }

    const product = await res.json();

    return {
      name: product.name,
      description: product.brand || product.category || "No description available",
      price: product.price,
      weight: product.weight || "1 pcs", // Get weight from product data
      expiryDate: null,
      manufacturingDate: null,
      batchNumber: null,
    };
  } catch (err) {
    console.error('Fetch failed:', err);
    return null;
  } finally {
    setProductLoading(false);
  }
};


  // Handler for automatic barcode lookup (triggered by input)
  async function handleAutoBarcodeLookup(barcode: string) {
    if (!barcode || barcode.length < 3) {
      return; // Don't lookup if barcode is too short
    }

    setErrorMessage(null);           // Clear any camera errors
    setProductError(null);           // Clear previous product errors
    setProductDetails(null);         // Clear previous product info
    setProductLoading(true);         // Start loading state
    setScannedResult(null);          // Reset scanned result for clarity

    try {
      const details = await fetchProductDetails(barcode); // 🔍 Call CSV-based lookup

      if (details) {
        setProductDetails(details);
        setWeight(details.weight || "1 pcs"); // Set weight from product data
        
        // Automatically suggest expiry date if no expiry date is found in product details
        if (!details.expiryDate) {
          await handleSuggestExpiryDate();
        } else {
          // If expiry date exists in product details, use it
          setExpiryDate(details.expiryDate);
          setExpiryAgreement('agree');
        }
      } else {
        setProductError(`No product found for barcode: ${barcode}`);
      }
    } catch (error) {
      console.error("Error during barcode lookup:", error);
      setProductError("An error occurred while fetching product details.");
    } finally {
      setProductLoading(false);      // Ensure loading ends
    }
  }

  // Handler for manual barcode lookup (kept for backward compatibility)
  async function handleManualBarcodeLookup() {
    const barcode = manualBarcodeInput.trim();

    if (!barcode) {
      setProductError("Please enter a barcode number.");
      return;
    }

    await handleAutoBarcodeLookup(barcode);
  }

  // Function to suggest expiry date using AI
  const handleSuggestExpiryDate = async () => {
    if (!productDetails) {
      toast({ title: "Error", description: "No product details available to suggest expiry date.", variant: "destructive" });
      return;
    }

    setIsSuggestingExpiry(true);
    setSuggestedExpiryDate("");
    setShelfLifeDays(0);
    setStorageRecommendation("");
    setConfidence("");
    setExpiryAgreement(null);

    try {
      const input: SuggestExpiryDateInput = {
        productName: productDetails.name,
        productCategory: productDetails.description,
        productWeight: weight,
        manufacturingDate: productDetails.manufacturingDate || undefined,
      };

      const result = await suggestExpiryDate(input);
      
      setSuggestedExpiryDate(result.suggestedExpiryDate);
      setShelfLifeDays(result.shelfLifeDays);
      setStorageRecommendation(result.storageRecommendation);
      setConfidence(result.confidence);
      
      // Auto-fill the expiry date field with the suggestion
      setExpiryDate(result.suggestedExpiryDate);
      
      toast({ 
        title: "Expiry Date Suggested", 
        description: `AI suggested expiry date: ${result.suggestedExpiryDate} (${result.confidence} confidence). Please confirm or edit.` 
      });
    } catch (error) {
      console.error('Error suggesting expiry date:', error);
      toast({ 
        title: "Error", 
        description: "Failed to suggest expiry date. Please enter manually.", 
        variant: "destructive" 
      });
    } finally {
      setIsSuggestingExpiry(false);
    }
  };

  // Function to handle expiry date agreement
  const handleExpiryAgreement = (agreement: 'agree' | 'disagree') => {
    if (!expiryDate) {
      toast({ title: "Error", description: "Please enter an expiry date first.", variant: "destructive" });
      return;
    }
    
    setExpiryAgreement(agreement);
    const message = agreement === 'agree' 
      ? `Expiry date confirmed: ${expiryDate}` 
      : `Expiry date disagreed. Please edit the date.`;
    
    toast({ 
      title: agreement === 'agree' ? "Expiry Date Confirmed" : "Expiry Date Disagreed", 
      description: message 
    });
  };


  const handleAddToInventory = async () => {
  // 1️⃣ Get userId from AuthContext
  // if (!currentUser?.id) { // This line is removed as per the edit hint
  //   toast({ title: "Error", description: "No user session found. Please log in.", variant: "destructive" });
  //   return;
  // }

  const barcodeToAdd = manualBarcodeInput.trim() || scannedResult;
  if (!barcodeToAdd) {
    toast({ title: "Error", description: "No barcode available to add to inventory.", variant: "destructive" });
    return;
  }

  // 2️⃣ If no product details, try to fetch them first
  let productInfo = productDetails;
  if (!productInfo) {
    try {
      productInfo = await fetchProductDetails(barcodeToAdd);
      if (!productInfo) {
        toast({ title: "Error", description: "No product found for this barcode. Please lookup the barcode first.", variant: "destructive" });
        return;
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch product details. Please lookup the barcode first.", variant: "destructive" });
      return;
    }
  }

  // 3️⃣ Build correct ingredient object matching RawIngredient interface
  const ingredient = {
    id: Date.now().toString(),
    name: productInfo.name,                                // ✅ REQUIRED
    quantity: quantity,                                       // ✅ REQUIRED
    unit: weight,                                              // ✅ Use weight from product data
    expiryDate: expiryDate || undefined,                      // ✅ Include expiry date if provided
  };

  try {
    const result = inventoryService.addOrUpdateIngredientInInventory('demo-user', ingredient); // Use a placeholder userId

    // Check if this was an update (quantity is greater than what we just added) or a new item
    const wasUpdate = result.quantity > quantity;
    const message = wasUpdate 
      ? `${result.name} quantity updated to ${result.quantity} ${result.unit} in inventory.`
      : `${result.name} added to inventory with ${result.quantity} ${result.unit}.`;
    
    toast({ title: "Success", description: message });

    setManualBarcodeInput('');
    setProductDetails(null);
    setQuantity(1);
    setWeight("1 pcs");
    setExpiryDate("");
    setSuggestedExpiryDate("");
    setShelfLifeDays(0);
    setStorageRecommendation("");
    setConfidence("");
    setExpiryAgreement(null);
    setScannedResult(null);
  } catch (error) {
    console.error('Error adding to inventory:', error);
    toast({ title: "Error", description: "Failed to add item to inventory.", variant: "destructive" });
  }
};


  // Function to start the camera scanning process
  const startScanning = async () => {
    if (!isZxingLoaded) {
      setErrorMessage("Scanner library is still loading. Please wait a moment.");
      return;
    }
    if (!videoRef.current || !codeReader.current) {
      setErrorMessage("Video element or scanner not initialized.");
      return;
    }

    // Reset relevant states before starting a new scan
    setIsScanning(true);
    setScannedResult(null);
    setErrorMessage(null);
    setProductDetails(null);
    setProductError(null);
    setProductLoading(false);
    setManualBarcodeInput(''); // Clear manual input when starting scan

    try {
      // Get available video input devices (cameras)
      const videoInputDevices = await codeReader.current.getVideoInputDevices();

      if (videoInputDevices.length === 0) {
        setErrorMessage("No video input devices found. Please ensure a camera is connected and allowed.");
        setIsScanning(false);
        return;
      }

      // Use the first available camera device
      const selectedDeviceId = videoInputDevices[0].deviceId;

      // Start decoding from the video stream
      codeReader.current.decodeFromVideoDevice(selectedDeviceId, videoRef.current, async (result: any, err: any) => {
        if (result) {
          // If a barcode is successfully scanned
          const barcodeData = result.getText();
          setScannedResult(barcodeData);
          setErrorMessage(null);
          setIsScanning(false);
          codeReader.current?.reset(); // Stop the scanner after a successful scan
          setManualBarcodeInput(barcodeData); // Populate manual input with scanned result
          console.log(`Scanned barcode: ${barcodeData}. Fetching product details...`);
          
          // Fetch product details for the scanned barcode
          const details = await fetchProductDetails(barcodeData);
          if (details) {
            setProductDetails(details);
            setWeight(details.weight || "1 pcs"); // Set weight from product data
          } else {
            setProductError(`No product found for barcode: ${barcodeData}`);
          }
          setProductLoading(false); // End loading state
        }
        if (err && !(err instanceof (window as any).ZXing.NotFoundException)) {
          // Handle other scanning errors, but ignore NotFoundException (no barcode found yet)
          console.error('Error scanning barcode:', err);
          setErrorMessage(`Error scanning: ${err.message}`);
          setIsScanning(false);
          codeReader.current?.reset(); // Reset scanner on error
          setProductLoading(false);
        }
      });
    } catch (error: any) {
      // Catch errors related to camera access or initialization
      console.error('Error starting camera or decoding:', error);
      setErrorMessage(`Error accessing camera: ${error.message || 'Unknown error'}. Please grant camera permission.`);
      setIsScanning(false);
      setProductLoading(false);
    }
  };

  // Function to stop the camera scanning process
  const stopScanning = () => {
    if (codeReader.current) {
      codeReader.current.reset(); // Reset the scanner to stop the camera feed
    }
    // Reset relevant states when stopping scan
    setIsScanning(false);
    setScannedResult(null);
    setErrorMessage(null);
    setProductDetails(null);
    setProductError(null);
    setProductLoading(false);
    setWeight("1 pcs"); // Reset weight field
    setExpiryDate("");
    setSuggestedExpiryDate("");
    setShelfLifeDays(0);
    setStorageRecommendation("");
    setConfidence("");
    setExpiryAgreement(null);
    // Manual input is kept as is, allowing the user to continue with it
  };

  return (
    // EnterpriseLayout provides a consistent layout for the page
    
      <div className="bg-muted/50 min-h-screen">
        <div className="w-full max-w-lg mx-auto mt-8 mb-8 p-4 bg-white rounded-lg shadow">
          <p style={{ maxWidth: 400, textAlign: 'center', marginBottom: 8 }}>
            This QR code, when scanned, will open the barcode scanner page of this app in a browser. The link is unique to your account and includes your user ID in the URL for personalized access or tracking.
          </p>
          <h2 className="text-lg font-semibold text-center mb-4">Scan this QR code to open the Barcode Scanner on another device</h2>
          {/* QR code is only shown if user is authenticated, but AppLayout enforces this. */}
          <div className="flex justify-center">
            {/* You can safely use currentUser from AppLayout context if needed. */}
            {/* <QRCodeCanvas value={`https://ioms-v1-pos-working.vercel.app/barcode-scanner?userId=${encodeURIComponent(currentUser.id)}`} size={180} /> */}
          </div>
        </div>
        <div className="flex flex-col items-center p-5">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 rounded-md p-2">Barcode Scanner</h1>
          {/* Video Scanner Section */}
          <div className="w-full max-w-lg mb-6 bg-white shadow-lg rounded-lg overflow-hidden border border-gray-300">
            <video
              ref={videoRef}
              className="w-full h-auto block rounded-t-lg"
              style={{ transform: 'scaleX(-1)' }}
              playsInline
              autoPlay
            />
            <div className="p-4 bg-gray-50 text-center text-sm text-gray-600 rounded-b-lg">
              {isScanning ? "Scanning for barcodes..." : (isZxingLoaded ? "Press 'Start Scanning' to begin." : "Loading scanner components...")}
            </div>
          </div>
          {/* Action Buttons: Start/Stop Scanning */}
          <div className="mt-6 mb-6 space-x-4">
            {!isScanning ? (
              <button
                onClick={startScanning}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-all duration-200"
                disabled={!isZxingLoaded} // Disable button if ZXing library is not yet loaded
              >
                {isZxingLoaded ? 'Start Camera Scan' : 'Loading Scanner...'}
              </button>
            ) : (
              <button
                onClick={stopScanning}
                className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75 transition-all duration-200"
              >
                Stop Camera Scan
              </button>
            )}
          </div>
          {/* Manual Barcode Input Section */}
          <div className="w-full max-w-lg p-5 bg-white shadow-lg rounded-lg border border-gray-300 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Manual Barcode Input</h2>
            <input // Barcode input field
              type="text"
              value={manualBarcodeInput}
              onChange={(e) => {
                const barcode = e.target.value;
                setManualBarcodeInput(barcode);
                // Auto-lookup when barcode is entered (minimum 3 characters)
                if (barcode.trim().length >= 3) {
                  handleAutoBarcodeLookup(barcode.trim());
                }
              }}
              placeholder="Enter barcode number"
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 text-center text-lg"
              disabled={!isZxingLoaded} // Disable input until ZXing is loaded
            />
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input // Quantity input field
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} // Ensure quantity is at least 1
                  placeholder="Quantity"
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg"
                  min="1" // HTML5 min attribute for numeric input
                  disabled={!isZxingLoaded || !manualBarcodeInput.trim()} // Disable if ZXing not loaded or no barcode entered
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight/Unit</label>
                <input // Weight/Unit input field
                  type="text"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="Weight/Unit"
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg"
                  disabled={!isZxingLoaded || !manualBarcodeInput.trim()} // Disable if ZXing not loaded or no barcode entered
                />
              </div>
            </div>
            
            {/* Expiry Date Section */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
              </div>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => {
                  setExpiryDate(e.target.value);
                  setExpiryAgreement(null); // Reset agreement when user edits
                }}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg"
                disabled={!isZxingLoaded || !manualBarcodeInput.trim()}
              />
              {isSuggestingExpiry && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                  <p className="text-center">🤖 AI is suggesting expiry date...</p>
                </div>
              )}
              {suggestedExpiryDate && !isSuggestingExpiry && (
                <div className={`mt-2 p-2 border rounded text-sm ${expiryAgreement === 'agree' ? 'bg-green-50 border-green-200' : expiryAgreement === 'disagree' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                  <p><strong>AI Suggestion:</strong> {suggestedExpiryDate}</p>
                  <p><strong>Shelf Life:</strong> {shelfLifeDays} days</p>
                  <p><strong>Storage:</strong> {storageRecommendation}</p>
                  <p><strong>Confidence:</strong> {confidence}</p>
                </div>
              )}
              {expiryDate && !expiryAgreement && (
                <div className="mt-4 flex flex-col items-center space-y-4">
                  <span className="text-base font-semibold text-gray-700">Do you agree with this expiry date?</span>
                  <div className="flex space-x-6">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={expiryAgreement === 'agree'}
                        onChange={() => handleExpiryAgreement('agree')}
                        className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-green-700 font-semibold">✅ Agree</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={expiryAgreement === 'disagree'}
                        onChange={() => handleExpiryAgreement('disagree')}
                        className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                      />
                      <span className="text-red-700 font-semibold">❌ Disagree</span>
                    </label>
                  </div>
                </div>
              )}
              {expiryAgreement === 'agree' && expiryDate && (
                <div className="mt-4 flex items-center space-x-2 justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  <span className="text-green-700 font-semibold text-base">Expiry date agreed.</span>
                </div>
              )}
              {expiryAgreement === 'disagree' && expiryDate && (
                <div className="mt-4 flex items-center space-x-2 justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  <span className="text-red-700 font-semibold text-base">Expiry date disagreed. Please edit the date.</span>
                </div>
              )}
            </div>
            <div className="flex justify-center">
              <button
                onClick={handleAddToInventory}
                className="w-full px-6 py-3 bg-yellow-600 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-75 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                // Enable if ZXing is loaded, there's a barcode (manual or scanned), and quantity is valid
                disabled={!isZxingLoaded || (!manualBarcodeInput.trim() && !scannedResult) || quantity <= 0} 
              >
                Add to Inventory
              </button>
            </div>
          </div>

          {/* Results and Error Messages Display Area */}
          {scannedResult && !productDetails && !productLoading && !productError && ( // Show only if scanned and no product details found yet
            <div className="mt-4 p-4 bg-green-100 text-green-800 font-semibold text-lg rounded-lg shadow-md break-words">
              Scanned Result: <span className="font-mono break-all">{scannedResult}</span>
            </div>
          )}

          {productLoading && (
            <div className="mt-4 p-4 bg-blue-100 text-blue-800 font-medium text-center rounded-lg shadow-md">
              Fetching product details...
            </div>
          )}

          {productDetails && (
            <div className="mt-4 p-4 bg-purple-100 text-purple-800 font-semibold text-lg rounded-lg shadow-md w-full max-w-lg">
              <h2 className="text-xl font-bold mb-2">Product Details</h2>
              <p><strong>Name:</strong> {productDetails.name}</p>
              <p><strong>Description:</strong> {productDetails.description}</p>
              <p><strong>Price:</strong> {productDetails.price}</p>
              <p><strong>Weight:</strong> {productDetails.weight}</p>
              {productDetails.expiryDate && (
                <p><strong>Expiry Date:</strong> {productDetails.expiryDate}</p>
              )}
              {productDetails.batchNumber && (
                <p><strong>Batch Number:</strong> {productDetails.batchNumber}</p>
              )}
              {productDetails.manufacturingDate && (
                <p><strong>Mfg. Date:</strong> {productDetails.manufacturingDate}</p>
              )}
            </div>
          )}

          {productError && (
            <div className="mt-4 p-4 bg-orange-100 text-orange-800 font-medium text-center rounded-lg shadow-md">
              {productError}
            </div>
          )}

          {errorMessage && (
            <div className="mt-4 p-4 bg-red-100 text-red-800 font-medium text-center rounded-lg shadow-md">
              Error: {errorMessage}
            </div>
          )}
          {autoLoginError && (
            <div className="mt-4 p-4 bg-red-100 text-red-800 font-medium text-center rounded-lg shadow-md">
              {autoLoginError}
            </div>
          )}

          {/* Tailwind CSS CDN - for rapid prototyping. For production, integrate via build process. */}
          <script src="https://cdn.tailwindcss.com"></script>
        </div>
      </div>
    
  );
};

export default BarcodeScannerPage;
