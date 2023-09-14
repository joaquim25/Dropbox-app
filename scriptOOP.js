class Messages {
  static accountAlreadyExists() {
    return "Account already exists.";
  }

  static accountAdded() {
    return "Account was added.";
  }

  static accountNotExists() {
    return "Account does not exist.";
  }

  static noAccounts() {
    return "No accounts.";
  }

  static accountWithLeastSpace(account) {
    return `Account with least free space: ${account}`;
  }

  static fileExceedsCapacity() {
    return "File size exceeds account capacity.";
  }

  static fileAlreadyExists() {
    return "File already exists in the account.";
  }

  static fileUploaded() {
    return "File uploaded into account.";
  }

  static fileDoesNotExist() {
    return "File does not exist.";
  }

  static fileSharingNotAllowed() {
    return "Account does not allow file sharing.";
  }

  static fileShared() {
    return "File was shared.";
  }

  static fileUpdated() {
    return "File was updated.";
  }

  static fileNotShared() {
    return "File not shared.";
  }

  static lastUpdatedBy(account) {
    return `Last update: ${account}`;
  }

  static mainPrompt() {
    return "Enter a command: (ADD, UPLOAD, SHARE, MINSPACE, LISTFILES, LISTALL, UPDATE, LASTUPDATE, EXIT)";
  }

  static exiting() {
    return "Exiting...";
  }

  static invalidCommand() {
    return "Invalid command.";
  }
}

class Account {
  #email;
  #memory;
  #filesShared;
  #files;
  #sharedMemoryRatio;

  constructor(email, availableSpace, sharedMemoryRatio) {
    this.#sharedMemoryRatio = sharedMemoryRatio;
    this.#email = email;
    this.#memory = availableSpace;
    this.#filesShared = [];
    this.#files = [];
  }

  // Getters
  get email() {
    return this.#email;
  }

  get files() {
    return this.#files;
  }

  get filesShared() {
    return this.#filesShared;
  }

  get memory() {
    return this.#memory;
  }

  get sharedMemoryRatio() {
    return this.#sharedMemoryRatio;
  }

  //Private Methods
  #getFile = (fileName) => this.files.find((file) => file.name === fileName);
  #getSharedFile = (fileName) =>
    this.filesShared.find((file) => file.name === fileName);

  #setMemory = (oper, amount) => {
    switch (oper) {
      case "+":
        this.#memory += amount;
        break;
      case "-":
        if (amount > this.memory) {
          return Messages.fileExceedsCapacity();
        }
        this.#memory -= amount;
        break;
      default:
        break;
    }
  };

  #addFileValidator = (fileName, newFile) => {
    for (const file of this.#files) {
      if (file.name === fileName) {
        return Messages.fileAlreadyExists();
      }
    }
    if (newFile.size > this.memory) {
      return Messages.fileExceedsCapacity();
    }
    return true;
  };

  #shareFileValidator = (ownerAccount, receiverAccount, fileToShare) => {
    if (!fileToShare) {
      return Messages.fileDoesNotExist();
    }
    if (!ownerAccount.canShare()) {
      return Messages.fileSharingNotAllowed();
    }
    if (
      ownerAccount instanceof PremiumAccount &&
      receiverAccount instanceof PremiumAccount
    ) {
      return Messages.fileShared();
    }
    if (fileToShare.size * 0.5 > receiverAccount.memory) {
      return Messages.fileExceedsCapacity();
    }
    return Messages.fileShared();
  };

  #updateFileValidator = (updaterAccount, fileToUpdate) => {
    if (!fileToUpdate) {
      return Messages.fileDoesNotExist();
    }
    if (!fileToUpdate.isShared() && this !== updaterAccount) {
      return Messages.fileNotShared();
    }
    return true;
  };

  // Public Methods
  addFile = (fileName, fileSize) => {
    const newFile = new File(fileName, fileSize, this.email);
    const validationResult = this.#addFileValidator(fileName, newFile);
    if (validationResult === true) {
      this.#files.push(newFile);
      this.#setMemory("-", newFile.size);
      return Messages.fileUploaded();
    } else {
      return validationResult;
    }
  };

  addSharedFile = (ownerAccount, receiverAccount, fileName) => {
    const fileToShare = ownerAccount.#getFile(fileName);
    const validationMessage = this.#shareFileValidator(
      ownerAccount,
      receiverAccount,
      fileToShare
    );
    if (validationMessage === Messages.fileShared()) {
      receiverAccount.#filesShared.push(fileToShare);
      receiverAccount.#setMemory(
        "-",
        fileToShare.size * receiverAccount.sharedMemoryRatio
      );
      fileToShare.share();
      return Messages.fileShared();
    } else {
      return validationMessage;
    }
  };

  updateFile = (updaterAccount, fileName) => {
    const fileToUpdate = this.#getFile(fileName);
    const validationMessage = this.#updateFileValidator(
      updaterAccount,
      fileToUpdate
    );
    if (validationMessage === true) {
      fileToUpdate.update(updaterAccount);
      return Messages.fileUpdated();
    } else {
      return validationMessage;
    }
  };

  getLastUpdateAccount = (fileName) => {
    // Get hold of the specified file in the owner's files
    let file = this.#getFile(fileName);

    // If the file is not found in the owner's files, check shared files
    if (!file) {
      file = this.#getSharedFile(fileName);
    }

    // If the file is still not found, return an error message
    if (!file) {
      return Messages.fileDoesNotExist();
    }

    // Return the email of the last person who updated the file
    return Messages.lastUpdatedBy(file.lastUpdatedBy);
  };

  canShare() {
    return this instanceof PremiumAccount;
  }
}

class BasicAccount extends Account {
  constructor(email) {
    const availableMemory = 2048;
    const fileWeight = 0.5;
    super(email, availableMemory, fileWeight);
  }
}

class PremiumAccount extends Account {
  constructor(email) {
    const availableMemory = 5120;
    const fileWeight = 0;
    super(email, availableMemory, fileWeight);
  }
}

class File {
  #name;
  #size;
  #owner;
  #lastUpdatedBy;
  #shared;

  constructor(name, size, owner) {
    this.#name = name;
    this.#size = size;
    this.#owner = owner;
    this.#lastUpdatedBy = owner;
    this.#shared = false;
  }

  //Getters
  get name() {
    return this.#name;
  }

  get size() {
    return this.#size;
  }

  get owner() {
    return this.#owner;
  }

  get lastUpdatedBy() {
    return this.#lastUpdatedBy;
  }

  get shared() {
    return this.#shared;
  }

  //Public Methods
  share() {
    this.#shared = true;
  }

  update(owner) {
    this.#lastUpdatedBy = owner.email;
  }

  isShared() {
    return this.shared;
  }
}

class DropboxApp {
  constructor() {
    this.accounts = {};

    // Private methods
    // ADD- Method to create an account.
    const createAccount = (email, type) => {
      if (this.accounts[email]) {
        //Check if an account with the provided email already exists
        return Messages.accountAlreadyExists();
      }
      // Create the account based on type
      switch (type) {
        case "basic":
          this.accounts[email] = new BasicAccount(email);
          break;
        case "premium":
          this.accounts[email] = new PremiumAccount(email);
          break;
        default:
          break;
      }

      return Messages.accountAdded();
    };

    // UPLOAD- Method the upload a file.
    const addFile = (email, fileName, fileSize) => {
      // Get hold of the current account by the email
      const account = this.accounts[email];

      // Check if the provided account exists
      if (!account) {
        return Messages.accountNotExists();
      }

      // Create a new file object

      // Runs the account addFile method
      const addResult = account.addFile(fileName, fileSize);
      return addResult;
    };

    // SHARE- Method to share a file between two users
    const shareFile = (owner, receiver, fileName) => {
      // Get the owner's and receiver's accounts
      const ownerAccount = this.accounts[owner];
      const receiverAccount = this.accounts[receiver];

      // Checks if either of the provided accounts do not exist
      if (!ownerAccount || !receiverAccount) {
        return Messages.accountNotExists();
      }

      // Call the addSharedFile method from the owner's account
      const shareResult = ownerAccount.addSharedFile(
        ownerAccount,
        receiverAccount,
        fileName
      );
      return shareResult;
    };

    // MINSPACE- Get the account with the least free space
    const getAccountLeastFreeSpace = () => {
      // Get an array of all account objects
      const accounts = Object.values(this.accounts);

      // Check if there are no accounts
      if (accounts.length === 0) {
        return Messages.noAccounts();
      }

      // Initialize with the first account as the one with least free space
      let accountLeastFreeSpace = accounts[0];

      // Iterate through each account and compare their memory usage, updating the accountLeastFreeSpace throughout
      for (const account of accounts) {
        if (account.memory < accountLeastFreeSpace.memory) {
          accountLeastFreeSpace = account;
        }
      }

      return Messages.accountWithLeastSpace(accountLeastFreeSpace.email);
    };

    // LISTFILES- List all the files in a given account
    const listAccountFiles = (email) => {
      // Get the account object by the provided email
      const account = this.accounts[email];

      //Check if the account exists
      if (!account) {
        return `${Messages.accountNotExists()}\n`;
      }

      // Initialize the list of files
      let filesList = "Account files:\n";

      // Iterate through the account's own files and add them to the list
      for (const file of account.files) {
        filesList += `${file.name} (${file.size} MB)\n`;
      }

      // Iterate through the account's shared files and add them to the list, marking them as shared
      for (const sharedFile of account.filesShared) {
        filesList += `${sharedFile.name} (${sharedFile.size} MB) (shared)\n`;
      }

      // Return the formatted list of files
      return filesList;
    };

    // LISTALL- List all the accounts in the app, email and type
    const listAllAccounts = () => {
      // Initialize the list of account details
      let accountList = "All accounts:\n";

      // Iterate through each account object and append its email and type to the list
      for (const account of Object.values(this.accounts)) {
        accountList += `${account.email} (${
          account instanceof PremiumAccount ? "Premium" : "Basic"
        })\n`;
      }

      // Return the formatted list of account details
      return accountList;
    };

    // UPDATE- Updates the information of a file
    const updateFile = (owner, updater, fileName) => {
      const ownerAccount = this.accounts[owner];
      const updaterAccount = this.accounts[updater];

      if (!ownerAccount || !updaterAccount) {
        return Messages.accountNotExists();
      }

      return ownerAccount.updateFile(updaterAccount, fileName);
    };

    // LASTUPDATE- Show the last update information for a specified file -----------> Passar para file
    const getLastUpdateAccount = (email, fileName) => {
      // Get the owner's account object based on the provided email
      const ownerAccount = this.accounts[email];

      // Check if the owner's account exists
      if (!ownerAccount) {
        return Messages.accountNotExists();
      }

      return ownerAccount.getLastUpdateAccount(fileName);
    };

    // Public methods
    this.createAccount = createAccount;
    this.addFile = addFile;
    this.shareFile = shareFile;
    this.getAccountLeastFreeSpace = getAccountLeastFreeSpace;
    this.listAccountFiles = listAccountFiles;
    this.listAllAccounts = listAllAccounts;
    this.updateFile = updateFile;
    this.getLastUpdateAccount = getLastUpdateAccount;
  }
}

class UserInterface {
  constructor(dropboxApp) {
    this.dropboxApp = dropboxApp;
  }

  //Helper function
  showDoubleAlert(content) {
    alert(content);
    alert("");
  }

  // Starts the user interaction loop
  start() {
    while (true) {
      const input = prompt(Messages.mainPrompt());

      // If the user types "EXIT" exit the loop.
      if (input.toUpperCase() === "EXIT") {
        this.showDoubleAlert(Messages.exiting());
        break;
      }

      // Split the input into a command and its arguments (array).
      const [command, ...args] = input.split(" ");
      // Handle the given command using the UserInterface handleCommand method
      this.handleCommand(command, args);
    }
  }

  // Method to handle the given user commands
  handleCommand(command, args) {
    let email, type, file, size, owner, receiver, updater;
    switch (command.toUpperCase()) {
      case "ADD":
        [email, type] = args;
        // Call the DropboxApp createAccount method and display the result
        const addResult = this.dropboxApp.createAccount(email, type);
        this.showDoubleAlert(addResult);
        break;

      case "UPLOAD":
        [email, file, size] = args;
        // Call the DropboxApp addFile method and display the result
        const uploadResult = this.dropboxApp.addFile(email, file, size);
        this.showDoubleAlert(uploadResult);
        break;

      case "SHARE":
        [owner, receiver, file] = args;
        // Call the DropboxApp shareFile method and display the result
        const shareResult = this.dropboxApp.shareFile(owner, receiver, file);
        this.showDoubleAlert(shareResult);
        break;

      case "MINSPACE":
        // Call the DropboxApp getAccountLeastFreeSpace method and display the result
        const minSpaceAccount = this.dropboxApp.getAccountLeastFreeSpace();
        this.showDoubleAlert(minSpaceAccount);
        break;

      case "LISTFILES":
        [email] = args;
        // Call the DropboxApp listAccountFiles method and display the result
        const listFilesResult = this.dropboxApp.listAccountFiles(email);
        alert(listFilesResult);
        break;

      case "LISTALL":
        // Call the DropboxApp listAllAccounts method and display the result
        const listAllResult = this.dropboxApp.listAllAccounts();
        alert(listAllResult);
        break;

      case "UPDATE":
        [owner, updater, file] = args;
        // Call the DropboxApp updateFile method and display the result
        const updateResult = this.dropboxApp.updateFile(owner, updater, file);
        this.showDoubleAlert(updateResult);
        break;

      case "LASTUPDATE":
        [email, file] = args;
        // Call the DropboxApp getLastUpdateAccount method and display the result
        const lastUpdateAccount = this.dropboxApp.getLastUpdateAccount(
          email,
          file
        );
        this.showDoubleAlert(lastUpdateAccount);
        break;

      default:
        // Display an error alert message for an invalid command
        this.showDoubleAlert(Messages.invalidCommand());
    }
  }
}

// Initialize DropboxApp
const dropboxApp = new DropboxApp();
const app = new UserInterface(dropboxApp);

// Start the app
app.start();
