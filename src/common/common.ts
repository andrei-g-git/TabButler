import { Message, SearchMode, TabData } from "./types";

export const isDev = true;

export async function getCurrentTab() {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true }); // what is the difference between currentWindow and lastFocused?
  return tab;
}

export async function getTabIdWithSearchOpen(
  windowId: number
): Promise<number | null> {
  // wde only want the active tab as that is the only place it can be in
  // get the tab in the window with search modal open and in tab search mode
  const [tab] = await chrome.tabs.query({ active: true, windowId });
  return new Promise((resolve, reject) => {
    if (tab?.id && !isChromeURL(tab.url!)) {
      chrome.tabs.sendMessage(
        tab.id,
        { message: Message.CHECK_SEARCH_OPEN },
        (respose: { isOpen: boolean; currentSearchMode: SearchMode }) => {
          resolve(
            respose.isOpen &&
              respose.currentSearchMode === SearchMode.TAB_SEARCH
              ? tab.id!
              : null
          );
        }
      );
    } else {
      resolve(null);
    }
  });
}

export function isChromeURL(url: string) {
  return (
    url.startsWith("chrome://") &&
    url.startsWith("chrome-extension://") &&
    // extension webstore
    url.startsWith("chrome.google.com")
  );
}

export async function getTabsInCurrentWindow() {
  // should I rely on this returning a promise???
  let tabs = await chrome.tabs.query({ currentWindow: true });
  return tabs
    .filter((tab) => {
      // will all pages have a title?
      return tab.id && tab.id !== chrome.tabs.TAB_ID_NONE && tab.url;
    })
    .map(({ id, favIconUrl, index, title, url }) => {
      // we know that these properties will be present
      const tabData: TabData = {
        tabId: id!,
        favIcon: favIconUrl || null,
        tabTitle: title!,
        tabUrl: url!,
        // muted info
      };
      return tabData;
    });
}
