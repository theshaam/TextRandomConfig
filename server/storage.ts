// Storage interface for future expansion
export interface IStorage {
  // Add storage methods here as needed
}

export class MemStorage implements IStorage {
  constructor() {
    // Initialize storage here
  }
}

export const storage = new MemStorage();
