echo "=== Checking MacTeX Installation ==="
echo ""

# Check pdflatex
if command -v pdflatex &> /dev/null; then
    echo "✓ pdflatex found at: $(which pdflatex)"
    echo "  Version: $(pdflatex --version | head -n 1)"
else
    echo "✗ pdflatex not found"
fi

echo ""

# Check LaTeX directory
if [ -d "/Library/TeX" ]; then
    echo "✓ MacTeX directory exists at /Library/TeX"
else
    echo "✗ MacTeX directory not found"
fi

echo ""

# Check Homebrew installation
if brew list --cask mactex &> /dev/null; then
    echo "✓ MacTeX installed via Homebrew"
elif brew list --cask basictex &> /dev/null; then
    echo "✓ BasicTeX installed via Homebrew"
else
    echo "✗ Not installed via Homebrew"
fi

echo ""

# Check pdf2svg and poppler
if command -v pdf2svg &> /dev/null; then
    echo "✓ pdf2svg found at: $(which pdf2svg)"
else
    echo "✗ pdf2svg not found"
fi

if command -v pdftoppm &> /dev/null; then
    echo "✓ pdftoppm found at: $(which pdftoppm)"
else
    echo "✗ pdftoppm not found"
fi
