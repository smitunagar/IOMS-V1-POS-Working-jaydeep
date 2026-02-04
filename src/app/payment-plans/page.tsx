'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { ChevronLeft, Check, ChevronRight } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { cn } from '@/lib/utils';

interface PaymentPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  features: string[];
  popular?: boolean;
}

const paymentPlans: PaymentPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: '$29',
    period: 'per month',
    features: [
      'Up to 2 locations',
      'Basic POS features',
      'Inventory management',
      'Email support'
    ]
  },
  {
    id: 'professional',
    name: 'Professional',
    price: '$79',
    period: 'per month',
    popular: true,
    features: [
      'Up to 5 locations',
      'Advanced POS features',
      'Full inventory management',
      'Analytics & reporting',
      'Priority support',
      'API access'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$199',
    period: 'per month',
    features: [
      'Unlimited locations',
      'All POS features',
      'Advanced analytics',
      'Custom integrations',
      'Dedicated support',
      'White-label options',
      'Custom training'
    ]
  }
];

const testimonials = [
  {
    id: 1,
    quote: "IOMS has transformed how we manage our restaurant. The inventory tracking is incredible and has saved us thousands in waste reduction.",
    author: "Sarah Martinez",
    role: "Restaurant Owner",
    initials: "SM"
  },
  {
    id: 2,
    quote: "The analytics dashboard gives us insights we never had before. Our operations are more efficient and profitable.",
    author: "James Davis",
    role: "Operations Manager",
    initials: "JD"
  },
  {
    id: 3,
    quote: "Best investment we've made. The real-time data helps us make better decisions every single day.",
    author: "Emily Chen",
    role: "General Manager",
    initials: "EC"
  }
];

export default function PaymentPlansPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Check if user is logged in or has signup data
    if (!currentUser) {
      const signupData = localStorage.getItem('signupData');
      if (!signupData) {
        router.push('/signup');
        return;
      }
    }

    // Check if restaurant type is selected
    const signupData = localStorage.getItem('signupData');
    if (signupData) {
      const parsedData = JSON.parse(signupData);
      if (!parsedData.restaurantType) {
        router.push('/restaurant-setup');
      }
    }
  }, [currentUser, router]);

  const handleContinue = async () => {
    if (!selectedPlan) {
      return;
    }

    setIsLoading(true);

    try {
      // Save payment plan to localStorage
      const signupData = localStorage.getItem('signupData');
      if (signupData) {
        const parsedData = JSON.parse(signupData);
        parsedData.paymentPlan = selectedPlan;
        localStorage.setItem('signupData', JSON.stringify(signupData));
      }

      // If user is not logged in, try to create account
      if (!currentUser) {
        const signupData = localStorage.getItem('signupData');
        if (signupData) {
          const parsedData = JSON.parse(signupData);
          // Here you would typically call your signup API
          // For now, we'll just redirect to marketplace
        }
      }

      // Redirect to marketplace
      router.push('/');
    } catch (error) {
      console.error('Error processing payment plan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    router.push('/restaurant-setup');
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 items-center justify-center p-8 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        </div>
        
        <div className="max-w-lg text-white relative z-10 w-full">
          {/* Branding Section */}
          <div className="mb-6">
            <h1 className="text-5xl font-bold mb-2 tracking-tight bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              IOMS
            </h1>
            <p className="text-lg font-medium text-blue-100 mb-5">
              Intelligent Operations Management System
            </p>
            <div className="space-y-2.5 text-blue-50">
              <div className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 bg-white rounded-full flex-shrink-0 mt-2"></div>
                <p className="text-sm leading-relaxed">Optimize operations with intelligent automation and seamless workflows</p>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 bg-white rounded-full flex-shrink-0 mt-2"></div>
                <p className="text-sm leading-relaxed">Monitor inventory levels instantly with live tracking and smart alerts</p>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 bg-white rounded-full flex-shrink-0 mt-2"></div>
                <p className="text-sm leading-relaxed">Make data-driven decisions with comprehensive analytics and insights</p>
              </div>
            </div>
          </div>

          {/* Testimonials Carousel */}
          <div className="pt-5 border-t border-white/20">
            <h3 className="text-base font-semibold text-white mb-4">What our customers say</h3>
            
            <div className="relative">
              {/* Testimonial Card */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 flex flex-col">
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-3.5 h-3.5 text-yellow-300 fill-current" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                </div>
                <p className="text-blue-50 mb-2 italic text-sm leading-relaxed">
                  "{testimonials[currentTestimonial].quote}"
                </p>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
                    {testimonials[currentTestimonial].initials}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-white text-sm truncate">{testimonials[currentTestimonial].author}</p>
                    <p className="text-xs text-blue-200 truncate">{testimonials[currentTestimonial].role}</p>
                  </div>
                </div>
              </div>

              {/* Carousel Controls */}
              <div className="flex items-center justify-between mt-3">
                {/* Dots Indicator */}
                <div className="flex items-center gap-1.5">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentTestimonial(index)}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-300",
                        index === currentTestimonial
                          ? "w-6 bg-white"
                          : "w-1.5 bg-white/40 hover:bg-white/60"
                      )}
                      aria-label={`Go to testimonial ${index + 1}`}
                    />
                  ))}
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={prevTestimonial}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all duration-200"
                    aria-label="Previous testimonial"
                  >
                    <ChevronLeft className="w-4 h-4 text-white" />
                  </button>
                  <button
                    onClick={nextTestimonial}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all duration-200"
                    aria-label="Next testimonial"
                  >
                    <ChevronRight className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Payment Plans */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white overflow-y-auto">
        <div className="w-full max-w-4xl">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Choose Your Payment Plan
            </h2>
            <p className="text-gray-600">
              Select the plan that best fits your business needs
            </p>
          </div>

          {/* Payment Plan Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {paymentPlans.map((plan) => (
              <Card
                key={plan.id}
                className={cn(
                  "p-6 cursor-pointer transition-all duration-200 relative flex flex-col",
                  selectedPlan === plan.id
                    ? 'border-blue-500 border-2 bg-blue-50 shadow-lg'
                    : plan.popular
                    ? 'border-blue-300 border-2 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                )}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <div className="mb-2">
                    <span className="text-3xl font-bold text-gray-900">
                      {plan.price}
                    </span>
                    <span className="text-sm text-gray-600 ml-1">
                      {plan.period}
                    </span>
                  </div>
                </div>

                <ul className="space-y-3 flex-1">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-4 w-4 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700 leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-end gap-4">
            <Button
              variant="outline"
              onClick={handleGoBack}
              className="px-6 h-10"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Go back
            </Button>
            <Button
              onClick={handleContinue}
              disabled={!selectedPlan || isLoading}
              className="px-6 h-10 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? 'Processing...' : 'Continue to Marketplace'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
