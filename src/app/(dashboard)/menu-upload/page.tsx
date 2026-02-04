'use client';

import React, { useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { useToast } from '@/shared/hooks/use-toast';
import { Button } from '@/shared/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MenuUploadPage() {
  const { currentUser, isLoading, isInitialized } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [extractionResult, setExtractionResult] = useState<any>(null);


  // Debug logging
  console.log('🔍 MenuUploadPage render:', {
    currentUser,
    isLoading,
    isInitialized,
    isUploading,
    selectedFile: selectedFile?.name
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      console.log('📁 File selected:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      });
      setSelectedFile(file);
      // Reset previous results when new file is selected
      setMenuItems([]);
      setExtractionResult(null);
    }
  };

  const handleNext = () => {
    if (menuItems.length > 0) {
      // Store the menu items in sessionStorage for the next page
      sessionStorage.setItem('extractedMenuItems', JSON.stringify(menuItems));
      sessionStorage.setItem('extractionResult', JSON.stringify(extractionResult));
      
      // Navigate to the menu editing page
      router.push('/menu-edit');
    }
  };

  const handleUpload = async () => {
    console.log('🔍 Button clicked! Starting upload process...');
    console.log('📁 Selected file:', selectedFile);
    console.log('👤 Current user:', currentUser);
    
    if (!selectedFile || !currentUser) {
      console.log('❌ Validation failed - missing file or user');
      toast({
        title: 'Error',
        description: 'Please select a file and ensure you are logged in',
        variant: 'destructive'
      });
      return;
    }

    console.log('✅ Validation passed, setting isUploading to true');
    setIsUploading(true);
    
    try {
      console.log('📖 Creating FileReader...');
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          console.log('📄 FileReader onload triggered');
          const base64 = e.target?.result as string;
          console.log('📊 Base64 data length:', base64?.length || 0);
          
          console.log('🌐 Making API request to /api/uploadMenu...');
          let response;
          try {
            response = await fetch('/api/uploadMenu', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                file: base64,
                userId: currentUser.id
              })
            });
          } catch (fetchError) {
            console.error('💥 Fetch error:', fetchError);
            const errorMessage = fetchError instanceof Error ? fetchError.message : 'Failed to connect to server';
            throw new Error(`Network error: ${errorMessage}`);
          }

          console.log('📡 API response status:', response.status);
          const result = await response.json();
          console.log('📊 API response data:', result);
          
          if (response.ok) {
            console.log('✅ API call successful, setting menu items');
            setMenuItems(result.menu || []);
            setExtractionResult(result);
            toast({
              title: 'Success',
              description: `Extracted ${result.menu?.length || 0} menu items`
            });
          } else {
            console.log('❌ API call failed');
            toast({
              title: 'Error',
              description: result.error || 'Upload failed',
              variant: 'destructive'
            });
          }
        } catch (apiError) {
          console.error('💥 Error in API call:', apiError);
          toast({
            title: 'Error',
            description: 'Upload failed',
            variant: 'destructive'
          });
        } finally {
          console.log('🏁 Setting isUploading to false');
          setIsUploading(false);
        }
      };
      
      console.log('📖 Starting to read file as data URL...');
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      console.error('💥 Error in handleUpload:', error);
      toast({
        title: 'Error',
        description: 'Upload failed',
        variant: 'destructive'
      });
      setIsUploading(false);
    }
  };

  // Show loading state while auth is initializing
  if (isLoading || !isInitialized) {
    return (
      
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading...</span>
          </div>
        </div>
      
    );
  }

  // Show login prompt if not authenticated
  if (!currentUser) {
    return (
      
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-6 text-center">
            <h2 className="text-xl font-semibold text-yellow-800 mb-2">Authentication Required</h2>
            <p className="text-yellow-700">Please log in to access the menu upload feature.</p>
          </div>
        </div>
      
    );
  }

  return (
    
      <div className="max-w-4xl mx-auto p-6">
        {/* Header with Centered Title and Action Buttons */}
        <div className="mb-6">
          {/* Back Button */}
          <div className="mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/inventory-management')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Inventory
            </Button>
          </div>
          
          {/* Centered Title */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold">Menu Upload</h1>
            <p className="text-gray-600">Upload your menu PDF for AI extraction</p>
          </div>
          
          {/* Next Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleNext}
              disabled={menuItems.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Next: Edit Menu Items →
            </Button>
          </div>
        </div>

        {/* Navigation Breadcrumb */}
        <div className="mb-4">
          <nav className="flex items-center space-x-2 text-sm text-gray-500">
            <button
              onClick={() => router.push('/inventory-management')}
              className="hover:text-blue-600"
            >
              Inventory Management
            </button>
            <span>→</span>
            <span className="text-gray-900 font-medium">Menu Upload</span>
          </nav>
        </div>

        {/* File Upload Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Upload Menu PDF</h2>
          
          <div className="space-y-4">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            
            {selectedFile && (
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                <span className="text-sm text-gray-700">📄 {selectedFile.name}</span>
                <span className="text-xs text-gray-500">
                  {selectedFile.size ? 
                    `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : 
                    'Size unknown'
                  }
                  {selectedFile.size === 0 && (
                    <span className="text-red-500 ml-1">(File may be corrupted)</span>
                  )}
                </span>
              </div>
            )}

            {isUploading && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-blue-700 font-medium">
                    Processing your menu... This may take a few moments.
                  </span>
                </div>
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="w-full"
            >
              {isUploading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </div>
              ) : (
                'Upload and Extract Menu'
              )}
            </Button>
          </div>
        </div>

        {/* Menu Preview */}
        {menuItems.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Extracted Menu Items ({menuItems.length})</h2>
              <div className="text-sm text-gray-500">
                Accuracy: {extractionResult?.extractionAccuracy || 0}%
              </div>
            </div>
            
            <div className="grid gap-4 mb-6">
              {menuItems.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{item.name || 'Unnamed Item'}</h3>
                      <p className="text-gray-600">{item.category || 'No Category'}</p>
                      {item.ingredients && item.ingredients.length > 0 && (
                        <p className="text-sm text-gray-500 mt-1">
                          Ingredients: {item.ingredients.map(ing => typeof ing === 'string' ? ing : ing.name).filter(Boolean).join(', ')}
                        </p>
                      )}
                    </div>
                    <span className="font-bold text-green-600">{item.price || 'No Price'}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Upload Another Menu Button */}
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => {
                  setMenuItems([]);
                  setExtractionResult(null);
                  setSelectedFile(null);
                }}
              >
                Upload Another Menu
              </Button>
            </div>
          </div>
        )}
      </div>
    
  );
}
