$env:FOOTBALL_DATA_API_KEY="c308a8c288bb41e8b0b0aba7ef841a75"
$env:FIREBASE_SERVICE_ACCOUNT=(Get-Content -Raw "C:\Users\Administrator\Downloads\group2-se1937-firebase-adminsdk-fbsvc-5397f6c5ca.json")

node sync-football-data.js