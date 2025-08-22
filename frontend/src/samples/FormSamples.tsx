export function FormSamples() {
  return (
    <div className="border rounded-lg p-6 bg-white">
      <h4 className="text-lg font-semibold text-gray-900 mb-4">Forms</h4>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Login Form */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <h5 className="font-semibold text-gray-900 mb-4">Login Form</h5>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-blue-600" />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <a href="#" className="text-sm text-blue-600 hover:text-blue-700">
                Forgot password?
              </a>
            </div>
            <button
              type="submit"
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Sign In
            </button>
          </form>
        </div>

        {/* Contact Form */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <h5 className="font-semibold text-gray-900 mb-4">Contact Form</h5>
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Doe"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="john@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your message..."
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Send Message
            </button>
          </form>
        </div>

        {/* Settings Form */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <h5 className="font-semibold text-gray-900 mb-4">Settings Form</h5>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Name
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                defaultValue="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bio
              </label>
              <textarea
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                defaultValue="Software developer passionate about creating amazing user experiences."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notifications
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input type="checkbox" className="rounded border-gray-300 text-blue-600" defaultChecked />
                  <span className="ml-2 text-sm text-gray-600">Email notifications</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="rounded border-gray-300 text-blue-600" />
                  <span className="ml-2 text-sm text-gray-600">SMS notifications</span>
                </label>
              </div>
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900"
            >
              Save Settings
            </button>
          </form>
        </div>

        {/* Search Form */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <h5 className="font-semibold text-gray-900 mb-4">Search Forms</h5>
          <div className="space-y-4">
            {/* Basic Search */}
            <div className="flex gap-2">
              <input
                type="search"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search..."
              />
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Search
              </button>
            </div>
            
            {/* Advanced Search */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>All Categories</option>
                  <option>Products</option>
                  <option>Services</option>
                  <option>Articles</option>
                </select>
                <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Any Time</option>
                  <option>Last 24 Hours</option>
                  <option>Last Week</option>
                  <option>Last Month</option>
                </select>
              </div>
              <div className="flex gap-2">
                <input
                  type="search"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Advanced search..."
                />
                <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
                  Filter
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}