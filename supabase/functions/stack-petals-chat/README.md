# Petal Guide chatbot

The chatbot calls Gemini from this Supabase Edge Function. The API key stays
server-side and must never be placed in the storefront .env file with a
VITE_ prefix.

## Configure and deploy

Create a Gemini API key in Google AI Studio, then configure the hosted function:

```powershell
supabase secrets set GEMINI_API_KEY=YOUR_GEMINI_API_KEY
supabase secrets set GEMINI_CHAT_MODEL=gemini-3.6-flash
supabase functions deploy stack-petals-chat
```

After confirming the deployed chatbot works, the old secrets can be removed:

```powershell
supabase secrets unset OPENAI_API_KEY OPENAI_CHAT_MODEL
```

For local serving, copy .env.example to .env.local, add the key, and run:

```powershell
supabase functions serve stack-petals-chat --env-file supabase/functions/stack-petals-chat/.env.local
```
