# Swift Localizer

A powerful CLI tool to scan, validate, and translate Xcode `.xcstrings` localization files using AI. Perfect for Swift and SwiftUI projects that need professional localization without expensive subscription services.

## Features

- **Direct `.xcstrings` editing** - No need for `.xcloc` export/import workflows
- **AI-powered translation** - Uses OpenAI models for high-quality translations
- **Placeholder preservation** - Automatically maintains `%d`, `%lld`, `%1$@`, `%f`, `\(amount)` tokens
- **Batch processing** - Efficient parallel translation with configurable concurrency
- **Validation & repair** - Comprehensive validation and automatic placeholder fixing
- **Formality control** - Adjust translation register (formal/informal) for specific languages
- **Proofreading suggestions** - Get AI-powered improvement suggestions
- **Multi-language support** - Supports all languages that OpenAI can translate and Apple supports in Xcode

## Installation

```bash
npm install -g swift-localizer
```

Or install locally in your project:

```bash
npm install swift-localizer
```

## Quick Start

1. **Set up your OpenAI API key:**
   ```bash
   export OPENAI_API_KEY="your-api-key-here"
   ```

2. **Scan your localization file:**
   ```bash
   swift-localizer scan --in Localizable.xcstrings --langs ko
   ```

3. **Translate to Korean:**
   ```bash
   swift-localizer translate --in Localizable.xcstrings --langs ko
   ```

4. **Validate the results:**
   ```bash
   swift-localizer validate --in Localizable.xcstrings --langs ko
   ```

## Commands

### Scan
Analyze your `.xcstrings` file to see what needs translation:
```bash
swift-localizer scan --in Localizable.xcstrings --langs ko
```

### Translate
Translate your strings using AI:
```bash
swift-localizer translate --in Localizable.xcstrings --langs ko
```

### Validate
Check for translation issues and placeholder mismatches:
```bash
swift-localizer validate --in Localizable.xcstrings --langs ko
```

### Repair Placeholders
Fix positional placeholder mismatches automatically:
```bash
swift-localizer repair-placeholders --in Localizable.xcstrings --langs ko
```

### Proofread
One-command solution: repair, translate empties, and validate:
```bash
swift-localizer proofread --in Localizable.xcstrings --langs ko --fix-placeholders --fill-empties
```

### Formality
Adjust translation register (formal/informal):
```bash
swift-localizer formality --in Localizable.xcstrings --lang zh-Hans --register formal
```

### Suggest
Get improvement suggestions and optionally apply them:
```bash
swift-localizer suggest --in Localizable.xcstrings --lang de --apply
```

## Options

- `--in <path>`: Path to input `.xcstrings` file
- `--out <path>`: Output path (defaults to overwriting input)
- `--langs <list>`: Comma-separated language codes
- `--model <model>`: OpenAI model (default: gpt-4.1-nano)
- `--concurrency <n>`: Parallel requests (default: 8)
- `--batch-size <n>`: Items per request (default: 25)
- `--max-keys <n>`: Limit keys for pilot runs
- `--only-empties`: Translate only empty entries
- `--include-keys <list>`: Specific keys to include
- `--dry-run`: Simulate without writing changes

## Supported Languages

Swift Localizer supports all languages that OpenAI can translate and Apple supports in Xcode. This includes but is not limited to:

**Common Languages:**
- English (source): `en`
- Arabic: `ar`
- Chinese (Simplified): `zh-Hans`
- Chinese (Traditional): `zh-Hant`
- French: `fr`
- German: `de`
- Hindi: `hi`
- Italian: `it`
- Japanese: `ja`
- Korean: `ko`
- Portuguese (Brazil): `pt-BR`
- Portuguese (Portugal): `pt-PT`
- Spanish: `es`
- Spanish (Latin America): `es-419`
- Vietnamese: `vi`

**Additional Languages:**
- Dutch: `nl`
- Russian: `ru`
- Turkish: `tr`
- Polish: `pl`
- Swedish: `sv`
- Norwegian: `no`
- Danish: `da`
- Finnish: `fi`
- Greek: `el`
- Hebrew: `he`
- Thai: `th`
- Indonesian: `id`
- Malay: `ms`
- And many more...

Simply use the appropriate language code (e.g., `fr`, `de`, `ja`) and Swift Localizer will handle the translation using OpenAI's advanced language capabilities.

## Advanced Usage

### Pilot Translation
Test with a small subset first:
```bash
swift-localizer translate --in Localizable.xcstrings \
  --out Localizable.ko.test.xcstrings \
  --langs ko --max-keys 50
```

### Surgical Translation
Translate only specific keys:
```bash
swift-localizer translate --in Localizable.xcstrings \
  --langs ko --include-keys "Welcome back,Sign in"
```

### Batch Processing
Optimize for large catalogs:
```bash
swift-localizer translate --in Localizable.xcstrings \
  --langs ko --concurrency 4 --batch-size 20
```

## Development

```bash
git clone https://github.com/jeef84/swift-localizer.git
cd swift-localizer
npm install
npm run build
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Why Swift Localizer?

- **No subscriptions** - Pay only for OpenAI API usage
- **Direct integration** - Works with your existing `.xcstrings` files
- **Professional quality** - AI-powered translations that rival human translators
- **Developer-friendly** - Built by developers, for developers
- **Open source** - Transparent, customizable, and community-driven

## Support

- [GitHub Issues](https://github.com/jeef84/swift-localizer/issues)
- [Documentation](https://github.com/jeef84/swift-localizer#readme)
- [Examples](https://github.com/jeef84/swift-localizer/examples)

---

Made with ❤️ for the Swift community
