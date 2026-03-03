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

  // mock dog data (later fetch from API)
   const [dogs, setDogs] = useState([]);
  const [dogsLoading, setDogsLoading] = useState(false);

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

        // backend returns { dogs: [...] }
        setDogs(data.dogs || []);
      } catch (e) {
        console.error("Failed to load dogs", e);
      } finally {
        setDogsLoading(false);
      }
    };

    loadDogs();
  }, []);

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
            <div className="text-center text-sm text-[var(--bark-muted-text)] py-10">Loading dogs...</div>
          ) : dogs.length === 0 ? (
          <div className="text-center text-sm text-[var(--bark-muted-text)] py-10">
           No dogs available yet. (Shelters can add dogs in the admin flow.)
           </div>
             ) : (
          <SwipePage dogs={dogs} />
            )
            )}
        {tab === "filter" && (
          <FilterPage
            onApply={() => {
              
              setTab("swipe");
            }}
          />
        )}
        {tab === "messages" && (
          <MessagesPage
            user={user}
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

function SwipePage({ dogs }) {
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

  const goNextDog = () => {
    setIndex((i) => (i + 1) % dogs.length);
    x.set(0);
  };

  const swipeOut = async (direction) => {
    const toX = direction === "right" ? 420 : -420;
    await animate(x, toX, { type: "spring", stiffness: 260, damping: 22 });
    goNextDog();
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
                      {current.breed} • {current.age}
                    </p>
                  </div>

                  <span className="text-xs px-2 py-1 rounded-full bg-[var(--bark-accent)] text-white self-start">
                    Shelter
                  </span>
                </div>

                <p className="text-sm text-[var(--bark-muted-text)] mt-2">
                  {current.shelterName || "Unknown shelter"}
                </p>
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
                  onClick={() => swipeOut("right")}
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

function FilterPage({ onApply }) {
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
          onClick={() => {
            
            alert(`Filters applied:\nBreed: ${breed || "Any"}\nSize: ${size}\nAge: ${age}`);
            onApply();
          }}
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}

function MessagesPage({ user, onLogout }) {
  const [active, setActive] = useState("dundalk");
  const [mode, setMode] = useState("list"); // mobile mode: list or chat

  
  const [conversations, setConversations] = useState(() => ({
    dundalk: {
      name: "Dundalk Dog Shelter",
      messages: [
        { from: "shelter", text: "Hi! Buddy is still available 😊", ts: Date.now() - 200000 },
        { from: "user", text: "Great — can I arrange a visit?", ts: Date.now() - 150000 },
      ],
    },
    dogstrust: {
      name: "Dogs Trust Dublin",
      messages: [
        { from: "shelter", text: "Hello! Luna has a calm temperament.", ts: Date.now() - 160000 },
        { from: "user", text: "Is she okay with kids?", ts: Date.now() - 120000 },
      ],
    },
    dublinsPCA: {
      name: "Dublin SPCA",
      messages: [
        { from: "shelter", text: "Max is house-trained and loves walks.", ts: Date.now() - 140000 },
        { from: "user", text: "Perfect, what’s the adoption process?", ts: Date.now() - 100000 },
      ],
    },
  }));

  const convo = conversations[active];
  const [draft, setDraft] = useState("");

  // auto-scroll to bottom on new message / thread change
  const bottomRef = useRef(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active, convo.messages.length]);

  const sendMessage = () => {
    const text = draft.trim();
    if (!text) return;

    setConversations((prev) => ({
  ...prev,
  [active]: {
    ...prev[active],
    messages: [...prev[active].messages, { from: "user", text, ts: Date.now() }],
  },
}));

    setDraft("");
  };

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
          Messages
        </h2>
        <button
          className="text-sm px-3 py-2 rounded-xl border border-[var(--border)] hover:bg-white"
          onClick={onLogout}
        >
          Log out
        </button>
      </div>

      {/* Main container */}
      <div className="flex-1 bg-white rounded-2xl border border-[var(--border)] overflow-hidden flex">
        {/* Conversation list */}
        <div
          className={`w-full md:w-80 border-r border-[var(--border)] ${
            mode === "chat" ? "hidden md:block" : "block"
          }`}
        >
          <div className="px-4 py-3 font-semibold border-b border-[var(--border)]">
            Shelters
          </div>

          <div className="overflow-y-auto h-full">
            {Object.entries(conversations).map(([key, c]) => (
              <button
                key={key}
                className={`w-full text-left px-4 py-3 border-b border-[var(--border)] ${
                  active === key ? "bg-[var(--bark-secondary)]" : "bg-white"
                }`}
                onClick={() => {
                  setActive(key);
                  setMode("chat");
                }}
              >
                <div className="text-sm font-semibold">{c.name}</div>
                <div className="text-xs text-[var(--bark-muted-text)] truncate">
                  {c.messages[c.messages.length - 1]?.text || "No messages yet"}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat panel */}
        <div className={`flex-1 flex flex-col ${mode === "list" ? "hidden md:flex" : "flex"}`}>
          <div className="px-4 py-3 border-b border-[var(--border)] flex items-center gap-3">
            <button
              className="md:hidden px-3 py-2 rounded-xl border border-[var(--border)]"
              onClick={() => setMode("list")}
            >
              ←
            </button>
            <div className="font-semibold">{convo.name}</div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 space-y-2 overflow-y-auto bg-[var(--bark-secondary)]">
            {convo.messages.map((m, idx) => {
              const isUser = m.from === "user";
              return (
                <div
                  key={`${m.ts}-${idx}`}
                  className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm shadow-sm ${
                    isUser
                      ? "ml-auto bg-[var(--bark-primary)] text-white"
                      : "bg-white text-[var(--bark-text)]"
                  }`}
                >
                  {m.text}
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form
            className="p-3 border-t border-[var(--border)] flex gap-2 bg-white"
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
          >
            <input
              className="flex-1 p-3 rounded-2xl border border-[var(--border)]"
              placeholder={`Message ${convo.name}...`}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                // allow Enter to send, Shift+Enter for newline (optional)
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <button
              type="submit"
              className="px-5 rounded-2xl text-white font-semibold bg-[var(--bark-accent)]"
            >
              Send
            </button>
          </form>
        </div>
      </div>
      

      <p className="text-xs text-[var(--bark-muted-text)] mt-3">
        (Local demo state — backend persistence next.)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        }),
      });

      const data = await res.json();
      if (!res.ok) return alert(data?.error || "Failed to create dog.");

      // reset form + reload
      setName("");
      setBreed("");
      setDescription("");
      setImageUrl("");
      await loadMine();
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
              <div key={d.id} className="flex items-center justify-between border border-[var(--border)] rounded-xl p-3">
                <div>
                  <div className="font-semibold">{d.name}</div>
                  <div className="text-xs text-[var(--bark-muted-text)]">{d.breed} • {d.ageCategory} • {d.sizeCategory}</div>
                </div>

                <button
                  className="text-sm px-3 py-2 rounded-xl border border-[var(--border)] hover:bg-[var(--bark-secondary)]"
                  onClick={() => archiveDog(d.id)}
                  disabled={loading}
                >
                  Archive
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
