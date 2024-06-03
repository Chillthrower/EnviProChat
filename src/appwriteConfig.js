import { Client, Account, Databases } from 'appwrite';

export const API_ENDPOINT = 'https://cloud.appwrite.io/v1'
export const PROJECT_ID = '665b0d2c000615d85445'
export const DATABASE_ID = '665b0d9a000236663e36'
export const COLLECTION_ID_MESSAGES = '665b0da1003a3e02c85f'
export const COLLECTION_ID_CHANNELS = '665cca5100193a05fe2a';

const client = new Client()
    .setEndpoint(API_ENDPOINT) 
    .setProject(PROJECT_ID);    

export const account = new Account(client);
export const databases = new Databases(client)

export default client;