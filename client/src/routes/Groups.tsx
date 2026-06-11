import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useCreateGroup, useJoinGroup, useMyGroups } from "../lib/queries";
import { ApiError } from "../lib/api";
import { SectionTitle, avatarColor } from "../components/ui";

// Deterministic emoji from group name
function groupEmoji(name: string): string {
  const emojis = ["⚽", "🏆", "🌍", "🎯", "🔥", "⚡", "🦁", "🐉", "🎖️", "🌟"];
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0x7fffffff;
  return emojis[h % emojis.length];
}

export default function Groups() {
  const groupsQuery = useMyGroups();
  const navigate = useNavigate();
  const [modal, setModal] = useState<null | "create" | "join">(null);

  return (
    <div>
      <SectionTitle
        kicker="YOUR CREWS"
        title="Groups"
        right={
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setModal("join")}
              style={{
                padding: "8px 16px",
                borderRadius: "var(--r-sm)",
                background: "var(--surface2)",
                border: "1px solid var(--line)",
                color: "var(--text)",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 13.5,
                cursor: "pointer",
              }}
            >
              Join code
            </button>
            <button
              onClick={() => setModal("create")}
              style={{
                padding: "8px 16px",
                borderRadius: "var(--r-sm)",
                background: "var(--primary)",
                color: "#fff",
                border: "none",
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: 13.5,
                cursor: "pointer",
                boxShadow: "0 4px 14px color-mix(in oklab, var(--primary) 40%, transparent)",
              }}
            >
              ＋ New group
            </button>
          </div>
        }
      />

      {groupsQuery.isLoading ? (
        <div
          style={{
            display: "grid",
            placeItems: "center",
            minHeight: 240,
            color: "var(--muted)",
            fontFamily: "var(--font-display)",
            fontSize: 14,
          }}
        >
          Loading groups…
        </div>
      ) : (groupsQuery.data ?? []).length === 0 ? (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "var(--r-lg)",
            padding: "48px 24px",
            textAlign: "center",
          }}
        >
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 17,
              color: "var(--text)",
              marginBottom: 8,
            }}
          >
            You're not in any group yet
          </h3>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            Create one and invite friends, or join with an invite code.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 14,
          }}
        >
          {groupsQuery.data!.map((g) => {
            const color = avatarColor(g.name);
            const emoji = groupEmoji(g.name);
            return (
              <div
                key={g.id}
                onClick={() =>
                  navigate({ to: "/groups/$groupId", params: { groupId: g.id } })
                }
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--line)",
                  borderRadius: "var(--r-lg)",
                  padding: 18,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  transition: "border-color 0.15s, transform 0.12s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "var(--primary)";
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "var(--line)";
                  (e.currentTarget as HTMLDivElement).style.transform = "none";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 10,
                      background: `color-mix(in oklab, ${color} 18%, transparent)`,
                      border: `1px solid color-mix(in oklab, ${color} 30%, transparent)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 22,
                      flexShrink: 0,
                    }}
                  >
                    {emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 800,
                        fontSize: 15.5,
                        color: "var(--text)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {g.name}
                    </div>
                    <div
                      style={{
                        fontSize: 12.5,
                        color: "var(--muted)",
                        marginTop: 2,
                      }}
                    >
                      {g.member_count} member{g.member_count === 1 ? "" : "s"}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "inline-flex",
                    alignSelf: "flex-start",
                    background: "var(--surface2)",
                    borderRadius: "var(--r-sm)",
                    padding: "4px 10px",
                    fontFamily: "var(--font-mono)",
                    fontSize: 12.5,
                    letterSpacing: "0.10em",
                    fontWeight: 700,
                    color: "var(--muted)",
                  }}
                >
                  {g.invite_code}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal === "create" && (
        <CreateGroupModal onClose={() => setModal(null)} />
      )}
      {modal === "join" && <JoinGroupModal onClose={() => setModal(null)} />}
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(4,6,11,0.72)",
        backdropFilter: "blur(6px)",
        display: "grid",
        placeItems: "center",
        padding: 20,
        zIndex: 60,
        animation: "fadeUp .2s both",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 460,
          background: "var(--surface)",
          border: "1px solid var(--line2)",
          borderRadius: "var(--r-xl)",
          boxShadow: "var(--shadow-lg)",
          overflow: "hidden",
          animation: "pop .28s both",
          padding: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 18,
              color: "var(--text)",
            }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "var(--surface2)",
              border: "1px solid var(--line)",
              borderRadius: "var(--r-sm)",
              color: "var(--muted)",
              width: 30,
              height: 30,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "13px 15px",
  borderRadius: "var(--r-sm)",
  background: "var(--bg2)",
  border: "1.5px solid var(--line)",
  color: "var(--text)",
  fontSize: 15.5,
  outline: "none",
  fontFamily: "var(--font-display)",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12.5,
  fontWeight: 700,
  color: "var(--muted)",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  fontFamily: "var(--font-display)",
  marginBottom: 6,
};

function CreateGroupModal({ onClose }: { onClose: () => void }) {
  const create = useCreateGroup();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (name.trim().length < 2) {
      setError("Group name must be at least 2 characters");
      return;
    }
    setError(null);
    try {
      const group = await create.mutateAsync(name.trim());
      onClose();
      await navigate({ to: "/groups/$groupId", params: { groupId: group.id } });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create group");
    }
  };

  return (
    <Modal title="Create a group" onClose={onClose}>
      {error && (
        <div
          style={{
            background: "color-mix(in oklab, var(--red) 14%, transparent)",
            color: "var(--red)",
            borderRadius: "var(--r-sm)",
            padding: "10px 14px",
            fontSize: 13.5,
            marginBottom: 14,
          }}
        >
          {error}
        </div>
      )}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Group name</label>
        <input
          style={inputStyle}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Office League"
          autoFocus
        />
      </div>
      <button
        onClick={submit}
        disabled={create.isPending}
        style={{
          width: "100%",
          padding: "13px 16px",
          borderRadius: "var(--r-sm)",
          background: "var(--primary)",
          color: "#fff",
          border: "none",
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 15,
          cursor: create.isPending ? "not-allowed" : "pointer",
          opacity: create.isPending ? 0.7 : 1,
          boxShadow: "0 6px 20px color-mix(in oklab, var(--primary) 45%, transparent)",
        }}
      >
        {create.isPending ? "Creating…" : "Create group"}
      </button>
    </Modal>
  );
}

function JoinGroupModal({ onClose }: { onClose: () => void }) {
  const join = useJoinGroup();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (code.trim().length < 4) {
      setError("Enter a valid invite code");
      return;
    }
    setError(null);
    try {
      const group = await join.mutateAsync(code.trim().toUpperCase());
      onClose();
      await navigate({ to: "/groups/$groupId", params: { groupId: group.id } });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not join group");
    }
  };

  return (
    <Modal title="Join a group" onClose={onClose}>
      {error && (
        <div
          style={{
            background: "color-mix(in oklab, var(--red) 14%, transparent)",
            color: "var(--red)",
            borderRadius: "var(--r-sm)",
            padding: "10px 14px",
            fontSize: 13.5,
            marginBottom: 14,
          }}
        >
          {error}
        </div>
      )}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Invite code</label>
        <input
          style={{
            ...inputStyle,
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.12em",
            fontWeight: 700,
            fontSize: 18,
            textTransform: "uppercase",
          }}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="e.g. 7KQ2AB"
          autoFocus
        />
      </div>
      <button
        onClick={submit}
        disabled={join.isPending}
        style={{
          width: "100%",
          padding: "13px 16px",
          borderRadius: "var(--r-sm)",
          background: "var(--primary)",
          color: "#fff",
          border: "none",
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 15,
          cursor: join.isPending ? "not-allowed" : "pointer",
          opacity: join.isPending ? 0.7 : 1,
          boxShadow: "0 6px 20px color-mix(in oklab, var(--primary) 45%, transparent)",
        }}
      >
        {join.isPending ? "Joining…" : "Join group"}
      </button>
    </Modal>
  );
}
