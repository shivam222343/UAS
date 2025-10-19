// src/services/invictaService.js
import { db } from './firebase';
import { addDoc, collection, serverTimestamp, doc, getDoc } from 'firebase/firestore';

const COLLECTION = 'invicta_registrations';
const CONFIG_DOC_PATH = 'config/invicta';

export const InvictaService = {
  async saveRegistration(payload) {
    // payload expected: { name, email, college, workshop, paymentProofUrl, paymentProofPublicId }
    const colRef = collection(db, COLLECTION);
    const data = {
      ...payload,
      status: 'pending',
      createdAt: serverTimestamp(),
    };
    const ref = await addDoc(colRef, data);
    return { id: ref.id, ...data };
  },

  async getConfig() {
    try {
      const docRef = doc(db, CONFIG_DOC_PATH);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data(); // expected: { qrUrl, upiId, amount, accountName, note }
      }
    } catch (e) {
      console.error('Failed to read Invicta config:', e);
    }
    // Fallback defaults if config not set in Firestore
    return {
      qrUrl: '',
      upiId: 'upi-id@bank',
      amount: 199,
      accountName: 'Event Treasurer',
      note: 'Invicta workshop fee',
    };
  },
};
