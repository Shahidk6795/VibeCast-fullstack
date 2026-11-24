import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('VibeCast UI Crash Caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 text-center">
          <h1 className="text-3xl font-black mb-2">Something went wrong</h1>
          <p className="text-gray-400 mb-6 max-w-md">
            A display error occurred. Reloading the page usually clears it right up.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => window.location.reload()}
              className="bg-[#1db954] hover:bg-[#1ed760] text-black font-bold px-6 py-3 rounded-full transition"
            >
              Reload App
            </button>
            <a
              href="/"
              className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3 rounded-full transition"
            >
              Go Home
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;