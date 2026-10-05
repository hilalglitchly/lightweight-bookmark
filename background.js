// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'bookmark-tab',
        title: 'Bookmark this tab',
        contexts: ['page']
    });
});

// Handle context menu click — open folder picker popup
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'bookmark-tab' && tab) {
        const params = new URLSearchParams({
            title: tab.title || 'New Bookmark',
            url: tab.url || ''
        });

        chrome.windows.create({
            url: `bookmark_save.html?${params.toString()}`,
            type: 'popup',
            width: 400,
            height: 420,
            focused: true
        });
    }
});
