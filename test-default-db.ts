import { getApps, initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

async function test() {
  console.log('Starting Default Firestore database test...');
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
    const app = initializeApp({
      projectId: firebaseConfig.projectId,
      credential: applicationDefault()
    }, 'default-app');
    
    // Explicitly use default database
    const firestore = getFirestore(app);
    console.log('Testing default database (default)...');
    
    const ref = firestore.collection('users').doc('test_user_id');
    await ref.set({ name: 'Test Default User', test: true });
    console.log('Successfully wrote to default database!');
    
    const doc = await ref.get();
    console.log('Read from default database:', doc.data());
    await ref.delete();
    
  } catch (error: any) {
    console.error('Error with default database:', error.message || error);
  }
}

test();
