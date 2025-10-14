# Testing Guide - CA Delivery Vans Analytics

Quick reference for running tests and understanding the test infrastructure.

---

## Quick Start

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run full validation (lint + test + build)
npm run validate
```

---

## Test Commands

| Command | Description | Expected Result |
|---------|-------------|-----------------|
| `npm test` | Run all tests | 33 tests pass |
| `npm run test:coverage` | Run tests + generate coverage report | 91.66% coverage |
| `npm run lint` | Run ESLint on src and tests | 0 errors |
| `npm run build` | Compile TypeScript to JavaScript | dist/ folder created |
| `npm run validate` | Run all validation gates | All pass |

---

## Test Structure

```
tests/
├── unit/                      # Unit tests (23 tests)
│   ├── server.test.ts        # Server health checks (4 tests)
│   ├── upload.test.ts        # Upload endpoint (5 tests)
│   └── validator.test.ts     # Nash validation (14 tests)
├── integration/               # Integration tests (10 tests)
│   └── upload-flow.test.ts   # End-to-end flow (10 tests)
└── fixtures/                  # Test data
    ├── valid-nash.csv        # Valid Nash format
    └── invalid-nash.csv      # Invalid Nash format (bad date)
```

---

## What Each Test Suite Covers

### Server Tests (`tests/unit/server.test.ts`)
- Health check endpoint functionality
- Correct JSON response structure
- ISO timestamp validation
- Port configuration

### Upload Tests (`tests/unit/upload.test.ts`)
- CSV file acceptance
- Non-CSV file rejection
- 50MB file size limit
- Missing file error handling
- Response format validation

### Validator Tests (`tests/unit/validator.test.ts`)
- Column name validation (case-sensitive)
- Missing column detection
- Data type validation (Store Id must be numeric)
- Date format validation
- CA store filtering (2082, 2242, 5930)
- Carrier validation (FOX, NTG, FDC)
- Edge cases (empty files, non-existent files)

### Integration Tests (`tests/integration/upload-flow.test.ts`)
- Complete upload → validation flow
- Error message quality
- Statistics tracking
- CA vs non-CA store handling
- Corrupted file handling

---

## Coverage Thresholds

All thresholds set to **80%** in `jest.config.js`:

- Statements: 91.66% ✅ (exceeds 80%)
- Branches: 82.05% ✅ (exceeds 80%)
- Functions: 92.85% ✅ (exceeds 80%)
- Lines: 92.23% ✅ (exceeds 80%)

**Status**: All thresholds met

---

## Viewing Coverage Report

```bash
# Generate coverage report
npm run test:coverage

# Open HTML coverage report
open coverage/index.html
```

Coverage reports are in `coverage/` directory:
- `coverage/lcov-report/index.html` - Detailed HTML report
- `coverage/lcov.info` - LCOV format for CI tools
- `coverage/` folder is git-ignored

---

## Running Specific Tests

```bash
# Run single test file
npx jest tests/unit/server.test.ts

# Run tests matching pattern
npx jest --testNamePattern="health check"

# Run tests in watch mode
npx jest --watch

# Run with verbose output
npx jest --verbose
```

---

## Expected Console Warnings

These console errors are **expected** during tests (they test error handling):

1. **"Only CSV files are allowed"** - When testing non-CSV file rejection
2. **"File too large"** - When testing 50MB file size limit
3. **"ENOENT: no such file or directory"** - When multer tries to clean up rejected files

These are **not bugs** - they indicate error handling is working correctly.

---

## Adding New Tests

### 1. Unit Test Template

```typescript
import request from 'supertest';
import app from '../../src/ui-server';

describe('Feature Name', () => {
  describe('Specific Functionality', () => {
    it('should do something specific', async () => {
      // Arrange
      const testData = { /* setup */ };

      // Act
      const response = await request(app)
        .post('/api/endpoint')
        .send(testData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
```

### 2. Integration Test Template

```typescript
import request from 'supertest';
import app from '../../src/ui-server';
import { SomeUtil } from '../../src/utils/some-util';

describe('End-to-End Feature Flow', () => {
  it('should complete full workflow', async () => {
    // Step 1: Upload
    const uploadRes = await request(app)
      .post('/api/upload')
      .attach('file', testFilePath);
    expect(uploadRes.status).toBe(200);

    // Step 2: Validate
    const validation = await SomeUtil.validate(testFilePath);
    expect(validation.valid).toBe(true);

    // Step 3: Check Results
    // ... assertions
  });
});
```

---

## Test Fixtures

### Valid Nash CSV
- Path: `tests/fixtures/valid-nash.csv`
- Contains: 3 CA stores (2082, 2242, 5930)
- Carriers: FOX, NTG
- Purpose: Test successful validation

### Invalid Nash CSV
- Path: `tests/fixtures/invalid-nash.csv`
- Contains: Invalid date ("invalid-date")
- Purpose: Test error detection

### Creating New Fixtures

```bash
# Create new fixture
touch tests/fixtures/my-test-data.csv

# Add to .gitignore if temporary
echo "tests/fixtures/temp-*.csv" >> .gitignore
```

---

## Troubleshooting

### Tests Failing with "Cannot find module"
```bash
npm install
npm run build
```

### Tests Hanging or Not Completing
- Check for `app.listen()` without `NODE_ENV` check
- Ensure async tests use `async/await` or return promises
- Add `--detectOpenHandles` flag: `npx jest --detectOpenHandles`

### Coverage Not Meeting Threshold
```bash
# View detailed coverage report
npm run test:coverage
open coverage/lcov-report/index.html

# Find uncovered lines
npx jest --coverage --verbose
```

### TypeScript Compilation Errors
```bash
# Check TypeScript config
cat tsconfig.json

# Clean build
rm -rf dist/
npm run build
```

---

## CI/CD Integration

For continuous integration, use:

```yaml
# Example GitHub Actions
- name: Run Tests
  run: npm run validate

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

---

## Test Best Practices

1. **Test Isolation**: Each test should be independent
2. **Cleanup**: Use `afterAll()` to clean up test files
3. **Descriptive Names**: Use clear test descriptions
4. **Arrange-Act-Assert**: Structure tests clearly
5. **Edge Cases**: Test error conditions and boundaries
6. **Mocking**: Mock external dependencies (databases, APIs)

---

## Next Phase Testing

### Phase 2 Tests to Add
- [ ] Store registry persistence tests
- [ ] Rate card CRUD API tests
- [ ] Spark CPD bulk upload tests
- [ ] Python validator integration tests

### Phase 3 Tests to Add
- [ ] Analytics engine tests (Python)
- [ ] Dashboard API endpoint tests
- [ ] Performance tests (large CSV files)

### Phase 4 Tests to Add
- [ ] Frontend UI tests (if applicable)
- [ ] E2E tests with Selenium/Playwright
- [ ] Load testing with k6 or Artillery

---

## Resources

- **Jest Documentation**: https://jestjs.io/docs/getting-started
- **Supertest Documentation**: https://github.com/visionmedia/supertest
- **TypeScript Testing**: https://jestjs.io/docs/getting-started#using-typescript

---

**Last Updated**: 2025-10-13
**Test Count**: 33 tests
**Coverage**: 91.66%
**Status**: All Passing ✅
