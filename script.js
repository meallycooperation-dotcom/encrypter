(function() {
      // DOM elements
      const userInput = document.getElementById('userInput');
      const encryptBtn = document.getElementById('encryptButton');
      const decryptBtn = document.getElementById('decryptButton');
      const clearBtn = document.getElementById('clearButton');
      const resultOutputDiv = document.getElementById('resultOutput');
      const inputCharCountSpan = document.getElementById('inputCharCount');
      const outputCharCountSpan = document.getElementById('outputCharCount');
      const outputModeIcon = document.getElementById('outputModeIcon');
      const outputModeLabel = document.getElementById('outputModeLabel');
      const modeIndicator = document.getElementById('modeIndicator');

      // Track last operation for display context
      let lastOperation = null; // 'encrypt' or 'decrypt'

      // ----- Encryption function (same as before) -----
      function encryptText(plainText) {
        if (!plainText) return '';
        
        // Step 1: Base64 encode with Unicode support
        let base64;
        try {
          base64 = btoa(unescape(encodeURIComponent(plainText)));
        } catch (e) {
          base64 = btoa(plainText);
        }
        
        // Step 2: Caesar shift with key 7
        const shiftKey = 7;
        let shifted = '';
        for (let i = 0; i < base64.length; i++) {
          const charCode = base64.charCodeAt(i);
          let newCode = charCode + shiftKey;
          if (newCode > 126) {
            newCode = 32 + (newCode - 127);
          }
          shifted += String.fromCharCode(newCode);
        }
        
        // Step 3: Convert to hex
        let hexString = '';
        for (let i = 0; i < shifted.length; i++) {
          const hex = shifted.charCodeAt(i).toString(16).padStart(2, '0');
          hexString += hex;
        }
        
        // Step 4: Add salt
        const saltPrefix = 'ee2a';
        const saltSuffix = '9f1c';
        return saltPrefix + hexString + saltSuffix;
      }

      // ----- Decryption function (reverse of encryption) -----
      function decryptText(encryptedText) {
        if (!encryptedText) return '';
        
        try {
          // Remove salt prefix and suffix
          const saltPrefix = 'ee2a';
          const saltSuffix = '9f1c';
          
          // Check if the text has the expected salt format
          if (!encryptedText.startsWith(saltPrefix) || !encryptedText.endsWith(saltSuffix)) {
            throw new Error('Invalid encrypted format');
          }
          
          // Extract the hex part
          const hexString = encryptedText.slice(saltPrefix.length, encryptedText.length - saltSuffix.length);
          
          // Validate hex string (must be even length)
          if (hexString.length % 2 !== 0) {
            throw new Error('Invalid hex string');
          }
          
          // Convert hex back to shifted string
          let shifted = '';
          for (let i = 0; i < hexString.length; i += 2) {
            const hexPair = hexString.substr(i, 2);
            const charCode = parseInt(hexPair, 16);
            if (isNaN(charCode)) {
              throw new Error('Invalid hex character');
            }
            shifted += String.fromCharCode(charCode);
          }
          
          // Reverse the Caesar shift (shift back by 7)
          const shiftKey = 7;
          let base64 = '';
          for (let i = 0; i < shifted.length; i++) {
            const charCode = shifted.charCodeAt(i);
            let newCode = charCode - shiftKey;
            if (newCode < 32) {
              newCode = 127 - (32 - newCode);
            }
            base64 += String.fromCharCode(newCode);
          }
          
          // Decode Base64 to original text
          let plainText;
          try {
            plainText = decodeURIComponent(escape(atob(base64)));
          } catch (e) {
            // Fallback for simple ASCII
            plainText = atob(base64);
          }
          
          return plainText;
        } catch (error) {
          // Return error message if decryption fails
          return '⚠️ Decryption failed: ' + error.message;
        }
      }

      // Update character counts
      function updateInputCharCount() {
        const len = userInput.value.length;
        inputCharCountSpan.textContent = len;
      }

      function updateOutputCharCount(text) {
        if (!text || text.trim() === '') {
          outputCharCountSpan.textContent = '—';
        } else {
          outputCharCountSpan.textContent = text.length;
        }
      }

      // Update output mode display
      function updateOutputMode(operation) {
        if (operation === 'encrypt') {
          outputModeIcon.textContent = '🔒';
          outputModeLabel.textContent = 'ENCRYPTED';
          modeIndicator.textContent = 'encrypt mode';
          modeIndicator.style.color = '#cbb77e';
        } else if (operation === 'decrypt') {
          outputModeIcon.textContent = '🔓';
          outputModeLabel.textContent = 'DECRYPTED';
          modeIndicator.textContent = 'decrypt mode';
          modeIndicator.style.color = '#8bb5cc';
        } else {
          outputModeIcon.textContent = '📋';
          outputModeLabel.textContent = 'RESULT';
          modeIndicator.textContent = 'ready';
          modeIndicator.style.color = '#cbb77e';
        }
      }

      // Display result in the output card
      function displayResult(text, operation) {
        resultOutputDiv.innerHTML = '';
        
        if (!text) {
          const placeholderSpan = document.createElement('span');
          placeholderSpan.className = 'placeholder-text';
          placeholderSpan.textContent = 'Your result will appear here';
          resultOutputDiv.appendChild(placeholderSpan);
          updateOutputCharCount('');
          updateOutputMode(null);
          return;
        }
        
        // Check if it's an error message from decryption
        if (text.startsWith('⚠️')) {
          const errorSpan = document.createElement('span');
          errorSpan.style.color = '#e0774b';
          errorSpan.style.fontFamily = 'Inter, sans-serif';
          errorSpan.textContent = text;
          resultOutputDiv.appendChild(errorSpan);
          updateOutputCharCount(text);
          updateOutputMode(operation);
          return;
        }
        
        const textNode = document.createTextNode(text);
        resultOutputDiv.appendChild(textNode);
        updateOutputCharCount(text);
        updateOutputMode(operation);
        
        // subtle animation
        resultOutputDiv.style.transform = 'scale(1.01)';
        setTimeout(() => {
          resultOutputDiv.style.transform = 'scale(1)';
        }, 150);
      }

      // Handle encrypt
      function handleEncrypt() {
        const plainText = userInput.value;
        
        if (plainText.trim() === '') {
          displayResult('', null);
          // Visual feedback
          resultOutputDiv.style.boxShadow = 'inset 0 0 0 2px #e0774b';
          setTimeout(() => {
            resultOutputDiv.style.boxShadow = 'inset 0 4px 12px black';
          }, 200);
          return;
        }
        
        const encrypted = encryptText(plainText);
        lastOperation = 'encrypt';
        displayResult(encrypted, 'encrypt');
      }

      // Handle decrypt
      function handleDecrypt() {
        const encryptedText = userInput.value.trim();
        
        if (!encryptedText) {
          displayResult('', null);
          resultOutputDiv.style.boxShadow = 'inset 0 0 0 2px #e0774b';
          setTimeout(() => {
            resultOutputDiv.style.boxShadow = 'inset 0 4px 12px black';
          }, 200);
          return;
        }
        
        const decrypted = decryptText(encryptedText);
        lastOperation = 'decrypt';
        displayResult(decrypted, 'decrypt');
      }

      // Clear all
      function clearAll() {
        userInput.value = '';
        updateInputCharCount();
        displayResult('', null);
        lastOperation = null;
        userInput.focus();
      }

      // Event listeners
      encryptBtn.addEventListener('click', handleEncrypt);
      decryptBtn.addEventListener('click', handleDecrypt);
      clearBtn.addEventListener('click', clearAll);
      
      // Update input character count
      userInput.addEventListener('input', updateInputCharCount);
      
      // Keyboard shortcut: Ctrl+Enter for encrypt, Ctrl+Shift+Enter for decrypt
      userInput.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          if (e.shiftKey) {
            handleDecrypt();
          } else {
            handleEncrypt();
          }
        }
      });
      
      // Initialize
      function initialize() {
        updateInputCharCount();
        displayResult('', null);
        lastOperation = null;
        userInput.focus();
      }
      
      initialize();
    })();