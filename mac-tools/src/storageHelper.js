const { safeStorage } = require("electron");
const Store = require("electron-store");

const getStore = (storeName) => {
  return new Store({
    name: storeName,
  });
};

const encrypt = (data) => {
  return safeStorage.isEncryptionAvailable()
    ? safeStorage.encryptString(data).toString("base64")
    : data;
};

const decrypt = (data) => {
  return safeStorage.isEncryptionAvailable()
    ? safeStorage.decryptString(Buffer.from(data, "base64"))
    : data;
};

module.exports = {
  setItem: (storeName, key, value) => {
    const store = getStore(storeName);
    const encryptedValue = encrypt(value);
    store.set(key, encryptedValue);
  },
  getItem: (storeName, key) => {
    const store = getStore(storeName);
    const encryptedValue = store.get(key);
    return encryptedValue ? decrypt(encryptedValue) : null;
  },
  deleteItem: (storeName, key) => {
    const store = getStore(storeName);
    store.delete(key);
  },
};
