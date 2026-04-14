import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";



const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

function roleUiToApi(roleUi) {
  return roleUi === "Shelter" ? "SHELTER" : "BASIC_USER";
}

function roleApiToUi(roleApi) {
  return roleApi === "SHELTER" ? "Shelter" : "Basic User";
}

export default function App() {
  // "auth" state (mock)
  const [user, setUser] = useState(null); // { id, name, email, role }
  const [authView, setAuthView] = useState("login"); // "login" | "register"
  const [token, setToken] = useState(() => localStorage.getItem("bb_token") || "");
  const [authLoading, setAuthLoading] = useState(false);

  // app tab state
  const [tab, setTab] = useState("swipe"); // "swipe" | "filter" | "messages" | "admin"
  const isShelter = user?.role === "Shelter";

  useEffect(() => {
  const restore = async () => {
    if (!token) return;

    try {
      setAuthLoading(true);
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        // token invalid/expired
        localStorage.removeItem("bb_token");
        setToken("");
        setUser(null);
        return;
      }

      const data = await res.json();
      const apiUser = data.user;
      setUser({
        ...apiUser,
        role: roleApiToUi(apiUser.role),
      });
    } catch (e) {
      // backend down / network issue
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  };

  restore();
}, [token]);

const [dogs, setDogs] = useState([]);
const [dogsLoading, setDogsLoading] = useState(false);
const [seenDogIds, setSeenDogIds] = useState([]);
const [userLocation, setUserLocation] = useState(null);

const [matchModal, setMatchModal] = useState(null);
const [selectedConversationId, setSelectedConversationId] = useState("");
const [matchMessage, setMatchMessage] = useState("");
const [sendingMatchMessage, setSendingMatchMessage] = useState(false);

const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
  const sendMatchMessage = async () => {
    const text = matchMessage.trim();
    const conversationId = matchModal?.conversationId;

    if (!text || !conversationId) return;

    try {
      setSendingMatchMessage(true);

      const res = await fetch(`${API_BASE}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversationId,
          text,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.error || "Failed to send message.");
        return;
      }

      setMatchMessage("");
      setMatchModal(null);
      setSelectedConversationId(conversationId);
      setTab("messages");
    } catch (e) {
      alert("Could not reach backend.");
    } finally {
      setSendingMatchMessage(false);
    }
  };

useEffect(() => {
  const loadDogs = async () => {
    try {
      setDogsLoading(true);
      const res = await fetch(`${API_BASE}/dogs`);
      const data = await res.json();

      if (!res.ok) {
        console.error(data);
        return;
      }

      setDogs(data.dogs || []);
      
    } catch (e) {
      console.error("Failed to load dogs", e);
    } finally {
      setDogsLoading(false);
    }
  };
  

  loadDogs();
}, []);

  useEffect(() => {
  if (!navigator.geolocation) {
    console.log("Geolocation not supported");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      console.log("Geolocation success", position.coords.latitude, position.coords.longitude);
      setUserLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    },
    (error) => {
      console.log("Geolocation error", error);
      setUserLocation(null);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }
  );
}, []);

  const visibleDogs = dogs
  .filter((dog) => !seenDogIds.includes(dog.id))
  .sort((a, b) => {
    const aHasCoords =
      userLocation &&
      a.shelterLatitude != null &&
      a.shelterLongitude != null;

    const bHasCoords =
      userLocation &&
      b.shelterLatitude != null &&
      b.shelterLongitude != null;

    if (aHasCoords && bHasCoords) {
      const distanceA = getDistanceKm(
        userLocation.latitude,
        userLocation.longitude,
        a.shelterLatitude,
        a.shelterLongitude
      );

      const distanceB = getDistanceKm(
        userLocation.latitude,
        userLocation.longitude,
        b.shelterLatitude,
        b.shelterLongitude
      );

      return distanceA - distanceB;
    }

    if (aHasCoords && !bHasCoords) return -1;
    if (!aHasCoords && bHasCoords) return 1;

    return 0;
  });
  // If not logged in -> show auth screens
  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--bark-secondary)] text-[var(--bark-text)] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow p-6 border border-[var(--border)]">
          <div className="mb-6 text-center">
            <div className="text-3xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
              BarkBuddy
            </div>
            <div className="text-sm text-[var(--bark-muted-text)] mt-1">
              Find a dog that fits your lifestyle.
            </div>
          </div>

          {authLoading ? (
          <div className="text-center text-sm text-[var(--bark-muted-text)] py-8">
              Restoring session...
            </div>
            ) : authView === "login" ? (
            <LoginCard
              onLogin={({ user, token }) => {
            localStorage.setItem("bb_token", token);
              setToken(token);
              setUser(user);
              setTab("swipe");
            }}
              onSwitch={() => setAuthView("register")}
            />
          ) : (
            <RegisterCard
              onRegister={({ user, token }) => {
              localStorage.setItem("bb_token", token);
               setToken(token);
               setUser(user);
               setTab("swipe");
              }}
              onSwitch={() => setAuthView("login")}
            />
          )}
        </div>
      </div>
    );
  }

  
  return (
    <div className="h-screen bg-[var(--bark-secondary)] text-[var(--bark-text)] flex flex-col">
      {/* Top bar */}
      <header className="px-4 py-3 bg-white border-b border-[var(--border)] flex items-center justify-between">
        <div>
          <div className="font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
            BarkBuddy
          </div>
          <div className="text-xs text-[var(--bark-muted-text)]">
            Logged in as {user.name} ({user.role})
          </div>
        </div>

        {/* Only show Settings icon on Messages tab (as you wanted earlier) */}
        {tab === "messages" ? (
          <button
            className="px-3 py-2 rounded-xl border border-[var(--border)] hover:bg-[var(--bark-secondary)]"
            onClick={() => alert("Settings modal comes later (profile + logout).")}
            aria-label="Settings"
            title="Settings"
          >
            ⚙️
          </button>
        ) : (
          <div className="w-10" />
        )}
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4">
        {tab === "swipe" && (
          dogsLoading ? (
            <div className="text-center text-sm text-[var(--bark-muted-text)] py-10">
              Loading dogs...
            </div>
          ) : visibleDogs.length === 0 ? (
            <div className="text-center text-sm text-[var(--bark-muted-text)] py-10">
              No dogs available right now.
            </div>
          ) : (
            <SwipePage
              dogs={visibleDogs}
              user={user}
              token={token}
              apiBase={API_BASE}
              userLocation={userLocation}
              onOpenMessages={(conversationId = "") => {
                setSelectedConversationId(conversationId);
                setTab("messages");
              }}
              onDogSeen={(dogId) =>
                setSeenDogIds((prev) =>
                  prev.includes(dogId) ? prev : [...prev, dogId]
                )
              }
              onMatchCreated={(matchData) => {
                setMatchMessage("");
                setMatchModal(matchData);
              }}
            />
          )
        )}
        {tab === "filter" && (
            <FilterPage
              setDogs={setDogs}
              onApply={() => {
                setTab("swipe");
              }}
            />
          )}
        {tab === "messages" && (
          <MessagesPage
            user={user}
            token={token}
            apiBase={API_BASE}
            initialConversationId={selectedConversationId}
            onLogout={() => {
              localStorage.removeItem("bb_token");
              setToken("");
              setUser(null);
              setAuthView("login");
            }}
          />
        )}
        {tab === "admin" && isShelter && (
        <AdminPage token={token} apiBase={API_BASE} />
      )}
        


      
      </main>

      {matchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-6 text-center">
            <div className="text-2xl font-bold mb-2">
              It’s a Match!
            </div>

            <p className="text-sm text-[var(--bark-muted-text)] mb-4">
              You liked {matchModal.dogName}
            </p>

            <div className="w-28 h-28 mx-auto rounded-full overflow-hidden border mb-4">
              <img
                src={matchModal.dogImage || "https://placehold.co/200x200?text=Dog"}
                alt={matchModal.dogName}
                className="w-full h-full object-cover"
              />
            </div>

            <p className="text-sm text-[var(--bark-muted-text)] mb-4">
              Start chatting with {matchModal.shelterName}
            </p>

            <textarea
              className="w-full p-3 rounded-2xl border border-[var(--border)] mb-4 text-sm"
              rows={3}
              placeholder={`Send a message about ${matchModal.dogName}...`}
              value={matchMessage}
              onChange={(e) => setMatchMessage(e.target.value)}
            />

            <div className="grid gap-3">
              <button
                className="py-3 rounded-2xl text-white bg-[var(--bark-primary)] disabled:opacity-60"
                onClick={sendMatchMessage}
                disabled={sendingMatchMessage || !matchMessage.trim()}
              >
                {sendingMatchMessage ? "Sending..." : "Send message"}
              </button>

              <button
                className="py-3 rounded-2xl border"
                onClick={() => {
                  setMatchModal(null);
                  setMatchMessage("");
                }}
              >
                Keep swiping
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom tabs */}
      <nav className="bg-white border-t border-[var(--border)] px-3 py-2">
        <div className={`grid ${isShelter ? "grid-cols-4" : "grid-cols-3"} gap-2`}>
          <TabButton active={tab === "filter"} onClick={() => setTab("filter")} label="Filter" icon="🔎" />
          <TabButton active={tab === "swipe"} onClick={() => setTab("swipe")} label="Swipe" icon="🐶" />
          <TabButton active={tab === "messages"} onClick={() => setTab("messages")} label="Messages" icon="💬" />
          {isShelter && (<TabButton active={tab === "admin"} onClick={() => setTab("admin")} label="Admin" icon="🏠" />)}
        </div>
      </nav>
    </div>
  );
}

/* ---------------- Auth Cards ---------------- */

function LoginCard({ onLogin, onSwitch }) {
  const [role, setRole] = useState("Basic User");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-1" style={{ fontFamily: "var(--font-heading)" }}>
        Sign In
      </h2>
      <p className="text-sm text-[var(--bark-muted-text)] mb-4">
        Enter your details to continue.
      </p>

      <label className="block text-sm font-medium mb-1">Account type</label>
      <div className="grid grid-cols-2 gap-2 mb-4">
        <RoleButton active={role === "Basic User"} onClick={() => setRole("Basic User")} label="Basic User" />
        <RoleButton active={role === "Shelter"} onClick={() => setRole("Shelter")} label="Shelter" />
      </div>

      <label className="block text-sm font-medium mb-1">Email</label>
      <input
        className="w-full p-3 rounded-xl border border-[var(--border)] mb-3"
        placeholder="you@example.com"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <label className="block text-sm font-medium mb-1">Password</label>
      <input
        className="w-full p-3 rounded-xl border border-[var(--border)] mb-4"
        placeholder="••••••••"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        className="w-full p-3 rounded-xl text-white font-semibold bg-[var(--bark-primary)] hover:opacity-95 disabled:opacity-60"
        disabled={submitting}
        onClick={async () => {
          if (!email || !password) return alert("Please enter email and password.");

          try {
            setSubmitting(true);
            const res = await fetch(`${API_BASE}/auth/login`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
              return alert(data?.error || "Login failed.");
            }

            // Optional: ensure role selection matches account role (helps UX)
            const apiRoleUi = roleApiToUi(data.user.role);
            if (apiRoleUi !== role) {
            return alert(`This account is a ${apiRoleUi} account. Please select "${apiRoleUi}" and try again.`);
          }

            onLogin({
              user: { ...data.user, role: roleApiToUi(data.user.role) },
              token: data.token,
            });
          } catch (e) {
            alert("Could not reach server. Is the backend running?");
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {submitting ? "Signing in..." : "Sign In"}
      </button>

      <div className="text-center text-sm text-[var(--bark-muted-text)] mt-4">
        Don’t have an account?{" "}
        <button className="text-[var(--bark-primary)] font-semibold" onClick={onSwitch}>
          Sign up
        </button>
      </div>
    </div>
  );
}

function RegisterCard({ onRegister, onSwitch }) {
  const [role, setRole] = useState("Basic User");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [shelterName, setShelterName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isShelter = role === "Shelter";

  return (
    <div>
      <h2 className="text-xl font-semibold mb-1" style={{ fontFamily: "var(--font-heading)" }}>
        Create Account
      </h2>
      <p className="text-sm text-[var(--bark-muted-text)] mb-4">
        Register to start matching with dogs.
      </p>

      <label className="block text-sm font-medium mb-1">Account type</label>
      <div className="grid grid-cols-2 gap-2 mb-4">
        <RoleButton active={role === "Basic User"} onClick={() => setRole("Basic User")} label="Basic User" />
        <RoleButton active={role === "Shelter"} onClick={() => setRole("Shelter")} label="Shelter" />
      </div>

      <label className="block text-sm font-medium mb-1">Name</label>
      <input
        className="w-full p-3 rounded-xl border border-[var(--border)] mb-3"
        placeholder="Martin"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      {isShelter && (
        <>
          <label className="block text-sm font-medium mb-1">Shelter name</label>
          <input
            className="w-full p-3 rounded-xl border border-[var(--border)] mb-3"
            placeholder="Dundalk Dog Rescue"
            value={shelterName}
            onChange={(e) => setShelterName(e.target.value)}
          />
        </>
      )}

      <label className="block text-sm font-medium mb-1">Email</label>
      <input
        className="w-full p-3 rounded-xl border border-[var(--border)] mb-3"
        placeholder="you@example.com"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <label className="block text-sm font-medium mb-1">Password</label>
      <input
        className="w-full p-3 rounded-xl border border-[var(--border)] mb-4"
        placeholder="Minimum 8 characters"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        className="w-full p-3 rounded-xl text-white font-semibold bg-[var(--bark-primary)] hover:opacity-95 disabled:opacity-60"
        disabled={submitting}
        onClick={async () => {
          if (!name || !email || !password) return alert("Please fill in all fields.");
          if (password.length < 8) return alert("Password must be at least 8 characters.");
          if (isShelter && shelterName.trim().length < 2) return alert("Please enter your shelter name.");

          try {
            setSubmitting(true);

            const res = await fetch(`${API_BASE}/auth/register`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name,
                email,
                password,
                role: roleUiToApi(role),
                shelterName: isShelter ? shelterName.trim() : undefined,
              }),
            });

            const data = await res.json();

            if (!res.ok) {
              // Prisma unique constraint errors arrive as 409 from our backend
              return alert(data?.error || "Registration failed.");
            }

            onRegister({
              user: { ...data.user, role: roleApiToUi(data.user.role) },
              token: data.token,
            });
          } catch (e) {
            alert("Could not reach server. Is the backend running?");
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {submitting ? "Creating..." : "Create Account"}
      </button>

      <div className="text-center text-sm text-[var(--bark-muted-text)] mt-4">
        Already have an account?{" "}
        <button className="text-[var(--bark-primary)] font-semibold" onClick={onSwitch}>
          Sign in
        </button>
      </div>
    </div>
  );
}

/* ---------------- Tabs & Pages ---------------- */

function TabButton({ active, onClick, label, icon }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl py-2 px-2 flex flex-col items-center justify-center border ${
        active
          ? "bg-[var(--bark-primary)] text-white border-[var(--bark-primary)]"
          : "bg-white text-[var(--bark-text)] border-[var(--border)]"
      }`}
    >
      <div className="text-lg">{icon}</div>
      <div className="text-xs font-medium">{label}</div>
    </button>
  );
}

function RoleButton({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-xl border text-sm font-medium ${
        active
          ? "bg-[var(--bark-primary)] text-white border-[var(--bark-primary)]"
          : "bg-white border-[var(--border)]"
      }`}
      type="button"
    >
      {label}
    </button>
  );
}

function SwipePage({ dogs, user, token, apiBase, onOpenMessages, onDogSeen, userLocation, onMatchCreated }) {
  const [index, setIndex] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);

  const current = dogs[index];
  if (!current) {
  return (
    <div className="text-center text-sm text-[var(--bark-muted-text)] py-10">
      No dogs to show yet.
    </div>
  );
}

const photos =
  Array.isArray(current?.photos) && current.photos.length > 0
    ? current.photos
    : current?.imageUrl
      ? [current.imageUrl]
      : ["https://placehold.co/800x1200?text=BarkBuddy"];
  const next = dogs[(index + 1) % dogs.length];
  const third = dogs[(index + 2) % dogs.length];

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-250, 0, 250], [-12, 0, 12]);
  const likeOpacity = useTransform(x, [0, 120], [0, 1]);
  const nopeOpacity = useTransform(x, [-120, 0], [1, 0]);

  useEffect(() => setPhotoIndex(0), [index]);

    const removeCurrentDog = () => {
      onDogSeen(current.id);
      setIndex(0);
      setPhotoIndex(0);
      x.set(0);
    };

    const swipeOut = async (direction) => {
    const toX = direction === "right" ? 420 : -420;
    await animate(x, toX, { type: "spring", stiffness: 260, damping: 22 });
    removeCurrentDog();
  };
    const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const distanceKm =
  userLocation &&
  current?.shelterLatitude != null &&
  current?.shelterLongitude != null
    ? getDistanceKm(
        userLocation.latitude,
        userLocation.longitude,
        current.shelterLatitude,
        current.shelterLongitude
      )
    : null;

 const likeDog = async () => {
  try {
    if (user?.role !== "Basic User") {
      await swipeOut("right");
      return;
    }

    const likeRes = await fetch(`${apiBase}/dogs/${current.id}/like`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const likeData = await likeRes.json();

    if (!likeRes.ok) {
      alert(likeData?.error || "Could not like dog.");
      return;
    }

    if (!current?.shelter?.id) {
      alert("Shelter information is missing for this dog.");
      return;
    }

    const convoRes = await fetch(`${apiBase}/conversations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        shelterId: current.shelter.id,
        dogId: current.id,
      }),
    });

    const convoData = await convoRes.json();

    if (!convoRes.ok) {
      alert(convoData?.error || "Could not create conversation.");
      return;
    }

    await swipeOut("right");

      onMatchCreated({
        dogName: current.name,
        dogImage: current.imageUrl,
        shelterName: current.shelterName || "Shelter",
        conversationId: convoData.conversation?.id || "",
      });
  } catch (e) {
    alert("Could not reach backend.");
  }
};

  const onDragEnd = (_, info) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (offset > 140 || velocity > 900) return swipeOut("right");
    if (offset < -140 || velocity < -900) return swipeOut("left");

    animate(x, 0, { type: "spring", stiffness: 260, damping: 20 });
  };

  const nextPhoto = () =>
    setPhotoIndex((i) => (i + 1) % photos.length);
  const prevPhoto = () =>
  setPhotoIndex((i) => (i - 1 + photos.length) % photos.length);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Discover
        </h2>
        <div className="text-xs text-[var(--bark-muted-text)]">
          {index + 1}/{dogs.length}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="relative w-full max-w-md aspect-[9/16]">
          {third && (
            <div
              className="absolute inset-0 rounded-3xl border border-[var(--border)] bg-white shadow-sm overflow-hidden"
              style={{ transform: "scale(0.92) translateY(24px)" }}
            >
              <CardMedia dog={third} photoIndex={0} minimal />
            </div>
          )}

          {next && (
            <div
              className="absolute inset-0 rounded-3xl border border-[var(--border)] bg-white shadow overflow-hidden"
              style={{ transform: "scale(0.96) translateY(12px)" }}
            >
              <CardMedia dog={next} photoIndex={0} minimal />
            </div>
          )}

          <motion.div
            className="absolute inset-0 rounded-3xl border border-[var(--border)] bg-white shadow-xl overflow-hidden touch-pan-y"
            style={{ x, rotate }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.9}
            onDragEnd={onDragEnd}
          >
            <motion.div
              className="absolute top-5 left-5 z-10 px-4 py-2 rounded-xl font-bold border-2 border-green-500 text-green-600 bg-white/80 backdrop-blur"
              style={{ opacity: likeOpacity }}
            >
              LIKE
            </motion.div>
            <motion.div
              className="absolute top-5 right-5 z-10 px-4 py-2 rounded-xl font-bold border-2 border-red-500 text-red-600 bg-white/80 backdrop-blur"
              style={{ opacity: nopeOpacity }}
            >
              NOPE
            </motion.div>

            <div className="relative h-[68%]">
              <img
                src={photos[photoIndex] || photos[0]}
                alt={`${current.name}`}
                className="w-full h-full object-cover"
                onError={(e) => {
               e.currentTarget.src = "https://placehold.co/800x1200?text=BarkBuddy";
                }}
                />
                
              

              {photos.length > 1 && (
                <>
                  <button
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/75 backdrop-blur rounded-full px-3 py-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      prevPhoto();
                    }}
                    aria-label="Previous photo"
                  >
                    ◀
                  </button>
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/75 backdrop-blur rounded-full px-3 py-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      nextPhoto();
                    }}
                    aria-label="Next photo"
                  >
                    ▶
                  </button>
                </>
              )}

              <div className="absolute top-3 left-1/2 -translate-x-1/2 flex gap-1">
                {photos.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i === photoIndex ? "w-6 bg-white" : "w-2 bg-white/60"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="h-[32%] p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-xl font-semibold leading-tight">
                      {current.name}
                    </h3>
                    <p className="text-sm text-[var(--bark-muted-text)]">
                      {current.breed} • {current.ageCategory}
                    </p>
                  </div>

                  <span className="text-xs px-2 py-1 rounded-full bg-[var(--bark-accent)] text-white self-start">
                    Shelter
                  </span>
                </div>

                <p className="text-sm text-[var(--bark-muted-text)] mt-2">
                  {current.shelterName || "Unknown shelter"}
                </p>
                {current.shelterLocation ? (
                <p className="text-xs text-[var(--bark-muted-text)] mt-1">
                  📍 {current.shelterLocation}
                </p>
              ) : (
                <p className="text-xs text-[var(--bark-muted-text)] mt-1">
                  📍 Location unavailable
                </p>
              )}

              {distanceKm !== null ? (
                <p className="text-xs text-[var(--bark-muted-text)] mt-1">
                  {distanceKm.toFixed(1)} km away
                </p>
              ) : (
                <p className="text-xs text-[var(--bark-muted-text)] mt-1">
                  Distance unavailable
                </p>
              )}
              </div>

              <div className="flex flex-wrap gap-2 mt-2 text-xs">
                {current.vaccinated && (
                  <span className="px-2 py-1 rounded-full bg-[var(--bark-secondary)]">
                    Vaccinated
                  </span>
                )}

                {current.neutered && (
                  <span className="px-2 py-1 rounded-full bg-[var(--bark-secondary)]">
                    Neutered
                  </span>
                )}

                {current.microchipped && (
                  <span className="px-2 py-1 rounded-full bg-[var(--bark-secondary)]">
                    Microchipped
                  </span>
                )}

                {current.goodWithKids && (
                  <span className="px-2 py-1 rounded-full bg-[var(--bark-secondary)]">
                    Good with kids
                  </span>
                )}

                {current.goodWithDogs && (
                  <span className="px-2 py-1 rounded-full bg-[var(--bark-secondary)]">
                    Good with dogs
                  </span>
                )}

                {current.houseTrained && (
                  <span className="px-2 py-1 rounded-full bg-[var(--bark-secondary)]">
                    House trained
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3">
                <button
                  className="py-3 rounded-2xl border border-[var(--border)] bg-white hover:bg-[var(--bark-secondary)]"
                  onClick={() => swipeOut("left")}
                >
                  Skip
                </button>
                <button
                  className="py-3 rounded-2xl text-white font-semibold bg-[var(--bark-primary)] hover:opacity-95"
                  onClick={likeDog}
                >
                  Like
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="h-3" />
    </div>
  );
}

function CardMedia({ dog, photoIndex, minimal }) {
  const photos =
  Array.isArray(dog?.photos) && dog.photos.length > 0
    ? dog.photos
    : dog?.imageUrl
      ? [dog.imageUrl]
      : ["https://placehold.co/800x1200?text=BarkBuddy"];

  return (
    <div className="relative h-full">
      <img
        src={photos[photoIndex] || photos[0]}
        alt={dog?.name || "Dog"}
        className="w-full h-full object-cover"
        onError={(e) => {
          e.currentTarget.src = "https://placehold.co/800x1200?text=BarkBuddy";
        }}
      />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/55 to-transparent" />
      {minimal && (
        <div className="absolute bottom-4 left-4 text-white">
          <div className="font-semibold">{dog?.name}</div>
          <div className="text-xs opacity-90">{dog?.breed}</div>
        </div>
      )}
    </div>
  );
}

function FilterPage({ onApply, setDogs }) {
  const [breed, setBreed] = useState("");
  const [size, setSize] = useState("Any");
  const [age, setAge] = useState("Any");

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>
        Filters
      </h2>

      <div className="bg-white rounded-2xl shadow border border-[var(--border)] p-4">
        <label className="block text-sm font-medium mb-1">Breed</label>
        <input
          className="w-full p-3 rounded-xl border border-[var(--border)] mb-3"
          placeholder="e.g. Labrador"
          value={breed}
          onChange={(e) => setBreed(e.target.value)}
        />

        <label className="block text-sm font-medium mb-1">Size</label>
        <select
          className="w-full p-3 rounded-xl border border-[var(--border)] mb-3"
          value={size}
          onChange={(e) => setSize(e.target.value)}
        >
          <option>Any</option>
          <option>Small</option>
          <option>Medium</option>
          <option>Large</option>
        </select>

        <label className="block text-sm font-medium mb-1">Age</label>
        <select
          className="w-full p-3 rounded-xl border border-[var(--border)]"
          value={age}
          onChange={(e) => setAge(e.target.value)}
        >
          <option>Any</option>
          <option>Puppy</option>
          <option>Adult</option>
          <option>Senior</option>
        </select>

        <button
          className="w-full mt-4 py-3 rounded-xl text-white font-semibold bg-[var(--bark-primary)] hover:opacity-95"
          onClick={async () => {
  try {
    const params = new URLSearchParams();

    if (breed) params.append("breed", breed);
    if (size !== "Any") params.append("sizeCategory", size.toUpperCase());
    if (age !== "Any") params.append("ageCategory", age.toUpperCase());

    const res = await fetch(`${API_BASE}/dogs?${params.toString()}`);
    const data = await res.json();

    if (!res.ok) {
      alert(data?.error || "Failed to filter dogs.");
      return;
    }

    setDogs(data.dogs || []);
    onApply();
  } catch (e) {
    alert("Could not reach backend.");
  }
}}
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}

function MessagesPage({ user, token, apiBase, onLogout, initialConversationId }) {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(initialConversationId || "");
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [mode, setMode] = useState("list");
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef(null);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiBase}/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data?.error || "Failed to load conversations.");
        return;
      }

      setConversations(data.conversations || []);

      if (initialConversationId) {
          setActiveId(initialConversationId);
        } else if (!activeId && data.conversations?.length > 0) {
          setActiveId(data.conversations[0].id);
        }
    } catch (e) {
      alert("Could not reach backend.");
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId) => {
    if (!conversationId) return;

    try {
      setLoading(true);
      const res = await fetch(`${apiBase}/messages/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data?.error || "Failed to load messages.");
        return;
      }

      setMessages(data.messages || []);
    } catch (e) {
      alert("Could not reach backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (activeId) {
      loadMessages(activeId);
    } else {
      setMessages([]);
    }
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const activeConversation =
    conversations.find((c) => c.id === activeId) || null;

  const conversationTitle = (c) => {
    if (!c) return "Conversation";

    if (user.role === "Shelter") {
      return c.user?.name || c.user?.email || "User";
    }

    return (
      c.shelter?.shelterProfile?.shelterName ||
      c.shelter?.name ||
      c.shelter?.email ||
      "Shelter"
    );
  };

  const sendMessage = async () => {
    const text = draft.trim();
    if (!text || !activeId) return;

    try {
      const res = await fetch(`${apiBase}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversationId: activeId,
          text,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.error || "Failed to send message.");
        return;
      }

      setMessages((prev) => [...prev, data.message]);
      setDraft("");
      loadConversations();
    } catch (e) {
      alert("Could not reach backend.");
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Messages
        </h2>
        <button
          className="text-sm px-3 py-2 rounded-xl border border-[var(--border)] hover:bg-white"
          onClick={onLogout}
        >
          Log out
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-3 mb-3">
  {conversations.map((c) => (
    <button
      key={c.id}
      className="flex flex-col items-center min-w-[72px]"
      onClick={() => {
        setActiveId(c.id);
        setMode("chat");
      }}
    >
      <div className={`w-16 h-16 rounded-full overflow-hidden border-2 ${
        activeId === c.id ? "border-[var(--bark-primary)]" : "border-[var(--border)]"
      }`}>
        <img
          src={c.dog?.imageUrl || "https://placehold.co/200x200?text=Dog"}
          alt={c.dog?.name || "Dog"}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = "https://placehold.co/200x200?text=Dog";
          }}
        />
      </div>
      <div className="text-xs mt-1 text-center truncate max-w-[72px]">
        {c.dog?.name || conversationTitle(c)}
      </div>
    </button>
  ))}
</div>

      <div className="flex-1 bg-white rounded-2xl border border-[var(--border)] overflow-hidden flex">
        <div
          className={`w-full md:w-80 border-r border-[var(--border)] ${
            mode === "chat" ? "hidden md:block" : "block"
          }`}
        >
          <div className="px-4 py-3 font-semibold border-b border-[var(--border)]">
            Conversations
          </div>

          <div className="overflow-y-auto h-full">
            {loading && conversations.length === 0 ? (
              <div className="p-4 text-sm text-[var(--bark-muted-text)]">
                Loading conversations...
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-sm text-[var(--bark-muted-text)]">
                No conversations yet.
              </div>
            ) : (
              conversations.map((c) => {
                const lastMessage = c.messages?.[0];
                return (
                  <button
                    key={c.id}
                    className={`w-full text-left px-4 py-3 border-b border-[var(--border)] ${
                      activeId === c.id ? "bg-[var(--bark-secondary)]" : "bg-white"
                    }`}
                    onClick={() => {
                      setActiveId(c.id);
                      setMode("chat");
                    }}
                  >
                    <div className="text-sm font-semibold">
                      {conversationTitle(c)}
                    </div>

                    {c.dog?.name && (
                      <div className="text-xs text-[var(--bark-muted-text)]">
                        About: {c.dog.name}
                      </div>
                    )}

                    <div className="text-xs text-[var(--bark-muted-text)] truncate">
                      {lastMessage?.text || "No messages yet"}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div
          className={`flex-1 flex flex-col ${
            mode === "list" ? "hidden md:flex" : "flex"
          }`}
        >
          <div className="px-4 py-3 border-b border-[var(--border)] flex items-center gap-3">
            <button
              className="md:hidden px-3 py-2 rounded-xl border border-[var(--border)]"
              onClick={() => setMode("list")}
            >
              ←
            </button>
            <div className="font-semibold">
              {activeConversation
                ? conversationTitle(activeConversation)
                : "Select a conversation"}
            </div>
          </div>

          <div className="flex-1 p-4 space-y-2 overflow-y-auto bg-[var(--bark-secondary)]">
            {!activeId ? (
              <div className="text-sm text-[var(--bark-muted-text)]">
                Select a conversation to view messages.
              </div>
            ) : messages.length === 0 ? (
              <div className="text-sm text-[var(--bark-muted-text)]">
                No messages yet.
              </div>
            ) : (
              messages.map((m) => {
                const isUser = m.senderId === user.id;
                return (
                  <div
                    key={m.id}
                    className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm shadow-sm ${
                      isUser
                        ? "ml-auto bg-[var(--bark-primary)] text-white"
                        : "bg-white text-[var(--bark-text)]"
                    }`}
                  >
                    {m.text}
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          <form
            className="p-3 border-t border-[var(--border)] flex gap-2 bg-white"
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
          >
            <input
              className="flex-1 p-3 rounded-2xl border border-[var(--border)]"
              placeholder={
                activeConversation
                  ? `Message ${conversationTitle(activeConversation)}...`
                  : "Select a conversation first..."
              }
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={!activeId}
            />
            <button
              type="submit"
              className="px-5 rounded-2xl text-white font-semibold bg-[var(--bark-accent)] disabled:opacity-60"
              disabled={!activeId}
            >
              Send
            </button>
          </form>
        </div>
      </div>

      <p className="text-xs text-[var(--bark-muted-text)] mt-3">
        Messages are now loaded from the backend.
      </p>
    </div>
  );
}
function AdminPage({ token, apiBase }) {
  const [dogs, setDogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [breed, setBreed] = useState("");
  const [description, setDescription] = useState("");
  const [ageCategory, setAgeCategory] = useState("ADULT");
  const [sizeCategory, setSizeCategory] = useState("MEDIUM");
  const [imageUrl, setImageUrl] = useState("");

  const [vaccinated, setVaccinated] = useState(false);
  const [neutered, setNeutered] = useState(false);
  const [microchipped, setMicrochipped] = useState(false);
  const [goodWithKids, setGoodWithKids] = useState(false);
  const [goodWithDogs, setGoodWithDogs] = useState(false);
  const [houseTrained, setHouseTrained] = useState(false);
  const [adoptionFee, setAdoptionFee] = useState("");

  const loadMine = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiBase}/dogs/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) return alert(data?.error || "Failed to load your dogs.");
      setDogs(data.dogs || []);
    } catch (e) {
      alert("Could not reach backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMine();
  }, []);

  const createDog = async () => {
    if (!name || !breed) return alert("Name + breed are required.");

    try {
      setLoading(true);
      const res = await fetch(`${apiBase}/dogs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          breed,
          description: description || undefined,
          ageCategory,
          sizeCategory,
          imageUrl: imageUrl || undefined,
          vaccinated,
          neutered,
          microchipped,
          goodWithKids,
          goodWithDogs,
          houseTrained,
          adoptionFee: adoptionFee === "" ? undefined : Number(adoptionFee),
        }),
      });

     const data = await res.json();
    if (!res.ok) return alert(data?.error || "Failed to create dog.");

      const newDog = data.dog;

      setDogs((prev) => [newDog, ...prev]);

      setName("");
      setBreed("");
      setDescription("");
      setImageUrl("");
      setAgeCategory("ADULT");
      setSizeCategory("MEDIUM");
      setVaccinated(false);
      setNeutered(false);
      setMicrochipped(false);
      setGoodWithKids(false);
      setGoodWithDogs(false);
      setHouseTrained(false);
      setAdoptionFee("");


      
      alert("Dog created.");
    } catch (e) {
      alert("Could not reach backend.");
    } finally {
      setLoading(false);
    }
  };

  const archiveDog = async (id) => {
    try {
      setLoading(true);
      const res = await fetch(`${apiBase}/dogs/${id}/archive`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) return alert(data?.error || "Failed to archive dog.");
      await loadMine();
    } catch (e) {
      alert("Could not reach backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
        Shelter Admin
      </h2>

      <div className="bg-white rounded-2xl shadow border border-[var(--border)] p-4 space-y-3">
        <div className="font-semibold">Add Dog</div>

        <input
          className="w-full p-3 rounded-xl border border-[var(--border)]"
          placeholder="Name (required)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="w-full p-3 rounded-xl border border-[var(--border)]"
          placeholder="Breed (required)"
          value={breed}
          onChange={(e) => setBreed(e.target.value)}
        />

        <input
          className="w-full p-3 rounded-xl border border-[var(--border)]"
          placeholder="Image URL (optional)"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />

        <textarea
          className="w-full p-3 rounded-xl border border-[var(--border)]"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />

        <div className="grid grid-cols-2 gap-2">
          <select
            className="w-full p-3 rounded-xl border border-[var(--border)]"
            value={ageCategory}
            onChange={(e) => setAgeCategory(e.target.value)}
          >
            <option value="PUPPY">PUPPY</option>
            <option value="ADULT">ADULT</option>
            <option value="SENIOR">SENIOR</option>
          </select>

          <select
            className="w-full p-3 rounded-xl border border-[var(--border)]"
            value={sizeCategory}
            onChange={(e) => setSizeCategory(e.target.value)}
          >
            <option value="SMALL">SMALL</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LARGE">LARGE</option>
          </select>
        </div>

        <input
          className="w-full p-3 rounded-xl border border-[var(--border)]"
          placeholder="Adoption fee (optional)"
          type="number"
          value={adoptionFee}
          onChange={(e) => setAdoptionFee(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-2 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={vaccinated} onChange={(e) => setVaccinated(e.target.checked)} />
            Vaccinated
          </label>

          <label className="flex items-center gap-2">
            <input type="checkbox" checked={neutered} onChange={(e) => setNeutered(e.target.checked)} />
            Neutered
          </label>

          <label className="flex items-center gap-2">
            <input type="checkbox" checked={microchipped} onChange={(e) => setMicrochipped(e.target.checked)} />
            Microchipped
          </label>

          <label className="flex items-center gap-2">
            <input type="checkbox" checked={goodWithKids} onChange={(e) => setGoodWithKids(e.target.checked)} />
            Good with kids
          </label>

          <label className="flex items-center gap-2">
            <input type="checkbox" checked={goodWithDogs} onChange={(e) => setGoodWithDogs(e.target.checked)} />
            Good with dogs
          </label>

          <label className="flex items-center gap-2">
            <input type="checkbox" checked={houseTrained} onChange={(e) => setHouseTrained(e.target.checked)} />
            House trained
          </label>
        </div>

        <button
          className="w-full py-3 rounded-xl text-white font-semibold bg-[var(--bark-primary)] disabled:opacity-60"
          disabled={loading}
          onClick={createDog}
        >
          {loading ? "Working..." : "Create Dog"}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow border border-[var(--border)] p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold">My Dogs</div>
          <button
            className="text-sm px-3 py-2 rounded-xl border border-[var(--border)]"
            onClick={loadMine}
            disabled={loading}
          >
            Refresh
          </button>
        </div>

        {dogs.length === 0 ? (
          <div className="text-sm text-[var(--bark-muted-text)]">No dogs yet.</div>
        ) : (
          <div className="space-y-2">
            {dogs.map((d) => (
              <div key={d.id} className="border border-[var(--border)] rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{d.name}</div>
                    <div className="text-xs text-[var(--bark-muted-text)]">
                      {d.breed} • {d.ageCategory} • {d.sizeCategory}
                    </div>
                    {d.adoptionFee !== null && d.adoptionFee !== undefined && (
                      <div className="text-xs text-[var(--bark-muted-text)] mt-1">
                        Adoption fee: €{d.adoptionFee}
                      </div>
                    )}
                  </div>

                  <button
                    className="text-sm px-3 py-2 rounded-xl border border-[var(--border)] hover:bg-[var(--bark-secondary)]"
                    onClick={() => archiveDog(d.id)}
                    disabled={loading}
                  >
                    Archive
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mt-2 text-xs">
                  {d.vaccinated && <span className="px-2 py-1 rounded-full bg-[var(--bark-secondary)]">Vaccinated</span>}
                  {d.neutered && <span className="px-2 py-1 rounded-full bg-[var(--bark-secondary)]">Neutered</span>}
                  {d.microchipped && <span className="px-2 py-1 rounded-full bg-[var(--bark-secondary)]">Microchipped</span>}
                  {d.goodWithKids && <span className="px-2 py-1 rounded-full bg-[var(--bark-secondary)]">Good with kids</span>}
                  {d.goodWithDogs && <span className="px-2 py-1 rounded-full bg-[var(--bark-secondary)]">Good with dogs</span>}
                  {d.houseTrained && <span className="px-2 py-1 rounded-full bg-[var(--bark-secondary)]">House trained</span>}
                  {d.archived && <span className="px-2 py-1 rounded-full bg-red-100">Archived</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

