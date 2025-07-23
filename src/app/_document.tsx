import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body>
        <Main />
        <NextScript />
        {/* Add any client-side only scripts here */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Ensure window is defined
              if (typeof window !== 'undefined') {
                // Mock IndexedDB if not available
                if (!window.indexedDB) {
                  window.indexedDB = {};
                  window.IDBRequest = function() {};
                  window.IDBTransaction = function() {};
                  window.IDBKeyRange = function() {};
                  window.IDBCursor = function() {};
                  window.IDBDatabase = function() {};
                  window.IDBObjectStore = function() {};
                  window.IDBIndex = function() {};
                  window.IDBFactory = function() {};
                }
              }
            `,
          }}
        />
      </body>
    </Html>
  );
}
