/**
 * One-time migration script for TRACE to copy existing local JSON files:
 * - backend/data/user_history/*.json -> Firestore users/{uid}/history/{itemId}
 * - backend/data/editorial-news.json -> Firestore editorial_news/{itemId}
 * - backend/data/reviews/*.json -> Firestore reviews/{reportId}/user_reviews/{reviewId}
 */
import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const BASE_DATA = path.join(process.cwd(), 'backend', 'data');

async function runMigration() {
  console.log('🚀 Starting TRACE JSON-to-Firestore Migration...');

  let app;
  if (getApps().length === 0) {
    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (credPath && fs.existsSync(credPath)) {
      app = initializeApp({ credential: cert(JSON.parse(fs.readFileSync(credPath, 'utf8'))) });
    } else {
      app = initializeApp({ projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'trace-34d57' });
    }
  } else {
    app = getApps()[0];
  }

  const db = getFirestore(app);
  let migratedUsers = 0;
  let migratedHistory = 0;
  let migratedEditorial = 0;
  let migratedReviews = 0;

  // 1. Migrate User History
  const historyDir = path.join(BASE_DATA, 'user_history');
  if (fs.existsSync(historyDir)) {
    const files = fs.readdirSync(historyDir).filter((f) => f.endsWith('.json'));
    console.log(`Found ${files.length} user history files to migrate.`);

    for (const file of files) {
      const uid = file.replace('.json', '');
      const content = fs.readFileSync(path.join(historyDir, file), 'utf8');
      try {
        const items = JSON.parse(content);
        if (Array.isArray(items)) {
          const batch = db.batch();
          for (const item of items) {
            const docRef = db.collection('users').doc(uid).collection('history').doc(item.id);
            batch.set(docRef, item, { merge: true });
            migratedHistory++;
          }
          await batch.commit();
          migratedUsers++;
        }
      } catch (err) {
        console.warn(`Failed to parse history for ${uid}:`, err);
      }
    }
  }

  // 2. Migrate Editorial News
  const editorialFile = path.join(BASE_DATA, 'editorial-news.json');
  if (fs.existsSync(editorialFile)) {
    try {
      const content = JSON.parse(fs.readFileSync(editorialFile, 'utf8'));
      if (Array.isArray(content.items)) {
        const batch = db.batch();
        for (const item of content.items) {
          const docRef = db.collection('editorial_news').doc(item.id);
          batch.set(docRef, item, { merge: true });
          migratedEditorial++;
        }
        await batch.commit();
      }
    } catch (err) {
      console.warn('Failed to migrate editorial-news.json:', err);
    }
  }

  // 3. Migrate Reviews
  const reviewsDir = path.join(BASE_DATA, 'reviews');
  if (fs.existsSync(reviewsDir)) {
    const files = fs.readdirSync(reviewsDir).filter((f) => f.endsWith('.json'));
    for (const file of files) {
      const reportId = file.replace('.json', '');
      try {
        const reviews = JSON.parse(fs.readFileSync(path.join(reviewsDir, file), 'utf8'));
        if (Array.isArray(reviews)) {
          const batch = db.batch();
          for (const r of reviews) {
            const docRef = db.collection('report_reviews').doc(reportId).collection('user_reviews').doc(r.userId);
            batch.set(docRef, r, { merge: true });
            migratedReviews++;
          }
          await batch.commit();
        }
      } catch (err) {
        console.warn(`Failed to migrate reviews for ${reportId}:`, err);
      }
    }
  }

  console.log('✅ Migration complete!');
  console.log(`- Users processed: ${migratedUsers}`);
  console.log(`- History records synced: ${migratedHistory}`);
  console.log(`- Editorial articles synced: ${migratedEditorial}`);
  console.log(`- Reviews synced: ${migratedReviews}`);
}

runMigration().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
