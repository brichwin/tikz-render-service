# TikZ Render Service

A Node.js Express service that compiles TikZ LaTeX code snippets and returns rendered images in SVG or PNG format, with optional AI-generated accessibility descriptions.

## Features

- Render TikZ pictures to SVG or PNG
- AI-generated accessibility descriptions (alt-text and long descriptions)
- Built-in caching for improved performance (images and descriptions)
- Request rate limiting to prevent abuse
- Compilation queue to manage server resources
- Input validation and sanitization
- Configurable timeouts for compilation safety
- Health check endpoint for monitoring

<img width="2570" height="5134" alt="TikZ service output showing TikZ source code, debug output, rendered mathematical plot, and AI generated short and long description" src="https://github.com/user-attachments/assets/0da72393-699c-4dec-bc21-e249429d85fa" />


## Prerequisites

### System Dependencies

This service requires a LaTeX distribution and PDF conversion tools:

**Ubuntu/Debian:**

```bash
sudo apt-get update
sudo apt-get install -y texlive texlive-latex-extra texlive-pictures pdf2svg poppler-utils
```

**macOS (using Homebrew):**

First, fix Homebrew permissions if needed:

```bash
sudo chown -R $(whoami) /opt/homebrew
```

Then install the packages:

```bash
# Full MacTeX (recommended, ~4GB)
brew install --cask mactex

# OR BasicTeX (smaller, ~100MB, requires additional packages)
brew install --cask basictex
sudo tlmgr update --self
sudo tlmgr install pgf tikz-cd standalone preview

# Install conversion tools
brew install pdf2svg poppler

# Update your PATH
eval "$(/usr/libexec/path_helper)"
```

**Fedora/RHEL:**

```bash
sudo dnf install texlive texlive-latex texlive-pgf pdf2svg poppler-utils
```

### Node.js

Node.js version 14 or higher is required.

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd tikz-render-service
```

2. Install Node.js dependencies:

```bash
npm install
```

3. Install the Anthropic SDK for AI descriptions (optional):

```bash
npm install @anthropic-ai/sdk
```

4. Create environment configuration:

```bash
cp .env.example .env
```

5. Edit `.env` to customize settings:

```
PORT=3010
NODE_ENV=development
TEMP_DIR=./temp
ANTHROPIC_API_KEY=your_api_key_here
```

6. **IMPORTANT: Secure your API key**
   - Never commit `.env` to version control
   - Ensure `.env` is listed in `.gitignore`
   - Use environment variables in production
   - Rotate keys if accidentally exposed

7. Start the service:

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

## Getting an Anthropic API Key

AI-generated descriptions require an Anthropic API key. Here's how to get one:

### Step 1: Sign Up

1. Go to <https://console.anthropic.com>
2. Click "Sign Up" and create an account
3. Verify your email address

### Step 2: Add Payment Method

1. Navigate to **Settings** → **Billing**
2. Add a credit card (required for API access)
3. Anthropic uses pay-as-you-go pricing

### Step 3: Create API Key

1. Go to **Settings** → **API Keys** (<https://console.anthropic.com/settings/keys>)
2. Click **"Create Key"**
3. Give your key a name (e.g., "TikZ Render Service")
4. **Copy the key immediately** - you won't see it again!

### Step 4: Add to Your Project

Add the key to your `.env` file:

```bash
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxx
```

### Pricing

**Claude Sonnet 4.5** (default model):

- Input: $3 per million tokens
- Output: $15 per million tokens
- **~$0.01-0.02 per description** (1-2 cents)

**Cost-Saving Option**: Use Claude Haiku instead (modify `src/services/descriptionService.js`):

```javascript
model: 'claude-3-haiku-20240307',  // ~$0.001-0.002 per description
```

### Rate Limits

- Free tier: 5 requests/minute, 50 requests/day
- Paid tier: Higher limits based on usage

### Running Without AI Descriptions

The service works perfectly without an API key - simply:

- Don't add `ANTHROPIC_API_KEY` to `.env`
- AI description features will be disabled
- All other functionality remains available

## API Reference

### POST /api/render

Render a TikZ picture to SVG or PNG.

**Request Body:**

```json
{
  "tikzCode": "\\begin{tikzpicture}\n\\draw (0,0) circle (1cm);\n\\end{tikzpicture}",
  "format": "svg"
}
```

**Parameters:**

- `tikzCode` (string, required): The TikZ picture code
- `format` (string, optional): Output format, either `svg` or `png`. Default: `svg`

**Response:**

- Content-Type: `image/svg+xml` or `image/png`
- Body: The rendered image

**Headers:**

- `X-Cache`: `HIT` if served from cache, `MISS` if freshly rendered

**Example using curl:**

```bash
curl -X POST http://localhost:3010/api/render \
  -H "Content-Type: application/json" \
  -d '{
    "tikzCode": "\\begin{tikzpicture}\\draw[->] (0,0) -- (2,0);\\end{tikzpicture}",
    "format": "svg"
  }' \
  --output arrow.svg
```

### POST /api/describe

Generate AI accessibility descriptions for a TikZ diagram.

**Request Body:**

```json
{
  "tikzCode": "\\begin{tikzpicture}\\draw (0,0) circle (1cm);\\end{tikzpicture}",
  "imageBase64": "iVBORw0KGgoAAAANS...",
  "format": "png"
}
```

**Parameters:**

- `tikzCode` (string, required): The TikZ picture code
- `imageBase64` (string, required): Base64-encoded PNG image
- `format` (string, optional): Image format (currently only `png` supported). Default: `png`

**Response:**

```json
{
  "altText": "Circle with 1cm radius centered at origin",
  "longDescription": "<p>A simple geometric diagram showing a circle with a radius of 1 centimeter. The circle is centered at the coordinate origin (0,0).</p>",
  "cached": false
}
```

**Response Fields:**

- `altText` (string): Short description (≤150 characters) for HTML alt attribute
- `longDescription` (string): Detailed HTML description
- `cached` (boolean): Whether the description was served from cache

**Note**: AI descriptions only work with PNG format due to Claude API limitations.

**Example using curl:**

```bash
# First, render and get the base64 image
curl -X POST http://localhost:3010/api/render \
  -H "Content-Type: application/json" \
  -d '{"tikzCode":"\\begin{tikzpicture}\\draw (0,0) circle (1cm);\\end{tikzpicture}","format":"png"}' \
  | base64 > image.b64

# Then generate description
curl -X POST http://localhost:3010/api/describe \
  -H "Content-Type: application/json" \
  -d "{\"tikzCode\":\"\\\\begin{tikzpicture}\\\\draw (0,0) circle (1cm);\\\\end{tikzpicture}\",\"imageBase64\":\"$(cat image.b64)\",\"format\":\"png\"}"
```

### GET /api/health

Health check endpoint that returns service status and statistics.

**Response:**

```json
{
  "status": "healthy",
  "queue": {
    "running": 1,
    "queued": 3,
    "maxConcurrent": 2
  },
  "cache": {
    "keys": 42,
    "hits": 156,
    "misses": 73
  },
  "aiDescriptions": true
}
```

**Response Fields:**

- `status`: Overall service health ("healthy" or "unhealthy")
- `queue`: Compilation queue statistics
- `cache`: Cache hit/miss statistics (includes both images and descriptions)
- `aiDescriptions`: Whether AI descriptions are enabled (API key configured)

## Usage Examples

### Basic HTML Demo

A simple HTML page for testing (open directly in browser, not via Live Server):

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>TikZ Render Demo</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        textarea { width: 100%; height: 200px; font-family: monospace; padding: 10px; box-sizing: border-box; }
        button { padding: 10px 20px; font-size: 16px; cursor: pointer; margin-right: 10px; }
        #result { margin-top: 20px; border: 1px solid #ccc; padding: 20px; text-align: center; }
        #error { color: red; margin-top: 10px; }
    </style>
</head>
<body>
    <h1>TikZ Render Service Demo</h1>
    <textarea id="tikzInput">\begin{tikzpicture}
  \draw[->] (0,0) -- (4,0) node[right] {$x$};
  \draw[->] (0,0) -- (0,3) node[above] {$y$};
  \draw[blue, thick, domain=0:4, samples=100] plot (\x, {2*sin(\x r)});
\end{tikzpicture}</textarea>
    
    <div>
        <button type="button" onclick="render('svg')">Render as SVG</button>
        <button type="button" onclick="render('png')">Render as PNG</button>
    </div>
    
    <div id="error"></div>
    <div id="result"></div>

    <script>
        const API_URL = 'http://localhost:3010/api/render';
        
        async function render(format) {
            const tikzCode = document.getElementById('tikzInput').value;
            const resultDiv = document.getElementById('result');
            const errorDiv = document.getElementById('error');
            
            resultDiv.innerHTML = '<p>Rendering...</p>';
            errorDiv.textContent = '';
            
            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tikzCode, format })
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Rendering failed');
                }
                
                const blob = await response.blob();
                const imageUrl = URL.createObjectURL(blob);
                const cacheStatus = response.headers.get('X-Cache');
                
                resultDiv.innerHTML = `
                    <p>Result (${cacheStatus === 'HIT' ? 'from cache' : 'freshly rendered'}):</p>
                    <img src="${imageUrl}" alt="Rendered TikZ" style="max-width: 100%;">
                `;
            } catch (error) {
                resultDiv.innerHTML = '';
                errorDiv.textContent = 'Error: ' + error.message;
            }
        }
    </script>
</body>
</html>
```

**Important**: Open this HTML file directly in your browser (drag and drop or File → Open), not through VS Code Live Server, to avoid auto-reload issues.

### With AI Descriptions

See the included `demo-with-ai.html` for a complete example with AI-generated accessibility descriptions.

## Configuration

### Environment Variables

- `PORT`: Server port (default: 3010)
- `NODE_ENV`: Environment mode (development/production)
- `TEMP_DIR`: Directory for temporary files (default: ./temp)
- `ANTHROPIC_API_KEY`: API key for AI descriptions (optional)

### Constants

Edit `src/config/constants.js` to adjust:

- `MAX_TIKZ_SIZE`: Maximum TikZ code size in bytes (default: 50000)
- `MAX_CONCURRENT_COMPILATIONS`: Maximum parallel LaTeX compilations (default: 2)
- `LATEX_TIMEOUT`: LaTeX compilation timeout in milliseconds (default: 30000)
- `CONVERSION_TIMEOUT`: PDF conversion timeout in milliseconds (default: 10000)
- `CACHE_TTL`: Cache time-to-live in seconds (default: 3600)
- `RATE_LIMIT_WINDOW`: Rate limit window in milliseconds (default: 60000)
- `RATE_LIMIT_MAX`: Maximum requests per window (default: 20)

## Security Considerations

The service includes several security measures:

1. **Input Validation**: TikZ code is validated and dangerous LaTeX commands are blocked
2. **Size Limits**: Input size is limited to prevent memory exhaustion (5MB for describe endpoint)
3. **Rate Limiting**: Requests are rate-limited per IP address
4. **Timeouts**: Compilation processes have strict timeouts
5. **Sanitization**: File paths and commands are carefully sanitized
6. **API Key Security**: Never commit API keys to version control

### Blocked Commands

The following LaTeX commands are blocked for security:

- `\input{}`
- `\include{}`
- `\write18`
- `\immediate\write`
- `\openout`
- `\input|`

### API Key Security Best Practices

- **Never commit** `.env` files to version control
- Add `.env` to `.gitignore`
- Use environment variables in production deployments
- Rotate API keys if exposed
- Use separate keys for development and production
- Monitor API usage in Anthropic Console
- Set up billing alerts to prevent unexpected charges

## Performance

- **Image Caching**: Identical render requests are served from cache (1 hour TTL)
- **Description Caching**: AI descriptions are cached based on TikZ code (1 hour TTL)
- **Queue System**: Compilation requests are queued to prevent resource exhaustion
- **Concurrency Limit**: Only 2 compilations run simultaneously by default

**Cache Statistics:**

- Cache hit = instant response (< 10ms)
- Cache miss (render) = 1-30 seconds (depending on complexity)
- Cache miss (AI description) = 1-3 seconds (API call to Claude)

## Troubleshooting

### LaTeX Compilation Errors

If you receive compilation errors, check:

1. TikZ code syntax is correct
2. All required TikZ libraries are loaded
3. LaTeX is properly installed on the system
4. Check server logs for detailed error messages

### Timeout Errors

If compilations timeout:

1. Simplify the TikZ code
2. Increase timeout values in `src/config/constants.js`
3. Check system resources (CPU, memory)

### Permission Errors

Ensure the service has write permissions for the temp directory:

```bash
chmod 755 ./temp
```

### CORS Errors

If getting CORS errors from the browser:

1. Ensure the CORS middleware is properly configured in `src/app.js`
2. Open HTML files directly in browser (not through Live Server)
3. Or configure your development server's CORS settings

### AI Description Errors

**"ANTHROPIC_API_KEY not configured"**:

- Add your API key to `.env`
- Restart the server

**"request entity too large"**:

- Image too large for description
- Increase body size limit in `src/app.js`

**"Input should be 'image/jpeg', 'image/png'..."**:

- Use PNG format for AI descriptions
- SVG is not supported by Claude's vision API

### MacTeX Installation Issues

If Homebrew shows permission errors:

```bash
sudo chown -R $(whoami) /opt/homebrew
```

To verify MacTeX is installed:

```bash
which pdflatex
pdflatex --version
```

## Development

### Running Tests

```bash
npm test
```

### Project Structure

```
tikz-render-service/
├── src/
│   ├── config/          # Configuration files
│   ├── middleware/      # Express middleware
│   ├── services/        # Business logic
│   │   ├── compilationQueue.js
│   │   ├── cacheService.js
│   │   ├── latexCompiler.js
│   │   ├── imageConverter.js
│   │   └── descriptionService.js  # AI descriptions
│   ├── utils/           # Utility functions
│   ├── routes/          # API routes
│   │   ├── render.js
│   │   ├── describe.js  # AI description endpoint
│   │   └── index.js
│   ├── app.js           # Express app
│   └── server.js        # Server entry point
├── temp/                # Temporary files (gitignored)
├── tests/               # Test files
├── .env                 # Environment variables (gitignored)
├── .env.example         # Environment template
└── package.json
```

### Adding New Features

1. Create new service in `src/services/`
2. Add route in `src/routes/`
3. Update `src/routes/index.js` to register route
4. Add tests in `tests/`
5. Update README with new endpoint documentation

## License

This project is licensed under the GNU General Public License v3.0 only (GPL-3.0-only).

See the [LICENSE](LICENSE) file for details.

## Security

**Security Note**: Never include API keys or sensitive data in pull requests.

## Support

This repo is provided as-is without support.

## Acknowledgments

- Built with [Express](https://expressjs.com/)
- LaTeX rendering via [TeX Live](https://www.tug.org/texlive/)
- AI descriptions powered by [Anthropic Claude](https://www.anthropic.com/)
- PDF conversion using [pdf2svg](https://github.com/dawbarton/pdf2svg) and [Poppler](https://poppler.freedesktop.org/)
