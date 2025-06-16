import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Globe, Shield, Zap, Users, ArrowRight, Check } from 'lucide-react';

export default function Home() {
  const { user } = useAuth();

  const features = [
    {
      icon: Globe,
      title: 'Custom Subdomains',
      description: 'Get your own subdomain like username.myluminarasystem.pro for your personal system dashboard.',
    },
    {
      icon: Shield,
      title: 'Secure Authentication',
      description: 'Sign up with email, GitHub, or Discord. All with secure JWT authentication and email verification.',
    },
    {
      icon: Zap,
      title: 'Admin Tokens',
      description: 'Generate secure admin tokens to manage your subdomain and integrate with external tools.',
    },
    {
      icon: Users,
      title: 'Multi-Provider Login',
      description: 'Choose from multiple authentication providers for the most convenient sign-in experience.',
    },
  ];

  const testimonials = [
    {
      name: 'Alex Chen',
      username: 'alexdev',
      content: 'Perfect for managing my development environment. The subdomain system makes everything so organized!',
      avatar: '🧑‍💻',
    },
    {
      name: 'Sarah Johnson',
      username: 'sarahsys',
      content: 'Love how easy it was to set up. GitHub integration made onboarding seamless.',
      avatar: '👩‍💼',
    },
    {
      name: 'Mike Rodriguez',
      username: 'mikecode',
      content: 'The admin tokens feature is exactly what I needed for my automation workflows.',
      avatar: '👨‍🔧',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-primary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Manage Your System
              <span className="block text-primary-600">With Luminara</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Get your own subdomain and secure admin access to manage your system efficiently. 
              Simple setup, powerful features, and enterprise-grade security.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Link to="/dashboard" className="btn btn-primary text-lg px-8 py-3">
                  Go to Dashboard
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn btn-primary text-lg px-8 py-3">
                    Get Started Free
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                  <Link to="/login" className="btn btn-outline text-lg px-8 py-3">
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to make system management simple and secure.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card text-center">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Get started in three simple steps
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white font-bold text-xl">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Sign Up
              </h3>
              <p className="text-gray-600">
                Create your account using email, GitHub, or Discord in just a few clicks.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white font-bold text-xl">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Choose Subdomain
              </h3>
              <p className="text-gray-600">
                Pick your unique subdomain and get instant access to your personal dashboard.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white font-bold text-xl">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Start Managing
              </h3>
              <p className="text-gray-600">
                Generate admin tokens and start managing your system with secure access.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Users Say
            </h2>
            <p className="text-xl text-gray-600">
              Join thousands of satisfied users
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="card">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-2xl">{testimonial.avatar}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-gray-600 text-sm">@{testimonial.username}</p>
                  </div>
                </div>
                <p className="text-gray-700">"{testimonial.content}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of users managing their systems with Luminara.
          </p>
          {!user && (
            <Link to="/register" className="btn bg-white text-primary-600 hover:bg-gray-100 text-lg px-8 py-3">
              Create Your Account
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
