import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  Globe, 
  Key, 
  Copy, 
  Eye, 
  EyeOff, 
  Settings, 
  Trash2, 
  Plus,
  Check,
  X,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Subdomain, SubdomainAvailability, AdminToken, AdminTokenStatus } from '../types/subdomain';
import api from '../lib/api';

export default function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'subdomain' | 'tokens'>('subdomain');
  
  // Subdomain state
  const [subdomain, setSubdomain] = useState<Subdomain | null>(null);
  const [subdomainInput, setSubdomainInput] = useState('');
  const [subdomainAvailability, setSubdomainAvailability] = useState<SubdomainAvailability | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [isCreatingSubdomain, setIsCreatingSubdomain] = useState(false);
  const [isDeletingSubdomain, setIsDeletingSubdomain] = useState(false);
  
  // Admin token state
  const [adminTokenStatus, setAdminTokenStatus] = useState<AdminTokenStatus | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [isDeletingToken, setIsDeletingToken] = useState(false);

  useEffect(() => {
    fetchSubdomain();
    fetchAdminTokenStatus();
  }, []);

  const fetchSubdomain = async () => {
    try {
      const response = await api.get('/subdomains/my');
      setSubdomain(response.data);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        toast.error('Failed to fetch subdomain');
      }
    }
  };

  const fetchAdminTokenStatus = async () => {
    try {
      const response = await api.get('/subdomains/my/admin-token/status');
      setAdminTokenStatus(response.data);
    } catch (error) {
      // Ignore error if no subdomain exists yet
    }
  };

  const checkSubdomainAvailability = async (subdomainName: string) => {
    if (subdomainName.length < 3) {
      setSubdomainAvailability(null);
      return;
    }

    setIsCheckingAvailability(true);
    try {
      const response = await api.get(`/subdomains/check/${subdomainName}`);
      setSubdomainAvailability(response.data);
    } catch (error) {
      setSubdomainAvailability({ available: false, reason: 'Check failed' });
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const handleSubdomainInputChange = (value: string) => {
    setSubdomainInput(value);
    
    // Debounce availability check
    const timeoutId = setTimeout(() => {
      if (value.trim()) {
        checkSubdomainAvailability(value.trim().toLowerCase());
      } else {
        setSubdomainAvailability(null);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const createSubdomain = async () => {
    if (!subdomainAvailability?.available) return;

    setIsCreatingSubdomain(true);
    try {
      const response = await api.post('/subdomains/', { subdomain: subdomainInput });
      setSubdomain(response.data);
      setSubdomainInput('');
      setSubdomainAvailability(null);
      toast.success('Subdomain created successfully!');
      fetchAdminTokenStatus(); // Refresh token status
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to create subdomain');
    } finally {
      setIsCreatingSubdomain(false);
    }
  };

  const deleteSubdomain = async () => {
    if (!confirm('Are you sure you want to delete your subdomain? This action cannot be undone.')) {
      return;
    }

    setIsDeletingSubdomain(true);
    try {
      await api.delete('/subdomains/my');
      setSubdomain(null);
      setAdminTokenStatus(null);
      setAdminToken(null);
      toast.success('Subdomain deleted successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to delete subdomain');
    } finally {
      setIsDeletingSubdomain(false);
    }
  };

  const generateAdminToken = async () => {
    setIsGeneratingToken(true);
    try {
      const response = await api.post('/subdomains/my/admin-token');
      setAdminToken(response.data.token);
      setShowToken(true);
      await fetchAdminTokenStatus();
      toast.success('Admin token generated successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to generate admin token');
    } finally {
      setIsGeneratingToken(false);
    }
  };

  const deleteAdminToken = async () => {
    if (!confirm('Are you sure you want to delete your admin token? This will revoke access to all applications using this token.')) {
      return;
    }

    setIsDeletingToken(true);
    try {
      await api.delete('/subdomains/my/admin-token');
      setAdminTokenStatus({ has_token: false });
      setAdminToken(null);
      toast.success('Admin token deleted successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to delete admin token');
    } finally {
      setIsDeletingToken(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const copySubdomainUrl = () => {
    if (subdomain) {
      copyToClipboard(subdomain.full_url);
    }
  };

  const copyAdminToken = () => {
    if (adminToken) {
      copyToClipboard(adminToken);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome back, <span className="font-medium">{user?.username}</span>! Manage your subdomain and access tokens.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('subdomain')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'subdomain'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Globe className="w-4 h-4 inline mr-2" />
                Subdomain
              </button>
              <button
                onClick={() => setActiveTab('tokens')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'tokens'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Key className="w-4 h-4 inline mr-2" />
                Admin Tokens
              </button>
            </nav>
          </div>
        </div>

        {/* Subdomain Tab */}
        {activeTab === 'subdomain' && (
          <div className="space-y-6">
            {!subdomain ? (
              /* Create Subdomain */
              <div className="card">
                <div className="flex items-center mb-4">
                  <Globe className="w-6 h-6 text-primary-600 mr-3" />
                  <h2 className="text-xl font-semibold text-gray-900">Create Your Subdomain</h2>
                </div>
                <p className="text-gray-600 mb-6">
                  Choose a unique subdomain to access your personal system dashboard.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subdomain Name
                    </label>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={subdomainInput}
                          onChange={(e) => {
                            const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                            setSubdomainInput(value);
                            handleSubdomainInputChange(value);
                          }}
                          className="input"
                          placeholder="your-subdomain"
                          maxLength={30}
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          {isCheckingAvailability && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                          )}
                          {subdomainAvailability && !isCheckingAvailability && (
                            subdomainAvailability.available ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <X className="w-4 h-4 text-red-500" />
                            )
                          )}
                        </div>
                      </div>
                      <span className="text-gray-500">.myluminarasystem.pro</span>
                    </div>
                    
                    {subdomainAvailability && (
                      <div className="mt-2">
                        {subdomainAvailability.available ? (
                          <p className="text-sm text-green-600 flex items-center">
                            <Check className="w-4 h-4 mr-1" />
                            Subdomain is available!
                          </p>
                        ) : (
                          <p className="text-sm text-red-600 flex items-center">
                            <X className="w-4 h-4 mr-1" />
                            {subdomainAvailability.reason}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={createSubdomain}
                    disabled={!subdomainAvailability?.available || isCreatingSubdomain}
                    className="btn btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingSubdomain ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    Create Subdomain
                  </button>
                </div>
              </div>
            ) : (
              /* Existing Subdomain */
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Globe className="w-6 h-6 text-primary-600 mr-3" />
                    <h2 className="text-xl font-semibold text-gray-900">Your Subdomain</h2>
                  </div>
                  <div className="flex items-center space-x-2">
                    <a
                      href={subdomain.full_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline text-sm flex items-center"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Visit
                    </a>
                    <button
                      onClick={copySubdomainUrl}
                      className="btn btn-outline text-sm flex items-center"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy URL
                    </button>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Subdomain</p>
                      <p className="text-lg font-mono font-medium text-gray-900">
                        {subdomain.subdomain}.myluminarasystem.pro
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Created</p>
                      <p className="text-sm text-gray-900">
                        {new Date(subdomain.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-yellow-800">
                        Danger Zone
                      </h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        Deleting your subdomain will permanently remove it and revoke all associated admin tokens.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={deleteSubdomain}
                  disabled={isDeletingSubdomain}
                  className="btn bg-red-600 text-white hover:bg-red-700 flex items-center"
                >
                  {isDeletingSubdomain ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Delete Subdomain
                </button>
              </div>
            )}
          </div>
        )}

        {/* Admin Tokens Tab */}
        {activeTab === 'tokens' && (
          <div className="space-y-6">
            {!subdomain ? (
              /* No Subdomain Message */
              <div className="card text-center">
                <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Create a Subdomain First
                </h3>
                <p className="text-gray-600 mb-4">
                  You need to create a subdomain before you can generate admin tokens.
                </p>
                <button
                  onClick={() => setActiveTab('subdomain')}
                  className="btn btn-primary"
                >
                  Create Subdomain
                </button>
              </div>
            ) : (
              <>
                {/* Current Token Status */}
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <Key className="w-6 h-6 text-primary-600 mr-3" />
                      <h2 className="text-xl font-semibold text-gray-900">Admin Token</h2>
                    </div>
                    {adminTokenStatus?.has_token && (
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      </div>
                    )}
                  </div>

                  {!adminTokenStatus?.has_token ? (
                    <div>
                      <p className="text-gray-600 mb-6">
                        Generate a secure admin token to authenticate with your subdomain's admin panel and API endpoints.
                      </p>
                      <button
                        onClick={generateAdminToken}
                        disabled={isGeneratingToken}
                        className="btn btn-primary flex items-center"
                      >
                        {isGeneratingToken ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <Plus className="w-4 h-4 mr-2" />
                        )}
                        Generate Admin Token
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm text-gray-600">Token Status</p>
                          <p className="text-sm text-gray-600">
                            Created: {adminTokenStatus.created_at ? new Date(adminTokenStatus.created_at).toLocaleDateString() : 'Unknown'}
                          </p>
                        </div>
                        <p className="text-sm text-green-600 font-medium">Active and ready to use</p>
                      </div>

                      {adminToken && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-start">
                            <AlertCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                            <div className="flex-1">
                              <h3 className="text-sm font-medium text-blue-800 mb-2">
                                Your New Admin Token
                              </h3>
                              <p className="text-sm text-blue-700 mb-3">
                                Copy this token now. For security reasons, it won't be shown again.
                              </p>
                              <div className="flex items-center space-x-2">
                                <div className="flex-1 bg-white border border-blue-200 rounded px-3 py-2 font-mono text-sm">
                                  {showToken ? adminToken : '••••••••••••••••••••••••••••••••••••••••••••••'}
                                </div>
                                <button
                                  onClick={() => setShowToken(!showToken)}
                                  className="btn btn-outline text-sm"
                                >
                                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                                <button
                                  onClick={copyAdminToken}
                                  className="btn btn-primary text-sm flex items-center"
                                >
                                  <Copy className="w-4 h-4 mr-1" />
                                  Copy
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start">
                          <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                          <div>
                            <h3 className="text-sm font-medium text-yellow-800">
                              Danger Zone
                            </h3>
                            <p className="text-sm text-yellow-700 mt-1">
                              Deleting your admin token will immediately revoke access to all applications using it.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-3">
                        <button
                          onClick={generateAdminToken}
                          disabled={isGeneratingToken}
                          className="btn btn-outline flex items-center"
                        >
                          {isGeneratingToken ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                          ) : (
                            <Settings className="w-4 h-4 mr-2" />
                          )}
                          Regenerate Token
                        </button>
                        <button
                          onClick={deleteAdminToken}
                          disabled={isDeletingToken}
                          className="btn bg-red-600 text-white hover:bg-red-700 flex items-center"
                        >
                          {isDeletingToken ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <Trash2 className="w-4 h-4 mr-2" />
                          )}
                          Delete Token
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Token Usage Instructions */}
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">How to Use Your Admin Token</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">API Authentication</h4>
                      <div className="bg-gray-900 rounded-lg p-4 text-green-400 font-mono text-sm overflow-x-auto">
                        <div>curl -H "Authorization: Bearer YOUR_TOKEN" \</div>
                        <div className="ml-4">https://{subdomain?.subdomain}.myluminarasystem.pro/api/admin</div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Security Best Practices</h4>
                      <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                        <li>Store your token securely and never share it publicly</li>
                        <li>Use environment variables in your applications</li>
                        <li>Regenerate tokens periodically for better security</li>
                        <li>Delete tokens immediately if compromised</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
