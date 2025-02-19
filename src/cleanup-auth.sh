#!/bin/bash

# Remove old auth files
rm -f src/auth.ts
rm -f src/lib/auth.ts
rm -f src/lib/auth-state.ts
rm -f src/lib/supabase.ts
rm -f src/lib/supabase-client.ts
rm -f src/lib/supabase-singleton.ts
rm -f src/contexts/AuthContext.tsx
rm -f src/hooks/useSupabaseAuth.ts
rm -f src/store/auth.ts

# Clear localStorage
echo "Please run this in your browser console:"
echo "localStorage.clear();"
echo "window.location.reload();"