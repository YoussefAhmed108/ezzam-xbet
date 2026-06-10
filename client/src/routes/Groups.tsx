import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useCreateGroup, useJoinGroup, useMyGroups } from "../lib/queries";
import { ApiError } from "../lib/api";

export default function Groups() {
  const groupsQuery = useMyGroups();
  const navigate = useNavigate();
  const [modal, setModal] = useState<null | "create" | "join">(null);

  return (
    <div>
      <div className="page-head spread">
        <div>
          <h1>Groups</h1>
          <p>Compete with friends. Highest total points wins.</p>
        </div>
        <div className="toolbar" style={{ margin: 0 }}>
          <button className="btn btn-secondary" onClick={() => setModal("join")}>
            Join with code
          </button>
          <button className="btn btn-primary" onClick={() => setModal("create")}>
            Create group
          </button>
        </div>
      </div>

      {groupsQuery.isLoading ? (
        <div className="loading">Loading groups…</div>
      ) : (groupsQuery.data ?? []).length === 0 ? (
        <div className="card empty">
          <h3>You're not in any group yet</h3>
          <p>Create one and invite friends, or join with an invite code.</p>
        </div>
      ) : (
        <div className="grid">
          {groupsQuery.data!.map((g) => (
            <div
              key={g.id}
              className="card group-card"
              onClick={() => navigate({ to: "/groups/$groupId", params: { groupId: g.id } })}
            >
              <h3>{g.name}</h3>
              <span className="muted">
                {g.member_count} member{g.member_count === 1 ? "" : "s"}
              </span>
              <span className="code-pill">{g.invite_code}</span>
            </div>
          ))}
        </div>
      )}

      {modal === "create" && (
        <CreateGroupModal onClose={() => setModal(null)} />
      )}
      {modal === "join" && <JoinGroupModal onClose={() => setModal(null)} />}
    </div>
  );
}

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
      {error && <div className="alert alert-error">{error}</div>}
      <div className="field">
        <label>Group name</label>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Office League"
          autoFocus
        />
      </div>
      <button
        className="btn btn-primary btn-block"
        onClick={submit}
        disabled={create.isPending}
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
      {error && <div className="alert alert-error">{error}</div>}
      <div className="field">
        <label>Invite code</label>
        <input
          className="input"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="e.g. 7KQ2AB"
          autoFocus
        />
      </div>
      <button
        className="btn btn-primary btn-block"
        onClick={submit}
        disabled={join.isPending}
      >
        {join.isPending ? "Joining…" : "Join group"}
      </button>
    </Modal>
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
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="card card-pad modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="spread" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 18 }}>{title}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
