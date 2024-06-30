const {
  app,
  BrowserWindow,
  ipcMain,
  nativeTheme,
  globalShortcut,
  clipboard,
} = require("electron");
const path = require("node:path");
const storageHelper = require("./storageHelper");

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

const icon_path = path.join(__dirname, "../images/MacTools.png");
//console.log(icon_path);
app.dock.setIcon(icon_path);

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: icon_path, // Path to your icon file
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, "index.html"));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

ipcMain.handle("dark-mode:toggle", () => {
  if (nativeTheme.shouldUseDarkColors) {
    nativeTheme.themeSource = "light";
  } else {
    nativeTheme.themeSource = "dark";
  }
  return nativeTheme.shouldUseDarkColors;
});

ipcMain.handle("dark-mode:system", () => {
  nativeTheme.themeSource = "system";
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // Register a 'Control+C' shortcut listener.
  const copyret = globalShortcut.register("Control+C", () => {
    var text = clipboard.readText();
    if (text) {
      var latest = storageHelper.getItem("clipboard", "latest");
      if (latest && latest.text !== text) {
        var history = [];
        var existingHistory = storageHelper.getItem("clipboard", "history");
        if (existingHistory) {
          history = existingHistory;
        }
        existingHistory.put(latest);
        storageHelper.setItem("clipboard", "history", existingHistory);
        storageHelper.setItem("clipboard", "latest", {
          text: text,
          datetime: getTimestamp(),
        });
      } else {
        var obj = {
          text: text,
          datetime: getTimestamp(),
        };
        storageHelper.setItem("clipboard", "latest", obj);
      }
    }
  });

  if (!copyret) {
    console.log("copy shortcut registration failed");
  }

  // Register a 'Control+V' shortcut listener.
  const pasteret = globalShortcut.register("Control+V", () => {
    openClipboardHistory();
  });

  if (!pasteret) {
    console.log("past shortcut registration failed");
  }
  // Check whether a shortcut is registered.
  console.log(globalShortcut.isRegistered("Control+V"));

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

app.on("will-quit", () => {
  // Unregister all shortcuts.
  globalShortcut.unregisterAll();
});

function openClipboardHistory() {
  const clipboardAppWindow = new BrowserWindow({
    width: 400,
    height: 600,
    icon: icon_path, // Path to your icon file
    title: "Clipboard History",
    webPreferences: {
      preload: path.join(__dirname, "clipboard-hostory/preload.js"),
    },
  });
  clipboardAppWindow.loadFile(
    path.join(__dirname, "clipboard-hostory/index.html")
  );

  // Listen for the 'blur' event
  clipboardAppWindow.on("blur", () => {
    clipboardAppWindow.close();
  });
}

const getTimestamp = () => {
  return new Date().toISOString();
};
