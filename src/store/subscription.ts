import { create } from 'zustand';
import { supabase } from '../lib/supabase-client';

export interface SubscriptionTier {
  id: string;
  name: string;
  billing_period?: string;
  price?: number;
  features?: string[];
  limits?: {
    messages_per_day?: number;
    contexts?: number;
    max_integrations?: number;
    storage_gb?: number;
    integrations?: number;
    max_team_members?: number;
  };
}

export interface ApiUsage {
  messages_sent?: number;
  contexts_created?: number;
  total_requests?: number;
  requests_by_type?: {
    [key: string]: number;
  };
  integrations_used?: number;
  usage_percentage?: number;
  period_start?: string;
  period_end?: string;
}


export interface BillingDetails {
  customer_id: string;
  payment_method?: string;
  billing_email: string;
}

interface SubscriptionState {
  currentTier: SubscriptionTier | null;
  usage: ApiUsage | null;
  billingDetails: BillingDetails | null;
  loading: boolean;
  error: string | null;
  fetchSubscription: () => Promise<void>;
  changeTier: (tierId: SubscriptionTier['id']) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  updatePaymentMethod: (paymentMethodId: string) => Promise<void>;
}

const DEFAULT_TIER: SubscriptionTier = {
  id: 'free',
  name: 'Free',
  price: 0,
  billing_period: 'monthly',
  features: [
    'Up to 100 messages per day',
    '1GB storage',
    'Basic email integration',
    'Task management',
  ],
  limits: {
    messages_per_day: 100,
    storage_gb: 1,
    max_integrations: 1,
    contexts: 3,
    max_team_members: 1,
    integrations: 1
  },
};

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  currentTier: null,
  usage: null,
  billingDetails: null,
  loading: false,
  error: null,

  fetchSubscription: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Try to get subscription data
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(); // Use maybeSingle instead of single to handle no results

      // If table doesn't exist or no subscription found, create a free tier subscription
      if (subError?.code === 'PGRST116' || !subscription) {
        const { data: newSubscription, error: createError } = await supabase
          .from('subscriptions')
          .insert({
            user_id: user.id,
            tier: 'free',
            status: 'active',
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          })
          .select()
          .single();

        if (createError) throw createError;
        
        set({
          currentTier: DEFAULT_TIER,
          billingDetails: newSubscription,
          usage: {
            period_start: new Date().toISOString(),
            period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            total_requests: 0,
            requests_by_type: {
              chat: 0,
              task: 0,
              email: 0,
              calendar: 0,
            },
            usage_percentage: 0,
          },
        });
        return;
      }

      // Try to get usage data
      const { data: usage, error: usageError } = await supabase
        .from('api_usage')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      // If no usage data, create initial usage record
      if (usageError?.code === 'PGRST116' || !usage) {
        const { data: newUsage, error: createUsageError } = await supabase
          .from('api_usage')
          .insert({
            user_id: user.id,
            period_start: new Date().toISOString(),
            period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            total_requests: 0,
            requests_by_type: {
              chat: 0,
              task: 0,
              email: 0,
              calendar: 0,
            },
          })
          .select()
          .single();

        if (createUsageError) throw createUsageError;
        
        set({
          currentTier: DEFAULT_TIER,
          usage: {
            ...newUsage,
            usage_percentage: 0,
          },
          billingDetails: subscription,
        });
        return;
      }

      set({
        currentTier: subscription ? {
          id: subscription.tier,
          name: subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1),
          price: subscription.tier === 'free' ? 0 : subscription.tier === 'pro' ? 19 : 49,
          billing_period: 'monthly',
          features: DEFAULT_TIER.features,
          limits: DEFAULT_TIER.limits,
        } : DEFAULT_TIER,
        usage: {
          ...usage,
          usage_percentage: (usage.total_requests || 0) / ((DEFAULT_TIER.limits?.messages_per_day || 100) * 30) * 100,
        },
        billingDetails: subscription,
      });
    } catch (error) {
      console.error('Error fetching subscription:', error);
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      set({ loading: false });
    }
  },

  changeTier: async (tierId) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          tier: tierId,
          status: 'active',
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });

      if (error) throw error;
      await get().fetchSubscription();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      set({ loading: false });
    }
  },

  cancelSubscription: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          tier: 'free',
          cancel_at_period_end: true,
        })
        .eq('user_id', user.id);

      if (error) throw error;
      await get().fetchSubscription();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      set({ loading: false });
    }
  },

  updatePaymentMethod: async (paymentMethodId) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('subscriptions')
        .update({
          payment_method: {
            id: paymentMethodId,
            updated_at: new Date().toISOString(),
          },
        })
        .eq('user_id', user.id);

      if (error) throw error;
      await get().fetchSubscription();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      set({ loading: false });
    }
  },
}));