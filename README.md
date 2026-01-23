# Transcript calculator

## Environment Configuration

### Debug Mode

The application supports debug mode to enable console logging during development.

**Local Development:**

1. Copy `.env.example` to `.env` (if not already created)
2. Set `VITE_DEBUG_MODE=true` to enable debug logs
3. Set `VITE_DEBUG_MODE=false` to disable debug logs

**Vercel Deployment:**

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add `VITE_DEBUG_MODE` with value `false` for production

```env
# .env (local development)
VITE_DEBUG_MODE=true  # Enable debug logs locally
```

### Running the Application

```bash
# Development mode
npm run dev

# Production build
npm run build
```

**Note:** The `.env` file is gitignored and won't be committed. Each developer and environment should maintain their own `.env` file based on `.env.example`.
