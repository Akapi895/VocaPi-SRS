import { useCallback } from 'react';
import { ChromeMessage, ContentScriptMessage } from '@/types';

export const useChromeMessages = () => {
  const sendMessage = useCallback(async (message: ChromeMessage) => {
    try {
      return await chrome.runtime.sendMessage(message);
    } catch (error) {
      console.error('Failed to send message:', error);
      return null;
    }
  }, []);

  const sendMessageToTab = useCallback(async (tabId: number, message: ContentScriptMessage) => {
    try {
      return await chrome.tabs.sendMessage(tabId, message);
    } catch (error) {
      console.error('Failed to send message to tab:', error);
      return null;
    }
  }, []);

  const sendMessageToActiveTab = useCallback(async (message: ContentScriptMessage) => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab.id) {
        return await sendMessageToTab(tab.id, message);
      }
    } catch (error) {
      console.error('Failed to send message to active tab:', error);
    }
    return null;
  }, [sendMessageToTab]);

  const listenForMessages = useCallback((callback: (message: any, sender: chrome.runtime.MessageSender) => void) => {
    const messageListener = (message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
      callback(message, sender);
      sendResponse({ success: true });
    };

    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  const getCurrentTab = useCallback(async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      return tab;
    } catch (error) {
      console.error('Failed to get current tab:', error);
      return null;
    }
  }, []);

  const getSelectedText = useCallback(async () => {
    try {
      const tab = await getCurrentTab();
      if (tab?.id) {
        const response = await sendMessageToTab(tab.id, { type: 'GET_SELECTED_TEXT' });
        return response?.text || '';
      }
    } catch (error) {
      console.error('Failed to get selected text:', error);
    }
    return '';
  }, [getCurrentTab, sendMessageToTab]);

  const showAddModal = useCallback(async (word?: string) => {
    try {
      const tab = await getCurrentTab();
      if (tab?.id) {
        return await sendMessageToTab(tab.id, { 
          type: 'SHOW_ADD_MODAL', 
          data: { word } 
        });
      }
    } catch (error) {
      console.error('Failed to show add modal:', error);
    }
    return false;
  }, [getCurrentTab, sendMessageToTab]);

  const showSuccessMessage = useCallback(async (message: string, duration = 3000) => {
    try {
      const tab = await getCurrentTab();
      if (tab?.id) {
        return await sendMessageToTab(tab.id, { 
          type: 'SHOW_SUCCESS_MESSAGE', 
          data: { message, duration } 
        });
      }
    } catch (error) {
      console.error('Failed to show success message:', error);
    }
    return false;
  }, [getCurrentTab, sendMessageToTab]);

  const showErrorMessage = useCallback(async (message: string, duration = 4000) => {
    try {
      const tab = await getCurrentTab();
      if (tab?.id) {
        return await sendMessageToTab(tab.id, { 
          type: 'SHOW_ERROR_MESSAGE', 
          data: { message, duration } 
        });
      }
    } catch (error) {
      console.error('Failed to show error message:', error);
    }
    return false;
  }, [getCurrentTab, sendMessageToTab]);

  return {
    sendMessage,
    sendMessageToTab,
    sendMessageToActiveTab,
    listenForMessages,
    getCurrentTab,
    getSelectedText,
    showAddModal,
    showSuccessMessage,
    showErrorMessage
  };
};
