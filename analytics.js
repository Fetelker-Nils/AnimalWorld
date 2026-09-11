// Vercel Web Analytics initialization
// This script initializes the analytics queue and will be tracked by Vercel when deployed
(function() {
  'use strict';
  
  // Initialize the analytics queue
  window.va = window.va || function() {
    (window.vaq = window.vaq || []).push(arguments);
  };
  
  // Set mode to production for proper tracking
  if (typeof process === 'undefined' || !process.env || process.env.NODE_ENV !== 'development') {
    window.vam = 'production';
  }
})();
