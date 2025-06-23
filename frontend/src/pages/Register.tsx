import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, Github, MessageSquare, Mail, User, Check, X } from 'lucide-react';
import { RegisterData } from '../types/auth';
import { validatePassword, validateUsername } from '../lib/utils.ts';
import api from '../lib/api';

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState<{
    isValid: boolean;
    errors: string[];
  }>({ isValid: false, errors: [] });
  
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterData>();

  const password = watch('password');
  const username = watch('username');

  // Real-time password validation
  React.useEffect(() => {
    if (password) {
      setPasswordValidation(validatePassword(password));
    }
  }, [password]);

  const onSubmit = async (data: RegisterData) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/signup', data);
      toast.success('Account created! Please check your email to verify your account.');
      navigate('/login');
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Registration failed';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'github' | 'discord') => {
    try {
      const response = await api.get(`/auth/${provider}`);
      window.location.href = response.data.auth_url;
    } catch (error) {
      toast.error(`Failed to initialize ${provider} login`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="card">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-lg">L</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Create your account</h2>
            <p className="mt-2 text-gray-600">
              Or{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-500 font-medium">
                sign in to your existing account
              </Link>
            </p>
          </div>

          {/* OAuth Buttons */}
          <div className="space-y-3 mb-6">
            <button
              onClick={() => handleOAuthLogin('github')}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Github className="w-5 h-5 mr-2" />
              Continue with GitHub
            </button>
            <button
              onClick={() => handleOAuthLogin('discord')}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              Continue with Discord
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or create account with email</span>
            </div>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Invalid email address',
                    },
                  })}
                  type="email"
                  className="input pl-10"
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  {...register('username', {
                    required: 'Username is required',
                    validate: (value) => {
                      const validation = validateUsername(value);
                      return validation.isValid || validation.error;
                    },
                  })}
                  type="text"
                  className="input pl-10"
                  placeholder="Choose a username"
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
              )}
              {username && !errors.username && (
                <p className="mt-1 text-sm text-gray-500">
                  Your subdomain will be: {username}.myluminarasystem.pro
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  {...register('password', {
                    required: 'Password is required',
                    validate: (value) => {
                      const validation = validatePassword(value);
                      return validation.isValid || 'Password does not meet requirements';
                    },
                  })}
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {/* Password Requirements */}
              {password && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center text-xs">
                    {password.length >= 8 ? (
                      <Check className="w-3 h-3 text-green-500 mr-1" />
                    ) : (
                      <X className="w-3 h-3 text-red-500 mr-1" />
                    )}
                    <span className={password.length >= 8 ? 'text-green-600' : 'text-red-600'}>
                      At least 8 characters
                    </span>
                  </div>
                  <div className="flex items-center text-xs">
                    {/[A-Z]/.test(password) ? (
                      <Check className="w-3 h-3 text-green-500 mr-1" />
                    ) : (
                      <X className="w-3 h-3 text-red-500 mr-1" />
                    )}
                    <span className={/[A-Z]/.test(password) ? 'text-green-600' : 'text-red-600'}>
                      One uppercase letter
                    </span>
                  </div>
                  <div className="flex items-center text-xs">
                    {/[a-z]/.test(password) ? (
                      <Check className="w-3 h-3 text-green-500 mr-1" />
                    ) : (
                      <X className="w-3 h-3 text-red-500 mr-1" />
                    )}
                    <span className={/[a-z]/.test(password) ? 'text-green-600' : 'text-red-600'}>
                      One lowercase letter
                    </span>
                  </div>
                  <div className="flex items-center text-xs">
                    {/\d/.test(password) ? (
                      <Check className="w-3 h-3 text-green-500 mr-1" />
                    ) : (
                      <X className="w-3 h-3 text-red-500 mr-1" />
                    )}
                    <span className={/\d/.test(password) ? 'text-green-600' : 'text-red-600'}>
                      One number
                    </span>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn btn-primary flex items-center justify-center"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              By creating an account, you agree to our{' '}
              <a href="#" className="text-primary-600 hover:text-primary-500">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-primary-600 hover:text-primary-500">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
