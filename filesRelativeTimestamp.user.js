// ==UserScript==
// @name        Show files relative timestamp
// @namespace   https://ultraservers.com
// @match       https://panel.ultraservers.com/server/*/files*
// @downloadURL
// @grant       none
// @version     1.0
// @author      Mortis
// @description May cause panel slowness
// ==/UserScript==


(function () {
  'use strict';

  const processed = new WeakMap(); // Prevents duplicate processing

  // Fixes the issue where you couldn't hover over folders to see the timestamp
  const s = document.createElement('style');
  s.textContent = `
  a.link-subtle-blend::after {
    pointer-events: none !important;
  }
`;
  document.head.appendChild(s);

  // We calculate if the entry is within 24 hours and format it with the suffix
  const formatAgo = (date) => {
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return `${diffSec} seconds ago`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} minutes ago`;
    if (diffSec < 86400) return `about ${Math.floor(diffSec / 3600)} hours ago`;

    return null;
  };

  const formatDate = (date) => {
    const day = date.getDate();
    const suffix =
      day % 10 === 1 && day !== 11 ? 'st' :
        day % 10 === 2 && day !== 12 ? 'nd' :
          day % 10 === 3 && day !== 13 ? 'rd' : 'th';

    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();

    let hours = date.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${month} ${day}${suffix}, ${year} ${hours}:${minutes}${ampm}`;
  };

  const update = () => {
    const els = document.querySelectorAll('time.z-1');
    const updates = [];

    for (const el of els) {
      const datetime = el.getAttribute('datetime');
      if (!datetime) continue;

      // Skip if we already processed it
      if (processed.get(el) === datetime) continue;

      const date = new Date(datetime);
      if (isNaN(date)) continue;

      const ago = formatAgo(date);
      const full = formatDate(date);

      updates.push(() => {
        el.textContent = ago || full;
        el.setAttribute('title', full);
        processed.set(el, datetime);
      });
    }
    for (const i of updates) i();
  };

  // The script runs on page load, we need to run the function
  update();

  // Add some delay as we don't want to abuse the DOM and cause slowdowns
  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (!scheduled) {
      scheduled = true;
      requestIdleCallback(() => {
        update();
        scheduled = false;
      });
    }
  });

  // Observe changes
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
})();
