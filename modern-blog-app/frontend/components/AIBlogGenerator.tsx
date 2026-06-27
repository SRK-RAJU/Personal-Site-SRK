// /**
//  * ============================================================================
//  * AI BLOG GENERATION COMPONENT
//  * ============================================================================
//  * Purpose:
//  * - Automatically triggers the lightweight 5-tool preview exactly once on deploy
//  * - Blocks any continuous user refresh states from hitting Tavily/Gemini limits
//  * ============================================================================
//  */

// 'use client';

// import { useAIBlogGeneration } from '@/hooks/useAIBlogGeneration';
// import { useEffect, useState } from 'react';

// interface AIBlogGeneratorProps {
//   autoTrigger?: boolean;
//   showDebug?: boolean;
// }

// export function AIBlogGenerator({
//   // 🌟 KEEP ENABLED: Fires automatically exactly once when your fresh code deployment mounts
//   autoTrigger = true, 
//   showDebug = process.env.NODE_ENV === 'development',
// }: AIBlogGeneratorProps) {
//   const [showStatus, setShowStatus] = useState(false);
  
//   // Notice the hooks extraction parameters. Ensure your internal `useAIBlogGeneration` implementation
//   // automatically appends `?deploy-check=true` to the fetch query options when autoTrigger is active.
//   const { isGenerating, isCompleted, isError, message, post, generatePost } =
//     useAIBlogGeneration(autoTrigger);

//   useEffect(() => {
//     if (isGenerating || isCompleted || isError) {
//       setShowStatus(true);
//     }
//   }, [isGenerating, isCompleted, isError]);

//   if (!showStatus && !showDebug) {
//     return null;
//   }

//   return (
//     <div className="fixed bottom-4 right-4 max-w-sm z-50">
//       <div
//         className={`rounded-lg border p-4 shadow-lg ${
//           isError
//             ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
//             : isCompleted
//               ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
//               : 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
//         }`}
//       >
//         {/* Status Header */}
//         <div className="mb-2 flex items-center gap-2">
//           {isGenerating && (
//             <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
//           )}
//           {isCompleted && <span className="text-xl">✅</span>}
//           {isError && <span className="text-xl">❌</span>}

//           <span className="font-semibold">
//             {isGenerating ? 'Deployment Verification Run...' : isError ? 'Run Blocked/Failed' : 'Verification Complete'}
//           </span>
//         </div>

//         {/* Status Message */}
//         <p className="mb-3 text-sm text-gray-700 dark:text-gray-200">{message}</p>

//         {/* Post Metadata Output Details */}
//         {post && (
//           <div className="mb-3 rounded bg-white/50 dark:bg-white/5 p-2 text-xs">
//             <p className="font-medium">📝 {post.title}</p>
//             <p className="text-gray-600 dark:text-gray-400">
//               {post.tools_covered.length} tools • {post.cves_mentioned} CVEs
//             </p>
//           </div>
//         )}

//         {/* Manual Action Override Button for Development Environments */}
//         {showDebug && !isGenerating && (
//           <button
//             onClick={() => generatePost()}
//             className="w-full rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
//           >
//             🔄 Force Manual Generate (Dev Sandbox)
//           </button>
//         )}

//         {/* Modal Close Action Anchor */}
//         <button
//           onClick={() => setShowStatus(false)}
//           className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
//         >
//           ✕
//         </button>
//       </div>
//     </div>
//   );
// }