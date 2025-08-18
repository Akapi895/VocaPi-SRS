console.log('Vocab SRS content script loaded');

if (!window.vocabSRSInitialized) {
  window.vocabSRSInitialized = true;
  (document.readyState==='loading' ? document.addEventListener('DOMContentLoaded',init) : init());
}

function init() {
  if (!window.VocabUtils || !window.VocabAPI) {
    console.error('Vocab SRS utilities not loaded');
    return;
  }
  console.log('Vocab SRS initialized on', location.hostname);
}

chrome.runtime.onMessage.addListener((req, _, sendRes)=>{
  if (req.action==='ping') return sendRes({status:'active'}), true;
  if (req.action==='showAddModal' && req.word) {
    const res = window.VocabSRS?.showAddModal ? 'modal shown' : 'modal not available';
    window.VocabSRS?.showAddModal?.(req.word);
    return sendRes({status:res}), true;
  }
});

let currentUrl = location.href;
const handleUrlChange = ()=>{
  if (location.href!==currentUrl) {
    currentUrl=location.href;
    console.log('URL changed, reinit');
    setTimeout(init,500);
  }
};

new MutationObserver(handleUrlChange).observe(document.body,{childList:true,subtree:true});
addEventListener('popstate',handleUrlChange);
addEventListener('beforeunload',()=>{
  window.VocabAPI?.AudioPlayer?.stop();
});
