// ==UserScript==
// @name         UltraServers Schedule cron enhancement
// @namespace    https://ultraservers.com
// @version      1.6
// @author       Mortis
// @downloadURL  https://github.com/UltraMortis/random-ultra-stuff/raw/refs/heads/main/scheduleCronEnhancement.user.js
// @description  Generate Crons in with the power of AI
// @match        https://panel.ultraservers.com/server*
// @grant        GM_xmlhttpRequest
// @connect      ultraservers-cron-1060219763051.us-central1.run.app
// ==/UserScript==

(function () {

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

  const observer = new MutationObserver(() => {
    if (!location.pathname.includes('/schedules')) return;

    // Listen for button clicks such as the Create schedule button being pressed
    document.addEventListener('click', async (e) => {
      const target = e.target.closest('button');
      if (!target || !target.textContent.includes('Create Schedule')) return;

      let modal;
      // Wait for the modal to appear. I could use a while loop or mutation observer but this is easier
      for (let i = 0; i < 50; i++) {
        // Since the numbers in the #headlessui-dialog-panel-X are dynamic, I needed to find the modal in a more reliable and dynamic manner
        modal = [...document.querySelectorAll('[role="dialog"]')]
          .find(element => element.textContent.includes('Create Schedule'));
        if (modal) break;
        await new Promise(r => setTimeout(r, 100));
      }
      if (!modal) {
        console.warn('Modal not found');
        return;
      }
      if (modal.querySelector('#ai-cron-box')) return;

      const cheatsheetBtn = [...modal.querySelectorAll('button')].find(btn =>
        btn.textContent.includes('Show CRON Cheatsheet')
      );
      // We want this to be above the cheatsheet button
      const insertTarget = cheatsheetBtn?.closest('.floating-content');
      if (!insertTarget) {
        console.warn('Insert target not found');
        return;
      }

      // Figure out the offset of the user's timezone from UTC. The AI will take user's timezone offset and their desired input to create a UTC cron schedule
      const offsetMinutes = -new Date().getTimezoneOffset();
      const sign = offsetMinutes >= 0 ? '+' : '-';
      const absMinutes = Math.abs(offsetMinutes);
      const hours = String(Math.floor(absMinutes / 60)).padStart(2, '0');
      const minutes = String(absMinutes % 60).padStart(2, '0');
      const timezoneOffset = `${sign}${hours}:${minutes}`;

      // Creating the UI for this to work
      const aiBox = document.createElement('div');
      aiBox.id = 'ai-cron-box';
      aiBox.className = 'mt-0 mb-0 p-4 bg-elevation-1 border border-blend-brd_mute rounded-lg text-sm';
      aiBox.innerHTML = `
        <label class="block text-xs uppercase text-neutral-200 mb-2">Get AI to generate a CRON schedule</label>
        <div class="flex">
          <input class="form-input form-input-primary flex-2 rounded-r-none" placeholder="e.g. Every 3 hours 20 minutes" id="ai-cron-input">
          <button class="btn btn-primary ml-2 space-x-2" id="ai-cron-generate-btn">Generate</button>
        </div>
        <div class="mt-4 text-neutral-400 text-xs leading-relaxed">
          <p>
            Type your schedule in plain English and it’ll be converted to a CRON expression.<br>
            We automatically adjust your times from your timezone (<strong>${timezoneOffset}</strong>) to UTC, which is what our scheduler uses.
          </p>
          <p class="mt-3 font-semibold text-neutral-300">Examples:</p>
          <ul style="list-style-type: disc; padding-left: 1.25rem; margin-top: 0.5rem;">
            <li>Run every Mon, Wed, Fri at 7:30am</li>
            <li>At 4pm on the 1st and 15th</li>
            <li>Every 10 minutes 9am to 5pm weekdays</li>
            <li>Daily at midnight</li>
            <li>Twice a day at 2am and 2pm</li>
            <li>Every hour on the half-hour</li>
          </ul>
        </div>
      `;

      insertTarget.insertAdjacentElement('beforebegin', aiBox);

      // Create a click event listener for the generate button
      document.getElementById('ai-cron-generate-btn').addEventListener('click', () => {
        const input = document.getElementById('ai-cron-input').value.trim();
        if (!input) return showToast('Please type something', 'error');

        // Disable the button when the button has been pressed
        const genButton = document.getElementById('ai-cron-generate-btn')
        genButton.disabled = true;
        genButton.textContent = '...';

        // Send the API request to the server
        GM_xmlhttpRequest({
          method: 'POST',
          url: 'https://ultraservers-cron-1060219763051.us-central1.run.app/',
          headers: { 'Content-Type': 'application/json' },
          data: JSON.stringify({ input, timezone_offset: timezoneOffset }),
          onload(res) {
            // Enable the button when the request is done
            genButton.disabled = false;
            genButton.textContent = 'Generate';

            // We expect the data to just be a JSON object with the cron fields value
            let data;
            try {
              data = JSON.parse(res.responseText);
            } catch {
              console.error(res.responseText);
              return showToast('Invalid response from server', 'error');
            }
            // Data returned was not what we expected
            if (!(data.minute && data.hour && data.day_of_month && data.month && data.day_of_week)) {
              return showToast('Missing CRON fields in response', 'error');
            }

            // A function to set the values of the cron UI elements. You may wonder why I didn't use `el.value = val` directly. It's because the UI would reset so this hack was used
            function modifyCronUI(el, val) {
              const valueSetter = Object.getOwnPropertyDescriptor(el, 'value')?.set;
              const proto = Object.getPrototypeOf(el);
              const protoSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
              if (valueSetter && valueSetter !== protoSetter) protoSetter.call(el, val);
              else valueSetter.call(el, val);
              el.dispatchEvent(new Event('input', { bubbles: true }));
            }

            // Modifies the UI to set the cron expression
            modifyCronUI(modal.querySelector('#minute'), data.minute);
            modifyCronUI(modal.querySelector('#hour'), data.hour);
            modifyCronUI(modal.querySelector('#dayOfMonth'), data.day_of_month);
            modifyCronUI(modal.querySelector('#month'), data.month);
            modifyCronUI(modal.querySelector('#dayOfWeek'), data.day_of_week);
            showToast('CRON expression generated successfully', 'success');
          },
          // Error handling
          onerror(e) {
            genButton.disabled = false;
            genButton.textContent = 'Generate';
            console.error(e);
            showToast(`Request failed: ${e.message}`, 'error');
          },
        });
      });
    }, { once: true });
  });

  // Observe whenever theres a change to DOM
  observer.observe(document.body, { childList: true, subtree: true });

  // Handle changes to the back/forward navigation
  const originalPush = history.pushState;
  history.pushState = function () {
    originalPush.apply(this, arguments);
    setTimeout(() => observer.takeRecords(), 50);
  };
  // Add the event listener
  window.addEventListener('popstate', () => setTimeout(() => observer.takeRecords(), 50));

})();
