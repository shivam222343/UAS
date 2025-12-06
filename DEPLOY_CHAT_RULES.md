# Deploy Firestore Chat Rules

## Prerequisites
- Firebase CLI installed (`npm install -g firebase-tools`)
- Logged in to Firebase (`firebase login`)
- Firebase project initialized in this directory

## Deployment Commands

### 1. Deploy Firestore Rules (REQUIRED)
```bash
firebase deploy --only firestore:rules --project your-project-id
```

**Note:** You'll need to merge the chat rules with your existing Firestore rules. Copy the contents of `firestore.chat.rules` into your main `firestore.rules` file.

### 2. Deploy Storage Rules (REQUIRED)
```bash
firebase deploy --only storage:rules --project your-project-id
```

**Note:** Merge the contents of `storage.chat.rules` into your main `storage.rules` file.

### 3. Deploy Firestore Indexes (REQUIRED)
```bash
firebase deploy --only firestore:indexes --project your-project-id
```

**Note:** Merge the contents of `firestore.chat.indexes.json` into your main `firestore.indexes.json` file.

### 4. Deploy All at Once
```bash
firebase deploy --only firestore:rules,storage:rules,firestore:indexes --project your-project-id
```

## Merging Rules

### Firestore Rules
Add the conversation rules to your existing `firestore.rules`:

```javascript
// ... your existing rules ...

// Chat Conversations (add this section)
match /conversations/{conversationId} {
  allow read: if request.auth != null && 
    request.auth.uid in resource.data.participants;
  
  allow create: if request.auth != null &&
    request.auth.uid in request.resource.data.participants;
  
  allow update: if request.auth != null &&
    request.auth.uid in resource.data.participants;
  
  match /messages/{messageId} {
    allow read: if request.auth != null &&
      request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participants;
    
    allow create: if request.auth != null &&
      request.resource.data.senderId == request.auth.uid;
    
    allow update: if request.auth != null &&
      (resource.data.senderId == request.auth.uid ||
       request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participants);
    
    allow delete: if request.auth != null &&
      resource.data.senderId == request.auth.uid;
  }
  
  match /typing/{userId} {
    allow read: if request.auth != null;
    allow write: if request.auth != null && userId == request.auth.uid;
  }
}
```

### Storage Rules
Add the chat storage rules to your existing `storage.rules`:

```javascript
// ... your existing rules ...

// Chat attachments (add this section)
match /chat/{conversationId}/{fileName} {
  allow write: if request.auth != null &&
    request.resource.size < 10 * 1024 * 1024;
  
  allow read: if request.auth != null;
}
```

## Verification

After deployment, verify the rules are active:

1. Go to Firebase Console
2. Navigate to Firestore Database > Rules
3. Check that conversation rules are present
4. Navigate to Storage > Rules
5. Check that chat storage rules are present
6. Navigate to Firestore Database > Indexes
7. Verify the chat indexes are building/built

## Troubleshooting

### Index Building
- Indexes may take a few minutes to build
- You'll see a link in the console to create missing indexes if needed
- Click the link and it will auto-create the required indexes

### Permission Denied Errors
- Ensure you're logged in: `firebase login`
- Check you have the correct project selected: `firebase use your-project-id`
- Verify you have admin access to the Firebase project

### Rules Not Updating
- Clear Firebase cache: `firebase deploy --only firestore:rules --force`
- Check the Firebase Console to see if rules were actually deployed
- Wait a few seconds for rules to propagate

## Testing

After deployment, test the chat feature:

1. Open the app and navigate to Members page
2. Click "Message" button on a member
3. Send a test message
4. Verify message appears in real-time
5. Try uploading an image
6. Test edit/delete functionality

If you encounter permission errors, check the browser console for specific rule violations.
