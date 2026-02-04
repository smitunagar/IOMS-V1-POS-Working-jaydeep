"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { useAuth } from '@/features/auth/AuthContext';
import { useToast } from '@/shared/hooks/use-toast';
import Link from 'next/link';
import { Loader2, Mail, Lock, Eye, EyeOff, User, Phone, ChevronLeft, ChevronRight, ArrowRight, Building2, MapPin, Check, CreditCard, ChevronDown, Star, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

// Testimonial Data for each step
const testimonials = {
  1: {
    quote: "The analytics dashboard gives us insights we never had before. Our operations are more efficient and profitable.",
    author: "James Davis",
    role: "Operations Manager",
    initials: "JD",
    color: "bg-[#7C3AED]" // Purple
  },
  2: {
    quote: "IOMS has transformed how we manage our restaurant. The inventory tracking is incredible and has saved us thousands in waste reduction.",
    author: "Sarah Martinez",
    role: "Restaurant Owner",
    initials: "SM",
    color: "bg-[#6366f1]" // Indigo
  },
  3: {
    quote: "Setting up our multiple locations was effortless. The centralized control saved me hours of administrative work every week.",
    author: "Michael Ross",
    role: "Franchise Director",
    initials: "MR",
    color: "bg-emerald-500" 
  },
  4: {
    quote: "The predictive ordering feature alone has paid for the subscription ten times over. It's like having a dedicated purchasing manager.",
    author: "Elena Rodriguez",
    role: "Head Chef",
    initials: "ER",
    color: "bg-orange-500"
  },
  5: {
    quote: "Best investment we've made. The real-time data helps us make better decisions every single day.",
    author: "Emily Chen",
    role: "General Manager",
    initials: "EC",
    color: "bg-indigo-500"
  }
};

type SignupStep = 'user' | 'password' | 'restaurantAddress' | 'restaurantInfo' | 'businessType' | 'paymentPlan';

const restaurantTypes = [
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

const businessTypes = [
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

const paymentPlans = [
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

const plans = [
  {
    id: 'Basic',
    price: '$29',
    period: 'per month',
    features: ['Single Location', 'Basic Inventory', 'Standard Support'],
    planId: 'basic'
  },
  {
    id: 'Professional',
    price: '$79',
    period: 'per month',
    features: ['Multi-Location (up to 3)', 'Advanced Analytics', 'Priority Support', 'AI Forecasting'],
    planId: 'professional'
  },
  {
    id: 'Enterprise',
    price: '$199',
    period: 'per month',
    features: ['Unlimited Locations', 'Custom API Access', 'Dedicated Account Manager', 'White Labeling'],
    planId: 'enterprise'
  }
];

export default function SignupPage() {
  const [currentStep, setCurrentStep] = useState<SignupStep>('user');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Restaurant info
  const [restaurantName, setRestaurantName] = useState('');
  const [addressStreet, setAddressStreet] = useState('');
  const [addressCity, setAddressCity] = useState('');
  const [addressState, setAddressState] = useState('');
  const [addressZip, setAddressZip] = useState('');
  const [addressCountry, setAddressCountry] = useState('');
  const [restaurantPhone, setRestaurantPhone] = useState('');
  const [restaurantEmail, setRestaurantEmail] = useState('');
  const [taxId, setTaxId] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [cuisineType, setCuisineType] = useState('');
  
  // Business type
  const [selectedBusinessType, setSelectedBusinessType] = useState<string>('');
  
  // Payment plan
  const [selectedPaymentPlan, setSelectedPaymentPlan] = useState<string>('professional');
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  
  const [error, setError] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  
  const { signup, isLoading: authIsLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  // Get current step number for testimonial
  const getStepNumber = (): number => {
    switch (currentStep) {
      case 'user': return 1;
      case 'password': return 2;
      case 'restaurantAddress': return 3;
      case 'restaurantInfo': return 4;
      case 'businessType': return 5;
      case 'paymentPlan': return 6;
      default: return 1;
    }
  };

  const currentTestimonial = testimonials[getStepNumber() as keyof typeof testimonials] || testimonials[1];

  // Load saved signup data from localStorage when component mounts
  // Only load if user is in the middle of signup (not after successful account creation)
  useEffect(() => {
    const savedSignupData = localStorage.getItem('signupData');
    if (savedSignupData) {
      try {
        const parsedData = JSON.parse(savedSignupData);
        
        // Check if this is a completed signup (has all required fields including paymentPlan)
        // If account was created, the data should have been cleared, but check anyway
        const isCompletedSignup = parsedData.paymentPlan && parsedData.email && parsedData.password;
        
        if (!isCompletedSignup) {
          // Only restore data if signup is in progress (not completed)
          setName(parsedData.name || '');
          setEmail(parsedData.email || '');
          setPassword(parsedData.password || '');
          setPhone(parsedData.phone || '');
          setRestaurantName(parsedData.restaurantName || '');
          setAddressStreet(parsedData.addressStreet || '');
          setAddressCity(parsedData.addressCity || '');
          setAddressState(parsedData.addressState || '');
          setAddressZip(parsedData.addressZip || '');
          setAddressCountry(parsedData.addressCountry || '');
          setRestaurantPhone(parsedData.restaurantPhone || '');
          setRestaurantEmail(parsedData.restaurantEmail || '');
          setTaxId(parsedData.taxId || '');
          setWebsiteUrl(parsedData.websiteUrl || '');
          setCuisineType(parsedData.cuisineType || '');
          setSelectedBusinessType(parsedData.restaurantType || '');
          setSelectedPaymentPlan(parsedData.paymentPlan || '');
          
          // Determine current step based on saved data
          if (parsedData.paymentPlan) {
            setCurrentStep('paymentPlan');
          } else if (parsedData.restaurantType) {
            setCurrentStep('businessType');
          } else if (parsedData.cuisineType || parsedData.taxId || parsedData.websiteUrl) {
            setCurrentStep('restaurantInfo');
          } else if (parsedData.restaurantName || parsedData.addressStreet) {
            setCurrentStep('restaurantAddress');
          } else if (parsedData.password) {
            setCurrentStep('password');
          }
        } else {
          // If signup appears completed, clear the data and start fresh
          localStorage.removeItem('signupData');
          setCurrentStep('user');
        }
      } catch (error) {
        console.error('[Signup] Error parsing saved signup data:', error);
        // Clear invalid data
        localStorage.removeItem('signupData');
        setCurrentStep('user');
      }
    }
  }, []);

  const handleUserInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate required fields
    if (!name.trim()) {
      setError("Full name is required.");
      return;
    }
    
    if (!email) {
      setError("Email address is required.");
      return;
    }
    
    // Save user data and move to password step
    const signupData = {
      name,
      email,
      password: password || '',
      phone: phone || '',
      restaurantName: restaurantName || '',
      addressStreet: addressStreet || '',
      addressCity: addressCity || '',
      addressState: addressState || '',
      addressZip: addressZip || '',
      addressCountry: addressCountry || '',
      restaurantPhone: restaurantPhone || '',
      restaurantEmail: restaurantEmail || '',
      taxId: taxId || '',
      websiteUrl: websiteUrl || '',
      cuisineType: cuisineType || ''
    };
    
    localStorage.setItem('signupData', JSON.stringify(signupData));
    setCurrentStep('password');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate password fields
    if (!password) {
      setError("Password is required.");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    
    // Check if password contains at least one number (API requirement)
    if (!/\d/.test(password)) {
      setError("Password must contain at least one number.");
      return;
    }
    
    // Save password data and move to restaurant step
    const signupData = {
      name,
      email,
      password,
      phone: phone || '',
      restaurantName: restaurantName || '',
      addressStreet: addressStreet || '',
      addressCity: addressCity || '',
      addressState: addressState || '',
      addressZip: addressZip || '',
      addressCountry: addressCountry || '',
      restaurantPhone: restaurantPhone || '',
      restaurantEmail: restaurantEmail || '',
      taxId: taxId || '',
      websiteUrl: websiteUrl || '',
      cuisineType: cuisineType || ''
    };
    
    localStorage.setItem('signupData', JSON.stringify(signupData));
    setCurrentStep('restaurantAddress');
  };

  const handleRestaurantAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate required fields
    if (!restaurantName.trim()) {
      setError("Restaurant name is required.");
      return;
    }
    
    if (!addressStreet.trim()) {
      setError("Street address is required.");
      return;
    }
    
    if (!addressCity.trim()) {
      setError("City is required.");
      return;
    }
    
    if (!addressState.trim()) {
      setError("State is required.");
      return;
    }
    
    if (!addressZip.trim()) {
      setError("ZIP code is required.");
      return;
    }
    
    if (!addressCountry.trim()) {
      setError("Country is required.");
      return;
    }
    
    // Save restaurant address data and move to restaurant info step
    const signupData = {
      name,
      email,
      password,
      phone: phone || '',
      restaurantName,
      addressStreet,
      addressCity,
      addressState,
      addressZip,
      addressCountry,
      restaurantPhone: restaurantPhone || '',
      restaurantEmail: restaurantEmail || '',
      taxId: taxId || '',
      websiteUrl: websiteUrl || '',
      cuisineType: cuisineType || '',
      restaurantType: selectedBusinessType || ''
    };
    
    localStorage.setItem('signupData', JSON.stringify(signupData));
    setCurrentStep('restaurantInfo');
  };

  const handleRestaurantInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // All fields are optional, so no validation needed
    // Save restaurant info data and move to business type step
    const signupData = {
      name,
      email,
      password,
      phone: phone || '',
      restaurantName,
      addressStreet,
      addressCity,
      addressState,
      addressZip,
      addressCountry,
      restaurantPhone: restaurantPhone || '',
      restaurantEmail: restaurantEmail || '',
      taxId: taxId || '',
      websiteUrl: websiteUrl || '',
      cuisineType: cuisineType || '',
      restaurantType: selectedBusinessType || ''
    };
    
    localStorage.setItem('signupData', JSON.stringify(signupData));
    setCurrentStep('businessType');
  };

  const handleBusinessTypeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!selectedBusinessType) {
      setError("Please select a business type.");
      return;
    }
    
    // Save business type data and move to payment plan step
    const signupData = {
      name,
      email,
      password,
      phone: phone || '',
      restaurantName,
      addressStreet,
      addressCity,
      addressState,
      addressZip,
      addressCountry,
      restaurantPhone: restaurantPhone || '',
      restaurantEmail: restaurantEmail || '',
      taxId: taxId || '',
      websiteUrl: websiteUrl || '',
      cuisineType: cuisineType || '',
      restaurantType: selectedBusinessType,
      paymentPlan: selectedPaymentPlan || ''
    };
    
    localStorage.setItem('signupData', JSON.stringify(signupData));
    setCurrentStep('paymentPlan');
  };

  const handlePaymentPlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!selectedPaymentPlan) {
      setError("Please select a payment plan.");
      return;
    }
    
    setIsSigningUp(true);
    
    try {
      // Save all signup data to localStorage first
      const signupData = {
        name,
        email,
        password,
        phone: phone || '',
        restaurantName,
        addressStreet,
        addressCity,
        addressState,
        addressZip,
        addressCountry,
        restaurantPhone: restaurantPhone || '',
        restaurantEmail: restaurantEmail || '',
        taxId: taxId || '',
        websiteUrl: websiteUrl || '',
        cuisineType: cuisineType || '',
        restaurantType: selectedBusinessType,
        paymentPlan: selectedPaymentPlan
      };
      
      console.log('[Signup] Saving signup data to localStorage:', { email, restaurantName });
      localStorage.setItem('signupData', JSON.stringify(signupData));
      
      // Verify data was saved
      const savedData = localStorage.getItem('signupData');
      if (!savedData) {
        throw new Error('Failed to save signup data to localStorage');
      }
      console.log('[Signup] Data saved successfully to localStorage');
      
      // Call the signup API directly to get better error messages
      // Build payload - only include phone if it's valid
      const signupPayload: Record<string, string> = {
        name: name.trim(),
        email: email.trim(), 
        password: password
      };
      
      // Only add phone if it's provided, not empty, and valid
      // Check if phone exists and has actual content (not just whitespace)
      const phoneValue = phone?.trim() || '';
      if (phoneValue !== '') {
        // Clean the phone number (remove spaces, dashes, parentheses) before sending
        const cleanPhone = phoneValue.replace(/[\s\-\(\)]/g, '').trim();
        // Validate phone format: must start with + or 1-9, then 0-15 more digits
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (cleanPhone !== '' && phoneRegex.test(cleanPhone)) {
          signupPayload.phone = cleanPhone;
        } else {
          // Phone was provided but invalid format
          setError("Please enter a valid phone number or leave it empty.");
          setIsSigningUp(false);
          return;
        }
      }
      // If phone is empty/undefined/null, don't include it in payload at all
      
      // Add restaurant information if provided
      if (restaurantName && addressStreet && addressCity && addressState && addressZip && addressCountry) {
        signupPayload.restaurantName = restaurantName.trim();
        signupPayload.addressStreet = addressStreet.trim();
        signupPayload.addressCity = addressCity.trim();
        signupPayload.addressState = addressState.trim();
        signupPayload.addressZip = addressZip.trim();
        signupPayload.addressCountry = addressCountry.trim();
        
        // Add optional restaurant fields if provided
        if (restaurantPhone?.trim()) {
          signupPayload.restaurantPhone = restaurantPhone.trim();
        }
        if (restaurantEmail?.trim()) {
          signupPayload.restaurantEmail = restaurantEmail.trim();
        }
        if (taxId?.trim()) {
          signupPayload.taxId = taxId.trim();
        }
        if (websiteUrl?.trim()) {
          signupPayload.websiteUrl = websiteUrl.trim();
        }
        if (cuisineType?.trim()) {
          signupPayload.cuisineType = cuisineType.trim();
        }
        if (selectedBusinessType?.trim()) {
          signupPayload.restaurantType = selectedBusinessType.trim();
        }
      }
      
      console.log('[Signup] Calling signup API with payload:', { 
        email: signupPayload.email, 
        name: signupPayload.name, 
        hasPhone: 'phone' in signupPayload,
        phone: signupPayload.phone || 'not included',
        payloadKeys: Object.keys(signupPayload),
        originalPhone: phone,
        phoneValue: phoneValue
      });
      
      try {
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(signupPayload),
        });
        
        const data = await response.json();
        console.log('[Signup] API response:', { status: response.status, data });
        
        if (response.ok && data.success) {
          console.log('[Signup] Account created successfully, clearing form data');
          
          // Clear all form data from localStorage
          localStorage.removeItem('signupData');
          
          // Reset all form states
          setName('');
          setEmail('');
          setPassword('');
          setConfirmPassword('');
          setPhone('');
          setRestaurantName('');
          setAddressStreet('');
          setAddressCity('');
          setAddressState('');
          setAddressZip('');
          setAddressCountry('');
          setRestaurantPhone('');
          setRestaurantEmail('');
          setTaxId('');
          setWebsiteUrl('');
          setCuisineType('');
          setSelectedBusinessType('');
          setSelectedPaymentPlan('');
          setCurrentStep('user');
          setError('');
          
          console.log('[Signup] Form cleared, redirecting to login');
          // Account created successfully, redirect to login
          router.push('/login');
        } else {
          console.error('[Signup] Signup failed:', data.error || 'Unknown error');
          setError(data.error || "Failed to create account. Please try again.");
          setIsSigningUp(false);
        }
      } catch (fetchError) {
        console.error('[Signup] Error calling signup API:', fetchError);
        setError("Failed to create account. Please check your connection and try again.");
        setIsSigningUp(false);
      }
    } catch (error) {
      console.error('[Signup] Error during signup:', error);
      setError(error instanceof Error ? error.message : "An error occurred. Please try again.");
      setIsSigningUp(false);
    }
  };
  
  if (authIsLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const stepNumber = getStepNumber();

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white font-sans text-wm-blue">
      {/* Left Side - Branding & Dynamic Testimonial */}
      <div className="lg:w-1/2 bg-wm-blue relative overflow-hidden flex flex-col justify-between p-8 lg:p-16 text-white min-h-[40vh] lg:min-h-screen transition-all duration-500">
        {/* Background Grid & Effects */}
        <div 
          className="absolute inset-0 z-0 opacity-10" 
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}
        />
        <div className="absolute top-0 right-0 w-[80%] h-full bg-gradient-to-l from-wm-teal/10 to-transparent pointer-events-none z-0" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#2A9D8F] rounded-full blur-[100px] pointer-events-none z-0 mix-blend-soft-light opacity-20" />

        {/* Brand Content */}
        <div className="relative z-10 space-y-6 mt-8 lg:mt-0">
          <div>
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <h1 className="font-headline font-black text-4xl lg:text-5xl tracking-tight mb-2">IOMS</h1>
            </Link>
            <p className="font-headline font-medium text-xl opacity-90">Intelligent Operations Management System</p>
        </div>
        
          <ul className="space-y-4 mt-8">
            <li className="flex items-start gap-3">
              <div className="mt-1 w-1.5 h-1.5 rounded-full bg-wm-teal" />
              <span className="text-sm lg:text-base font-light opacity-80">Optimize operations with intelligent automation and seamless workflows</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="mt-1 w-1.5 h-1.5 rounded-full bg-wm-teal" />
              <span className="text-sm lg:text-base font-light opacity-80">Monitor inventory levels instantly with live tracking and smart alerts</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="mt-1 w-1.5 h-1.5 rounded-full bg-wm-teal" />
              <span className="text-sm lg:text-base font-light opacity-80">Make data-driven decisions with comprehensive analytics and insights</span>
            </li>
          </ul>
          </div>

        {/* Dynamic Testimonial Section */}
        <div className="relative z-10 mt-12 lg:mt-0">
          <h3 className="font-headline font-bold text-lg mb-4">What our customers say</h3>
          
          {/* Glass Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-6 relative overflow-hidden shadow-2xl transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 pointer-events-none" />
            
            <div className="flex gap-1 text-yellow-400 mb-3">
              <Star size={16} fill="currentColor" />
              <Star size={16} fill="currentColor" />
              <Star size={16} fill="currentColor" />
              <Star size={16} fill="currentColor" />
              <Star size={16} fill="currentColor" />
                </div>
            
            <p className="text-sm lg:text-base italic font-light mb-6 leading-relaxed min-h-[48px]">
              "{currentTestimonial.quote}"
            </p>

            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full ${currentTestimonial.color} flex items-center justify-center text-xs font-bold font-headline uppercase transition-colors duration-500`}>
                {currentTestimonial.initials}
                  </div>
              <div>
                <div className="font-bold text-sm">{currentTestimonial.author}</div>
                <div className="text-xs opacity-70">{currentTestimonial.role}</div>
                  </div>
                </div>
              </div>

          {/* Carousel Indicators */}
          <div className="flex items-center gap-4 mt-6">
            <div className="flex gap-2">
              <div className={`w-2 h-2 rounded-full bg-white ${stepNumber === 1 ? '' : 'opacity-50'}`} />
              <div className={`w-2 h-2 rounded-full bg-white ${stepNumber === 2 ? '' : 'opacity-50'}`} />
              <div className={`w-2 h-2 rounded-full bg-white ${stepNumber === 3 ? '' : 'opacity-50'}`} />
              <div className={`w-2 h-2 rounded-full bg-white ${stepNumber === 4 ? '' : 'opacity-50'}`} />
              <div className={`w-2 h-2 rounded-full bg-white ${stepNumber === 5 ? '' : 'opacity-50'}`} />
              <div className={`w-2 h-2 rounded-full bg-white ${stepNumber === 6 ? '' : 'opacity-50'}`} />
                </div>
            <div className="ml-auto flex gap-2">
                  <button
                onClick={() => {
                  const prevStep = Math.max(1, stepNumber - 1);
                  const stepMap: Record<number, SignupStep> = { 1: 'user', 2: 'password', 3: 'restaurantAddress', 4: 'restaurantInfo', 5: 'businessType', 6: 'paymentPlan' };
                  setCurrentStep(stepMap[prevStep] || 'user');
                }} 
                className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <ChevronLeft size={16} />
                  </button>
                  <button
                onClick={() => {
                  const nextStep = Math.min(6, stepNumber + 1);
                  const stepMap: Record<number, SignupStep> = { 1: 'user', 2: 'password', 3: 'restaurantAddress', 4: 'restaurantInfo', 5: 'businessType', 6: 'paymentPlan' };
                  setCurrentStep(stepMap[nextStep] || 'paymentPlan');
                }} 
                className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>

        {/* Bottom Logo */}
        <div className="absolute bottom-8 left-8 hidden lg:block">
          <div 
            className="w-10 h-10 bg-black/30 rounded-full flex items-center justify-center border border-white/10 text-white font-serif font-bold cursor-pointer hover:bg-black/50 transition-colors" 
            onClick={() => router.push('/login')}
          >
            W
          </div>
        </div>
      </div>

      {/* Right Side - Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative overflow-y-auto">
        <button 
          onClick={() => router.push('/login')}
          className="absolute top-6 left-6 text-gray-400 hover:text-wm-blue lg:hidden"
        >
          <ChevronLeft size={24} />
        </button>

        <div className="w-full max-w-lg space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h2 className="font-headline font-bold text-3xl text-wm-blue">
              {currentStep === 'user' && 'Create an account'}
              {currentStep === 'password' && 'Set your password'}
              {currentStep === 'restaurantAddress' && 'Restaurant Address'}
              {currentStep === 'restaurantInfo' && 'Restaurant Information'}
              {currentStep === 'businessType' && 'Select Your Business Type'}
              {currentStep === 'paymentPlan' && 'Choose Your Payment Plan'}
            </h2>
            <p className="text-gray-500 text-sm">
              {currentStep === 'user' && 'Sign up to get started with IOMS'}
              {currentStep === 'password' && 'Create a secure password for your account'}
              {currentStep === 'restaurantAddress' && 'Enter your restaurant address details'}
              {currentStep === 'restaurantInfo' && 'Additional restaurant information (optional)'}
              {currentStep === 'businessType' && 'Choose the configuration that best matches your business'}
              {currentStep === 'paymentPlan' && 'Select the plan that best fits your business needs'}
            </p>
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-2 text-xs font-medium text-gray-400 overflow-x-auto pb-2 scrollbar-hide">
            <div className={`flex items-center gap-2 min-w-fit ${stepNumber >= 1 ? 'text-wm-blue font-bold' : ''}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center ${stepNumber >= 1 ? 'bg-blue-100 text-wm-blue' : 'bg-gray-200'}`}>1</span>
              <span>User</span>
              </div>
            <ChevronRight size={12} />
            <div className={`flex items-center gap-2 min-w-fit ${stepNumber >= 2 ? 'text-wm-blue font-bold' : ''}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center ${stepNumber >= 2 ? 'bg-blue-100 text-wm-blue' : 'bg-gray-200'}`}>2</span>
              <span>Password</span>
            </div>
            <ChevronRight size={12} />
            <div className={`flex items-center gap-2 min-w-fit ${stepNumber >= 3 ? 'text-wm-blue font-bold' : ''}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center ${stepNumber >= 3 ? 'bg-blue-100 text-wm-blue' : 'bg-gray-200'}`}>3</span>
              <span>Address</span>
              </div>
            <ChevronRight size={12} />
            <div className={`flex items-center gap-2 min-w-fit ${stepNumber >= 4 ? 'text-wm-blue font-bold' : ''}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center ${stepNumber >= 4 ? 'bg-blue-100 text-wm-blue' : 'bg-gray-200'}`}>4</span>
              <span>Info</span>
            </div>
            <ChevronRight size={12} />
            <div className={`flex items-center gap-2 min-w-fit ${stepNumber >= 5 ? 'text-wm-blue font-bold' : ''}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center ${stepNumber >= 5 ? 'bg-blue-100 text-wm-blue' : 'bg-gray-200'}`}>5</span>
              <span>Business</span>
              </div>
            <ChevronRight size={12} />
            <div className={`flex items-center gap-2 min-w-fit ${stepNumber >= 6 ? 'text-wm-blue font-bold' : ''}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center ${stepNumber >= 6 ? 'bg-wm-blue text-white' : 'bg-gray-200'}`}>6</span>
              <span>Plan</span>
            </div>
          </div>

          {/* STEP 1: USER INFO */}
          {currentStep === 'user' && (
            <form onSubmit={handleUserInfoSubmit} className="space-y-5 animate-in fade-in slide-in-from-right duration-300">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Full Name</label>
                <div className="relative">
                  <input 
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={cn(
                      "w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:border-wm-blue focus:ring-4 focus:ring-wm-blue/10 outline-none transition-all text-sm",
                      error && "border-red-500 focus:border-red-500 focus:ring-red-500/10"
                    )}
                    placeholder="Enter your full name"
                    required
                    autoComplete="name"
                  />
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Email Address</label>
                <div className="relative">
                  <input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={cn(
                      "w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:border-wm-blue focus:ring-4 focus:ring-wm-blue/10 outline-none transition-all text-sm",
                      error && "border-red-500 focus:border-red-500 focus:ring-red-500/10"
                    )}
                    placeholder="Enter your email"
                    required
                    autoComplete="email"
                  />
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Phone Number <span className="text-gray-400 font-normal">(Optional)</span></label>
                <div className="relative">
                  <input 
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:border-wm-blue focus:ring-4 focus:ring-wm-blue/10 outline-none transition-all text-sm"
                    placeholder="Enter phone number"
                    autoComplete="tel"
                  />
                  <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="pt-4">
                <button 
                type="submit"
                disabled={isSigningUp || authIsLoading}
                  className="w-full bg-wm-blue hover:bg-blue-800 text-white font-bold py-3.5 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  Next: Set Password <ArrowRight size={18} />
                </button>
              </div>
              
              <div className="text-center text-sm text-gray-500 pt-2">
                Already have an account? <Link href="/login" className="font-bold text-wm-blue hover:text-blue-800">Sign in</Link>
              </div>
            </form>
          )}

          {/* STEP 2: PASSWORD */}
          {currentStep === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-5 animate-in fade-in slide-in-from-right duration-300">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={cn(
                      "w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-lg focus:border-wm-blue focus:ring-4 focus:ring-wm-blue/10 outline-none transition-all text-sm",
                      error && "border-red-500 focus:border-red-500 focus:ring-red-500/10"
                    )}
                    placeholder="Enter your password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500">Must be at least 8 characters</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Confirm Password</label>
                <div className="relative">
                  <input 
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={cn(
                      "w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-lg focus:border-wm-blue focus:ring-4 focus:ring-wm-blue/10 outline-none transition-all text-sm",
                      error && "border-red-500 focus:border-red-500 focus:ring-red-500/10"
                    )}
                    placeholder="Confirm your password"
                    required
                    autoComplete="new-password"
                  />
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setCurrentStep('user')}
                  className="w-1/3 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold py-3.5 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <ChevronLeft size={18} /> Back
                </button>
                <button 
                  type="submit"
                  disabled={isSigningUp || authIsLoading}
                  className="w-2/3 bg-wm-blue hover:bg-blue-800 text-white font-bold py-3.5 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  Next: Restaurant Address <ArrowRight size={18} />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: RESTAURANT ADDRESS */}
          {currentStep === 'restaurantAddress' && (
            <form onSubmit={handleRestaurantAddressSubmit} className="space-y-5 animate-in fade-in slide-in-from-right duration-300">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Restaurant Name</label>
                <div className="relative">
                  <input 
                    type="text"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    className={cn(
                      "w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:border-wm-blue focus:ring-4 focus:ring-wm-blue/10 outline-none transition-all text-sm",
                      error && "border-red-500 focus:border-red-500 focus:ring-red-500/10"
                    )}
                    placeholder="Enter restaurant name"
                    required
                  />
                  <Building2 size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Street Address</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={addressStreet}
                    onChange={(e) => setAddressStreet(e.target.value)}
                    className={cn(
                      "w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:border-wm-blue focus:ring-4 focus:ring-wm-blue/10 outline-none transition-all text-sm",
                      error && "border-red-500 focus:border-red-500 focus:ring-red-500/10"
                    )}
                    placeholder="Enter street address"
                    required
                  />
                  <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">City</label>
                <div className="relative">
                    <input 
                    type="text"
                      value={addressCity}
                      onChange={(e) => setAddressCity(e.target.value)}
                      className={cn(
                        "w-full pl-4 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:border-wm-blue focus:ring-4 focus:ring-wm-blue/10 outline-none transition-all text-sm",
                        error && "border-red-500 focus:border-red-500 focus:ring-red-500/10"
                      )}
                      placeholder="Enter city"
                    required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">State</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={addressState}
                      onChange={(e) => setAddressState(e.target.value)}
                    className={cn(
                        "w-full pl-4 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:border-wm-blue focus:ring-4 focus:ring-wm-blue/10 outline-none transition-all text-sm",
                        error && "border-red-500 focus:border-red-500 focus:ring-red-500/10"
                    )}
                      placeholder="Enter state"
                      required
                  />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">ZIP Code</label>
                <div className="relative">
                    <input 
                      type="text" 
                      value={addressZip}
                      onChange={(e) => setAddressZip(e.target.value)}
                      className={cn(
                        "w-full pl-4 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:border-wm-blue focus:ring-4 focus:ring-wm-blue/10 outline-none transition-all text-sm",
                        error && "border-red-500 focus:border-red-500 focus:ring-red-500/10"
                      )}
                      placeholder="Enter ZIP code"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Country</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={addressCountry}
                      onChange={(e) => setAddressCountry(e.target.value)}
                      className={cn(
                        "w-full pl-4 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:border-wm-blue focus:ring-4 focus:ring-wm-blue/10 outline-none transition-all text-sm",
                        error && "border-red-500 focus:border-red-500 focus:ring-red-500/10"
                      )}
                      placeholder="Enter country"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setCurrentStep('password')}
                  className="w-1/3 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold py-3.5 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <ChevronLeft size={18} /> Back
                </button>
                <button 
                  type="submit" 
                  disabled={isSigningUp || authIsLoading}
                  className="w-2/3 bg-wm-blue hover:bg-blue-800 text-white font-bold py-3.5 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  Next: Restaurant Information <ArrowRight size={18} />
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: RESTAURANT INFO */}
          {currentStep === 'restaurantInfo' && (
            <form onSubmit={handleRestaurantInfoSubmit} className="space-y-5 animate-in fade-in slide-in-from-right duration-300">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Restaurant Phone <span className="text-gray-400 font-normal">(Optional)</span></label>
                <div className="relative">
                  <input 
                    type="tel"
                    value={restaurantPhone}
                    onChange={(e) => setRestaurantPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:border-wm-blue focus:ring-4 focus:ring-wm-blue/10 outline-none transition-all text-sm"
                    placeholder="Enter phone number"
                  />
                  <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Restaurant Email <span className="text-gray-400 font-normal">(Optional)</span></label>
                <div className="relative">
                  <input 
                    type="email"
                    value={restaurantEmail}
                    onChange={(e) => setRestaurantEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:border-wm-blue focus:ring-4 focus:ring-wm-blue/10 outline-none transition-all text-sm"
                    placeholder="Enter email"
                  />
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Tax ID <span className="text-gray-400 font-normal">(Optional)</span></label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    className="w-full pl-4 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:border-wm-blue focus:ring-4 focus:ring-wm-blue/10 outline-none transition-all text-sm"
                    placeholder="Enter tax ID"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Website URL <span className="text-gray-400 font-normal">(Optional)</span></label>
                <div className="relative">
                  <input 
                    type="url" 
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    className="w-full pl-4 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:border-wm-blue focus:ring-4 focus:ring-wm-blue/10 outline-none transition-all text-sm"
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Cuisine Type <span className="text-gray-400 font-normal">(Optional)</span></label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={cuisineType}
                    onChange={(e) => setCuisineType(e.target.value)}
                    className="w-full pl-4 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:border-wm-blue focus:ring-4 focus:ring-wm-blue/10 outline-none transition-all text-sm"
                    placeholder="e.g., Italian, Mexican, Asian, etc."
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setCurrentStep('restaurantAddress')}
                  className="w-1/3 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold py-3.5 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <ChevronLeft size={18} /> Back
                </button>
                <button 
                  type="submit"
                  disabled={isSigningUp || authIsLoading}
                  className="w-2/3 bg-wm-blue hover:bg-blue-800 text-white font-bold py-3.5 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  Next: Business Type <ArrowRight size={18} />
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: BUSINESS TYPE */}
          {currentStep === 'businessType' && (
            <form onSubmit={handleBusinessTypeSubmit} className="space-y-5 animate-in fade-in slide-in-from-right duration-300">
              <div className="grid grid-cols-1 gap-3">
                {businessTypes.map((type) => (
                  <div
                    key={type.id}
                    className={cn(
                      "p-4 rounded-lg border-2 cursor-pointer transition-all duration-200",
                      selectedBusinessType === type.id
                        ? 'border-wm-blue bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    )}
                    onClick={() => setSelectedBusinessType(type.id)}
                  >
                    <h3 className="text-base font-semibold text-gray-900 mb-1">
                      {type.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {type.description}
                    </p>
                  </div>
                ))}
              </div>

              {/* Error Message */}
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setCurrentStep('restaurantInfo')}
                  className="w-1/3 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold py-3.5 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <ChevronLeft size={18} /> Back
                </button>
                <button 
                  type="submit"
                  disabled={!selectedBusinessType || isSigningUp || authIsLoading}
                  className="w-2/3 bg-wm-blue hover:bg-blue-800 text-white font-bold py-3.5 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  Next: Payment Plan <ArrowRight size={18} />
                </button>
              </div>
            </form>
          )}

          {/* STEP 5: PAYMENT PLAN */}
          {currentStep === 'paymentPlan' && (
            <form onSubmit={handlePaymentPlanSubmit} className="space-y-5 animate-in fade-in slide-in-from-right duration-300">
              <div className="grid grid-cols-1 gap-3">
                {plans.map((plan) => {
                  const isExpanded = expandedPlan === plan.id;
                  const isSelected = selectedPaymentPlan === (plan.planId || plan.id.toLowerCase());
                  
                  const togglePlanDetails = (e: React.MouseEvent) => {
                    e.stopPropagation();
                    setExpandedPlan(isExpanded ? null : plan.id);
                  };
                  
                  return (
                    <div
                      key={plan.id}
                      className={cn(
                        "rounded-lg border-2 transition-all duration-200 relative overflow-hidden cursor-pointer",
                        isSelected
                          ? 'border-wm-blue bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                      onClick={() => {
                        setSelectedPaymentPlan(plan.planId || plan.id.toLowerCase());
                      }}
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-semibold text-gray-900">
                              {plan.id}
                              </h3>
                              {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-wm-blue flex items-center justify-center flex-shrink-0">
                                <Check className="h-3 w-3 text-white" />
                                </div>
                              )}
                          </div>
                          <button
                            type="button"
                            onClick={togglePlanDetails}
                            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
                          >
                            <span>{isExpanded ? 'Hide' : 'View'}</span>
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </div>
                        <div className="flex items-baseline gap-1 mb-2">
                          <span className="text-2xl font-bold text-gray-900">
                            {plan.price}
                          </span>
                          <span className="text-sm text-gray-600">
                            {plan.period}
                          </span>
                        </div>
                      </div>

                      {/* Collapsible Features List */}
                      <div
                        className={cn(
                          "overflow-hidden transition-all duration-300 ease-in-out",
                          isExpanded ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
                        )}
                      >
                        <div className="px-4 pb-4 border-t border-gray-200">
                          <ul className="space-y-2 pt-3">
                            {plan.features.map((feature, index) => (
                              <li key={index} className="flex items-start text-sm">
                                <Check className="h-4 w-4 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                                <span className="text-gray-700 leading-relaxed">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Error Message */}
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setCurrentStep('businessType')}
                  className="w-1/3 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold py-3.5 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <ChevronLeft size={18} /> Back
                </button>
                <button 
                  type="submit"
                  disabled={!selectedPaymentPlan || isSigningUp || authIsLoading}
                  className="w-2/3 bg-wm-blue hover:bg-blue-800 text-white font-bold py-3.5 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSigningUp || authIsLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
