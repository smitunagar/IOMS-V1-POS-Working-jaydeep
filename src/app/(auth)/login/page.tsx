"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/shared/components/ui/card";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { useAuth } from '@/features/auth/AuthContext';
import Link from 'next/link';
import { Loader2, Mail, Lock, Eye, EyeOff, ChevronLeft, ChevronRight, Star, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

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

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const { login, isLoading: authIsLoading } = useAuth();
  const router = useRouter();
  
  // Get redirect parameter from URL
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  const [isMensa, setIsMensa] = useState(false);
  
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect');
      const mensa = params.get('mensa') === 'true' || params.get('institutional') === 'true';
      setRedirectPath(redirect);
      setIsMensa(mensa);
    }
  }, []);

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  // Auto-rotate testimonials
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Basic validation
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setIsLoggingIn(true);
    const success = await login(email, password);
    setIsLoggingIn(false);
    if (success) {
      if (rememberMe) {
        localStorage.setItem('rememberEmail', email);
      } else {
        localStorage.removeItem('rememberEmail');
      }
      // Redirect to the specified path or default to dashboard
      const redirectTo = redirectPath || '/dashboard';
      router.push(redirectTo);
    } else {
      setError('Invalid email or password. Please try again.');
    }
  };

  // Load remembered email on mount
  React.useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);
  
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

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white font-sans text-wm-blue">
      {/* Left Side - Branding & Testimonial */}
      <div className="lg:w-1/2 bg-wm-blue relative overflow-hidden flex flex-col justify-between p-8 lg:p-16 text-white min-h-[40vh] lg:min-h-screen">
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

        {/* Testimonial Section */}
        <div className="relative z-10 mt-12 lg:mt-0">
          <h3 className="font-headline font-bold text-lg mb-4">What our customers say</h3>
          
          {/* Glass Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 pointer-events-none" />
            
            <div className="flex gap-1 text-yellow-400 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} fill="currentColor" />
              ))}
            </div>
            
            <p className="text-sm lg:text-base italic font-light mb-6 leading-relaxed">
              "{testimonials[currentTestimonial].quote}"
            </p>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold font-headline">
                {testimonials[currentTestimonial].initials}
              </div>
              <div>
                <div className="font-bold text-sm">{testimonials[currentTestimonial].author}</div>
                <div className="text-xs opacity-70">{testimonials[currentTestimonial].role}</div>
              </div>
            </div>
          </div>

          {/* Carousel Indicators */}
          <div className="flex items-center gap-4 mt-6">
            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    index === currentTestimonial
                      ? "w-6 bg-white"
                      : "w-2 bg-white opacity-50 hover:opacity-70"
                  )}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
            <div className="ml-auto flex gap-2">
              <button
                onClick={prevTestimonial}
                className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors"
                aria-label="Previous testimonial"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={nextTestimonial}
                className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors"
                aria-label="Next testimonial"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Logo (Mascot placeholder) */}
        <div className="absolute bottom-8 left-8 hidden lg:block">
          <div className="w-10 h-10 bg-black/30 rounded-full flex items-center justify-center border border-white/10 text-white font-serif font-bold cursor-pointer hover:bg-black/50 transition-colors">
            W
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative">
        <button 
          onClick={() => router.back()}
          className="absolute top-6 left-6 text-gray-400 hover:text-wm-blue lg:hidden"
        >
          <ChevronLeft size={24} />
        </button>

        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2">
            <h2 className="font-headline font-bold text-3xl text-wm-blue">Welcome back</h2>
            <p className="text-gray-500 text-sm">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn(
                    "w-full px-4 py-3 bg-gray-50 border border-transparent rounded-lg focus:bg-white focus:border-wm-blue focus:ring-4 focus:ring-wm-blue/10 outline-none transition-all text-sm font-medium",
                    error && "border-red-500 focus:border-red-500 focus:ring-red-500/10"
                  )}
                  placeholder="Enter your email"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-gray-700">Password</label>
                  <Link
                    href="/forgot-password"
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={cn(
                      "w-full px-4 py-3 bg-gray-50 border border-transparent rounded-lg focus:bg-white focus:border-wm-blue focus:ring-4 focus:ring-wm-blue/10 outline-none transition-all text-sm font-medium pr-10",
                      error && "border-red-500 focus:border-red-500 focus:ring-red-500/10"
                    )}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="relative flex items-center">
                <input 
                  type="checkbox" 
                  id="remember" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="peer w-5 h-5 rounded border-gray-300 text-wm-blue focus:ring-wm-blue/20" 
                />
              </div>
              <label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer">Remember me</label>
            </div>

            <button 
              type="submit"
              disabled={isLoggingIn || authIsLoading}
              className="w-full bg-wm-blue hover:bg-blue-700 text-white font-bold py-3.5 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoggingIn ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <div className="text-center text-sm text-gray-500">
            Don&apos;t have an account? <Link href={isMensa ? "/mensa-signup" : "/signup"} className="font-bold text-blue-600 hover:text-blue-700">{isMensa ? "Sign up for Mensa IOMS" : "Sign up"}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
