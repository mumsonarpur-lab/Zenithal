// 1. Show a clean, solid standalone Zenithal Sign-In page
const gate = document.createElement("div");
gate.id = "zenithal-auth-gate";
gate.style.cssText = `
  position: fixed; inset: 0; z-index: 99999;
  background: #f8fafc; color: #0f172a;
  display: flex; align-items: center; justify-content: center; padding: 20px;
  font-family: system-ui, -apple-system, sans-serif;
`;

gate.innerHTML = `
  <div style="width:100%; max-width:400px; background:#ffffff; border:1px solid #e2e8f0; border-radius:16px; box-shadow:0 10px 25px rgba(0,0,0,0.08); text-align:center; padding:32px 26px;">
    <div style="font-size:38px; font-weight:800; letter-spacing:-1px; margin-bottom:6px; color:#0f172a;">Zenithal</div>
    <p style="color:#64748b; font-size:14px; margin:0 0 22px;">Sign in to access Zenithal Search Engine</p>

    <button id="z-google-btn" style="width:100%; padding:11px; border-radius:10px; background:#ffffff; color:#0f172a; border:1px solid #cbd5e1; font-weight:600; cursor:pointer; margin-bottom:14px;">
      Continue with Google
    </button>

    <div style="color:#94a3b8; font-size:12px; margin-bottom:14px;">or use email</div>

    <input id="z-email" type="email" placeholder="Email address" style="width:100%; box-sizing:border-box; border:1px solid #cbd5e1; border-radius:10px; margin-bottom:10px; padding:11px 14px; font-size:14px;" />
    <input id="z-pass" type="password" placeholder="Password (min 6 chars)" style="width:100%; box-sizing:border-box; border:1px solid #cbd5e1; border-radius:10px; margin-bottom:16px; padding:11px 14px; font-size:14px;" />

    <div style="display:flex; gap:10px;">
      <button id="z-login-btn" style="flex:1; padding:11px; border:none; border-radius:10px; background:#2563eb; color:#ffffff; font-weight:600; cursor:pointer;">Sign In</button>
      <button id="z-signup-btn" style="flex:1; padding:11px; border:1px solid #cbd5e1; border-radius:10px; background:#f1f5f9; color:#0f172a; font-weight:600; cursor:pointer;">Create Account</button>
    </div>

    <p id="z-auth-msg" style="color:#ef4444; font-size:13px; margin:14px 0 0; min-height:18px;"></p>
  </div>
`;
document.body.appendChild(gate);
// 2. Load Firebase safely without URL stripping
const sdkBase = "https:" + "//www." + "gstatic.com" + "/firebasejs/10.12.2/";
const { initializeApp } = await import(sdkBase + "firebase-app.js");
const {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} = await import(sdkBase + "firebase-auth.js");
const firebaseConfig = {
  apiKey: "AIzaSyCThmC-LQZ6A6-XDoqwpogbxJVopb1zpkI",
  authDomain: "zenithal-ff094.firebaseapp.com",
  projectId: "zenithal-ff094",
  appId: "1:83091113957:web:b3f5da8aada2e28a79d10c"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// 4. Add User Profile + Sign Out button to your topbar
const topbar = document.querySelector(".topbar");
const userPill = document.createElement("div");
userPill.id = "z-user-pill";
userPill.style.cssText = "display:none; align-items:center; gap:8px;";
topbar.appendChild(userPill);

const msg = document.getElementById("z-auth-msg");

document.getElementById("z-google-btn").onclick = async () => {
  msg.textContent = "";
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (e) {
    msg.textContent = e.message;
  }
};

document.getElementById("z-login-btn").onclick = async () => {
  msg.textContent = "";
  const email = document.getElementById("z-email").value.trim();
  const pass = document.getElementById("z-pass").value;
  try {
    await signInWithEmailAndPassword(auth, email, pass);
  } catch (e) {
    msg.textContent = "Invalid email or password.";
  }
};

document.getElementById("z-signup-btn").onclick = async () => {
  msg.textContent = "";
  const email = document.getElementById("z-email").value.trim();
  const pass = document.getElementById("z-pass").value;
  try {
    await createUserWithEmailAndPassword(auth, email, pass);
  } catch (e) {
    msg.textContent = e.message;
  }
};

// 5. Lock or Unlock Zenithal based on login state
onAuthStateChanged(auth, (user) => {
  if (user) {
    gate.style.display = "none";
    const name = user.displayName || user.email.split("@")[0];
    userPill.style.display = "flex";
    userPill.innerHTML = `
      <span style="font-size:13px; color:var(--sub);">👤 ${name}</span>
      <button id="z-logout-btn" class="btn-sm">Sign out</button>
    `;
    document.getElementById("z-logout-btn").onclick = () => signOut(auth);
  } else {
    gate.style.display = "flex";
    userPill.style.display = "none";
  }
});
