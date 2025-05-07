export default function ErrorPage() {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
        <h1 className="text-4xl font-bold mb-4">Oops!</h1>
        <p className="text-xl mb-6">Sorry, an unexpected error has occurred.</p>
        <button 
          className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
          onClick={() => window.location.reload()}
        >
          Refresh Page
        </button>
      </div>
    );
  }
  