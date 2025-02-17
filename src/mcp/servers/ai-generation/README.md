# AI Generation MCP Servers

This directory contains MCP servers for various AI content generation services.

## Image Generation

### Ideogram Server
- High-quality image generation with strong artistic control
- Support for multiple styles and aesthetics
- Advanced prompt understanding
- Variations and iterations
- Resolution control

### Flux Server
- Real-time image generation
- Style transfer capabilities
- Animation support
- Batch processing
- Custom model fine-tuning

## Music Generation

### Riffusion Server
- Real-time music generation
- Style transfer between genres
- Tempo and rhythm control
- Multi-instrument support
- Loop creation

### AudioCraft Server
- High-quality music generation
- Multiple genre support
- Duration control
- Instrument separation
- Audio enhancement

## Voice Generation

### ElevenLabs Server
- High-quality voice synthesis
- Multiple voice styles
- Emotion control
- Language support
- Custom voice cloning

### Coqui Server
- Fast voice generation
- Multiple languages
- Voice style transfer
- Emotion synthesis
- Real-time processing

## Model Hosting

### Hugging Face Server
- Access to thousands of models
- Real-time inference
- Model fine-tuning
- Version control
- Custom pipeline support

### Replicate Server
- Cloud model deployment
- Version management
- Custom training
- API access
- Usage tracking

## Usage Examples

### Image Generation
```typescript
// Generate image with Ideogram
const image = await use_mcp_tool({
  server_name: 'ideogram',
  tool_name: 'generate',
  arguments: {
    prompt: "A futuristic city at sunset",
    style: "cinematic",
    resolution: "1024x1024",
    num_steps: 50
  }
});

// Create animation with Flux
const animation = await use_mcp_tool({
  server_name: 'flux',
  tool_name: 'animate',
  arguments: {
    prompt: "A blooming flower",
    frames: 30,
    fps: 24,
    style: "realistic"
  }
});
```

### Music Generation
```typescript
// Generate music with Riffusion
const music = await use_mcp_tool({
  server_name: 'riffusion',
  tool_name: 'generate',
  arguments: {
    prompt: "Upbeat electronic dance music",
    duration: 30,
    tempo: 128,
    style: "edm"
  }
});

// Create full song with AudioCraft
const song = await use_mcp_tool({
  server_name: 'audiocraft',
  tool_name: 'generate',
  arguments: {
    prompt: "Epic orchestral soundtrack",
    duration: 180,
    instruments: ["strings", "brass", "percussion"],
    structure: "intro,build,climax,outro"
  }
});
```

### Voice Generation
```typescript
// Generate voice with ElevenLabs
const voice = await use_mcp_tool({
  server_name: 'elevenlabs',
  tool_name: 'generate',
  arguments: {
    text: "Welcome to your personalized news report",
    voice_id: "news_anchor_1",
    emotion: "professional",
    language: "en-US"
  }
});

// Create podcast with Coqui
const podcast = await use_mcp_tool({
  server_name: 'coqui',
  tool_name: 'generate',
  arguments: {
    script: "Today's top stories...",
    voice: "broadcaster",
    background_music: true,
    segments: ["intro", "news", "weather", "outro"]
  }
});
```

### Model Deployment
```typescript
// Use Hugging Face model
const result = await use_mcp_tool({
  server_name: 'huggingface',
  tool_name: 'inference',
  arguments: {
    model: "stabilityai/stable-diffusion-xl-base-1.0",
    input: {
      prompt: "A detailed portrait in renaissance style"
    }
  }
});

// Deploy on Replicate
const deployment = await use_mcp_tool({
  server_name: 'replicate',
  tool_name: 'deploy',
  arguments: {
    model: "stability-ai/sdxl",
    version: "1.0",
    compute: "gpu",
    scale: "auto"
  }
});
```

## Workflow Examples

### Automated News Report
```typescript
// 1. Fetch news articles
const articles = await use_mcp_tool({
  server_name: 'news-api',
  tool_name: 'fetch',
  arguments: {
    categories: ["technology", "science"],
    limit: 5
  }
});

// 2. Generate summary
const summary = await use_mcp_tool({
  server_name: 'gemini',
  tool_name: 'summarize',
  arguments: {
    articles,
    style: "broadcast",
    length: "medium"
  }
});

// 3. Generate background music
const music = await use_mcp_tool({
  server_name: 'riffusion',
  tool_name: 'generate',
  arguments: {
    prompt: "Gentle news background music",
    duration: summary.estimated_duration,
    volume: 0.2
  }
});

// 4. Generate voice
const voice = await use_mcp_tool({
  server_name: 'elevenlabs',
  tool_name: 'generate',
  arguments: {
    text: summary.text,
    voice_id: "news_anchor_1"
  }
});

// 5. Mix audio
const podcast = await use_mcp_tool({
  server_name: 'audio-mixer',
  tool_name: 'mix',
  arguments: {
    tracks: [
      { type: "voice", content: voice },
      { type: "background", content: music }
    ],
    format: "mp3",
    quality: "high"
  }
});
```

### AI Band Creation
```typescript
// 1. Generate melody
const melody = await use_mcp_tool({
  server_name: 'riffusion',
  tool_name: 'generate',
  arguments: {
    prompt: "Catchy pop melody",
    duration: 60
  }
});

// 2. Generate accompaniment
const instruments = ["drums", "bass", "guitar", "synth"].map(async (instrument) => 
  await use_mcp_tool({
    server_name: 'audiocraft',
    tool_name: 'generate',
    arguments: {
      prompt: `${instrument} accompaniment`,
      duration: 60,
      reference: melody
    }
  })
);

// 3. Mix tracks
const song = await use_mcp_tool({
  server_name: 'audio-mixer',
  tool_name: 'mix',
  arguments: {
    tracks: [melody, ...instruments],
    effects: ["compression", "eq", "reverb"],
    format: "wav"
  }
});
```

## Configuration

Each server requires specific environment variables for API access:

```env
# Ideogram
IDEOGRAM_API_KEY=your_key_here
IDEOGRAM_API_URL=https://api.ideogram.ai/v1

# Flux
FLUX_API_KEY=your_key_here
FLUX_API_URL=https://api.flux.ai/v1

# Riffusion
RIFFUSION_API_KEY=your_key_here
RIFFUSION_API_URL=https://api.riffusion.com/v1

# AudioCraft
AUDIOCRAFT_API_KEY=your_key_here
AUDIOCRAFT_API_URL=https://api.audiocraft.ai/v1

# ElevenLabs
ELEVENLABS_API_KEY=your_key_here
ELEVENLABS_API_URL=https://api.elevenlabs.io/v1

# Coqui
COQUI_API_KEY=your_key_here
COQUI_API_URL=https://api.coqui.ai/v1

# Hugging Face
HUGGINGFACE_API_KEY=your_key_here
HUGGINGFACE_API_URL=https://api-inference.huggingface.co/models

# Replicate
REPLICATE_API_KEY=your_key_here
REPLICATE_API_URL=https://api.replicate.com/v1
```

## Implementation Notes

- All servers implement rate limiting and error handling
- Responses are cached when appropriate
- Progress callbacks for long-running operations
- Automatic retries for transient failures
- Webhook support for async operations

## Future Enhancements

1. Add support for:
   - Stable Diffusion fine-tuning
   - Custom voice model training
   - Real-time collaboration
   - Advanced audio effects
   - Video generation

2. Improve:
   - Response time optimization
   - Resource usage monitoring
   - Error recovery
   - Quality control
   - Cost optimization

3. Integrate with:
   - More cloud providers
   - Additional AI models
   - Streaming platforms
   - Content delivery networks
   - Analytics services