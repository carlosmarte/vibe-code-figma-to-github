export function CardSamples() {
  return (
    <div className="border rounded-lg p-6 bg-white">
      <h4 className="text-lg font-semibold text-gray-900 mb-4">Cards</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Basic Card */}
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <h5 className="font-semibold text-gray-900 mb-2">Basic Card</h5>
          <p className="text-sm text-gray-600">
            This is a simple card with a title and some content. Perfect for displaying basic information.
          </p>
        </div>

        {/* Card with Image */}
        <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
          <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600"></div>
          <div className="p-4">
            <h5 className="font-semibold text-gray-900 mb-2">Card with Image</h5>
            <p className="text-sm text-gray-600 mb-3">
              Beautiful gradient header with content below.
            </p>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Learn more →
            </button>
          </div>
        </div>

        {/* Card with Actions */}
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <h5 className="font-semibold text-gray-900">Interactive Card</h5>
            <button className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Cards can include action buttons and menus.
          </p>
          <div className="flex gap-2">
            <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
              Action
            </button>
            <button className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>

        {/* Profile Card */}
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
            <div>
              <h5 className="font-semibold text-gray-900">John Doe</h5>
              <p className="text-sm text-gray-500">Software Engineer</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Building amazing products with modern technologies.
          </p>
          <div className="flex gap-2">
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">React</span>
            <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">Node.js</span>
            <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded">TypeScript</span>
          </div>
        </div>

        {/* Stats Card */}
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h5 className="text-sm font-medium text-gray-500">Total Revenue</h5>
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-gray-900">$45,231.89</p>
          <p className="text-sm text-green-600 mt-1">+20.1% from last month</p>
        </div>

        {/* Notification Card */}
        <div className="border-l-4 border-blue-500 rounded-lg p-4 bg-blue-50">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <h5 className="font-semibold text-blue-900">Information</h5>
              <p className="text-sm text-blue-700 mt-1">
                A new software update is available. See what's new in version 2.0.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}