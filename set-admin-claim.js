const admin = require('firebase-admin');
admin.initializeApp({
    credential: admin.credential.applicationDefault()
});

async function setAdminClaim(email) {
    try {
        const user = await admin.auth().getUserByEmail(email);
        await admin.auth().setCustomUserClaims(user.uid, { isAdmin: true });
        console.log(`Admin claim added to ${email}`);
    } catch (error) {
        console.error('Error:', error);
    }
}

// Replace with your admin email
setAdminClaim('admin@subtracker.com');