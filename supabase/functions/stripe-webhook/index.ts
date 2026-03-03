import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'https://esm.sh/stripe@14?target=deno';
import { createServiceClient } from '../_shared/supabase.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
});

// Map Stripe Price IDs to subscription tiers
const TIER_FROM_PRICE: Record<string, string> = {
  'price_1Suf0HDidS2jVuhadtJLgnLX': 'basic',   // basic monthly
  'price_1Suf0HDidS2jVuhaYZ3GEQzW': 'basic',   // basic annual
  'price_1SufOZDidS2jVuha7RkjyRXi': 'pro',     // pro monthly
  'price_1SufOZDidS2jVuhakiQNABxz': 'pro',     // pro annual
  'price_1SufPkDidS2jVuhatY2mAZT1': 'premium', // premium monthly
  'price_1SufPkDidS2jVuham4wwGraF': 'premium', // premium annual
};

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  if (!sig) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      sig,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook signature verification failed:', message);
    return new Response(`Invalid signature: ${message}`, { status: 400 });
  }

  const supabase = createServiceClient();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const orgId = session.metadata?.org_id;
      const subscriptionId = session.subscription as string;

      if (!orgId || !subscriptionId) {
        console.error(`Checkout session missing metadata: org_id=${orgId}, subscription=${subscriptionId}, session=${session.id}`);
        return new Response(
          JSON.stringify({ error: 'Missing org_id or subscription in checkout session' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } },
        );
      }

      // Look up the subscription to get the price/tier
      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      const priceId = sub.items.data[0]?.price.id;
      const tier = TIER_FROM_PRICE[priceId] || 'basic';

      const { error: updateError } = await supabase
        .from('organizations')
        .update({
          stripe_subscription_id: subscriptionId,
          subscription_tier: tier,
          subscription_status: 'active',
          past_due_since: null,
        })
        .eq('id', orgId);

      if (updateError) {
        console.error(`Failed to update org ${orgId} after checkout:`, updateError.message);
        return new Response(
          JSON.stringify({ error: 'Database update failed' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } },
        );
      }

      console.log(`Checkout completed: org=${orgId}, tier=${tier}`);
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      const priceId = sub.items.data[0]?.price.id;
      const tier = TIER_FROM_PRICE[priceId] || 'basic';

      // Map Stripe subscription status to our status
      const statusMap: Record<string, string> = {
        active: 'active',
        past_due: 'past_due',
        canceled: 'canceled',
        unpaid: 'past_due',
        trialing: 'trialing',
        incomplete: 'past_due',
        incomplete_expired: 'expired',
        paused: 'past_due',
      };
      const status = statusMap[sub.status];
      if (!status) {
        console.error(`Unknown Stripe subscription status: ${sub.status}`);
        break;
      }

      // Find org by stripe_subscription_id
      // Set past_due_since when entering past_due; clear it when returning to active
      const pastDueUpdate = status === 'past_due'
        ? { past_due_since: new Date().toISOString() }
        : status === 'active'
          ? { past_due_since: null }
          : {};

      const { error } = await supabase
        .from('organizations')
        .update({
          subscription_tier: tier,
          subscription_status: status,
          ...pastDueUpdate,
        })
        .eq('stripe_subscription_id', sub.id);

      if (error) {
        console.error('Failed to update subscription:', error.message);
      } else {
        console.log(`Subscription updated: sub=${sub.id}, tier=${tier}, status=${status}`);
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.subscription as string;

      if (subscriptionId) {
        // Only set past_due_since if not already set (preserve original overdue date)
        const { data: org } = await supabase
          .from('organizations')
          .select('past_due_since')
          .eq('stripe_subscription_id', subscriptionId)
          .single();

        const updates: Record<string, unknown> = { subscription_status: 'past_due' };
        if (!org?.past_due_since) {
          updates.past_due_since = new Date().toISOString();
        }

        const { error } = await supabase
          .from('organizations')
          .update(updates)
          .eq('stripe_subscription_id', subscriptionId);

        if (error) {
          console.error('Failed to mark subscription past_due:', error.message);
        } else {
          console.log(`Invoice payment failed: sub=${subscriptionId}, marked past_due`);
        }
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;

      const { error } = await supabase
        .from('organizations')
        .update({
          subscription_tier: 'trial',
          subscription_status: 'expired',
          stripe_subscription_id: null,
          past_due_since: null,
        })
        .eq('stripe_subscription_id', sub.id);

      if (error) {
        console.error('Failed to handle subscription deletion:', error.message);
      } else {
        console.log(`Subscription deleted: sub=${sub.id}`);
      }
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
