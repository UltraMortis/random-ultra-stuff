// ==UserScript==
// @name         Pterodactyl Backup Copy URL Button
// @namespace    https://ultraservers.com
// @version      1.2
// @author       Mortis
// @downloadURL https://github.com/UltraMortis/random-ultra-stuff/raw/refs/heads/main/copyBackupURL.user.js
// @description  Add a 'Copy URL' button to each backup on the UltraServers backup panel for those that want to use their preferred downloader
// @match        https://panel.ultraservers.com/server*
// @grant        GM_setClipboard
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(async function () {
  'use strict';

  // Helpful utility function to show cool toast like messages
  function showToast(message, type = 'info') {
    const colors = {
      info: { background: '#17a2b8', icon: 'ℹ️' },
      success: { background: '#28a745', icon: '✅' },
      error: { background: '#dc3545', icon: '❌' }
    };

    const toast = document.createElement('div');
    // I like this style of toast messages
    toast.textContent = `${colors[type]?.icon || ''} ${message}`;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${colors[type]?.background || '#333'};
        color: white;
        padding: 12px 18px;
        border-radius: 6px;
        font-size: 14px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 9999;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.3s ease, transform 0.3s ease;
        transform: translateY(20px);
        margin-top: 10px;
    `;

    // Adds the delay to trigger animation transition
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    });

    // Lets you click to close the toast
    toast.addEventListener('click', () => toast.remove());

    // Close the toast after 5 seconds
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px)';
      setTimeout(() => toast.remove(), 300);
    }, 5000);

    // Ensures we can stack the notifications
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 9998;';
      document.body.appendChild(container);
    }

    container.appendChild(toast);
  }

  const apiToken = 'REPLACE_IF_THIS_DOESNT_WORK'; // Replace with your API token if this doesn't seem to work. Pterodactyl Client API works if you're logged in
  const panelOrigin = 'https://panel.ultraservers.com';

  const serverId = window.location.pathname.split('/')[2];

  const headers = {
    Authorization: `Bearer ${apiToken}`,
    Accept: 'Application/vnd.pterodactyl.v1+json',
    'Content-Type': 'application/json'
  };

  // Core logic to detect which backup page we’re on and fetch backups
  async function initBackups() {
    // If we're not on the backups tab, exit
    const path = window.location.pathname;
    if (!path.endsWith('/backups')) return;
    
    // Check every 100ms for 8 seconds to see if the header is loaded
    const waitTimeout = 8000;
    const waitInterval = 100;
    let elapsed = 0;
    let headersEls = [];

    while (elapsed < waitTimeout) {
      headersEls = document.querySelectorAll('.page-header-title-heading-title');
      if (headersEls.length > 0) break;
      await new Promise(r => setTimeout(r, waitInterval));
      elapsed += waitInterval;
    }

    if (headersEls.length === 0) {
      console.error('Header not found in time');
      headersEls = [];
    }

    const headerText = [...headersEls].map(el => el.textContent.trim());
    let endpoint = null;

    if (headerText.some(t => t.startsWith('User Backups'))) {
      endpoint = `${panelOrigin}/api/client/servers/${serverId}/backups`;
    } else if (headerText.some(t => t.startsWith('System Backups'))) {
      endpoint = `${panelOrigin}/api/client/servers/${serverId}/system-backups`;
    }

    if (!endpoint) return;
    console.debug('Using endpoint:', endpoint);

    const backupRes = await fetch(endpoint, { method: 'GET', headers });

    // Stop script if we don't get a good response
    if (!backupRes.ok) return console.error('Failed to fetch backups');

    const { data: backups } = await backupRes.json();

    // Map each backup's checksum to its UUID for lookup purposes
    const checksumToUuid = Object.fromEntries(
      backups.map(b => [b.attributes.checksum, b.attributes.uuid])
    );

    // Observe for changes and add the custom button
    const observer = new MutationObserver(() => {
      // Each card is a backup, if there's no cards then theres no backups
      const cards = document.querySelectorAll('.card-body');
      if (cards.length === 0) return;

      if (headerText.some(t => t.startsWith('System Backups'))) {
        const alertDiv = document.querySelector('.alert-body > div');
        if (alertDiv && !alertDiv.querySelector('.system-backup-note')) {
          const newLine = document.createElement('div');
          newLine.className = 'system-backup-note';
          newLine.innerHTML = "<strong>The extension you installed allows you to grab system backup URLs; however, they're not officially implemented and will be 100% slower. This was done out of curiosity.</strong>";
          alertDiv.appendChild(newLine);
        }
      }

      // Loop through each backup
      cards.forEach(card => {
        // Ignore if the button already exists
        if (card.querySelector('.copy-url-button')) return;

        // Get Checksum from backup card
        const checksumText = [...card.querySelectorAll('span.font-mono')]
          .map(e => e.textContent.trim())
          .find(text => text.startsWith('restic-snapshot-id:'));

        // Lookup UUID by checksum and if there's no valid entry then skip that card
        const backupUuid = checksumToUuid[checksumText];
        if (!backupUuid) return;

        // Create the button. If you prefer a different icon then you'll need to modify the innerHTML with the svg
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-ghost-neutral btn-icon copy-url-button';
        btn.title = 'Copy backup download URL';
        btn.style.marginLeft = '0.2rem';

        btn.innerHTML = `
          <svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="link"
               class="svg-inline--fa fa-link fa-fw" role="img" xmlns="http://www.w3.org/2000/svg"
               viewBox="0 0 512 512" fill="currentColor" width="1em" height="1em">
            <path fill="currentColor" d="M326.6 185.4c12.5 12.5 12.5 32.8 0 45.3l-96 96c-12.5
              12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l96-96c12.5-12.5
              32.8-12.5 45.3 0zM232.6 79c50-50 131-50 181 0s50 131 0
              181l-50.6 50.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8
              0-45.3L368.4 215c25-25 25-65.5 0-90.5s-65.5-25-90.5
              0l-50.6 50.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8
              0-45.3L232.6 79zm-80.6 192.4c12.5 12.5 12.5 32.8
              0 45.3L103.6 365c-25 25-25 65.5 0 90.5s65.5 25
              90.5 0l50.6-50.6c12.5-12.5 32.8-12.5 45.3 0s12.5
              32.8 0 45.3l-50.6 50.6c-50 50-131 50-181 0s-50-131
              0-181l50.6-50.6c12.5-12.5 32.8-12.5 45.3 0z"/>
          </svg>
        `;
        // Click function that'll send the API request to download backup but return the URL instead of downloading it
        btn.onclick = () => {
          GM_xmlhttpRequest({
            method: 'GET',
            url: `${panelOrigin}/api/client/servers/${serverId}/backups/${backupUuid}/download`,
            headers,
            onload: res => {
              try {
                const json = JSON.parse(res.responseText);
                const url = json.attributes?.url;
                if (url) {
                  GM_setClipboard(url, 'text');
                  showToast('Copied backup URL to clipboard!', 'success');

                } else {
                  showToast('No URL found in response.', 'error');
                }
              } catch (e) {
                showToast('Failed to parse download response.', 'error');
              }
            },
            onerror: () => showToast('Failed to fetch download URL.', 'error')
          });
        };

        const buttons = card.querySelector('span.flex.items-center.justify-end');
        if (buttons) {
          // We grab the Download button through it's Icon, if it changes this will need to be updated
          const downloadBtn = buttons.querySelector('button svg[data-icon="cloud-arrow-down"]')?.parentElement;

          if (downloadBtn) {
            // We insert the button right after the download button
            downloadBtn.insertAdjacentElement('afterend', btn);
          } else {
            // We'll add it anyways in case above fails or an update occurs
            buttons.appendChild(btn);
          }
        }
      });
    });

    // Observe any changes such as a backup being deleted, created or some sort of change
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Initial run
  await initBackups();

  // SPA detection: override pushState and replaceState
  const origPush = history.pushState;
  history.pushState = function () {
    origPush.apply(this, arguments);
    initBackups();
  };
  const origReplace = history.replaceState;
  history.replaceState = function () {
    origReplace.apply(this, arguments);
    initBackups();
  };
  window.addEventListener('popstate', initBackups);

  // Fallback: poll the header in case some tabs don’t trigger pushState/replaceState
  let lastHeaderText = '';
  setInterval(async () => {
    const headersEls = document.querySelectorAll('.page-header-title-heading-title');
    const headerText = [...headersEls].map(el => el.textContent.trim()).join();
    if (headerText !== lastHeaderText) {
      lastHeaderText = headerText;
      await initBackups();
    }
  }, 500);

})();
