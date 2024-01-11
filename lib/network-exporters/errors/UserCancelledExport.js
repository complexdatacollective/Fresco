class UserCancelledExport extends Error {
  constructor() {
    super();
    this.name = 'UserCancelledExport';
    this.message = 'The user cancelled the export process.';
  }
}

export default UserCancelledExport;
