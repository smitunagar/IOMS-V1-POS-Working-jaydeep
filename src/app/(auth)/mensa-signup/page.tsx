"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { useAuth } from '@/features/auth/AuthContext';
import { useToast } from '@/shared/hooks/use-toast';
import Link from 'next/link';
import { Loader2, Mail, Lock, Eye, EyeOff, User, Phone, ChevronLeft, ChevronRight, ArrowRight, Building2, MapPin, Check, CreditCard, ChevronDown, Star, ChevronUp, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

// Testimonial Data for each step
const testimonials = {
  1: {
    quote: "Mensa IOMS has revolutionized our menu management. The compliance workflows ensure we meet all regulatory requirements effortlessly.",
    author: "Dr. Maria Schmidt",
    role: "Food Service Director",
    initials: "MS",
    color: "bg-[#7C3AED]"
  },
  2: {
    quote: "The HACCP module gives us complete traceability. We can track every temperature reading and corrective action with full audit trails.",
    author: "Thomas Weber",
    role: "Quality Assurance Manager",
    initials: "TW",
    color: "bg-[#6366f1]"
  },
  3: {
    quote: "Waste tracking with KrWG compliance has helped us reduce food waste by 40% while maintaining full regulatory compliance.",
    author: "Anna Müller",
    role: "Sustainability Coordinator",
    initials: "AM",
    color: "bg-emerald-500"
  },
  4: {
    quote: "The approval workflows save us hours every week. Daily and weekly menu approvals are now seamless and fully documented.",
    author: "Klaus Fischer",
    role: "Kitchen Manager",
    initials: "KF",
    color: "bg-orange-500"
  },
  5: {
    quote: "Best enterprise solution for institutional food service. The DGE nutrition validation ensures we always meet dietary guidelines.",
    author: "Dr. Sarah Becker",
    role: "Nutrition Director",
    initials: "SB",
    color: "bg-indigo-500"
  },
  6: {
    quote: "The comprehensive platform has streamlined all our institutional operations. From menu planning to compliance reporting, everything is in one place.",
    author: "Michael Hoffmann",
    role: "Operations Director",
    initials: "MH",
    color: "bg-purple-500"
  }
};

type SignupStep = 'user' | 'password' | 'restaurantAddress' | 'restaurantInfo' | 'businessType' | 'paymentPlan';

const restaurantTypes = [
  {
    id: 'hospital',
    title: 'Hospital',
    description: 'Healthcare facility with patient meal services and dietary requirements'
  },
  {
    id: 'school',
    title: 'School / University',
    description: 'Educational institution with cafeteria and meal program management'
  },
  {
    id: 'nursing-home',
    title: 'Nursing Home / Care Facility',
    description: 'Long-term care facility with specialized dietary needs and compliance requirements'
  },
  {
    id: 'corporate',
    title: 'Corporate Cafeteria',
    description: 'Corporate dining facility with employee meal services'
  },
  {
    id: 'government',
    title: 'Government Facility',
    description: 'Government institution with food service operations'
  }
];

const businessTypes = [
  {
    id: 'hospital',
    title: 'Hospital',
    description: 'Healthcare facility with patient meal services and dietary requirements'
  },
  {
    id: 'school',
    title: 'School / University',
    description: 'Educational institution with cafeteria and meal program management'
  },
  {
    id: 'nursing-home',
    title: 'Nursing Home / Care Facility',
    description: 'Long-term care facility with specialized dietary needs and compliance requirements'
  },
  {
    id: 'corporate',
    title: 'Corporate Cafeteria',
    description: 'Corporate dining facility with employee meal services'
  },
  {
    id: 'government',
    title: 'Government Facility',
    description: 'Government institution with food service operations'
  }
];

const paymentPlans = [
  {
    id: 'professional',
    title: 'Professional',
    price: '€299',
    period: '/month',
    description: 'Perfect for single institutions',
    features: [
      'Menu Management Workflows',
      'HACCP Compliance Module',
      'Waste & KrWG Tracking',
      'Up to 3 locations',
      'Email support',
      'Standard compliance reports'
    ],
    popular: false
  },
  {
    id: 'enterprise',
    title: 'Enterprise',
    price: '€799',
    period: '/month',
    description: 'For multi-location institutions',
    features: [
      'Everything in Professional',
      'Unlimited locations',
      'Advanced analytics & reporting',
      'Priority support',
      'Custom compliance workflows',
      'API access',
      'Dedicated account manager',
      'Training & onboarding'
    ],
    popular: true
  },
  {
    id: 'custom',
    title: 'Custom',
    price: 'Custom',
    period: '',
    description: 'Tailored solution for your needs',
    features: [
      'Everything in Enterprise',
      'Custom integrations',
      'White-label options',
      'On-site training',
      '24/7 support',
      'SLA guarantees',
      'Custom development'
    ],
    popular: false
  }
];

export default function MensaSignupPage() {
  const [currentStep, setCurrentStep] = useState<SignupStep>('user');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Restaurant/Institution info
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
  const [selectedPaymentPlan, setSelectedPaymentPlan] = useState<string>('enterprise');
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

  // Load form data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('mensaSignupData');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        if (data.name) setName(data.name);
        if (data.email) setEmail(data.email);
        if (data.phone) setPhone(data.phone);
        if (data.restaurantName) setRestaurantName(data.restaurantName);
        if (data.addressStreet) setAddressStreet(data.addressStreet);
        if (data.addressCity) setAddressCity(data.addressCity);
        if (data.addressState) setAddressState(data.addressState);
        if (data.addressZip) setAddressZip(data.addressZip);
        if (data.addressCountry) setAddressCountry(data.addressCountry);
        if (data.restaurantPhone) setRestaurantPhone(data.restaurantPhone);
        if (data.restaurantEmail) setRestaurantEmail(data.restaurantEmail);
        if (data.taxId) setTaxId(data.taxId);
        if (data.websiteUrl) setWebsiteUrl(data.websiteUrl);
        if (data.cuisineType) setCuisineType(data.cuisineType);
        if (data.selectedBusinessType) setSelectedBusinessType(data.selectedBusinessType);
        if (data.selectedPaymentPlan) setSelectedPaymentPlan(data.selectedPaymentPlan);
        if (data.currentStep) setCurrentStep(data.currentStep);
      } catch (error) {
        console.error('Error loading saved signup data:', error);
      }
    }
  }, []);

  // Save form data to localStorage on change
  useEffect(() => {
    const signupData = {
      name,
      email,
      phone,
      restaurantName,
      addressStreet,
      addressCity,
      addressState,
      addressZip,
      addressCountry,
      restaurantPhone,
      restaurantEmail,
      taxId,
      websiteUrl,
      cuisineType,
      selectedBusinessType,
      selectedPaymentPlan,
      currentStep
    };
    localStorage.setItem('mensaSignupData', JSON.stringify(signupData));
  }, [name, email, phone, restaurantName, addressStreet, addressCity, addressState, addressZip, addressCountry, restaurantPhone, restaurantEmail, taxId, websiteUrl, cuisineType, selectedBusinessType, selectedPaymentPlan, currentStep]);

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    
    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters long');
      return;
    }
    
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setCurrentStep('password');
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!password) {
      setError('Please enter a password');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    if (!/\d/.test(password)) {
      setError('Password must contain at least one number');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setCurrentStep('restaurantAddress');
  };

  const handleRestaurantAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!restaurantName.trim()) {
      setError('Please enter institution name');
      return;
    }
    
    if (!addressStreet.trim()) {
      setError('Please enter street address');
      return;
    }
    
    if (!addressCity.trim()) {
      setError('Please enter city');
      return;
    }
    
    if (!addressState.trim()) {
      setError('Please enter state/province');
      return;
    }
    
    if (!addressZip.trim()) {
      setError('Please enter zip/postal code');
      return;
    }
    
    if (!addressCountry.trim()) {
      setError('Please enter country');
      return;
    }
    
    setCurrentStep('restaurantInfo');
  };

  const handleRestaurantInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCurrentStep('businessType');
  };

  const handleBusinessTypeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!selectedBusinessType) {
      setError('Please select an institution type');
      return;
    }
    
    setCurrentStep('paymentPlan');
  };

  const handlePaymentPlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!selectedPaymentPlan) {
      setError('Please select a payment plan');
      return;
    }
    
    setIsSigningUp(true);
    
    try {
      // Prepare signup payload
      const phoneValue = phone && phone.trim() !== '' ? phone.trim() : undefined;
      
      const signupPayload: any = {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: password,
        restaurantName: restaurantName.trim(),
        addressStreet: addressStreet.trim(),
        addressCity: addressCity.trim(),
        addressState: addressState.trim(),
        addressZip: addressZip.trim(),
        addressCountry: addressCountry.trim(),
        restaurantType: selectedBusinessType,
      };
      
      if (phoneValue) {
        signupPayload.phone = phoneValue;
      }
      
      if (restaurantPhone && restaurantPhone.trim() !== '') {
        signupPayload.restaurantPhone = restaurantPhone.trim();
      }
      
      if (restaurantEmail && restaurantEmail.trim() !== '') {
        signupPayload.restaurantEmail = restaurantEmail.trim();
      }
      
      if (taxId && taxId.trim() !== '') {
        signupPayload.taxId = taxId.trim();
      }
      
      if (websiteUrl && websiteUrl.trim() !== '') {
        signupPayload.websiteUrl = websiteUrl.trim();
      }
      
      if (cuisineType && cuisineType.trim() !== '') {
        signupPayload.cuisineType = cuisineType.trim();
      }
      
      try {
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(signupPayload),
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
          // Clear all form data from localStorage
          localStorage.removeItem('mensaSignupData');
          
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
          setSelectedPaymentPlan('enterprise');
          setCurrentStep('user');
          setError('');
          
          toast({
            title: "Account Created",
            description: "Your Mensa IOMS account has been created successfully!",
          });
          
          // Redirect to login with redirect to Mensa IOMS
          router.push('/login?redirect=/mensa-ioms&mensa=true');
        } else {
          setError(data.error || 'Signup failed. Please try again.');
          toast({
            title: "Signup Failed",
            description: data.error || 'An error occurred during signup',
            variant: "destructive",
          });
        }
      } catch (error: any) {
        console.error('Signup error:', error);
        setError(error.message || 'An error occurred. Please try again.');
        toast({
          title: "Error",
          description: error.message || 'An error occurred during signup',
          variant: "destructive",
        });
      }
    } finally {
      setIsSigningUp(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10" 
             style={{
               backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
               backgroundSize: '30px 30px'
             }}>
        </div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-wm-teal rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
        
        <div className="relative z-10 max-w-md text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
              <ShieldCheck className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
            <h2 className="text-3xl font-headline font-black text-white">
              Mensa IOMS
            </h2>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 mb-6">
            <div className="flex items-center gap-2 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-wm-teal text-wm-teal" />
              ))}
            </div>
            <p className="text-white/90 text-sm italic mb-4 font-sans">
              "{currentTestimonial.quote}"
            </p>
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm", currentTestimonial.color)}>
                {currentTestimonial.initials}
              </div>
              <div className="text-left">
                <p className="text-white font-bold text-sm">{currentTestimonial.author}</p>
                <p className="text-white/70 text-xs">{currentTestimonial.role}</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-2 text-left">
            <div className="flex items-center gap-2 text-white/80">
              <div className="w-2 h-2 bg-wm-teal rounded-full"></div>
              <span className="text-sm">Enterprise-grade compliance workflows</span>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <div className="w-2 h-2 bg-wm-teal rounded-full"></div>
              <span className="text-sm">HACCP & KrWG compliance built-in</span>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <div className="w-2 h-2 bg-wm-teal rounded-full"></div>
              <span className="text-sm">Multi-location support</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col justify-center p-6 lg:p-12 bg-white">
        <div className="max-w-md w-full mx-auto">
          {/* Back Button - Mobile */}
          <Link 
            href="/mensa-ioms"
            className="lg:hidden inline-flex items-center gap-2 text-wm-blue hover:text-wm-teal mb-6 font-bold text-sm transition-colors"
          >
            <ChevronLeft size={18} />
            Back
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-headline font-black text-wm-blue mb-2">
              Create Mensa Account
            </h1>
            <p className="text-gray-600">
              Step {getStepNumber()} of 6
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Step 1: User Info */}
          {currentStep === 'user' && (
            <form onSubmit={handleUserSubmit} className="space-y-5 animate-in fade-in slide-in-from-right duration-300">
              <div>
                <Label htmlFor="name" className="text-sm font-bold text-gray-700 mb-2 block">
                  Full Name *
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    required
                    className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    autoComplete="name"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email" className="text-sm font-bold text-gray-700 mb-2 block">
                  Email Address *
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone" className="text-sm font-bold text-gray-700 mb-2 block">
                  Phone Number <span className="text-gray-400 font-normal">(Optional)</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+49 123 456 7890"
                    className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    autoComplete="tel"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <Link 
                  href="/mensa-ioms"
                  className="text-wm-blue hover:text-wm-teal font-bold text-sm flex items-center gap-2"
                >
                  <ChevronLeft size={16} />
                  Back
                </Link>
                <button 
                  type="submit"
                  className="bg-wm-blue hover:bg-blue-800 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
                >
                  Next: Password
                  <ChevronRight size={18} />
                </button>
              </div>
            </form>
          )}

          {/* Step 2: Password */}
          {currentStep === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-5 animate-in fade-in slide-in-from-right duration-300">
              <div>
                <Label htmlFor="password" className="text-sm font-bold text-gray-700 mb-2 block">
                  Password *
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    required
                    className="pl-10 pr-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters with at least one number</p>
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-sm font-bold text-gray-700 mb-2 block">
                  Confirm Password *
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    required
                    className="pl-10 pr-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <button 
                  type="button"
                  onClick={() => setCurrentStep('user')}
                  className="text-wm-blue hover:text-wm-teal font-bold text-sm flex items-center gap-2"
                >
                  <ChevronLeft size={16} />
                  Back
                </button>
                <button 
                  type="submit"
                  className="bg-wm-blue hover:bg-blue-800 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
                >
                  Next: Institution Address
                  <ChevronRight size={18} />
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Restaurant Address */}
          {currentStep === 'restaurantAddress' && (
            <form onSubmit={handleRestaurantAddressSubmit} className="space-y-5 animate-in fade-in slide-in-from-right duration-300">
              <div>
                <Label htmlFor="restaurantName" className="text-sm font-bold text-gray-700 mb-2 block">
                  Institution Name *
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <Input
                    id="restaurantName"
                    type="text"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    placeholder="Hospital Name, School Name, etc."
                    required
                    className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="addressStreet" className="text-sm font-bold text-gray-700 mb-2 block">
                  Street Address *
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <Input
                    id="addressStreet"
                    type="text"
                    value={addressStreet}
                    onChange={(e) => setAddressStreet(e.target.value)}
                    placeholder="123 Main Street"
                    required
                    className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="addressCity" className="text-sm font-bold text-gray-700 mb-2 block">
                    City *
                  </Label>
                  <Input
                    id="addressCity"
                    type="text"
                    value={addressCity}
                    onChange={(e) => setAddressCity(e.target.value)}
                    placeholder="Berlin"
                    required
                    className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="addressState" className="text-sm font-bold text-gray-700 mb-2 block">
                    State/Province *
                  </Label>
                  <Input
                    id="addressState"
                    type="text"
                    value={addressState}
                    onChange={(e) => setAddressState(e.target.value)}
                    placeholder="Berlin"
                    required
                    className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="addressZip" className="text-sm font-bold text-gray-700 mb-2 block">
                    Zip/Postal Code *
                  </Label>
                  <Input
                    id="addressZip"
                    type="text"
                    value={addressZip}
                    onChange={(e) => setAddressZip(e.target.value)}
                    placeholder="10115"
                    required
                    className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="addressCountry" className="text-sm font-bold text-gray-700 mb-2 block">
                    Country *
                  </Label>
                  <Input
                    id="addressCountry"
                    type="text"
                    value={addressCountry}
                    onChange={(e) => setAddressCountry(e.target.value)}
                    placeholder="Germany"
                    required
                    className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <button 
                  type="button"
                  onClick={() => setCurrentStep('password')}
                  className="text-wm-blue hover:text-wm-teal font-bold text-sm flex items-center gap-2"
                >
                  <ChevronLeft size={16} />
                  Back
                </button>
                <button 
                  type="submit"
                  className="bg-wm-blue hover:bg-blue-800 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
                >
                  Next: Institution Information
                  <ChevronRight size={18} />
                </button>
              </div>
            </form>
          )}

          {/* Step 4: Restaurant Information */}
          {currentStep === 'restaurantInfo' && (
            <form onSubmit={handleRestaurantInfoSubmit} className="space-y-5 animate-in fade-in slide-in-from-right duration-300">
              <div>
                <Label htmlFor="restaurantPhone" className="text-sm font-bold text-gray-700 mb-2 block">
                  Institution Phone <span className="text-gray-400 font-normal">(Optional)</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <Input
                    id="restaurantPhone"
                    type="tel"
                    value={restaurantPhone}
                    onChange={(e) => setRestaurantPhone(e.target.value)}
                    placeholder="+49 123 456 7890"
                    className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="restaurantEmail" className="text-sm font-bold text-gray-700 mb-2 block">
                  Institution Email <span className="text-gray-400 font-normal">(Optional)</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <Input
                    id="restaurantEmail"
                    type="email"
                    value={restaurantEmail}
                    onChange={(e) => setRestaurantEmail(e.target.value)}
                    placeholder="info@institution.com"
                    className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="taxId" className="text-sm font-bold text-gray-700 mb-2 block">
                  Tax ID <span className="text-gray-400 font-normal">(Optional)</span>
                </Label>
                <Input
                  id="taxId"
                  type="text"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  placeholder="Tax identification number"
                  className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <Label htmlFor="websiteUrl" className="text-sm font-bold text-gray-700 mb-2 block">
                  Website URL <span className="text-gray-400 font-normal">(Optional)</span>
                </Label>
                <Input
                  id="websiteUrl"
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://www.institution.com"
                  className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <Label htmlFor="cuisineType" className="text-sm font-bold text-gray-700 mb-2 block">
                  Cuisine Type <span className="text-gray-400 font-normal">(Optional)</span>
                </Label>
                <Input
                  id="cuisineType"
                  type="text"
                  value={cuisineType}
                  onChange={(e) => setCuisineType(e.target.value)}
                  placeholder="e.g., Mensa, Healthcare, Educational"
                  className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between pt-4">
                <button 
                  type="button"
                  onClick={() => setCurrentStep('restaurantAddress')}
                  className="text-wm-blue hover:text-wm-teal font-bold text-sm flex items-center gap-2"
                >
                  <ChevronLeft size={16} />
                  Back
                </button>
                <button 
                  type="submit"
                  className="bg-wm-blue hover:bg-blue-800 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
                >
                  Next: Institution Type
                  <ChevronRight size={18} />
                </button>
              </div>
            </form>
          )}

          {/* Step 5: Business Type */}
          {currentStep === 'businessType' && (
            <form onSubmit={handleBusinessTypeSubmit} className="space-y-5 animate-in fade-in slide-in-from-right duration-300">
              <div>
                <Label className="text-sm font-bold text-gray-700 mb-4 block">
                  Select Institution Type *
                </Label>
                <div className="space-y-3">
                  {businessTypes.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setSelectedBusinessType(type.id)}
                      className={cn(
                        "w-full p-4 text-left border-2 rounded-xl transition-all",
                        selectedBusinessType === type.id
                          ? "border-wm-blue bg-blue-50 shadow-md"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-wm-blue">{type.title}</h3>
                            {selectedBusinessType === type.id && (
                              <Check className="w-5 h-5 text-wm-teal" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{type.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <button 
                  type="button"
                  onClick={() => setCurrentStep('restaurantInfo')}
                  className="text-wm-blue hover:text-wm-teal font-bold text-sm flex items-center gap-2"
                >
                  <ChevronLeft size={16} />
                  Back
                </button>
                <button 
                  type="submit"
                  disabled={!selectedBusinessType}
                  className="bg-wm-blue hover:bg-blue-800 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  Next: Payment Plan
                  <ChevronRight size={18} />
                </button>
              </div>
            </form>
          )}

          {/* Step 6: Payment Plan */}
          {currentStep === 'paymentPlan' && (
            <form onSubmit={handlePaymentPlanSubmit} className="space-y-5 animate-in fade-in slide-in-from-right duration-300">
              <div className="grid grid-cols-1 gap-3">
                {paymentPlans.map((plan) => {
                  const isExpanded = expandedPlan === plan.id;
                  const isSelected = selectedPaymentPlan === plan.id;
                  
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
                          : 'border-gray-200 hover:border-gray-300',
                        plan.popular && "border-wm-teal"
                      )}
                      onClick={() => {
                        setSelectedPaymentPlan(plan.id);
                      }}
                    >
                      {plan.popular && (
                        <span className="absolute top-3 right-12 px-2 py-1 bg-wm-teal text-white text-xs font-bold rounded-full z-10">
                          Popular
                        </span>
                      )}
                      <div className="p-4">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-semibold text-gray-900">
                              {plan.title}
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
                        <p className="text-sm text-gray-600 mb-2">{plan.description}</p>
                        <div className="flex items-baseline gap-1 mb-2">
                          <span className="text-2xl font-bold text-gray-900">
                            {plan.price}
                          </span>
                          {plan.period && (
                            <span className="text-sm text-gray-600">
                              {plan.period}
                            </span>
                          )}
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

