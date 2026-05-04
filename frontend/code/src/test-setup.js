import '@testing-library/jest-dom'

// Polyfill ResizeObserver for jsdom (used by @xyflow/react)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}


