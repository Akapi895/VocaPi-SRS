// Anti-paste guard for review system
class AntiPasteGuard {
  setup(inputElement) {
    if (!inputElement) return;
    
    // Prevent all forms of paste
    inputElement.addEventListener('paste', (e) => {
      e.preventDefault();
      this.showWarning();
      return false;
    });
    
    // Prevent drag and drop
    inputElement.addEventListener('drop', (e) => {
      e.preventDefault();
      this.showWarning();
      return false;
    });
    
    inputElement.addEventListener('dragover', (e) => {
      e.preventDefault();
      return false;
    });
    
    // Prevent context menu (right-click)
    inputElement.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.showWarning();
      return false;
    });
    
    // Monitor for suspicious rapid input (possible programmatic input)
    let lastInputTime = 0;
    let rapidInputCount = 0;
    
    inputElement.addEventListener('input', (e) => {
      const currentTime = Date.now();
      
      // If multiple characters were added at once (length > 1), it might be paste
      const inputLength = e.target.value.length;
      const timeDiff = currentTime - lastInputTime;
      
      if (inputLength > 1 && timeDiff < 50) {
        rapidInputCount++;
        if (rapidInputCount > 2) {
          // Suspicious activity - clear input and warn
          e.target.value = '';
          this.showWarning();
          rapidInputCount = 0;
        }
      } else {
        rapidInputCount = 0;
      }
      
      lastInputTime = currentTime;
    });
    
    // Additional protection: monitor clipboard API
    inputElement.addEventListener('keydown', (e) => {
      // Block Ctrl+V, Cmd+V, Ctrl+Shift+V, etc.
      if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        this.showWarning();
        return false;
      }
    });
  }
  
  showWarning() {
    // Create or update warning message
    let warningDiv = document.getElementById('anti-paste-warning');
    
    if (!warningDiv) {
      warningDiv = document.createElement('div');
      warningDiv.id = 'anti-paste-warning';
      warningDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #ef4444;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        z-index: 10000;
        font-weight: 500;
        text-align: center;
        animation: antiPasteShake 0.6s ease-in-out;
      `;
      
      // Add CSS animation
      if (!document.getElementById('anti-paste-styles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'anti-paste-styles';
        styleSheet.textContent = `
          @keyframes antiPasteShake {
            0%, 100% { transform: translate(-50%, -50%) rotate(0deg); }
            10%, 30%, 50%, 70%, 90% { transform: translate(-50%, -50%) rotate(-3deg); }
            20%, 40%, 60%, 80% { transform: translate(-50%, -50%) rotate(3deg); }
          }
          
          .shake {
            animation: shake 0.5s ease-in-out;
          }
          
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
          }
        `;
        document.head.appendChild(styleSheet);
      }
      
      document.body.appendChild(warningDiv);
    }
    
    warningDiv.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 24px;">🚫</span>
        <div>
          <div style="font-weight: bold; margin-bottom: 4px;">No Copy-Paste Allowed!</div>
          <div style="font-size: 14px; opacity: 0.9;">Please type the word manually to learn effectively</div>
        </div>
      </div>
    `;
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      if (warningDiv && warningDiv.parentNode) {
        warningDiv.remove();
      }
    }, 3000);
    
    // Add shake effect to current input
    const activeInput = document.activeElement;
    if (activeInput && (activeInput.id === 'answer-input' || activeInput.id === 'retype-input')) {
      activeInput.classList.add('shake');
      setTimeout(() => {
        activeInput.classList.remove('shake');
      }, 500);
    }
  }
}

// Export to global scope
if (typeof window !== 'undefined') {
  window.AntiPasteGuard = AntiPasteGuard;
}