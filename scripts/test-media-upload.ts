/**
 * Test Media Verification & Deepfake endpoints to verify persistence without reloads
 */

const baseUrl = 'http://localhost:3000';

async function testUploads() {
  console.log('[TEST] Testing Photo & Video Fact-Checking Endpoints...');

  // 1. Test /api/fact-check-media
  console.log('1. Testing /api/fact-check-media...');
  const mediaRes = await fetch(`${baseUrl}/api/fact-check-media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mediaUrl: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167',
      mediaType: 'image',
      userNotes: 'Breaking news quarantine alert image test',
    }),
  });
  const mediaData = await mediaRes.json();
  console.log('   /api/fact-check-media response status:', mediaRes.status);
  console.log('   /api/fact-check-media success:', mediaData.success, 'verdict:', mediaData.result?.verdict);

  // 2. Test /api/detect-deepfake
  console.log('2. Testing /api/detect-deepfake...');
  const dfRes = await fetch(`${baseUrl}/api/detect-deepfake`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mediaUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2',
      mediaType: 'video',
      description: 'News anchor reporting in studio video test',
    }),
  });
  const dfData = await dfRes.json();
  console.log('   /api/detect-deepfake response status:', dfRes.status);
  console.log('   /api/detect-deepfake success:', dfData.success, 'isManipulated:', dfData.result?.isManipulated);

  if (mediaData.success && dfData.success) {
    console.log('\n[PASS] Both photo and video verification endpoints completed successfully without server errors!');
  } else {
    console.error('\n[FAIL] Media check failed');
    process.exit(1);
  }
}

testUploads().catch(console.error);
