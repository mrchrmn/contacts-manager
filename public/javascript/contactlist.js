import { API } from "./api.js";


class Contact {
  constructor(id, full_name, email, phone_number, tags) {
    this.id = id;
    this.full_name = full_name;
    this.email = email;
    this.phone_number = phone_number;
    this.tags = tags;
  }

  // restore proper Contact object from JSON data
  static fromData(contactData) {
    return Object.assign(new Contact(), contactData);
  }

  getDetails() {
    return Object.assign({}, this);
  }

  getTags() {
    if (!this.tags) return [];

    return this.tags.split(",");
  }

  // converts input string into properly formatted string
  setTags(inputString) {
    this.tags = Array.from(new Set(inputString.split(",")
                                              .map(tag => tag.toLowerCase()
                                                             .trim()))
                          ).join(",");
  }

  setName(newName) {
    this.full_name = newName;
  }

  setEmail(newEmail) {
    this.email = newEmail;
  }

  setPhone(newNumber) {
    this.phone_number = newNumber;
  }
};


export class ContactList {
  constructor() {
    this.contacts = [];
  }

  // restore proper ContactList object from JSON data
  static async makeList() {
    let data = await API.getAll();
    let list = new ContactList();

    data.forEach(contactData => {
      list.contacts.push(Contact.fromData(contactData));
    });

    return list;
  }


  async add(contactData) {
    let contact = Contact.fromData(contactData);
    this.contacts.push(contact);
    await API.post(contact);
  }

  async update(contactData) {
    let contact = this.findById(contactData.id);

    contact.setName(contactData.full_name);
    contact.setEmail(contactData.email);
    contact.setPhone(contactData.phone_number);
    contact.setTags(contactData.tags);

    await API.put(contact);
  }

  async delete(id) {
    let index = this.indexOf(id);
    this.contacts.splice(index, 1);
    await API.delete(id);
  }


  indexOf(id) {
    let index;
    this.contacts.forEach((contact, idx) => {
      if (contact.id === id) index = idx;
    });
    return index;
  }

  generateId() {
    let highestId = this.contacts.map(contact => contact.id).sort((a, b) => Number(b) - Number(a))[0];
    return Number(highestId) + 1;
  }


  findById(id) {
    let filtered = this.contacts.filter(contact => contact.id === id);

    if (filtered.length > 0) {
      return this.contacts.filter(contact => contact.id === id)[0];
    } else {
      return null;
    }
  }

  findByString(string, namesOnly) {
    string = string.toLowerCase();

    if (!string || string.length === 0) return this.getAll();

    let filtered

    if (namesOnly) {
      filtered = this.contacts.filter(contact => {
        if (contact.full_name.toLowerCase().includes(string)) return true;
      });  
    } else {
      filtered = this.contacts.filter(contact => {
        if (contact.full_name.toLowerCase().includes(string) ||
            contact.email.toLowerCase().includes(string) ||
            contact.phone_number?.toLowerCase().includes(string)) return true;
        if (contact.tags) {
          if (contact.tags.includes(string)) return true;
        }
      });  
    }

    return filtered;
  }

  findByTags(tagArray) {
    if (!tagArray || tagArray.length === 0) return this.getAll();

    let filtered = this.contacts.filter(contact => {
      return tagArray.some(tag => contact.getTags().includes(tag));
    });

    return filtered;
  }

  
  getAll() {
    return this.contacts.slice();
  }

  getAllTags() {
    let allTags = this.contacts.reduce((tags, contact) => {
      return tags.concat(contact.getTags())
    }, []);

    return Array.from(new Set(allTags));
  }

  getVisible(searchString, searchTags, namesOnly) {
    return this.findByString(searchString, namesOnly)
               .filter(contact => this.findByTags(searchTags)
                                      .includes(contact));
  }

  getVisibleIds(searchString, searchTags, namesOnly) {
    return this.getVisible(searchString, searchTags, namesOnly).map(contact => contact.id);
  }
};