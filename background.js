// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'bookmark-tab',
        title: 'Bookmark this tab',
        contexts: ['page']
    });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'bookmark-tab' && tab) {
        // Get the user's pinned folder, fallback to Bookmarks Bar ('1')
        chrome.storage.local.get(['defaultFolderId'], (result) => {
            const parentId = result.defaultFolderId || '1';

            chrome.bookmarks.create({
                parentId: parentId,
                title: tab.title || 'New Bookmark',
                url: tab.url
            }, (created) => {
                if (chrome.runtime.lastError) {
                    console.error('Bookmark failed:', chrome.runtime.lastError.message);
                    return;
                }
                // Get folder name for notification
                chrome.bookmarks.get(parentId, (nodes) => {
                    const folderName = nodes && nodes[0] ? nodes[0].title : 'Bookmarks';
                    // Show a badge briefly to confirm
                    chrome.action.setBadgeText({ text: '✓', tabId: tab.id });
                    chrome.action.setBadgeBackgroundColor({ color: '#22c55e', tabId: tab.id });
                    setTimeout(() => {
                        chrome.action.setBadgeText({ text: '', tabId: tab.id });
                    }, 2000);
                });
            });
        });
    }
});
