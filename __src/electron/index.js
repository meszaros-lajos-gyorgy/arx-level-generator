const path = require('path')
const { app, BrowserWindow, dialog, ipcMain } = require('electron')

let win

const createWindow = () => {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, './build/app.js'),
    },
  })

  win.loadFile(path.join(__dirname, './static/index.html'))

  win.webContents.on('did-finish-load', () => {
    const version = require('../../package.json').version
    win.setTitle(`Arx Fatalis Level Generator (${version})`)
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.on('change output directory', async (e) => {
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    properties: ['openDirectory'],
  })

  if (!canceled) {
    e.sender.send('output directory changed', filePaths[0])
  }
})
