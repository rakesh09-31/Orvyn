import React, { useState, useEffect } from "react";

export default function MemoryView({ backendUrl }) {
  const [memories, setMemories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newCategory, setNewCategory] = useState("Preferences");
  const [newPinned, setNewPinned] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchMemories = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/memory`);
      if (res.ok) {
        const data = await res.json();
        setMemories(data.memories || []);
      }
    } catch (e) {
      console.warn("Memory fetch notice:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, [backendUrl]);

  const handleAddMemory = async (e) => {
    e.preventDefault();
    if (!newKey.trim() || !newValue.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${backendUrl}/api/memory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: newKey.trim(),
          value: newValue.trim(),
          category: newCategory,
          pinned: newPinned,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMemories((prev) => [...prev, data.memory]);
        setNewKey("");
        setNewValue("");
        setNewPinned(false);
      }
    } catch (err) {
      console.error("Add memory error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMemory = async (id) => {
    try {
      const res = await fetch(`${backendUrl}/api/memory/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMemories((prev) => prev.filter((m) => m.id !== id));
      }
    } catch (err) {
      console.error("Delete memory error:", err);
    }
  };

  const filteredMemories = memories.filter((m) => {
    const q = searchQuery.toLowerCase();
    return (
      m.key.toLowerCase().includes(q) ||
      m.value.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="view-container memory-view">
      <div className="view-header">
        <div>
          <h2>Long-Term Memory Engine</h2>
          <p>
            Key facts, developer preferences, and persistent context automatically injected into system prompts.
          </p>
        </div>
        <button className="refresh-btn" onClick={fetchMemories}>
          🔄 Refresh
        </button>
      </div>

      <div className="memory-grid-layout">
        {/* ADD MEMORY CARD */}
        <div className="memory-form-card">
          <h3>Add New Context Item</h3>
          <p className="panel-desc">Instruct ORVYN to remember custom instructions or background data.</p>

          <form onSubmit={handleAddMemory} className="memory-form">
            <div className="form-group">
              <label>Topic / Key</label>
              <input
                type="text"
                placeholder="e.g. Preferred Coding Style"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Context Value</label>
              <textarea
                placeholder="e.g. Always write clean Python with type hints and docstrings"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                rows={3}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                >
                  <option value="User Profile">User Profile</option>
                  <option value="Preferences">Preferences</option>
                  <option value="System Context">System Context</option>
                  <option value="Project Notes">Project Notes</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div className="form-group-checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={newPinned}
                    onChange={(e) => setNewPinned(e.target.checked)}
                  />
                  <span>Pin to High Priority</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="add-memory-btn"
              disabled={submitting || !newKey.trim() || !newValue.trim()}
            >
              {submitting ? "Saving..." : "+ Save Memory Item"}
            </button>
          </form>
        </div>

        {/* MEMORIES LIST */}
        <div className="memories-list-card">
          <div className="list-card-header">
            <h3>Stored Memories ({filteredMemories.length})</h3>
            <input
              type="text"
              className="memory-search-input"
              placeholder="🔍 Filter memories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="loading-state">Loading memory database...</div>
          ) : filteredMemories.length === 0 ? (
            <div className="empty-state">
              No memories match your query. Add your first memory item using the form.
            </div>
          ) : (
            <div className="memories-cards-container">
              {filteredMemories.map((item) => (
                <div className={`memory-item-card ${item.pinned ? "pinned" : ""}`} key={item.id}>
                  <div className="memory-item-header">
                    <span className="memory-category-badge">{item.category}</span>
                    {item.pinned && <span className="pinned-badge">📌 High Priority</span>}
                    <button
                      className="delete-mem-btn"
                      onClick={() => handleDeleteMemory(item.id)}
                      title="Delete memory"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="memory-key">{item.key}</div>
                  <div className="memory-value">{item.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
