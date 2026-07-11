import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

async function test() {
  console.log('Starting Custom Database Admin SDK test...');
  let firebaseConfig: any = {};
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
  } catch (err) {
    console.error('Failed to read config:', err);
    return;
  }

  try {
    console.log('Initializing firebase-admin app with projectId:', firebaseConfig.projectId);
    const app = initializeApp({
      projectId: firebaseConfig.projectId,
      credential: applicationDefault()
    }, 'custom-app');
    
    console.log('Getting Firestore for databaseId:', firebaseConfig.firestoreDatabaseId);
    const firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    
    console.log('Listing collections to test permission...');
    const collections = await firestore.listCollections();
    console.log('Successfully listed collections:', collections.map(c => c.id));
    
    console.log('Writing test document...');
    const ref = firestore.collection('users').doc('test_admin_user');
    await ref.set({ name: 'Test Admin User', test: true });
    console.log('Successfully wrote to custom database!');
    
    const docSnap = await ref.get();
    console.log('Read test document:', docSnap.data());
    
    await ref.delete();
    console.log('Successfully deleted test document!');
    
  } catch (error: any) {
    console.error('Error during Admin SDK test:', error);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

test();
