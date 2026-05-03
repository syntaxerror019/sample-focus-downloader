(function() {
  if (!window.location.href.match(/samplefocus\.com\/samples\/.+/)) {
    alert('This script only runs on single sample page. Click on a sample and re-run this!');
    console.log('Not on a sample page. Current URL:', window.location.href);
    return;
  }

  let latestAudioUrl = null;

  function isAudioUrl(url) {
    if (!url) return false;
    return /\.(mp3|wav|ogg|m4a|flac|aac|opus)(\?.*)?$/i.test(url);
  }

  function findDownloadButton() {
    // selectors to try (makes it dynamic)
    const selectors = [
      'button[aria-label="Download"]',
      'button[aria-label*="download" i]',
      'button:has(i.fa-download)',
      '.fa-download',
      'button[class*="download"]',
      '[aria-label="Requires 1 credits."] button',
      'button:has(svg[data-testid="DownloadIcon"])',
      'button.MuiButton-root:has(i.fa-download)'
    ];

    //Try each selector
    for (let selector of selectors) {
      try {
        const button = document.querySelector(selector);
        if (button) {
          if (button.classList && button.classList.contains('fa-download')) {
            return button.closest('button');
          }
          return button;
        }
      } catch(e) {
        continue;
      }
    }

    const allButtons = document.querySelectorAll('button');
    for (let btn of allButtons) {
      // Check for download icon or text
      if (btn.innerHTML.includes('fa-download') || 
          btn.innerHTML.includes('Download') ||
          btn.getAttribute('aria-label') === 'Download' ||
          (btn.getAttribute('aria-label') && btn.getAttribute('aria-label').toLowerCase().includes('download'))) {
        return btn;
      }
    }

    return null;
  }

  function injectDownloadButton(originalButton, audioUrl) {
    if (!originalButton || !audioUrl) return null;
    
    let existingInject = document.querySelector('#custom-download-btn');
    if (existingInject) {
      existingInject.setAttribute('data-audio-url', audioUrl);
      return existingInject;
    }

    const customButton = document.createElement('button');
    customButton.id = 'custom-download-btn';
    customButton.setAttribute('data-audio-url', audioUrl);
    customButton.innerHTML = 'Download (no credits)';
    customButton.style.cssText = `
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 12px 24px;
      font-size: 16px;
      font-weight: bold;
      border-radius: 8px;
      cursor: pointer;
      margin: 10px 0;
      width: 100%;
      text-transform: uppercase;
      letter-spacing: 1px;
      transition: transform 0.2s, box-shadow 0.2s;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      z-index: 9999;
    `;

    customButton.onmouseenter = () => {
      customButton.style.transform = 'translateY(-2px)';
      customButton.style.boxShadow = '0 6px 12px rgba(0,0,0,0.15)';
    };
    customButton.onmouseleave = () => {
      customButton.style.transform = 'translateY(0)';
      customButton.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
    };

    customButton.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const url = customButton.getAttribute('data-audio-url');
      if (url) {
        downloadAudio(url);
      } else {
        console.error('No audio URL available');
        alert('No audio URL found yet. Try playing the sample first.');
      }
    };
    
    const parentContainer = originalButton.closest('.MuiGrid-root') || originalButton.parentElement;
    if (parentContainer) {
      parentContainer.appendChild(customButton);
    } else {

      originalButton.insertAdjacentElement('afterend', customButton);
    }

    return customButton;
  }
  async function downloadAudio(url) {
    try {
      const button = document.querySelector('#custom-download-btn');
      if (button) {
        const originalText = button.innerHTML;
        button.innerHTML = 'Downloading';
        button.disabled = true;
        button.style.opacity = '0.7';

        const response = await fetch(url);
        const blob = await response.blob();

        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        
        let filename = url.split('/').pop().split('?')[0];
        if (!filename.match(/\.(mp3|wav|ogg)$/)) {
          filename = `sample_${Date.now()}.mp3`;
        }
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
        setTimeout(() => {
          button.innerHTML = originalText;
          button.disabled = false;
          button.style.opacity = '1';
        }, 2000);

      } else {
        const a = document.createElement('a');
        a.href = url;
        a.download = url.split('/').pop().split('?')[0] || 'sample.mp3';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. The audio might require from a different source.');
      
      const button = document.querySelector('#custom-download-btn');
      if (button) {
        button.innerHTML = 'Download Failed';
        button.disabled = false;
        setTimeout(() => {
          button.innerHTML = 'Download (no credits)';
          button.style.opacity = '1';
        }, 2000);
      }
    }
  }

  //Monito requests for audio files
  function setupAudioMonitor() {
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      const url = args[0];
      if (isAudioUrl(url)) {
        latestAudioUrl = url;
        
        setTimeout(() => {
          const downloadBtn = findDownloadButton();
          if (downloadBtn && latestAudioUrl) {
            injectDownloadButton(downloadBtn, latestAudioUrl);
          }
        }, 100);
      }
      return originalFetch.apply(this, args);
    };

    
    const XHR = XMLHttpRequest.prototype;
    const originalOpen = XHR.open;
    const originalSend = XHR.send;
    XHR.open = function(method, url) {
      this._url = url;
      this._method = method;
      return originalOpen.apply(this, arguments);
    };

    XHR.send = function() {
      if (isAudioUrl(this._url)) {
        latestAudioUrl = this._url;
        
        setTimeout(() => {
          const downloadBtn = findDownloadButton();
          if (downloadBtn && latestAudioUrl) {
            injectDownloadButton(downloadBtn, latestAudioUrl);
          }
        }, 100);
      }
      return originalSend.apply(this, arguments);
    };
  }
  function monitorAudioElements() {
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType === 1) { // Element node
            if (node.tagName === 'AUDIO' || node.tagName === 'VIDEO') {
              const src = node.src || node.querySelector('source')?.src;
              if (src && isAudioUrl(src)) {
                console.log('Audio element detected:', src);
                latestAudioUrl = src;
                const downloadBtn = findDownloadButton();
                if (downloadBtn) {
                  injectDownloadButton(downloadBtn, latestAudioUrl);
                }
              }
            }
          }
        });
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  function init() {

    setupAudioMonitor();
    monitorAudioElements();
    setTimeout(() => {
      const existingAudio = document.querySelector('audio source, video source, audio, video');
      if (existingAudio) {
        const src = existingAudio.src || existingAudio.getAttribute('src');
        if (src && isAudioUrl(src)) {
          latestAudioUrl = src;
          const downloadBtn = findDownloadButton();
          if (downloadBtn) {
            injectDownloadButton(downloadBtn, latestAudioUrl);
          }
        }
      }
    }, 2000);
  }

  // Start the script
  init();
})();
