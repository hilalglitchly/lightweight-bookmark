// Build context menu with folder sub-menus
chrome.runtime.onInstalled.addListener(() => {
    buildContextMenu();
});

// Rebuild menu when bookmarks change
chrome.bookmarks.onCreated.addListener(rebuildIfFolder);
chrome.bookmarks.onRemoved.addListener(buildContextMenu);
chrome.bookmarks.onChanged.addListener(buildContextMenu);
chrome.bookmarks.onMoved.addListener(buildContextMenu);

function rebuildIfFolder(id, bookmark) {
    // Only rebuild if a folder was created (no url = folder)
    if (!bookmark.url) buildContextMenu();
}

function buildContextMenu() {
    chrome.contextMenus.removeAll(() => {
        // Parent menu item
        chrome.contextMenus.create({
            id: 'bookmark-parent',
            title: 'Bookmark this tab',
            contexts: ['page']
        });

        // Build folder sub-menus from bookmark tree
        chrome.bookmarks.getTree((tree) => {
            const roots = tree[0].children || [];
            roots.forEach(root => {
                createFolderMenus(root, 'bookmark-parent');
            });
        });
    });
}

function createFolderMenus(node, parentMenuId) {
    // Only process folders (no url)
    if (node.url) return;

    const menuId = 'folder-' + node.id;
    const title = node.title || 'Bookmarks';

    chrome.contextMenus.create({
        id: menuId,
        title: title,
        parentId: parentMenuId,
        contexts: ['page']
    });

    // Recursively add subfolders
    const subfolders = (node.children || []).filter(c => !c.url);
    subfolders.forEach(child => {
        createFolderMenus(child, menuId);
    });
}

// Handle click — save bookmark to selected folder
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (!info.menuItemId.startsWith('folder-') || !tab) return;

    const folderId = info.menuItemId.replace('folder-', '');

    chrome.bookmarks.create({
        parentId: folderId,
        title: tab.title || 'New Bookmark',
        url: tab.url
    }, (created) => {
        if (chrome.runtime.lastError) {
            console.error('Bookmark failed:', chrome.runtime.lastError.message);
            return;
        }
        // Show green badge as confirmation
        chrome.action.setBadgeText({ text: '✓', tabId: tab.id });
        chrome.action.setBadgeBackgroundColor({ color: '#22c55e', tabId: tab.id });
        setTimeout(() => {
            chrome.action.setBadgeText({ text: '', tabId: tab.id });
        }, 2000);
    });
});
