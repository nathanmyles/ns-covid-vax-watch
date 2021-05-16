var fs = require("fs");

const storageFileName = 'email-storage.json'

class EmailStore {
  constructor() {
    this.sent_emails = []
    this.failedToSave = false
    this.load()
  }

  load() {
    try {
      this.sent_emails = JSON.parse(fs.readFileSync(storageFileName)) || []
      console.log(`Datastore loaded ${this.sent_emails.length} emails\n`)
    } catch (e) {
      console.log('No datastore found. Will create a new one.')
      this.data = []
    }
  }

  save() {
    fs.writeFile(storageFileName, JSON.stringify(this.sent_emails, null, '\t'), err => {
      if (!err) {
        return
      }

      if (!this.failedToSave) {
        console.error("unable to save processed emails", err)
      }
      this.failedToSave = true;
    });
  }

  add(email) {
    const newEmail = !this.includes(email)

    if (newEmail) {
      this.sent_emails.push(email);
      this.save();
    }
  }

  includes(email) {
    return this.sent_emails.includes(email)
  }

  get length() {
    return this.sent_emails.length
  }
}

exports.EmailStore = EmailStore