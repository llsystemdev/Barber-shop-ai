import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

async function test() {
  console.log('Starting Client SDK Firestore test on public analyses collection...');
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
    const app = initializeApp(firebaseConfig);
    console.log('Initialized Firebase Client App!');
    
    const db = firebaseConfig.firestoreDatabaseId
      ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
      : getFirestore(app);
    
    console.log('Attempting to write document to analyses collection...');
    const ref = doc(db, 'analyses', 'test_client_analysis');
    await setDoc(ref, { style: 'Fade Cut', score: 95, test: true });
    console.log('Successfully wrote to analyses collection via Client SDK!');
    
    const docSnap = await getDoc(ref);
    console.log('Read test analysis:', docSnap.data());
    
    await deleteDoc(ref);
    console.log('Successfully deleted test analysis!');
  } catch (error: any) {
    console.error('Error during Client SDK test:', error.message || error);
  }
}

test();
