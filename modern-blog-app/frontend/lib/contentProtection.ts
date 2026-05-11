/**
 * Enhanced Security Utilities
 * - Disable right-click context menu
 * - Disable developer tools
 * - Prevent content copying
 * - Add security headers
 */

// export function disableRightClick() {
//   // Disable right-click context menu
//   document.addEventListener('contextmenu', (e) => {
//     e.preventDefault();
//     return false;
//   }, false);
// }


// lib/contentProtection.ts
// COMMENTED OUT: All content protection code has been disabled for network debugging
// Re-enable after Supabase integration and API testing is complete

// export function disableRightClick() {
//   document.addEventListener(
//     'contextmenu',
//     (e) => {
//       e.preventDefault();
//
//       // Play beep sound
//       const beep = new Audio(
//         'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA='
//       );
//       beep.play().catch(() => {});
//
//       // Create the warning overlay
//       const warning = document.createElement('div');
//       warning.textContent = '⚠️ Content is protected';
//       warning.style.position = 'fixed';
//       warning.style.top = '50%';
//       warning.style.left = '50%';
//       warning.style.transform = 'translate(-50%, -50%)';
//       warning.style.backgroundColor = 'red';
//       warning.style.color = 'white';
//       warning.style.padding = '20px 30px';
//       warning.style.borderRadius = '8px';
//       warning.style.fontSize = '18px';
//       warning.style.fontWeight = 'bold';
//       warning.style.zIndex = '9999';
//       warning.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
//       warning.style.opacity = '0';
//       warning.style.transition = 'opacity 0.3s ease';
//
//       document.body.appendChild(warning);
//
//       // Fade in
//       requestAnimationFrame(() => {
//         warning.style.opacity = '1';
//       });
//
//       // Auto-hide after 2 seconds with fade-out
//       setTimeout(() => {
//         warning.style.opacity = '0';
//         setTimeout(() => {
//           warning.remove();
//         }, 300);
//       }, 2000);
//
//       return false;
//     },
//     false
//   );
// }
//
// export function disableDeveloperTools() {
//   // Detect console open
//   const devtools = { open: false };
//   const threshold = 160; // Height threshold for detecting devtools
//
//   setInterval(() => {
//     if (window.outerHeight - window.innerHeight > threshold) {
//       if (!devtools.open) {
//         devtools.open = true;
//         console.clear();
//         console.log(
//           '%cStop! This is a browser feature intended for developers.',
//           'color: red; font-size: 16px; font-weight: bold;'
//         );
//         console.log(
//           '%cUsing this console may expose sensitive information.',
//           'color: #ff0000; font-size: 14px;'
//         );
//         // Optionally redirect or show warning
//       }
//     } else {
//       devtools.open = false;
//     }
//   }, 500);
//
//   // Disable Ctrl+Shift+I (Inspector)
//   document.addEventListener('keydown', (e) => {
//     if (
//       (e.ctrlKey && e.shiftKey && e.keyCode === 73) || // Ctrl+Shift+I
//       (e.ctrlKey && e.shiftKey && e.keyCode === 75) || // Ctrl+Shift+K (Console)
//       (e.keyCode === 123) // F12
//     ) {
//       e.preventDefault();
//       e.stopPropagation();
//       return false;
//     }
//   });
//
//   // Disable Ctrl+Shift+C (Inspect element)
//   document.addEventListener('keydown', (e) => {
//     if (e.ctrlKey && e.shiftKey && e.keyCode === 67) {
//       e.preventDefault();
//       return false;
//     }
//   });
// }
//
// export function disableCopyProtection() {
//   // Prevent text selection on important content
//   document.addEventListener('copy', (e) => {
//     const selection = window.getSelection();
//     const selectedText = selection ? selection.toString() : '';
//     const textToCopy = `${selectedText}\n\n© ${new Date().getFullYear()} Raju SRK. All rights reserved.`;
//     e.clipboardData?.setData('text/plain', textToCopy);
//     e.preventDefault();
//   });
// }
//
// export function addSecurityHeaders() {
//   // Note: Most headers should be set at server level, but we can add some client-side protections
//
//   // Prevent clickjacking
//   if (window.self !== window.top) {
//     window.top!.location.href = window.self.location.href;
//   }
//
//   // Prevent MIME type sniffing
//   const meta = document.createElement('meta');
//   meta.httpEquiv = 'X-UA-Compatible';
//   meta.content = 'IE=edge';
//   document.head.appendChild(meta);
// }
//
// export function enableContentSecurityPolicy() {
//   // CSP should be set via headers, but this is a fallback notice
//   console.log('Content Security Policy enabled');
// }
//
// /**
//  * Prevent page leaking via referrer
//  */
// export function protectReferrer() {
//   const meta = document.createElement('meta');
//   meta.name = 'referrer';
//   meta.content = 'no-referrer';
//   document.head.appendChild(meta);
// }
//
// /**
//  * Disable printing sensitive information
//  */
// export function disablePrinting() {
//   window.addEventListener('beforeprint', (e) => {
//     console.warn('Printing has been disabled for this page');
//     const printStyleSheet = document.createElement('link');
//     printStyleSheet.rel = 'stylesheet';
//     printStyleSheet.href = 'data:text/css,body { display: none; }';
//     document.head.appendChild(printStyleSheet);
//   });
// }
