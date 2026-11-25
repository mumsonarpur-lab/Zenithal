// ZenMeet - Search-Triggered Contacts & Video Meeting Flow (No Topbar Button)
const jitsiScript = document.createElement("script");
jitsiScript.src = "https:" + "//meet.jit.si/external_api.js";
document.head.appendChild(jitsiScript);

let savedContacts = JSON.parse(localStorage.getItem("zenmeet_contacts") || "[]");
let activeMeetingUrl = "";
let activeRoomCode = "";
let jitsiApi = null;

function generateMeetCode() {
  const part = (n) => Math.random().toString(36).substring(2, 2 + n);
  return `${part(3)}-${part(4)}-${part(3)}`;
}

// Create full-screen ZenMeet modal
const zmOverlay = document.createElement("div");
zmOverlay.id = "zenmeet-overlay";
zmOverlay.style.cssText = `
  display: none; position: fixed; inset: 0; z-index: 99998;
  background: #f8fafc; color: #0f172a; flex-direction: column;
  font-family: system-ui, -apple-system, sans-serif;
`;

zmOverlay.innerHTML = `
  <div style="display:flex; align-items:center; justify-content:space-between; padding:14px 22px; background:#ffffff; border-bottom:1px solid #e2e8f0;">
    <div style="display:flex; align-items:center; gap:10px;">
      <span style="font-size:22px; font-weight:800; color:#2563eb;">ZenMeet</span>
      <span id="zm-room-badge" style="font-size:12px; background:#eff6ff; color:#1d4ed8; padding:4px 10px; border-radius:999px; font-weight:600;">Contacts & Invite Lobby</span>
    </div>
    <button id="zm-close-btn" style="padding:8px 16px; border-radius:8px; border:none; background:#ef4444; color:#fff; font-weight:600; cursor:pointer; font-size:13px;">Close</button>
  </div>

  <!-- Step 1: Contacts & Share Link First -->
  <div id="zm-lobby" style="flex:1; overflow-y:auto; display:flex; align-items:center; justify-content:center; padding:20px;">
    <div style="width:100%; max-width:520px; background:#ffffff; border:1px solid #e2e8f0; border-radius:18px; box-shadow:0 10px 25px rgba(0,0,0,0.06); padding:28px;">
      <h2 style="margin:0 0 6px; font-size:24px; font-weight:800;">Video calls and meetings for everyone</h2>
      <p style="margin:0 0 20px; color:#64748b; font-size:14px;">Select contacts to share your private meeting link before joining.</p>

      <div style="background:#f1f5f9; border:1px solid #cbd5e1; border-radius:12px; padding:14px; margin-bottom:18px;">
        <div style="font-size:12px; font-weight:600; color:#475569; margin-bottom:6px;">Your Private ZenMeet Link</div>
        <div style="display:flex; gap:8px; align-items:center;">
          <input id="zm-link-display" type="text" readonly style="flex:1; padding:9px 12px; border-radius:8px; border:1px solid #cbd5e1; background:#ffffff; font-size:13px; color:#0f172a;" />
          <button id="zm-copy-link-btn" style="padding:9px 14px; border:none; border-radius:8px; background:#2563eb; color:#fff; font-weight:600; cursor:pointer; font-size:13px;">Copy</button>
          <button id="zm-new-link-btn" title="Generate new link" style="padding:9px 11px; border:1px solid #cbd5e1; border-radius:8px; background:#fff; cursor:pointer; font-size:13px;">↻</button>
        </div>
      </div>

      <div style="margin-bottom:18px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <span style="font-size:14px; font-weight:700;">Share With Your Contacts</span>
          <button id="zm-phone-contacts-btn" style="padding:5px 10px; border-radius:8px; border:1px solid #cbd5e1; background:#f8fafc; color:#2563eb; font-size:12px; font-weight:600; cursor:pointer;">+ Phone Contacts</button>
        </div>

        <div style="display:flex; gap:6px; margin-bottom:10px;">
          <input id="zm-contact-name" type="text" placeholder="Contact name" style="flex:1; padding:8px 10px; border-radius:8px; border:1px solid #cbd5e1; font-size:13px;" />
          <input id="zm-contact-info" type="text" placeholder="Email or WhatsApp number" style="flex:1.2; padding:8px 10px; border-radius:8px; border:1px solid #cbd5e1; font-size:13px;" />
          <button id="zm-add-contact-btn" style="padding:8px 12px; border:none; border-radius:8px; background:#0f172a; color:#fff; font-size:13px; font-weight:600; cursor:pointer;">Add</button>
        </div>

        <div id="zm-contacts-list" style="max-height:160px; overflow-y:auto; border:1px solid #e2e8f0; border-radius:10px; padding:6px;"></div>
      </div>

      <div style="display:flex; gap:10px; margin-bottom:14px;">
        <button id="zm-enter-room-btn" style="flex:1; padding:13px; border:none; border-radius:10px; background:#2563eb; color:#fff; font-size:15px; font-weight:700; cursor:pointer;">
          Join Meeting Room →
        </button>
      </div>

      <div style="display:flex; gap:8px; border-top:1px solid #e2e8f0; padding-top:14px;">
        <input id="zm-code-input" type="text" placeholder="Or enter a friend's code (e.g. abc-defg-hij)" style="flex:1; padding:10px 12px; border-radius:8px; border:1px solid #cbd5e1; font-size:13px;" />
        <button id="zm-join-code-btn" style="padding:10px 16px; border:none; border-radius:8px; background:#10b981; color:#fff; font-weight:600; cursor:pointer; font-size:13px;">Join</button>
      </div>
    </div>
  </div>

  <!-- Step 2: Live Video Room -->
  <div id="zm-call-area" style="display:none; flex:1; width:100%; height:100%; background:#0f172a;"></div>
`;
document.body.appendChild(zmOverlay);

function setLobbyMeetingCode(code) {
  activeRoomCode = code || generateMeetCode();
  activeMeetingUrl = window.location.origin + "/?zenmeet=" + activeRoomCode;
  document.getElementById("zm-link-display").value = activeMeetingUrl;
}

function renderContacts() {
  const list = document.getElementById("zm-contacts-list");
  if (!savedContacts.length) {
    list.innerHTML = `<div style="padding:14px; text-align:center; color:#94a3b8; font-size:13px;">No contacts added yet. Add a friend above or import from Phone Contacts to share your invite link!</div>`;
    return;
  }
  list.innerHTML = savedContacts.map((c, idx) => `
    <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 10px; border-bottom:1px solid #f1f5f9;">
      <div>
        <div style="font-size:13px; font-weight:600; color:#0f172a;">${c.name}</div>
        <div style="font-size:12px; color:#64748b;">${c.info}</div>
      </div>
      <div style="display:flex; gap:6px;">
        <button onclick="shareZenMeetTo(${idx})" style="padding:6px 12px; border:none; border-radius:6px; background:#16a34a; color:#fff; font-size:12px; font-weight:600; cursor:pointer;">Share Link</button>
        <button onclick="removeZenMeetContact(${idx})" style="padding:6px 8px; border:none; border-radius:6px; background:#fee2e2; color:#dc2626; font-size:12px; cursor:pointer;">✕</button>
      </div>
    </div>
  `).join("");
}

window.shareZenMeetTo = function (idx) {
  const c = savedContacts[idx];
  const message = `Join my ZenMeet video call on Zenithal: ${activeMeetingUrl}`;
  if (navigator.share) {
    navigator.share({ title: "ZenMeet Invitation", text: message, url: activeMeetingUrl }).catch(() => {});
  } else if (c.info.includes("@")) {
    window.open("mailto:" + encodeURIComponent(c.info) + "?subject=" + encodeURIComponent("ZenMeet Video Call Invite") + "&body=" + encodeURIComponent(message));
  } else {
    const phone = c.info.replace(/[^0-9]/g, "");
    const waBase = "https:" + "//wa.me/";
    window.open(waBase + phone + "?text=" + encodeURIComponent(message), "_blank");
  }
};

window.removeZenMeetContact = function (idx) {
  savedContacts.splice(idx, 1);
  localStorage.setItem("zenmeet_contacts", JSON.stringify(savedContacts));
  renderContacts();
};

function startZenMeetCall(roomCode) {
  const cleanCode = roomCode.trim().replace(/[^a-zA-Z0-9-]/g, "") || activeRoomCode;
  document.getElementById("zm-lobby").style.display = "none";
  const callArea = document.getElementById("zm-call-area");
  callArea.style.display = "block";
  callArea.innerHTML = "";

  document.getElementById("zm-room-badge").textContent = "Live Room: " + cleanCode;
  document.getElementById("zm-close-btn").textContent = "Leave Call";

  if (window.JitsiMeetExternalAPI) {
    jitsiApi = new window.JitsiMeetExternalAPI("meet.jit.si", {
      roomName: "ZenithalOfficial_" + cleanCode,
      width: "100%",
      height: "100%",
      parentNode: callArea,
      configOverwrite: { startWithAudioMuted: false, startWithVideoMuted: false, prejoinPageEnabled: true },
      interfaceConfigOverwrite: { APP_NAME: "ZenMeet", SHOW_JITSI_WATERMARK: false }
    });
  }
}

window.openZenMeet = function (presetCode = "") {
  zmOverlay.style.display = "flex";
  document.getElementById("zm-lobby").style.display = "flex";
  document.getElementById("zm-call-area").style.display = "none";
  document.getElementById("zm-room-badge").textContent = "Contacts & Invite Lobby";
  document.getElementById("zm-close-btn").textContent = "Close";
  setLobbyMeetingCode(presetCode || generateMeetCode());
  renderContacts();
};

document.getElementById("zm-copy-link-btn").onclick = function () {
  navigator.clipboard.writeText(activeMeetingUrl);
  this.textContent = "Copied!";
  setTimeout(() => (this.textContent = "Copy"), 2000);
};

document.getElementById("zm-new-link-btn").onclick = () => setLobbyMeetingCode(generateMeetCode());

document.getElementById("zm-add-contact-btn").onclick = () => {
  const name = document.getElementById("zm-contact-name").value.trim();
  const info = document.getElementById("zm-contact-info").value.trim();
  if (!name || !info) return;
  savedContacts.push({ name, info });
  localStorage.setItem("zenmeet_contacts", JSON.stringify(savedContacts));
  document.getElementById("zm-contact-name").value = "";
  document.getElementById("zm-contact-info").value = "";
  renderContacts();
};

document.getElementById("zm-phone-contacts-btn").onclick = async () => {
  if ("contacts" in navigator && "ContactsManager" in window) {
    try {
