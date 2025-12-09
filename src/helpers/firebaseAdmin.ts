import admin from "firebase-admin";

import serviceAccount from "../../src/config/firebase.json";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as any),
});

export default admin;
