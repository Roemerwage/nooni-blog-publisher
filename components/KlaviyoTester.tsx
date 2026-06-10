import React, { useState, useEffect } from 'react';
import { useKlaviyo } from '../hooks/useKlaviyo';
import { Mail, Send, Users, Zap, TrendingUp } from 'lucide-react';

interface KlaviyoTesterProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const KlaviyoTester: React.FC<KlaviyoTesterProps> = ({ isOpen = true, onClose }) => {
  const {
    getLists,
    subscribeToList,
    getFlows,
    triggerFlow,
    trackEvent,
    getProfile,
    loading,
    error,
  } = useKlaviyo();

  const [lists, setLists] = useState<any[]>([]);
  const [flows, setFlows] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'subscribe' | 'flows' | 'events' | 'profile'>('subscribe');

  // Subscribe form
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [selectedListId, setSelectedListId] = useState('');
  const [subscribeResponse, setSubscribeResponse] = useState<any>(null);

  // Flow trigger (via metric event — set up a metric-triggered flow in Klaviyo)
  const [flowEmail, setFlowEmail] = useState('');
  const [flowEventName, setFlowEventName] = useState('');
  const [flowProperties, setFlowProperties] = useState('{}');
  const [flowResponse, setFlowResponse] = useState<any>(null);

  // Event tracking
  const [eventEmail, setEventEmail] = useState('');
  const [eventName, setEventName] = useState('');
  const [eventProperties, setEventProperties] = useState('{}');
  const [eventResponse, setEventResponse] = useState<any>(null);

  // Profile
  const [profileEmail, setProfileEmail] = useState('');
  const [profileData, setProfileData] = useState<any>(null);

  // Load lists and flows on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [listsData, flowsData] = await Promise.all([getLists(), getFlows()]);
        setLists(listsData);
        setFlows(flowsData);
        if (listsData.length > 0) setSelectedListId(listsData[0].id);
        if (flowsData.length > 0) setSelectedFlowId(flowsData[0].id);
      } catch (err) {
        console.error('Failed to load data:', err);
      }
    };
    loadData();
  }, [getLists, getFlows]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await subscribeToList(email, selectedListId, {
        firstName,
        lastName,
      });
      setSubscribeResponse(result);
      setEmail('');
      setFirstName('');
      setLastName('');
    } catch (err) {
      console.error('Subscribe failed:', err);
    }
  };

  const handleTriggerFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const props = JSON.parse(flowProperties);
      const result = await triggerFlow(flowEventName, flowEmail, props);
      setFlowResponse(result);
      setFlowEmail('');
      setFlowEventName('');
    } catch (err) {
      console.error('Flow trigger failed:', err);
    }
  };

  const handleTrackEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const props = JSON.parse(eventProperties);
      const result = await trackEvent(eventEmail, eventName, props);
      setEventResponse(result);
      setEventEmail('');
      setEventName('');
    } catch (err) {
      console.error('Event tracking failed:', err);
    }
  };

  const handleGetProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await getProfile(profileEmail);
      setProfileData(result);
    } catch (err) {
      console.error('Profile fetch failed:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 flex items-center justify-between sticky top-0">
          <div className="flex items-center gap-3">
            <Zap size={24} />
            <h2 className="text-2xl font-bold">Klaviyo Tester</h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded"
            >
              ✕
            </button>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 m-4 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b bg-gray-50">
          <button
            onClick={() => setActiveTab('subscribe')}
            className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition ${
              activeTab === 'subscribe'
                ? 'border-purple-600 text-purple-600 bg-white'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users size={18} /> Subscribe
          </button>
          <button
            onClick={() => setActiveTab('flows')}
            className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition ${
              activeTab === 'flows'
                ? 'border-purple-600 text-purple-600 bg-white'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Zap size={18} /> Trigger Flow
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition ${
              activeTab === 'events'
                ? 'border-purple-600 text-purple-600 bg-white'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <TrendingUp size={18} /> Track Event
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition ${
              activeTab === 'profile'
                ? 'border-purple-600 text-purple-600 bg-white'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Mail size={18} /> Profile
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Subscribe Tab */}
          {activeTab === 'subscribe' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Subscribe to List</h3>

              <form onSubmit={handleSubscribe} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    List
                  </label>
                  <select
                    value={selectedListId}
                    onChange={(e) => setSelectedListId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {lists.map((list) => (
                      <option key={list.id} value={list.id}>
                        {list.attributes?.name || list.id}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name (optional)
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="John"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name (optional)
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
                >
                  <Send size={18} /> {loading ? 'Subscribing...' : 'Subscribe'}
                </button>
              </form>

              {subscribeResponse && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                  <p className="text-green-800 font-medium mb-2">✓ Success!</p>
                  <pre className="text-xs text-green-700 overflow-auto">
                    {JSON.stringify(subscribeResponse, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Flows Tab */}
          {activeTab === 'flows' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Trigger Flow via Event</h3>
              <p className="text-sm text-gray-500 bg-blue-50 border border-blue-200 rounded p-3">
                Klaviyo flows cannot be triggered directly by ID. Instead, track a metric event and set up a <strong>metric-triggered flow</strong> in Klaviyo that listens for that event name.
              </p>

              {flows.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded p-3">
                  <p className="text-xs font-medium text-gray-600 mb-2">Your flows (for reference):</p>
                  <ul className="text-xs text-gray-500 space-y-1">
                    {flows.map(f => <li key={f.id}>• {f.attributes?.name || f.id}</li>)}
                  </ul>
                </div>
              )}

              <form onSubmit={handleTriggerFlow} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Name <span className="text-gray-400 font-normal">(must match flow trigger in Klaviyo)</span>
                  </label>
                  <input
                    type="text"
                    value={flowEventName}
                    onChange={(e) => setFlowEventName(e.target.value)}
                    placeholder="e.g., Blog Read, Free Sample Request"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={flowEmail}
                    onChange={(e) => setFlowEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Properties (JSON, optional)
                  </label>
                  <textarea
                    value={flowProperties}
                    onChange={(e) => setFlowProperties(e.target.value)}
                    placeholder='{"key": "value"}'
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
                >
                  <Zap size={18} /> {loading ? 'Sending event...' : 'Send Event → Trigger Flow'}
                </button>
              </form>

              {flowResponse && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                  <p className="text-green-800 font-medium mb-2">✓ Success!</p>
                  <pre className="text-xs text-green-700 overflow-auto">
                    {JSON.stringify(flowResponse, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Events Tab */}
          {activeTab === 'events' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Track Event</h3>

              <form onSubmit={handleTrackEvent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={eventEmail}
                    onChange={(e) => setEventEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Name
                  </label>
                  <input
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="e.g., Purchase, SignUp, ViewPage"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Properties (JSON, optional)
                  </label>
                  <textarea
                    value={eventProperties}
                    onChange={(e) => setEventProperties(e.target.value)}
                    placeholder='{"key": "value"}'
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
                >
                  <TrendingUp size={18} /> {loading ? 'Tracking...' : 'Track Event'}
                </button>
              </form>

              {eventResponse && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                  <p className="text-green-800 font-medium mb-2">✓ Success!</p>
                  <pre className="text-xs text-green-700 overflow-auto">
                    {JSON.stringify(eventResponse, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Get Profile</h3>

              <form onSubmit={handleGetProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
                >
                  <Mail size={18} /> {loading ? 'Fetching...' : 'Get Profile'}
                </button>
              </form>

              {profileData && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mt-4">
                  <p className="text-indigo-800 font-medium mb-2">✓ Profile Found</p>
                  <pre className="text-xs text-indigo-700 overflow-auto max-h-60">
                    {JSON.stringify(profileData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KlaviyoTester;
