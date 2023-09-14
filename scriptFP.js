// Messages
const ACCOUNT_ALREADY_EXISTS = "Account already exists.";
const ACCOUNT_NOT_FOUND = "Account does not exist.";
const ACCOUNT_NOT_ALLOWED_SHARE = "Account does not allow file sharing.";
const ACCOUNT_ADDED = "Account was added.";
const NO_ACCOUNTS = "No accounts.";
const FILE_NOT_FOUND = "File does not exist.";
const FILE_ALREADY_EXISTS = "File already exists in the account.";
const FILE_SIZE_EXCEEDS_CAPACITY = "File size exceeds account capacity.";
const FILE_SHARED = "File was shared.";
const FILE_NOT_SHARED = "File not shared.";
const FILE_UPDATED = "File was updated.";
const FILE_UPLOADED = "File uploaded into account.";
const MAIN_PROMPT =
  "Enter a command: (ADD, UPLOAD, SHARE, MINSPACE, LISTFILES, LISTALL, UPDATE, LASTUPDATE, EXIT)";
const EXITING = "Exiting...";
const INVALID_COMMAND = "Invalid command.";
const LAST_UPDATED = (account) => `Last update: ${account}`;
const ACCOUNT_LEAST_SPACE = (account) =>
  `Account with least free space: ${account}`;

//   App state -----------------------------------------------------------------
const state = {
  accounts: {},

  // ---------------------------  State actions ---------------------------------
  // Create an account
  createAccount(type, email) {
    type === "basic"
      ? (state.accounts[email] = {
          email,
          memory: 2048,
          type: "Basic",
          files: [],
          filesShared: [],
        })
      : (state.accounts[email] = {
          email,
          memory: 5120,
          type: "Premium",
          files: [],
          filesShared: [],
        });
  },

  // Upload a file into an account
  addFile(newFile, account) {
    account.files = [...account.files, newFile];
    account.memory -= newFile.size;
  },

  // Share a file with another user
  shareFile(receiverAccount, fileToShare, sharedSize = 0) {
    receiverAccount.filesShared = [...receiverAccount.filesShared, fileToShare];
    fileToShare.shared = true;
    receiverAccount.memory -= sharedSize;
  },

  // Update the lastUpdatedBy field of a file
  updateFile(file, updaterAccount) {
    file.lastUpdatedBy = updaterAccount.email;
  },
};

// Helper Functions --------------------------------------------------
// Return pretended file
function findFile(account, fileName) {
  return account.files.find((existingFile) => existingFile.name === fileName);
}

// Return pretended shared File
function findSharedFile(account, fileName) {
  return account.filesShared.find((sharedFile) => sharedFile.name === fileName);
}

// Return true if file exists in specific account, false otherwise
function fileExists(account, fileName) {
  return account.files.some((file) => file.name === fileName);
}

// Return targeted account object
function findAccountByEmail(email) {
  return state.accounts[email];
}

// Return true if size if bigger than targeted account memory, false otherwise
function notEnoughMemory(size, account) {
  return size > account.memory;
}

// Function to add an empty alert for test purposes
function showDoubleAlert(content) {
  alert(content);
  alert("");
}

// Shows a simple single alert
function showSimpleAlert(content) {
  alert(content);
}

// Main Functions -------------------------------------------------------

// ADD- Method to create an account.
function createAccount(email, type) {
  if (findAccountByEmail(email)) {
    return ACCOUNT_ALREADY_EXISTS;
  }

  switch (type) {
    case "basic":
      state.createAccount(type, email);
      break;
    case "premium":
      state.createAccount(type, email);
      break;
    default:
      break;
  }

  return ACCOUNT_ADDED;
}

// UPLOAD- Method the upload a file.
function addFile(email, fileName, fileSize) {
  const account = findAccountByEmail(email);

  if (!account) {
    return ACCOUNT_NOT_FOUND;
  }

  if (fileExists(account, fileName)) {
    return FILE_ALREADY_EXISTS;
  }

  const newFile = {
    name: fileName,
    size: fileSize,
    owner: account,
    shared: false,
    lastUpdatedBy: account.email,
  };

  if (notEnoughMemory(newFile.size, account)) {
    return FILE_SIZE_EXCEEDS_CAPACITY;
  }

  state.addFile(newFile, account);

  return FILE_UPLOADED;
}

// SHARE- Method to share a file between two users
function shareFile(owner, receiver, fileName) {
  // Get hold of the account that will send the file and the account that will receive it
  const ownerAccount = findAccountByEmail(owner, state.accounts);
  const receiverAccount = findAccountByEmail(receiver, state.accounts);

  // Check if either of the accounts do nor exist
  if (!ownerAccount || !receiverAccount) {
    return ACCOUNT_NOT_FOUND;
  }

  // Gets hold of the first object in the owner files array that matches the fileName
  const fileToShare = findFile(ownerAccount, fileName);
  // Check if no file object was found
  if (!fileToShare) {
    return FILE_NOT_FOUND;
  }

  // Check the account type of the owner and prevent sharing if it is not "Premium"
  if (ownerAccount.type !== "Premium") {
    return ACCOUNT_NOT_ALLOWED_SHARE;
  }

  // Send the file if the receiver account is "Premium" -----
  if (receiverAccount.type === "Premium") {
    state.shareFile(receiverAccount, fileToShare);
    return FILE_SHARED;
  }

  // Send the file if the receiver account is "Basic" -------
  const sharedSize = fileToShare.size * 0.5;
  // Check if the receiver has enough memory available to hold the shared file
  if (notEnoughMemory(sharedSize, receiverAccount)) {
    return FILE_SIZE_EXCEEDS_CAPACITY;
  }

  state.shareFile(receiverAccount, fileToShare, sharedSize);

  return FILE_SHARED;
}

// MINSPACE- Get the account with the least free space
function getAccountLeastFreeSpace() {
  // Returns an array with the account names on the accounts object
  const accountList = Object.values(state.accounts);

  // Check if the accounts object was empty
  if (accountList.length === 0) {
    return NO_ACCOUNTS;
  }

  // Iterate through the accounts comparing the memory throughout and getting hold of the smaller memory one
  const accountLeastFreeSpace = accountList.reduce((acc, account) => {
    return account.memory < acc.memory ? account : acc;
  }, accountList[0]);

  return ACCOUNT_LEAST_SPACE(accountLeastFreeSpace.email);
}

// LISTFILES- List all the files in a given account
function listAccountFiles(email) {
  // Get hold of the given account
  const account = findAccountByEmail(email, state.accounts);

  // Check if the given account does not exists
  if (!account) {
    return `${ACCOUNT_NOT_FOUND}\n`;
  }

  // Loop through the account files & filesShared, creating a string with the file object properties
  // of name and size for each one, and joining them afterwards in a string separated by "\n"
  const filesList = account.files
    .map((file) => `${file.name} (${file.size} MB)`)
    .join("\n");
  const sharedFilesList = account.filesShared
    .map((file) => `${file.name} (${file.size} MB) (shared)`)
    .join("\n");

  // Return a string with the previous strings, being the second one optional
  return `Account files:\n${filesList}\n${
    sharedFilesList ? sharedFilesList + "\n" : ""
  }`;
}

// LISTALL- List all the accounts in the app, email and type
function listAllAccounts() {
  // Returns an array with the account names on the accounts object
  const accountList = Object.values(state.accounts);

  // Loop through the accountsList, creating a string with the account object properties
  // of email and type for each one, and joining them afterwards in a string separated by "\n"
  // and return that string
  return accountList
    .map((account) => `${account.email} (${account.type})`)
    .join("\n");
}

// UPDATE- Updates the information of a file
function updateFile(ownerEmail, updaterEmail, fileName) {
  // Get hold of the account that owns the file and the account that will update it
  const ownerAccount = findAccountByEmail(ownerEmail, state.accounts);
  const updaterAccount = findAccountByEmail(updaterEmail, state.accounts);

  // Check if either the accounts do not exist
  if (!ownerAccount || !updaterAccount) {
    return ACCOUNT_NOT_FOUND;
  }

  // Gets hold of the first object in the owner files array that matches the fileName
  const file = findFile(ownerAccount, fileName);

  // Check if no file was found
  if (!file) {
    return FILE_NOT_FOUND;
  }

  // Check if the owner account is different from the updater account and the file was not shared
  if (ownerAccount !== updaterAccount && !file.shared) {
    return FILE_NOT_SHARED;
  }

  // Change the file lastUpdatedBy value to the updaterAccount email
  state.updateFile(file, updaterAccount);
  return FILE_UPDATED;
}

// LASTUPDATE- Show the last update information for a specified file
function getLastUpdateAccount(email, fileName) {
  // Get hold of the given account
  const ownerAccount = findAccountByEmail(email, state.accounts);

  // Check if the account does not exists
  if (!ownerAccount) {
    return ACCOUNT_NOT_FOUND;
  }

  // Search in both the files and filesShared and gets hold of the given file
  const file =
    findFile(ownerAccount, fileName) || findSharedFile(ownerAccount, fileName);

  // Check if not file was found
  if (!file) {
    return FILE_NOT_FOUND;
  }

  // Returns a sentence with the lastUpdatedBy information of that file
  return LAST_UPDATED(file.lastUpdatedBy);
}

// Dropbox App Interface Functions ------------------------------------------------
function handleCommand(command, args) {
  let email, type, file, size, owner, receiver, updater;

  switch (command.toUpperCase()) {
    case "ADD":
      [email, type] = args;
      const addResult = createAccount(email, type);
      showDoubleAlert(addResult);
      break;

    case "UPLOAD":
      [email, file, size] = args;
      const uploadResult = addFile(email, file, size);
      showDoubleAlert(uploadResult);
      break;

    case "SHARE":
      [owner, receiver, file] = args;
      const shareResult = shareFile(owner, receiver, file);
      showDoubleAlert(shareResult);
      break;

    case "MINSPACE":
      const minSpaceAccount = getAccountLeastFreeSpace();
      showDoubleAlert(minSpaceAccount);
      break;

    case "LISTFILES":
      [email] = args;
      const listFilesResult = listAccountFiles(email);
      showSimpleAlert(listFilesResult);
      break;

    case "LISTALL":
      const listAllResult = listAllAccounts();
      showSimpleAlert("All accounts:");
      showDoubleAlert(listAllResult);
      break;

    case "UPDATE":
      [owner, updater, file] = args;
      const updateResult = updateFile(owner, updater, file);
      showDoubleAlert(updateResult);
      break;

    case "LASTUPDATE":
      [email, file] = args;
      const lastUpdateAccount = getLastUpdateAccount(email, file);
      showDoubleAlert(lastUpdateAccount);
      break;

    default:
      showDoubleAlert(INVALID_COMMAND);
  }
}

function userInterface() {
  while (true) {
    const input = prompt(MAIN_PROMPT);

    if (input.toUpperCase() === "EXIT") {
      showDoubleAlert(EXITING);
      break;
    }

    const [command, ...args] = input.split(" ");
    handleCommand(command, args);
  }
}

//Start the app
userInterface();
