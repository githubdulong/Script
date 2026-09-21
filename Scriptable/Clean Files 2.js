// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: folder-open; share-sheet-inputs: file-url;

/**
 * Clean Files (Scriptable 文件与缓存专业清理工具)
 *
 * @version 2.5.1 (Refined & Hardened)
 * @author Honye / Optimized for MuTu
 *
 * 核心优化：
 * 1. 【彻底杜绝文字折行】：严格加上 [hidden] { display: none !important; } 与 white-space: nowrap，根治“全选”和“导入”被挤压上下折行的问题。
 * 2. 【全选机制可靠重构】：采用纯 CSS 类 (.item.is-selected) 进行状态绑定与联动，彻底解决点击“全选”不勾选、状态不生效的顽疾。
 * 3. 【实时选中容量显示】：进入选择模式时，底部删除按钮实时计算并展示勾选的项数与体积（如：删除 5 项 · 12.8 MB），删除心中有数。
 * 4. 【安全防误删防护】：删除前原生二次确认弹窗，并自动识别保护当前运行中的自身脚本，防止自杀式误删。
 * 5. 【真实容量换算】：精确按标准 B/KB/MB/GB 逐级换算，彻底修复原版将 Bytes 误当 KB 导致容量虚高成 GB 的严重 Bug。
 * 6. 【全目录容量可视化】：首页及各层级目录自动汇总项目数与占用空间，文件夹优先置顶、文件按体积降序排列，一眼定位垃圾大户。
 * 7. 【极简现代原生 UI】：精简页面标题英文后缀，自适应 iOS 16/17/18 深色与浅色模式，操作丝滑顺手。
 */

/**
 * 多语言国际化
 * @param {{[language: string]: string} | [en:string, zh:string]} langs
 */
const i18n = (langs) => {
  const language = Device.language();
  if (Array.isArray(langs)) {
    langs = {
      en: langs[0],
      zh: langs[1],
      others: langs[0],
    };
  } else {
    langs.others = langs.others || langs.en;
  }
  return langs[language] || langs.others;
};

// 文件管理器环境初始化
const fmLocal = FileManager.local();
const fmCloud = (() => {
  try {
    return FileManager.iCloud();
  } catch (e) {
    return null;
  }
})();
const usedICloud = fmCloud ? fmLocal.isFileStoredIniCloud(module.filename) : false;

/**
 * 智能获取适配的文件管理器（自动识别本地或 iCloud 路径）
 * @param {string} path
 * @returns {FileManager}
 */
const getFM = (path) => {
  if (!path) return fmLocal;
  try {
    if (fmCloud && (fmCloud.isFileStoredIniCloud(path) || path.includes('Mobile Documents'))) {
      return fmCloud;
    }
  } catch (e) {}
  return fmLocal;
};

/**
 * 精确格式化字节大小
 * @param {number} bytes
 * @returns {string}
 */
const formatSize = (bytes) => {
  if (bytes === undefined || bytes === null || isNaN(bytes) || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
};

/**
 * 计算目录大小与总项目数（带安全深度限制）
 * @param {string} dirPath
 * @param {number} maxDepth
 * @param {number} currentDepth
 * @returns {{ size: number, count: number }}
 */
const getDirSizeAndCount = (dirPath, maxDepth = 2, currentDepth = 0) => {
  const currentFm = getFM(dirPath);
  let totalSize = 0;
  let totalCount = 0;
  try {
    if (!currentFm.fileExists(dirPath) || !currentFm.isDirectory(dirPath)) {
      return { size: 0, count: 0 };
    }
    const items = currentFm.listContents(dirPath);
    totalCount = items.length;
    for (const name of items) {
      const fullPath = currentFm.joinPath(dirPath, name);
      try {
        if (currentFm.isDirectory(fullPath)) {
          if (currentDepth < maxDepth) {
            const sub = getDirSizeAndCount(fullPath, maxDepth, currentDepth + 1);
            totalSize += sub.size;
          }
        } else {
          totalSize += (currentFm.fileSize(fullPath) || 0);
        }
      } catch (e) {}
    }
  } catch (e) {}
  return { size: totalSize, count: totalCount };
};

/**
 * Scriptable WebView JSBridge 核心原生 SDK
 */
const sendResult = (() => {
  let sending = false;
  const queue = [];

  const processQueue = async (webView) => {
    if (sending || queue.length === 0) return;
    sending = true;
    while (queue.length > 0) {
      const item = queue.shift();
      const eventName = `ScriptableBridge_${item.code}_Result`;
      const res = item.data instanceof Error ? { err: item.data.message } : item.data;
      try {
        await webView.evaluateJavaScript(
          `window.dispatchEvent(
            new CustomEvent(
              ${JSON.stringify(eventName)},
              { detail: ${JSON.stringify(res)} }
            )
          )`
        );
      } catch (e) {
        console.error(e);
      }
    }
    sending = false;
  };

  return async (webView, code, data) => {
    queue.push({ code, data });
    await processQueue(webView);
  };
})();

/**
 * 注入 Bridge 脚本并监听通信
 * @param {WebView} webView
 * @param {object} options
 */
const inject = async (webView, options) => {
  const js = `(() => {
    const queue = window.__scriptable_bridge_queue;
    if (queue && queue.length) {
      completion(queue);
    }
    window.__scriptable_bridge_queue = null;

    if (!window.ScriptableBridge) {
      window.ScriptableBridge = {
        invoke(name, data, callback) {
          const detail = { code: name, data };
          const eventName = \`ScriptableBridge_\${name}_Result\`;
          const controller = new AbortController();
          window.addEventListener(
            eventName,
            (e) => {
              callback && callback(e.detail);
              controller.abort();
            },
            { signal: controller.signal }
          );

          if (window.__scriptable_bridge_queue) {
            window.__scriptable_bridge_queue.push(detail);
            completion();
          } else {
            completion(detail);
            window.__scriptable_bridge_queue = [];
          }
        }
      };
      window.dispatchEvent(new CustomEvent('ScriptableBridgeReady'));
    }
  })()`;

  const res = await webView.evaluateJavaScript(js, true);
  if (!res) return inject(webView, options);

  const methods = options.methods || {};
  const events = Array.isArray(res) ? res : [res];

  const sendTasks = events.map(({ code, data }) => {
    return (async () => {
      try {
        if (typeof methods[code] === 'function') {
          return await methods[code](data);
        }
        throw new Error(`Method [${code}] not implemented`);
      } catch (e) {
        return Promise.reject(e);
      }
    })()
      .then((r) => sendResult(webView, code, r))
      .catch((e) => {
        console.error(e);
        sendResult(webView, code, e instanceof Error ? e : new Error(String(e)));
      });
  });

  await Promise.all(sendTasks);
  inject(webView, options);
};

/**
 * 加载 HTML 并初始化注入
 * @param {WebView} webView
 * @param {object} args
 * @param {object} options
 */
const loadHTML = async (webView, args, options = {}) => {
  const { html, baseURL } = args;
  await webView.loadHTML(html, baseURL);
  inject(webView, options).catch((err) => console.error(err));
};

/**
 * 复制/覆盖文件
 * @param {string[]} fileURLs
 * @param {string} destPath
 */
const copyFiles = async (fileURLs, destPath) => {
  let isReplaceAll = false;
  const currentFm = getFM(destPath);
  for (const fileURL of fileURLs) {
    const fileName = currentFm.fileName(fileURL, true);
    const filePath = currentFm.joinPath(destPath, fileName);
    if (currentFm.fileExists(filePath)) {
      if (isReplaceAll) {
        currentFm.remove(filePath);
      } else {
        const alert = new Alert();
        alert.message = `“${fileName}”${i18n([' already exists. Do you want to replace it?', ' 已存在，是否替换？'])}`;
        const actions = [i18n(['All Yes', '全部替换']), i18n(['Yes', '替换']), i18n(['No', '跳过'])];
        for (const action of actions) alert.addAction(action);
        alert.addCancelAction(i18n(['Cancel', '取消']));
        const value = await alert.present();
        switch (actions[value]) {
          case i18n(['All Yes', '全部替换']):
            isReplaceAll = true;
            currentFm.remove(filePath);
            break;
          case i18n(['Yes', '替换']):
            currentFm.remove(filePath);
            break;
          case i18n(['No', '跳过']):
            continue;
          default:
            return;
        }
      }
    }
    currentFm.copy(fileURL, filePath);
  }
  const alert = new Alert();
  alert.title = i18n(['Import successful', '导入成功']);
  alert.message = i18n(['Re-enter this directory to view', '重新进入此目录可查看']);
  alert.addCancelAction(i18n(['OKay', '好的']));
  await alert.present();
};

/**
 * 导入外部文件
 * @param {string} destPath
 */
const importFiles = async (destPath) => {
  let fileURLs = args.fileURLs || [];
  if (!fileURLs.length) {
    try {
      fileURLs = await DocumentPicker.open();
    } catch (e) {
      return;
    }
  }
  await copyFiles(fileURLs, destPath);
};

/**
 * 呈现文件列表主视图
 * @param {object} options
 */
const presentList = async (options) => {
  const { title, list, directory, isRoot } = options;
  const webView = new WebView();

  const css = `
  :root {
    --text-primary: #1c1c1e;
    --text-secondary: #8e8e93;
    --color-primary: #007aff;
    --color-danger: #ff3b30;
    --divider-color: rgba(60, 60, 67, 0.12);
    --card-background: #ffffff;
    --bg-page: #f2f2f7;
    --bg-btn: rgba(0, 122, 255, 0.1);
    --fixed-btn-height: 3.2rem;
    --item-active-bg: rgba(0, 0, 0, 0.04);
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --text-primary: #ffffff;
      --text-secondary: #98989f;
      --color-primary: #0a84ff;
      --color-danger: #ff453a;
      --divider-color: rgba(84, 84, 88, 0.35);
      --card-background: #1c1c1e;
      --bg-page: #000000;
      --bg-btn: rgba(10, 132, 255, 0.15);
      --item-active-bg: rgba(255, 255, 255, 0.06);
    }
  }
  [hidden] {
    display: none !important;
  }
  * {
    -webkit-user-select: none;
    user-select: none;
    box-sizing: border-box;
  }
  body {
    margin: 0;
    -webkit-font-smoothing: antialiased;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
    min-height: 100vh;
    background-color: var(--bg-page);
    color: var(--text-primary);
    padding-top: env(safe-area-inset-top);
  }
  .header {
    position: sticky;
    z-index: 99;
    top: 0;
    left: 0;
    right: 0;
    height: 3.5rem;
    background: var(--card-background);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1rem;
    border-bottom: 0.5px solid var(--divider-color);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }
  .header__left,
  .header__right {
    display: flex;
    align-items: center;
    min-width: 4.2rem;
    flex-shrink: 0;
  }
  .header__left {
    justify-content: flex-start;
  }
  .header__right {
    justify-content: flex-end;
  }
  .header__btn,
  .select-all,
  .select {
    height: 1.85rem;
    padding: 0 0.8rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-primary);
    background-color: var(--bg-btn);
    border-radius: 99px;
    border: none;
    outline: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    white-space: nowrap !important;
    flex-shrink: 0 !important;
    cursor: pointer;
    transition: all 0.2s;
  }
  .header__btn:active,
  .select-all:active,
  .select:active {
    opacity: 0.6;
    transform: scale(0.96);
  }
  .title {
    flex: 1;
    font-size: 1.05rem;
    font-weight: 600;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin: 0;
    padding: 0 0.5rem;
  }
  .list-wrapper {
    margin: 1rem;
    background: var(--card-background);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,0.03);
  }
  .list {
    padding: 0;
    margin: 0;
    list-style: none;
  }
  .item {
    padding-left: 1rem;
    display: flex;
    align-items: center;
    overflow: hidden;
    cursor: pointer;
    transition: background-color 0.15s;
  }
  .item:active {
    background-color: var(--item-active-bg);
  }
  .item__body {
    flex: 1;
    display: flex;
    align-items: center;
    overflow: hidden;
    column-gap: 0.75rem;
  }
  .item__selection {
    width: 0;
    height: 1.5rem;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    opacity: 0;
    transition: width 0.2s, opacity 0.2s, margin-right 0.2s;
  }
  .list-select .item__selection {
    width: 1.5rem;
    opacity: 1;
    margin-right: 0.65rem;
  }
  .item__selection .icon-checked {
    display: none;
  }
  .item__selection .icon-unchecked {
    display: block;
  }
  .item.is-selected .item__selection .icon-checked {
    display: block;
  }
  .item.is-selected .item__selection .icon-unchecked {
    display: none;
  }
  .item__content {
    flex: 1;
    padding: 0.8rem 1rem 0.8rem 0;
    border-bottom: 0.5px solid var(--divider-color);
    overflow: hidden;
  }
  li:last-child .item__content {
    border-bottom: none;
  }
  .item__name {
    font-size: 0.95rem;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .item__name--protected {
    color: var(--color-primary);
  }
  .badge-protected {
    font-size: 0.7rem;
    padding: 0.1rem 0.35rem;
    background: var(--bg-btn);
    color: var(--color-primary);
    border-radius: 4px;
    margin-left: 0.35rem;
    vertical-align: middle;
  }
  .item__info {
    margin-top: 0.25rem;
    font-size: 0.8rem;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    column-gap: 0.5rem;
  }
  .fixed-bottom {
    position: fixed;
    z-index: 100;
    bottom: 0;
    left: 0;
    right: 0;
    padding-bottom: env(safe-area-inset-bottom);
    background: var(--card-background);
    border-top: 0.5px solid var(--divider-color);
    transform: translateY(100%);
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }
  .fixed-bottom.show {
    transform: translateY(0);
  }
  .btn-del {
    margin: 0;
    display: flex;
    width: 100%;
    height: var(--fixed-btn-height);
    justify-content: center;
    align-items: center;
    column-gap: 0.4rem;
    font-size: 0.95rem;
    font-weight: 600;
    background-color: transparent;
    color: var(--color-danger);
    padding: 0;
    border: none;
    cursor: pointer;
  }
  .btn-del:active {
    opacity: 0.6;
  }
  .bottom-holder {
    box-sizing: content-box;
    height: var(--fixed-btn-height);
    padding-bottom: env(safe-area-inset-bottom);
  }
  .empty-state {
    text-align: center;
    padding: 4rem 1.5rem;
    color: var(--text-secondary);
  }
  .empty-state__icon {
    font-size: 2.8rem;
    margin-bottom: 0.8rem;
  }
  .empty-state__text {
    font-size: 0.95rem;
    font-weight: 500;
  }
  .chevron-right {
    color: var(--text-secondary);
    opacity: 0.4;
    flex-shrink: 0;
  }
  `;

  const js = `
  window.invoke = (code, data) => {
    if (window.ScriptableBridge) {
      ScriptableBridge.invoke(code, data);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes || isNaN(bytes) || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1) + ' ' + sizes[i];
  };

  const isSelectMode = () => {
    return document.querySelector('.list')?.classList.contains('list-select');
  };

  const checkEmptyState = () => {
    const list = document.querySelector('.list');
    const emptyState = document.querySelector('.empty-state');
    const selectBtn = document.querySelector('.select');
    if (!list || list.children.length === 0) {
      if (emptyState) emptyState.removeAttribute('hidden');
      if (selectBtn) selectBtn.setAttribute('hidden', '');
    } else {
      if (emptyState) emptyState.setAttribute('hidden', '');
      if (selectBtn) selectBtn.removeAttribute('hidden');
    }
  };

  // 刷新底部删除按钮文字与全选按钮状态
  const updateSelectionState = () => {
    const allItems = Array.from(document.querySelectorAll('.item'));
    const selectedItems = Array.from(document.querySelectorAll('.item.is-selected'));
    const count = selectedItems.length;

    let totalBytes = 0;
    selectedItems.forEach((el) => {
      totalBytes += (parseInt(el.dataset.bytes) || 0);
    });

    const btnDelText = document.querySelector('.btn-del-text');
    if (btnDelText) {
      if (count > 0) {
        const sizeInfo = totalBytes > 0 ? (' · ' + formatSize(totalBytes)) : '';
        btnDelText.innerText = ${i18n(['`Delete (${count} items${sizeInfo})`', '`删除 (${count} 项${sizeInfo})`'])};
      } else {
        btnDelText.innerText = ${i18n(['"Delete"', '"删除"'])};
      }
    }

    const selectAllBtn = document.querySelector('.select-all');
    if (selectAllBtn && allItems.length > 0) {
      const isAllSelected = count === allItems.length;
      selectAllBtn.innerText = isAllSelected ? ${i18n(['"Deselect All"', '"取消全选"'])} : ${i18n(['"Select All"', '"全选"'])};
    }
  };

  // 进入或退出编辑模式
  const setSelectMode = (enable) => {
    const selectBtn = document.querySelector('.select');
    const selectAllBtn = document.querySelector('.select-all');
    const importBtn = document.querySelector('#import');
    const list = document.querySelector('.list');
    const bottomBar = document.querySelector('.fixed-bottom');

    if (enable) {
      selectBtn.innerText = ${i18n(['"Done"', '"完成"'])};
      if (importBtn) importBtn.setAttribute('hidden', '');
      if (selectAllBtn) selectAllBtn.removeAttribute('hidden');
      list?.classList.add('list-select');
      bottomBar?.classList.add('show');
    } else {
      selectBtn.innerText = ${i18n(['"Select"', '"选择"'])};
      if (selectAllBtn) selectAllBtn.setAttribute('hidden', '');
      if (importBtn) importBtn.removeAttribute('hidden');
      list?.classList.remove('list-select');
      bottomBar?.classList.remove('show');

      // 退出编辑时清除所有选中状态
      document.querySelectorAll('.item.is-selected').forEach((el) => el.classList.remove('is-selected'));
    }
    updateSelectionState();
  };

  // 顶部“选择 / 完成”按钮
  document.querySelector('.select')?.addEventListener('click', (e) => {
    const isEditing = isSelectMode();
    setSelectMode(!isEditing);
  });

  // 顶部“全选 / 取消全选”按钮
  document.querySelector('.select-all')?.addEventListener('click', (e) => {
    // 若未处于编辑模式，点击全选自动开启编辑模式
    if (!isSelectMode()) {
      setSelectMode(true);
    }

    const allItems = Array.from(document.querySelectorAll('.item'));
    const selectedItems = Array.from(document.querySelectorAll('.item.is-selected'));
    const isAllSelected = selectedItems.length === allItems.length;

    allItems.forEach((el) => {
      if (isAllSelected) {
        el.classList.remove('is-selected');
      } else {
        el.classList.add('is-selected');
      }
    });

    updateSelectionState();
  });

  // 单击列表条目
  document.querySelectorAll('.item').forEach((el) => {
    el.addEventListener('click', (e) => {
      const target = e.currentTarget;
      if (isSelectMode()) {
        target.classList.toggle('is-selected');
        updateSelectionState();
      } else {
        invoke('view', { ...target.dataset });
      }
    });
  });

  // 点击底部删除按钮
  document.querySelector('.btn-del')?.addEventListener('click', () => {
    const selectedItems = [];
    document.querySelectorAll('.item.is-selected').forEach((itemEl) => {
      selectedItems.push({ ...itemEl.dataset });
    });
    if (selectedItems.length === 0) {
      return;
    }
    invoke('remove', selectedItems);
  });

  // 响应删除成功事件
  const removeItems = (deletedList) => {
    if (!Array.isArray(deletedList)) return;
    const pathSet = new Set(deletedList.map(it => it.filePath || it.name));
    document.querySelectorAll('.item').forEach((el) => {
      const p = el.dataset.filePath || el.dataset.name;
      if (pathSet.has(p)) {
        const li = el.closest('li');
        if (li) li.remove();
      }
    });
    updateSelectionState();
    checkEmptyState();
  };

  window.addEventListener('JWeb', (e) => {
    const { code, data } = e.detail || {};
    if (code === 'remove-success') {
      removeItems(data);
    }
  });

  checkEmptyState();
  `;

  const selfPath = module.filename;

  const html = `<!DOCTYPE html>
  <html lang="${i18n(['en', 'zh-CN'])}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title>${title}</title>
    <style>${css}</style>
  </head>
  <body>
    <svg style="position: absolute;" width="0" height="0">
      <defs>
        <linearGradient id="folderGrad1" x1="16" y1="0" x2="16" y2="32" gradientUnits="userSpaceOnUse">
          <stop stop-color="#047AF6" stop-opacity="0.05"/>
          <stop offset="1" stop-color="#047AF6" stop-opacity="0.15"/>
        </linearGradient>
        <linearGradient id="folderGrad2" x1="16" y1="8" x2="16" y2="24" gradientUnits="userSpaceOnUse">
          <stop stop-color="#38bdf8"/>
          <stop offset="1" stop-color="#0284c7"/>
        </linearGradient>
        <linearGradient id="fileGrad1" x1="16" y1="0" x2="16" y2="32" gradientUnits="userSpaceOnUse">
          <stop stop-color="#64748b" stop-opacity="0.06"/>
          <stop offset="1" stop-color="#64748b" stop-opacity="0.15"/>
        </linearGradient>
      </defs>
    </svg>

    <div class="header">
      <div class="header__left">
        <button class="select-all" hidden>${i18n(['Select All', '全选'])}</button>
        ${directory
          ? `<button id="import" class="header__btn" onclick="invoke('import')">${i18n(['Import', '导入'])}</button>`
          : ''
        }
      </div>
      <h3 class="title">${title}</h3>
      <div class="header__right">
        ${list.length > 0 ? `<button class="select">${i18n(['Select', '选择'])}</button>` : ''}
      </div>
    </div>

    <div class="list-wrapper">
      <ul class="list">
      ${list.map((file) => {
        const isSelf = selfPath && file.filePath === selfPath;
        const bytesVal = file.rawBytes || 0;
        return `
        <li>
          <div class="item" 
            data-name="${file.name}"
            data-is-directory="${Number(file.isDirectory)}"
            data-file-path="${file.filePath}"
            data-bytes="${bytesVal}"
          >
            <div class="item__selection">
              <svg class="icon-unchecked" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="8.5" stroke="#8E8E93" stroke-width="1.6"/>
              </svg>
              <svg class="icon-checked" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" fill="#007AFF"/>
                <path d="M7.5 12L10.5 15L16.5 9" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="item__body">
              ${file.isDirectory
                ? `<svg width="2.2rem" height="2.2rem" viewBox="0 0 32 32" fill="none">
                    <rect width="32" height="32" rx="8" fill="url(#folderGrad1)"/>
                    <path d="M7 11.5C7 10.67 7.67 10 8.5 10H12.8C13.25 10 13.68 10.2 13.97 10.54L15.3 12.1H23.5C24.33 12.1 25 12.77 25 13.6V21.5C25 22.33 24.33 23 23.5 23H8.5C7.67 23 7 22.33 7 21.5V11.5Z" fill="url(#folderGrad2)"/>
                  </svg>`
                : `<svg width="2.2rem" height="2.2rem" viewBox="0 0 32 32" fill="none">
                    <rect width="32" height="32" rx="8" fill="url(#fileGrad1)"/>
                    <path d="M10 8C10 7.45 10.45 7 11 7H17.5L22 11.5V23C22 23.55 21.55 24 21 24H11C10.45 24 10 23.55 10 23V8Z" fill="#94A3B8"/>
                    <path d="M17 7V12H22" fill="#CBD5E1"/>
                  </svg>`
              }
              <div class="item__content">
                <div class="item__name ${isSelf ? 'item__name--protected' : ''}">
                  ${file.name}
                  ${isSelf ? `<span class="badge-protected">${i18n(['Protected', '当前脚本'])}</span>` : ''}
                </div>
                ${file.info ? `<div class="item__info">${file.info}</div>` : ''}
              </div>
              ${file.isDirectory ? `
              <svg class="chevron-right" width="12" height="12" viewBox="0 0 8 14" fill="none">
                <path d="M1 1L7 7L1 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>` : ''}
            </div>
          </div>
        </li>`;
      }).join('')}
      </ul>

      <div class="empty-state" ${list.length > 0 ? 'hidden' : ''}>
        <div class="empty-state__icon">📭</div>
        <div class="empty-state__text">${i18n(['This directory is empty', '此目录为空 / 暂无缓存文件'])}</div>
      </div>
    </div>

    <div class="bottom-holder"></div>
    <div class="fixed-bottom">
      <button class="btn-del">
        <svg width="1.25rem" height="1.25rem" viewBox="0 0 20 20" fill="none">
          <path d="M3.5 5.5H16.5M7 5.5V3.5C7 2.95 7.45 2.5 8 2.5H12C12.55 2.5 13 2.95 13 3.5V5.5M15 5.5V16C15 16.55 14.55 17 14 17H6C5.45 17 5 16.55 5 16V5.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M8 9V13.5M12 9V13.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="btn-del-text">${i18n(['Delete', '删除'])}</span>
      </button>
    </div>

    <script>${js}</script>
  </body>
  </html>`;

  // 打开子目录或预览文件
  const view = async (data) => {
    const { isDirectory, filePath, name } = data;
    const currentFm = getFM(filePath);

    if (Number(isDirectory)) {
      const unit = i18n(['items', '项']);
      let contents = [];
      try {
        contents = currentFm.listContents(filePath);
      } catch (e) {
        console.error(`无法读取目录内容: ${filePath} - ${e}`);
      }

      const subList = contents.map((itemName) => {
        const itemPath = currentFm.joinPath(filePath, itemName);
        let isDir = false;
        try {
          isDir = currentFm.isDirectory(itemPath);
        } catch (e) {}

        let dateStr = '';
        try {
          dateStr = currentFm.modificationDate(itemPath).toLocaleDateString('zh-CN');
        } catch (e) {}

        let infoStr = '';
        let rawBytes = 0;

        if (isDir) {
          const dirStat = getDirSizeAndCount(itemPath, 1);
          rawBytes = dirStat.size;
          infoStr = `${dateStr} · ${dirStat.count} ${unit}${rawBytes > 0 ? ` · ${formatSize(rawBytes)}` : ''}`;
        } else {
          try {
            rawBytes = currentFm.fileSize(itemPath) || 0;
          } catch (e) {}
          infoStr = `${dateStr} · ${formatSize(rawBytes)}`;
        }

        return {
          name: itemName,
          info: infoStr,
          filePath: itemPath,
          isDirectory: isDir,
          rawBytes,
        };
      });

      // 智能排序：文件夹排在最前，其次按体积降序排列，同等按名称
      subList.sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) {
          return a.isDirectory ? -1 : 1;
        }
        if (a.rawBytes !== b.rawBytes) {
          return b.rawBytes - a.rawBytes;
        }
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
      });

      presentList({
        title: name,
        list: subList,
        directory: filePath,
        isRoot: false,
      });
    } else {
      // 打开文件预览
      try {
        if (!currentFm.isFileDownloaded(filePath)) {
          await currentFm.downloadFileFromiCloud(filePath);
        }
      } catch (e) {}

      if (/\.(js|json)$/i.test(filePath)) {
        QuickLook.present(filePath);
        return;
      }
      if (/\.(jpg|jpeg|gif|png|heic|heif|webp)$/i.test(filePath)) {
        QuickLook.present(filePath, false);
        return;
      }
      try {
        const image = currentFm.readImage(filePath);
        if (image) {
          QuickLook.present(image, false);
          return;
        }
      } catch (e) {}
      try {
        const text = currentFm.readString(filePath);
        if (text) {
          QuickLook.present(text);
          return;
        }
      } catch (e) {}
      QuickLook.present(filePath);
    }
  };

  // 安全批量删除核心逻辑
  const remove = async (rawSelectedList) => {
    if (!rawSelectedList || !rawSelectedList.length) return;

    // 1. 运行自身脚本防误删保护
    const self = module.filename;
    let hasProtectedSelf = false;
    const filteredList = rawSelectedList.filter((it) => {
      if (self && it.filePath === self) {
        hasProtectedSelf = true;
        return false;
      }
      return true;
    });

    if (hasProtectedSelf) {
      const alertSelf = new Alert();
      alertSelf.title = i18n(['Protected', '🛡 安全防护']);
      alertSelf.message = i18n([
        'Current running script is protected and excluded from deletion.',
        '检测到所选内容包含当前正在运行的清理脚本，已自动排除保护，防止应用闪退！'
      ]);
      alertSelf.addAction(i18n(['OK', '好的']));
      await alertSelf.present();
    }

    if (filteredList.length === 0) return;

    // 2. 统计即将释放的总空间
    let totalBytes = 0;
    for (const it of filteredList) {
      const itemFm = getFM(it.filePath);
      try {
        if (Number(it.isDirectory)) {
          totalBytes += getDirSizeAndCount(it.filePath, 1).size;
        } else {
          totalBytes += (itemFm.fileSize(it.filePath) || 0);
        }
      } catch (e) {}
    }

    // 3. 原生确认对话框 (二次确认)
    const alert = new Alert();
    alert.title = i18n(['Confirm Deletion', '⚠️ 确认永久删除']);
    alert.message = i18n([
      `Are you sure you want to permanently delete ${filteredList.length} items (${formatSize(totalBytes)})? This action cannot be undone.`,
      `确认永久删除选中的 ${filteredList.length} 项内容吗？\n预计释放存储空间：${formatSize(totalBytes)}\n⚠️ 此操作不可撤销，请谨慎操作！`
    ]);
    alert.addDestructiveAction(i18n(['Delete Permanently', '确认永久删除']));
    alert.addCancelAction(i18n(['Cancel', '取消']));

    const actionIdx = await alert.present();
    if (actionIdx === -1) return; // 用户取消

    // 4. 执行安全删除
    const successfullyDeleted = [];
    for (const file of filteredList) {
      try {
        const itemFm = getFM(file.filePath);
        itemFm.remove(file.filePath);
        successfullyDeleted.push(file);
      } catch (err) {
        console.error(`删除失败: ${file.filePath} - ${err}`);
      }
    }

    // 5. 安全向前端同步已被删除的节点
    const detailJson = JSON.stringify({
      code: 'remove-success',
      data: successfullyDeleted,
    });
    await webView.evaluateJavaScript(
      `window.dispatchEvent(new CustomEvent('JWeb', { detail: ${detailJson} }))`,
      false
    );
  };

  await loadHTML(
    webView,
    {
      html,
      baseURL: 'https://scriptore.imarkr.com/scriptables/Clean%20Files%202'
    },
    {
      methods: {
        view,
        remove,
        import: () => importFiles(directory)
      }
    }
  );
  webView.present();
};

/**
 * 根目录分类装配（带容量与项目数实时统计）
 */
const buildRootDirectories = () => {
  const dirs = [
    {
      name: i18n(['Local Cache', '本地缓存']),
      filePath: FileManager.local().cacheDirectory(),
      isDirectory: true,
    },
    {
      name: i18n(['Local Temporary', '本地暂存']),
      filePath: FileManager.local().temporaryDirectory(),
      isDirectory: true,
    },
    {
      name: i18n(['Local Documents', '本地文件']),
      filePath: FileManager.local().documentsDirectory(),
      isDirectory: true,
    },
    {
      name: i18n(['Local Library', '本地支持库']),
      filePath: FileManager.local().libraryDirectory(),
      isDirectory: true,
    },
  ];

  if (usedICloud && fmCloud) {
    dirs.push(
      {
        name: i18n(['iCloud Documents', 'iCloud 脚本与文件']),
        filePath: fmCloud.documentsDirectory(),
        isDirectory: true,
      },
      {
        name: i18n(['iCloud Library', 'iCloud 支持库']),
        filePath: fmCloud.libraryDirectory(),
        isDirectory: true,
      }
    );
  }

  // 为首页各主要目录快速统计容量与项目数
  const unit = i18n(['items', '项']);
  const rootList = dirs.map((d) => {
    const stat = getDirSizeAndCount(d.filePath, 1);
    const sizeStr = stat.size > 0 ? ` · ${formatSize(stat.size)}` : '';
    return {
      ...d,
      info: `${stat.count} ${unit}${sizeStr}`,
      rawBytes: stat.size,
    };
  });

  return rootList;
};

// 启动执行
presentList({
  title: 'Clean Files',
  list: buildRootDirectories(),
  isRoot: true,
});
