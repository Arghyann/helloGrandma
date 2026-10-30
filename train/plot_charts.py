import json
import os
import matplotlib.pyplot as plt
import numpy as np

# Set aesthetic styling
plt.style.use("seaborn-v0_8-whitegrid" if "seaborn-v0_8-whitegrid" in plt.style.available else "default")
plt.rcParams["font.family"] = "sans-serif"
plt.rcParams["font.sans-serif"] = ["DejaVu Sans", "Arial", "Helvetica"]
plt.rcParams["axes.edgecolor"] = "#cccccc"
plt.rcParams["axes.linewidth"] = 0.8

with open("all_training_metrics.json") as f:
    raw_data = json.load(f)

# Extract curves for each model
models_meta = {
    "qwen_14b_6k": {
        "label": "Qwen 2.5 14B (Balanced 6k)",
        "color": "#10b981",  # Emerald green
        "marker": "o",
        "linewidth": 2.5,
    },
    "qwen_14b_comedy": {
        "label": "Qwen 2.5 14B (Comedy 1k)",
        "color": "#f59e0b",  # Amber
        "marker": "s",
        "linewidth": 2.2,
    },
    "llama_8b_v3": {
        "label": "Llama 3.1 8B (v3 Balanced 6k)",
        "color": "#3b82f6",  # Blue
        "marker": "^",
        "linewidth": 2.0,
    },
    "llama_8b_v2": {
        "label": "Llama 3 8B (v2 Baseline 2.5k)",
        "color": "#8b5cf6",  # Purple
        "marker": "d",
        "linewidth": 1.8,
    },
}

# -------------------------------------------------------------
# PLOT 1: Validation Loss Across Epochs (The Generalization Race)
# -------------------------------------------------------------
plt.figure(figsize=(9, 5.5), dpi=300)

for key, meta in models_meta.items():
    if key not in raw_data:
        continue
    history = raw_data[key].get("log_history", [])
    evals = [(h.get("epoch"), h.get("eval_loss")) for h in history if "eval_loss" in h and h.get("epoch") is not None]
    if not evals:
        continue
    evals.sort(key=lambda x: x[0])
    epochs, losses = zip(*evals)
    
    plt.plot(
        epochs, losses,
        label=meta["label"],
        color=meta["color"],
        marker=meta["marker"],
        linewidth=meta["linewidth"],
        markersize=8,
    )
    # Highlight min loss point
    min_idx = int(np.argmin(losses))
    plt.scatter(
        [epochs[min_idx]], [losses[min_idx]],
        color=meta["color"],
        s=140,
        zorder=5,
        edgecolor="black",
        linewidth=1.2,
    )
    plt.annotate(
        f"{losses[min_idx]:.3f}",
        (epochs[min_idx], losses[min_idx]),
        textcoords="offset points",
        xytext=(0, 9 if "qwen" in key else -17),
        ha="center",
        fontsize=9,
        fontweight="bold",
        color=meta["color"],
    )

plt.title("Validation Loss Across Epochs (Lower is Better)", fontsize=14, fontweight="bold", pad=15)
plt.xlabel("Epoch", fontsize=11, labelpad=8)
plt.ylabel("Validation Cross-Entropy Loss", fontsize=11, labelpad=8)
plt.xticks([1, 2, 3])
plt.ylim(1.8, 3.4)
plt.legend(frameon=True, facecolor="white", edgecolor="#e5e7eb", fontsize=9.5, loc="upper right")
plt.tight_layout()
plt.savefig("curves_eval_loss.png")
plt.close()
print("Saved curves_eval_loss.png")

# -------------------------------------------------------------
# PLOT 2: Step-by-Step Training Loss Decay (Normalized % Progress)
# -------------------------------------------------------------
plt.figure(figsize=(10, 5.5), dpi=300)

for key, meta in models_meta.items():
    if key not in raw_data:
        continue
    history = raw_data[key].get("log_history", [])
    train_losses = [(h.get("step"), h.get("loss")) for h in history if "loss" in h and h.get("step") is not None]
    if not train_losses:
        continue
    steps, losses = zip(*train_losses)
    total_steps = max(steps)
    # Convert steps to % progress
    pct = [s / total_steps * 100 for s in steps]
    
    # Smooth with rolling average
    window = 4
    if len(losses) > window:
        smooth_losses = np.convolve(losses, np.ones(window)/window, mode="valid")
        smooth_pct = pct[window-1:]
    else:
        smooth_losses = losses
        smooth_pct = pct
        
    plt.plot(
        smooth_pct, smooth_losses,
        label=meta["label"],
        color=meta["color"],
        linewidth=meta["linewidth"],
        alpha=0.9,
    )

plt.title("Training Loss Convergence (% of Total Training Steps)", fontsize=14, fontweight="bold", pad=15)
plt.xlabel("Training Progress (%)", fontsize=11, labelpad=8)
plt.ylabel("Training Loss (Smoothed)", fontsize=11, labelpad=8)
plt.legend(frameon=True, facecolor="white", edgecolor="#e5e7eb", fontsize=9.5)
plt.tight_layout()
plt.savefig("curves_training_loss.png")
plt.close()
print("Saved curves_training_loss.png")

# -------------------------------------------------------------
# PLOT 3: Complete 4-Panel Blog Master Dashboard
# -------------------------------------------------------------
fig, axes = plt.subplots(2, 2, figsize=(14, 10), dpi=300)

# Panel A: Validation Loss Comparison Bar Chart
ax_a = axes[0, 0]
models_bar = [
    "Llama 8B v2",
    "Llama 8B v3",
    "Qwen 14B Comedy",
    "Qwen 14B 6k",
]
best_eval_losses = [3.0145, 2.7858, 2.8598, 2.1623]
colors_bar = ["#8b5cf6", "#3b82f6", "#f59e0b", "#10b981"]

bars = ax_a.bar(models_bar, best_eval_losses, color=colors_bar, width=0.55, edgecolor="black", linewidth=0.8)
ax_a.set_title("A. Best Validation Loss (Lower = Better Style Match)", fontsize=11, fontweight="bold", pad=10)
ax_a.set_ylabel("Eval Loss", fontsize=10)
ax_a.set_ylim(0, 3.6)
for bar in bars:
    h = bar.get_height()
    ax_a.annotate(f"{h:.3f}", xy=(bar.get_x() + bar.get_width()/2, h), xytext=(0, 4), textcoords="offset points", ha="center", fontsize=9, fontweight="bold")
ax_a.axhline(2.1623, color="#10b981", linestyle=":", alpha=0.7)

# Panel B: Epoch 1 -> 2 -> 3 Trajectories
ax_b = axes[0, 1]
for key, meta in models_meta.items():
    if key not in raw_data:
        continue
    history = raw_data[key].get("log_history", [])
    evals = [(round(h.get("epoch")), h.get("eval_loss")) for h in history if "eval_loss" in h and h.get("epoch") is not None]
    if evals:
        eps, ls = zip(*evals)
        ax_b.plot(eps, ls, marker=meta["marker"], color=meta["color"], label=meta["label"], linewidth=2)
ax_b.set_title("B. Generalization Trajectory Across Epochs", fontsize=11, fontweight="bold", pad=10)
ax_b.set_xlabel("Epoch", fontsize=10)
ax_b.set_ylabel("Eval Loss", fontsize=10)
ax_b.set_xticks([1, 2, 3])
ax_b.legend(fontsize=8, loc="upper right")

# Panel C: Train vs Eval Divergence (Overfitting Metric)
ax_c = axes[1, 0]
div_names = ["v2 Baseline", "v3 Balanced", "v4 Comedy", "v4 Balanced 6k"]
div_train = [2.624, 2.423, 1.309, 1.019]
div_eval = [3.014, 2.785, 2.859, 2.162]
x_pos = np.arange(len(div_names))
w = 0.35
ax_c.bar(x_pos - w/2, div_train, width=w, label="Train Loss", color="#94a3b8", edgecolor="black", linewidth=0.7)
ax_c.bar(x_pos + w/2, div_eval, width=w, label="Eval Loss", color="#0284c7", edgecolor="black", linewidth=0.7)
ax_c.set_xticks(x_pos)
ax_c.set_xticklabels(div_names, rotation=15, ha="right", fontsize=8.5)
ax_c.set_title("C. Train Loss vs Eval Loss (Generalization Gap)", fontsize=11, fontweight="bold", pad=10)
ax_c.set_ylabel("Loss", fontsize=10)
ax_c.legend(fontsize=8.5)

# Panel D: Total Cost vs Performance
ax_d = axes[1, 1]
costs = [0.40, 0.55, 0.33, 2.08]
sizes = [8, 8, 14, 14]
for i, name in enumerate(div_names):
    c = "#10b981" if "v4" in name else "#3b82f6"
    ax_d.scatter(costs[i], div_eval[i], color=c, s=sizes[i]*18, edgecolors="black", linewidth=1.2, zorder=4)
    ax_d.annotate(
        name,
        (costs[i], div_eval[i]),
        xytext=(0, 8),
        textcoords="offset points",
        ha="center",
        fontsize=8.5,
        fontweight="bold",
        color=c,
    )
ax_d.set_title("D. Model Performance vs Compute Cost ($)", fontsize=11, fontweight="bold", pad=10)
ax_d.set_xlabel("Training Cost on Modal (USD)", fontsize=10)
ax_d.set_ylabel("Eval Loss (Lower is Better)", fontsize=10)
ax_d.set_ylim(0, 3.6)
ax_d.set_xlim(0.1, 2.5)

plt.tight_layout()
plt.savefig("curves_complete_dashboard.png")
plt.close()
print("Saved curves_complete_dashboard.png")
