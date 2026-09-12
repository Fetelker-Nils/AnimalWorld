// Vercel Speed Insights initialization
// This script initializes the Speed Insights queue and will be tracked by Vercel when deployed
(function() {
  'use strict';
  
  // Initialize the Speed Insights queue
  window.si = window.si || function() {
    (window.siq = window.siq || []).push(arguments);
  };
})();
