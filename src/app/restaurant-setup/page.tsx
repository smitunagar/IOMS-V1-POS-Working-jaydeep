'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';

interface RestaurantType {
  id: string;
  title: string;
  description: string;
}

const restaurantTypes: RestaurantType[] = [
  {
    id: 'fast-casual-qsr',
    title: 'Fast Casual / QSR',
    description: 'Configuration for fast food or counter service with counter or simple table management'
  },
  {
    id: 'cafes-bakeries',
    title: 'Cafes / Bakeries',
    description: 'Configuration for Cafes or bakeries, with counter or simple table management.'
  },
  {
    id: 'bar-pubs',
    title: 'Bar / Pubs',
    description: 'Configuration for Bars/Pubs, with counter or table service'
  },
  {
    id: 'casual-fine-dining',
    title: 'Casual / Fine dining',
    description: 'Configuration for traditional and gastronomic restaurants and brasseries with complete table management'
  },
  {
    id: 'hotels',
    title: 'Hotels',
    description: 'Configuration for hotel establishments'
  }
];

export default function RestaurantSetupPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [selectedType, setSelectedType] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    if (!currentUser) {
      // Check if signup data exists
      const signupData = localStorage.getItem('signupData');
      if (!signupData) {
        router.push('/signup');
      }
    }
  }, [currentUser, router]);

  const handleContinue = () => {
    if (!selectedType) {
      return;
    }

    // Save restaurant type to localStorage
    const signupData = localStorage.getItem('signupData');
    if (signupData) {
      const parsedData = JSON.parse(signupData);
      parsedData.restaurantType = selectedType;
      localStorage.setItem('signupData', JSON.stringify(parsedData));
    }

    // Redirect to payment plans
    router.push('/payment-plans');
  };

  const handleGoBack = () => {
    router.push('/signup');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center py-12 px-6">
        <div className="w-full max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-3">
              Select Your Business Type
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose the configuration that best matches your business
            </p>
          </div>

          {/* Restaurant Type Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {restaurantTypes.map((type) => (
              <Card
                key={type.id}
                className={`
                  p-8 cursor-pointer transition-all duration-200 h-full
                  ${selectedType === type.id
                    ? 'border-blue-500 border-2 bg-blue-50 shadow-lg scale-105'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-lg'
                  }
                `}
                onClick={() => setSelectedType(type.id)}
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {type.title}
                </h3>
                <p className="text-base text-gray-600 leading-relaxed">
                  {type.description}
                </p>
              </Card>
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-center gap-4 pt-6">
            <Button
              variant="outline"
              onClick={handleGoBack}
              className="px-8 py-6 text-base"
            >
              <ChevronLeft className="mr-2 h-5 w-5" />
              Go back
            </Button>
            <Button
              onClick={handleContinue}
              disabled={!selectedType || isLoading}
              className="px-8 py-6 text-base bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? 'Loading...' : 'Continue'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
