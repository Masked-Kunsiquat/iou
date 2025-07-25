/// <reference types="svelte" />
/// <reference types="vite/client" />

// Add these types for the Contact Picker API
interface Contact {
  name: string[];
  tel: string[];
}

interface ContactsManager {
  select(properties: string[], options?: { multiple: boolean }): Promise<Contact[]>;
}

interface Navigator {
  contacts: ContactsManager;
}