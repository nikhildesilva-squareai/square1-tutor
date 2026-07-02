'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface MonetizationSettings {
  is_monetized: boolean;
  is_free: boolean;
  monthly_price: number | null;
  annual_price: number | null;
  allow_free_tier: boolean;
  currency: string;
}

interface JoinCommunityFlowProps {
  communityId: string;
  communityName: string;
  onSuccess?: () => void;
}

export function JoinCommunityFlow({
  communityId,
  communityName,
  onSuccess,
}: JoinCommunityFlowProps) {
  const [settings, setSettings] = useState<MonetizationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<'free' | 'monthly' | 'annual' | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchMonetizationSettings();
  }, [communityId]);

  const fetchMonetizationSettings = async () => {
    try {
      const res = await fetch(`/api/communities/${communityId}/monetization/settings`);
      if (!res.ok) throw new Error('Failed to fetch settings');

      const data = await res.json();
      setSettings(data);

      // Default selection
      if (data.allow_free_tier && data.is_free) {
        setSelectedTier('free');
      } else if (data.monthly_price) {
        setSelectedTier('monthly');
      }
    } catch (error) {
      console.error('Settings fetch error:', error);
      toast.error('Failed to load community pricing');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinFree = async () => {
    setProcessing(true);
    try {
      const res = await fetch(
        `/api/communities/${communityId}/subscriptions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription_type: 'free' }),
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }

      toast.success(`Joined ${communityName}!`);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to join community');
    } finally {
      setProcessing(false);
    }
  };

  const handleJoinPaid = async (subscriptionType: 'monthly' | 'annual') => {
    setProcessing(true);
    try {
      // Step 1: Create payment intent
      const intentRes = await fetch(
        `/api/communities/${communityId}/payments/create-intent`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription_type: subscriptionType }),
        }
      );

      if (!intentRes.ok) {
        const error = await intentRes.json();
        throw new Error(error.error);
      }

      const paymentData = await intentRes.json();

      // Step 2: Show Stripe payment form (in real app, use Elements/Payment Element)
      // For MVP, simulate payment success
      console.log('Payment intent created:', paymentData);

      // Simulate payment completion
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Step 3: Create subscription
      const subRes = await fetch(
        `/api/communities/${communityId}/subscriptions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription_type: subscriptionType }),
        }
      );

      if (!subRes.ok) {
        const error = await subRes.json();
        throw new Error(error.error);
      }

      toast.success(
        `Successfully joined ${communityName}! ${
          subscriptionType === 'monthly' ? 'Monthly' : 'Annual'
        } subscription active.`
      );
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-pulse">Loading community options...</div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-6 text-center text-red-600">
        Error loading community information
      </div>
    );
  }

  // Free community
  if (!settings.is_monetized) {
    return (
      <div className="space-y-4 p-6">
        <h3 className="text-xl font-bold">{communityName}</h3>
        <p className="text-gray-600">Join this free community</p>
        <button
          onClick={handleJoinFree}
          disabled={processing}
          className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
        >
          {processing ? 'Joining...' : 'Join Free Community'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h3 className="text-2xl font-bold mb-2">{communityName}</h3>
        <p className="text-gray-600">Choose your membership tier</p>
      </div>

      {/* Tier Options */}
      <div className="space-y-3">
        {/* Free Tier */}
        {settings.allow_free_tier && (
          <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50"
            style={{
              borderColor: selectedTier === 'free' ? '#3b82f6' : '#e5e7eb',
              backgroundColor: selectedTier === 'free' ? '#eff6ff' : 'transparent',
            }}>
            <input
              type="radio"
              checked={selectedTier === 'free'}
              onChange={() => setSelectedTier('free')}
              className="mt-1 mr-3 w-4 h-4"
            />
            <div className="flex-1">
              <div className="font-semibold">Free Access</div>
              <div className="text-sm text-gray-600">Limited features</div>
            </div>
            <div className="text-lg font-bold">$0</div>
          </label>
        )}

        {/* Monthly Tier */}
        {settings.monthly_price && (
          <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50"
            style={{
              borderColor: selectedTier === 'monthly' ? '#3b82f6' : '#e5e7eb',
              backgroundColor: selectedTier === 'monthly' ? '#eff6ff' : 'transparent',
            }}>
            <input
              type="radio"
              checked={selectedTier === 'monthly'}
              onChange={() => setSelectedTier('monthly')}
              className="mt-1 mr-3 w-4 h-4"
            />
            <div className="flex-1">
              <div className="font-semibold">Monthly Plan</div>
              <div className="text-sm text-gray-600">Full access, cancel anytime</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">${settings.monthly_price}</div>
              <div className="text-xs text-gray-600">/month</div>
            </div>
          </label>
        )}

        {/* Annual Tier */}
        {settings.annual_price && (
          <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50"
            style={{
              borderColor: selectedTier === 'annual' ? '#3b82f6' : '#e5e7eb',
              backgroundColor: selectedTier === 'annual' ? '#eff6ff' : 'transparent',
            }}>
            <input
              type="radio"
              checked={selectedTier === 'annual'}
              onChange={() => setSelectedTier('annual')}
              className="mt-1 mr-3 w-4 h-4"
            />
            <div className="flex-1">
              <div className="font-semibold">Annual Plan</div>
              <div className="text-sm text-gray-600">
                Save{' '}
                {settings.monthly_price
                  ? Math.round(
                      ((settings.monthly_price * 12 - settings.annual_price) /
                        (settings.monthly_price * 12)) *
                        100
                    )
                  : 0}
                % vs monthly
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">${settings.annual_price}</div>
              <div className="text-xs text-gray-600">/year</div>
            </div>
          </label>
        )}
      </div>

      {/* Summary */}
      {selectedTier && selectedTier !== 'free' && (
        <div className="p-4 bg-blue-50 rounded-lg text-sm">
          <p className="font-medium mb-2">💳 Secure Payment</p>
          <p className="text-gray-700">
            {selectedTier === 'monthly'
              ? `$${settings.monthly_price} will be charged monthly`
              : `$${settings.annual_price} will be charged annually`}
          </p>
          <p className="text-gray-600 text-xs mt-2">
            Cancel your subscription anytime. No questions asked.
          </p>
        </div>
      )}

      {/* Join Button */}
      <button
        onClick={() => {
          if (selectedTier === 'free') {
            handleJoinFree();
          } else if (selectedTier === 'monthly') {
            handleJoinPaid('monthly');
          } else if (selectedTier === 'annual') {
            handleJoinPaid('annual');
          }
        }}
        disabled={!selectedTier || processing}
        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {processing ? 'Processing...' : 'Join Community'}
      </button>
    </div>
  );
}
