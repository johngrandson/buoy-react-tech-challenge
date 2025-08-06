# TDD Helper for React Applications

You are helping to implement Test-Driven Development (TDD) for React applications following modern testing patterns.

The user wants TDD for the following functionality: $ARGUMENTS. Ask for more clarity if not enough is provided.

## Instructions

1. **TDD Workflow**:
   - **Red**: Write failing test first
   - **Green**: Write minimal code to make test pass
   - **Refactor**: Improve code while keeping tests passing

2. **Test-First Approach**:
   - Start with business requirements
   - Write tests that describe expected behavior
   - Implement features to satisfy tests
   - Refactor with confidence

3. **React TDD Patterns**:

### **Business Logic Testing (Custom Hooks/Services)**
```javascript
// Test business logic first
import { renderHook, act } from '@testing-library/react';
import { useProducts } from './useProducts';
import { productService } from './productService';

jest.mock('./productService');

describe('useProducts', () => {
  test('creates product with valid data', async () => {
    const mockProduct = { id: 1, name: 'Test Product', price: 100 };
    productService.createProduct.mockResolvedValue(mockProduct);

    const { result } = renderHook(() => useProducts());

    await act(async () => {
      await result.current.createProduct({ name: 'Test Product', price: 100 });
    });

    expect(result.current.products).toContain(mockProduct);
    expect(productService.createProduct).toHaveBeenCalledWith({
      name: 'Test Product',
      price: 100
    });
  });

  test('handles invalid data with error state', async () => {
    const error = new Error('Invalid product data');
    productService.createProduct.mockRejectedValue(error);

    const { result } = renderHook(() => useProducts());

    await act(async () => {
      await result.current.createProduct({ name: '', price: -1 });
    });

    expect(result.current.error).toBe(error.message);
    expect(result.current.products).toHaveLength(0);
  });
});
```

### **Component Integration Testing**
```javascript
// Test component interactions
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductList } from './ProductList';
import { productService } from './productService';

jest.mock('./productService');

describe('ProductList', () => {
  test('displays product list', async () => {
    const mockProducts = [
      { id: 1, name: 'Product 1', price: 50 },
      { id: 2, name: 'Product 2', price: 100 }
    ];
    productService.getProducts.mockResolvedValue(mockProducts);

    render(<ProductList />);

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
      expect(screen.getByText('Product 2')).toBeInTheDocument();
    });

    expect(screen.getByTestId('product-1')).toBeInTheDocument();
    expect(screen.getByTestId('product-2')).toBeInTheDocument();
  });

  test('creates product via form submission', async () => {
    const user = userEvent.setup();
    const mockProduct = { id: 3, name: 'New Product', price: 75 };
    productService.createProduct.mockResolvedValue(mockProduct);

    render(<ProductList />);

    // Fill form
    await user.type(screen.getByLabelText(/product name/i), 'New Product');
    await user.type(screen.getByLabelText(/price/i), '75');
    await user.click(screen.getByRole('button', { name: /create product/i }));

    await waitFor(() => {
      expect(screen.getByText('New Product')).toBeInTheDocument();
    });

    expect(productService.createProduct).toHaveBeenCalledWith({
      name: 'New Product',
      price: 75
    });
  });
});
```

### **Component Unit Testing**
```javascript
// Test individual components
import { render, screen } from '@testing-library/react';
import { ProductCard } from './ProductCard';

describe('ProductCard', () => {
  test('renders product card with all details', () => {
    const product = {
      id: 1,
      name: 'Test Product',
      price: 100,
      description: 'A great product'
    };

    render(<ProductCard product={product} />);

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$100')).toBeInTheDocument();
    expect(screen.getByText('A great product')).toBeInTheDocument();
    expect(screen.getByTestId('product-card')).toBeInTheDocument();
  });

  test('calls onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnDelete = jest.fn();
    const product = { id: 1, name: 'Test Product', price: 100 };

    render(<ProductCard product={product} onDelete={mockOnDelete} />);

    await user.click(screen.getByTestId('delete-product-1'));

    expect(mockOnDelete).toHaveBeenCalledWith(1);
  });
});
```

4. **TDD Best Practices**:

### **Start with High-Level Feature Tests**
- Write acceptance tests for user stories
- Test the complete user journey
- Use descriptive test names that explain business value

### **Work from Outside-In**
- Start with component integration tests
- Move to custom hooks/service tests
- End with individual utility function tests

### **Use Test Data Builders**
- Create realistic test data with factory functions
- Use builders strategically
- Keep tests isolated and independent

### **Test Behavior, Not Implementation**
- Focus on what the component should do
- Test user interactions and outcomes
- Avoid testing internal implementation details

5. **React-Specific TDD Patterns**:

### **Event Handling**
```javascript
// Test user interactions
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductManager } from './ProductManager';

test('deletes product when delete button is clicked', async () => {
  const user = userEvent.setup();
  const mockProducts = [{ id: 1, name: 'Product 1', price: 50 }];
  
  render(<ProductManager initialProducts={mockProducts} />);

  expect(screen.getByTestId('product-1')).toBeInTheDocument();

  await user.click(screen.getByTestId('delete-product-1'));

  expect(screen.queryByTestId('product-1')).not.toBeInTheDocument();
});
```

### **Form Validation**
```javascript
// Test real-time validation
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductForm } from './ProductForm';

test('displays validation errors on invalid input', async () => {
  const user = userEvent.setup();

  render(<ProductForm />);

  // Trigger validation by submitting empty form
  await user.click(screen.getByRole('button', { name: /submit/i }));

  expect(screen.getByTestId('name-error')).toHaveTextContent("Name can't be blank");
  
  // Test price validation
  await user.type(screen.getByLabelText(/price/i), '-1');
  await user.tab(); // Trigger blur event

  expect(screen.getByTestId('price-error')).toHaveTextContent('Price must be greater than 0');
});
```

### **Context/State Management Testing**
```javascript
// Test context providers
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from './AuthContext';

const TestComponent = () => {
  const { user, login, logout } = useAuth();
  
  return (
    <div>
      {user ? (
        <div>
          <span data-testid="welcome">Welcome, {user.email}</span>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <button onClick={() => login('test@example.com')}>Login</button>
      )}
    </div>
  );
};

test('handles user authentication flow', async () => {
  const user = userEvent.setup();

  render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  );

  // Initially not logged in
  expect(screen.getByText('Login')).toBeInTheDocument();

  // Log in
  await user.click(screen.getByText('Login'));

  expect(screen.getByTestId('welcome')).toHaveTextContent('Welcome, test@example.com');

  // Log out
  await user.click(screen.getByText('Logout'));

  expect(screen.getByText('Login')).toBeInTheDocument();
});
```

### **API Integration Testing**
```javascript
// Test API integration with MSW
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductList } from './ProductList';

const server = setupServer(
  rest.get('/api/products', (req, res, ctx) => {
    return res(
      ctx.json([
        { id: 1, name: 'Product 1', price: 50 }
      ])
    );
  }),
  
  rest.post('/api/products', (req, res, ctx) => {
    const { name, price } = req.body;
    return res(
      ctx.json({ id: 2, name, price })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('loads and displays products from API', async () => {
  render(<ProductList />);

  await waitFor(() => {
    expect(screen.getByText('Product 1')).toBeInTheDocument();
  });
});
```

6. **TDD Workflow Helper**:

### **Step 1: Write the Test**
- Describe the expected user behavior
- Use clear, descriptive test names
- Set up necessary test data and mocks

### **Step 2: Run Tests (Red)**
- Ensure the test fails for the right reason
- Verify error messages are helpful

### **Step 3: Write Minimal Code (Green)**
- Implement just enough to make the test pass
- Don't over-engineer the solution

### **Step 4: Refactor**
- Improve code quality while keeping tests green
- Extract common patterns
- Follow React best practices

## Testing Tools Setup

```javascript
// Essential testing dependencies
{
  "@testing-library/react": "^13.4.0",
  "@testing-library/jest-dom": "^5.16.5",
  "@testing-library/user-event": "^14.4.3",
  "jest": "^29.3.1",
  "msw": "^0.49.2"
}

// setupTests.js
import '@testing-library/jest-dom';

// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};
```

## Example Usage

Tell me:
- What feature are you implementing?
- What is the expected user behavior?
- What React components are needed?
- What business rules should be enforced?
- What state management approach are you using?

I'll help you write tests first, then implement the feature following TDD principles and React best practices.