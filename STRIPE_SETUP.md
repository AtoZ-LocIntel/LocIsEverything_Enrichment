# Stripe Donation Setup Guide

This guide will help you set up the Stripe donation functionality for your Location Enrichment Platform.

## Prerequisites

- Stripe account with API keys
- Product ID: `prod_SkMGkZPKW9vqy8`
- Price ID: `price_1RorXmRotI9oY6VZymOygZRt`

## Environment Variables

You need to set the following environment variables:

### Frontend (Vite) Environment Variables

Create a `.env` file in the root of your project (or set in Vercel dashboard):

```bash
# Stripe Publishable Key (starts with pk_)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Optional: Override product/price IDs if different
VITE_STRIPE_PRODUCT_ID=prod_SkMGkZPKW9vqy8
VITE_STRIPE_PRICE_ID=price_1RorXmRotI9oY6VZymOygZRt

# Optional: Custom API endpoint (defaults to /api/create-checkout-session)
VITE_STRIPE_CHECKOUT_API=/api/create-checkout-session
```

### Backend (Vercel) Environment Variables

In your Vercel project settings, add:

```bash
# Stripe Secret Key (starts with sk_)
STRIPE_SECRET_KEY=sk_test_...
```

**Important:** Never commit your secret key to version control. Always use environment variables.

## How It Works

1. User clicks the "Donate" button in the header
2. Donation modal opens with preset amounts ($5, $10, $25, $50, $100) or custom amount
3. User selects/enters amount and clicks "Donate"
4. Frontend calls `/api/create-checkout-session` with the donation amount
5. Backend creates a Stripe Checkout Session
6. User is redirected to Stripe Checkout to complete payment
7. After payment, user is redirected back to your site with success message

## Testing

### Test Mode

Use Stripe test keys (starting with `pk_test_` and `sk_test_`) for development:
- Test card: `4242 4242 4242 4242`
- Any future expiry date
- Any 3-digit CVC
- Any ZIP code

### Production

Switch to live keys (starting with `pk_live_` and `sk_live_`) when ready for production.

## API Endpoint

The API endpoint is located at `api/create-checkout-session.ts` and handles:
- Creating Stripe Checkout Sessions
- Handling custom donation amounts
- Setting success/cancel URLs
- Error handling

## Troubleshooting

### "Stripe publishable key is not configured"
- Make sure `VITE_STRIPE_PUBLISHABLE_KEY` is set in your `.env` file
- Restart your dev server after adding environment variables
- In Vercel, make sure the environment variable is set in project settings

### "Failed to create checkout session"
- Check that `STRIPE_SECRET_KEY` is set in Vercel environment variables
- Verify your Stripe secret key is correct and active
- Check Vercel function logs for detailed error messages

### API route not found
- Ensure `api/create-checkout-session.ts` exists in your project root
- Verify `vercel.json` has the correct rewrite rules for `/api/*` routes
- Redeploy your Vercel project after adding the API route

## Security Notes

- Never expose your Stripe secret key in frontend code
- Always use environment variables for sensitive keys
- The secret key should only be used in server-side code (API routes)
- Use HTTPS in production (Vercel provides this automatically)

## Support

For Stripe-specific issues, refer to:
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Checkout Guide](https://stripe.com/docs/payments/checkout)

