# Contributing to Swift Localizer

Thank you for your interest in contributing to Swift Localizer! This document provides guidelines and information for contributors.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/swift-localizer.git`
3. Install dependencies: `npm install`
4. Build the project: `npm run build`

## Development Workflow

1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Make your changes
3. Test your changes: `npm run dev scan --in test.xcstrings`
4. Build: `npm run build`
5. Commit with a clear message: `git commit -m "feat: add new language support"`
6. Push to your fork: `git push origin feature/your-feature-name`
7. Create a pull request

## Code Style

- Use TypeScript for all new code
- Follow existing naming conventions
- Use meaningful variable and function names
- Add JSDoc comments for public functions
- Keep functions small and focused

## Testing

- Test your changes with real `.xcstrings` files
- Ensure placeholder preservation works correctly
- Test with different language combinations
- Verify error handling works as expected

## Pull Request Guidelines

- Provide a clear description of what the PR does
- Include any relevant issue numbers
- Add tests if applicable
- Update documentation if needed
- Ensure the build passes: `npm run build`

## Commit Message Format

Use conventional commits format:

- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `style:` for formatting changes
- `refactor:` for code refactoring
- `test:` for adding tests
- `chore:` for maintenance tasks

## Questions or Need Help?

- Open an issue for bugs or feature requests
- Join our discussions in GitHub Issues
- Check existing documentation first

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
