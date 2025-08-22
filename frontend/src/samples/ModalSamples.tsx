import { useState } from 'react';

export function ModalSamples() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="border rounded-lg p-6 bg-white">
      <h4 className="text-lg font-semibold text-gray-900 mb-4">Modals & Dialogs</h4>
      
      <div className="space-y-6">
        {/* Modal Trigger */}
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-3">Interactive Modal</h5>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Open Modal
          </button>
        </div>

        {/* Static Modal Examples */}
        <div className="space-y-4">
          <h5 className="text-sm font-medium text-gray-700">Modal Variations (Static)</h5>
          
          {/* Simple Modal */}
          <div className="relative border rounded-lg p-6 bg-white shadow-lg max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Simple Modal</h3>
            <p className="text-sm text-gray-500 mb-4">
              This is a simple modal with a title and description.
            </p>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
                Confirm
              </button>
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm">
                Cancel
              </button>
            </div>
          </div>

          {/* Alert Dialog */}
          <div className="relative border rounded-lg p-6 bg-white shadow-lg max-w-md">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900">Delete Account</h3>
                <div className="mt-2 text-sm text-gray-500">
                  <p>Are you sure you want to delete your account? This action cannot be undone.</p>
                </div>
                <div className="mt-4 flex gap-2">
                  <button className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm">
                    Delete
                  </button>
                  <button className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Form Modal */}
          <div className="relative border rounded-lg p-6 bg-white shadow-lg max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Item</h3>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter description"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm">
                  Save
                </button>
                <button type="button" className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Actual Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" style={{ marginLeft: '-1.5rem', marginTop: '-1.5rem' }}>
          <div className="flex min-h-screen items-center justify-center p-4">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={() => setShowModal(false)}
            />
            
            {/* Modal Content */}
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 mb-4">Welcome!</h3>
              <p className="text-sm text-gray-500 mb-6">
                This is a fully functional modal dialog. Click outside or press the X button to close it.
              </p>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Got it!
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Learn More
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}