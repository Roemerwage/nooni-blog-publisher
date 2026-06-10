// Example: How to use the KlaviyoTester component in your App

import React, { useState } from 'react';
import KlaviyoTester from './components/KlaviyoTester';

export default function AppExample() {
  const [showKlaviyoTester, setShowKlaviyoTester] = useState(false);

  return (
    <div>
      {/* Your existing app content */}

      {/* Add a button to open the tester */}
      <button
        onClick={() => setShowKlaviyoTester(!showKlaviyoTester)}
        className="fixed bottom-4 right-4 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
      >
        {showKlaviyoTester ? 'Close' : 'Klaviyo Tester'}
      </button>

      {/* Render the tester modal */}
      <KlaviyoTester
        isOpen={showKlaviyoTester}
        onClose={() => setShowKlaviyoTester(false)}
      />
    </div>
  );
}

// Or import the hook directly:
// import { useKlaviyo } from './hooks/useKlaviyo';
//
// function MyFeature() {
//   const { subscribeToList, triggerFlow, trackEvent, loading, error } = useKlaviyo();
//
//   return (
//     // Your component JSX
//   );
// }
