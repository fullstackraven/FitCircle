// Minimal test without any external dependencies
function SimpleApp() {
  return (
    <div className="min-h-screen bg-[hsl(222,47%,11%)] text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">FitCircle - App Test</h1>
        <p className="text-gray-300">Testing basic React functionality</p>
        <div className="mt-8 grid grid-cols-2 gap-4 max-w-md">
          <div className="bg-blue-600 p-4 rounded">Hydration</div>
          <div className="bg-purple-600 p-4 rounded">Meditation</div>
          <div className="bg-amber-600 p-4 rounded">Fasting</div>
          <div className="bg-green-600 p-4 rounded">Weight</div>
        </div>
      </div>
    </div>
  );
}

export default SimpleApp;